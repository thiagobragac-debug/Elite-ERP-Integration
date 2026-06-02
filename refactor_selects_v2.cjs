const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx') && !file.includes('SearchableSelect.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(path.join(__dirname, 'src', 'components', 'Forms'));
let totalConverted = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // We need to replace all `<select ...> ... </select>` blocks.
  // Using regex for the outer block is okay, but inside we'll extract props manually.
  
  const selectRegex = /<select([\s\S]*?)>([\s\S]*?)<\/select>/g;
  
  content = content.replace(selectRegex, (match, attrs, children) => {
    // Extract props from attrs using a simple balanced braces approach
    const props = {};
    let attrRegex = /([a-zA-Z]+)=(?:(["'])(.*?)\2|\{(.*?)\})/g;
    
    // Actually regex for { } fails if nested. Let's do a character by character parser for attrs.
    let idx = 0;
    while (idx < attrs.length) {
      // skip whitespace
      while (idx < attrs.length && /\s/.test(attrs[idx])) idx++;
      if (idx >= attrs.length) break;
      
      // read prop name
      let nameStart = idx;
      while (idx < attrs.length && /[a-zA-Z0-9_-]/.test(attrs[idx])) idx++;
      let propName = attrs.substring(nameStart, idx);
      
      if (attrs[idx] !== '=') {
        props[propName] = { type: 'boolean', value: true };
        continue;
      }
      
      idx++; // skip '='
      if (attrs[idx] === '"' || attrs[idx] === "'") {
        let quote = attrs[idx];
        idx++;
        let valStart = idx;
        while (idx < attrs.length && attrs[idx] !== quote) idx++;
        props[propName] = { type: 'string', value: attrs.substring(valStart, idx) };
        idx++; // skip closing quote
      } else if (attrs[idx] === '{') {
        idx++; // skip '{'
        let valStart = idx;
        let braceCount = 1;
        while (idx < attrs.length && braceCount > 0) {
          if (attrs[idx] === '{') braceCount++;
          if (attrs[idx] === '}') braceCount--;
          idx++;
        }
        props[propName] = { type: 'expr', value: attrs.substring(valStart, idx - 1) };
      }
    }

    if (!props.value || !props.onChange) {
      return match;
    }

    const valueStr = props.value.value;
    let onChangeStr = props.onChange.value;
    let newOnChange = '';
    
    if (onChangeStr.includes('e.target.value')) {
      newOnChange = onChangeStr.replace(/\(e\)/, '(val)').replace(/e\.target\.value/g, 'val');
    } else {
      newOnChange = `(val) => { /* TODO: adjust */ }`; // Fallback
    }

    // Parse children to build options array
    let optionsArrStr = `[\n`;
    let foundOpts = false;
    
    // Find all <option value="xxx">Label</option> or <option value={xxx}>Label</option>
    // Sometimes it's <option>Label</option> (value implicit)
    const optionRegex = /<option(?:[^>]*?value=(['"]|{)(.*?)\1)?[^>]*>([^<]+)<\/option>/g;
    let optMatch;
    while ((optMatch = optionRegex.exec(children)) !== null) {
      let optVal = optMatch[2] !== undefined ? optMatch[2] : optMatch[3].trim();
      let optLabel = optMatch[3].trim();
      optionsArrStr += `            { value: \`${optVal}\`, label: \`${optLabel}\` },\n`;
      foundOpts = true;
    }

    // Find all {array.map(x => <option key={x.id} value={x.id}>{x.nome}</option>)}
    // Using a more permissive map regex
    const mapRegex = /\{([a-zA-Z0-9_.]+)\.map\s*\(\s*([a-zA-Z0-9_]+)\s*=>\s*(?:\(\s*)?<option[^>]*value=\{([^}]+)\}[^>]*>(?:\{([^}]+)\}|([^<]+))<\/option>\s*(?:\))?\s*\)\}/g;
    let mapMatch;
    while ((mapMatch = mapRegex.exec(children)) !== null) {
      const arrayName = mapMatch[1].trim();
      const iteratorName = mapMatch[2].trim();
      const mapVal = mapMatch[3]; // e.g. f.id
      const mapLabel = mapMatch[4] || mapMatch[5]; // e.g. f.nome or plain text
      
      optionsArrStr += `            ...(${arrayName} || []).map(${iteratorName} => ({ value: String(${mapVal}), label: String(${mapLabel}) })),\n`;
      foundOpts = true;
    }

    optionsArrStr += `          ]`;

    if (!foundOpts) {
      return match;
    }

    let result = `        <SearchableSelect \n          value={${valueStr}}\n          onChange={${newOnChange}}\n          options={${optionsArrStr}}\n`;
    
    if (props.disabled) {
      result += `          disabled={${props.disabled.type === 'expr' ? props.disabled.value : `'${props.disabled.value}'`}}\n`;
    }

    result += `        />`;
    return result;
  });

  if (content !== originalContent) {
    if (!content.includes('SearchableSelect')) {
      // Find last import
      const lastImportIndex = content.lastIndexOf('import ');
      const endOfLastImport = content.indexOf('\\n', lastImportIndex);
      content = `import { SearchableSelect } from './SearchableSelect';\n` + content;
    }
    fs.writeFileSync(file, content, 'utf8');
    totalConverted++;
    console.log(`Converted selects in ${path.basename(file)}`);
  }
}

console.log(`Total files modified: ${totalConverted}`);
