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
      if (file.endsWith('.tsx')) {
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

  // We need to find block starting with <select and ending with </select>
  // and convert it.
  
  // Regex to match the whole select block
  const selectRegex = /<select([\s\S]*?)>([\s\S]*?)<\/select>/g;

  content = content.replace(selectRegex, (match, attrs, children) => {
    // Check if it has a value and onChange that we know how to parse
    const valueMatch = attrs.match(/value=\{([^}]+)\}/);
    const onChangeMatch = attrs.match(/onChange=\{([\s\S]+?)\}\s*(?=>|\w+=|disabled|required|\/\>)/);
    const disabledMatch = attrs.match(/disabled=\{([^}]+)\}/);
    const requiredMatch = attrs.includes('required');

    if (!valueMatch || !onChangeMatch) {
      console.log('Skipped due to missing value/onChange in:', path.basename(file));
      return match; // skip if we can't parse
    }

    const valueStr = valueMatch[1];
    
    // Attempt to extract the state setter from onChange. 
    // Typical: onChange={(e) => setFormData({...formData, raca: e.target.value})}
    // Or: onChange={(e) => setSomething(e.target.value)}
    let onChangeStr = onChangeMatch[1];
    let newOnChange = '';
    
    if (onChangeStr.includes('e.target.value')) {
      newOnChange = onChangeStr.replace(/\(e\)/, '(val)').replace(/e\.target\.value/g, 'val');
    } else {
      newOnChange = `(val) => { /* TODO: adjust */ }`; // Fallback
    }

    // Parse children to build options array
    let optionsArrStr = `[\n`;
    let foundOpts = false;
    
    // Find all <option value="xxx">Label</option>
    const optionRegex = /<option[^>]*value=(['"]|{)(.*?)\1[^>]*>([^<]+)<\/option>/g;
    let optMatch;
    while ((optMatch = optionRegex.exec(children)) !== null) {
      const optVal = optMatch[2];
      const optLabel = optMatch[3].trim();
      optionsArrStr += `            { value: \`${optVal}\`, label: \`${optLabel}\` },\n`;
      foundOpts = true;
    }

    // Find all {array.map(x => <option key={x.id} value={x.id}>{x.nome}</option>)}
    const mapRegex = /\{([^.]+)\.map\(([^=]+)=>\s*(?:\(\s*)?<option[^>]*value=\{([^}]+)\}[^>]*>([^<]+)<\/option>\s*(?:\))?\s*\)\}/g;
    let mapMatch;
    while ((mapMatch = mapRegex.exec(children)) !== null) {
      const arrayName = mapMatch[1].trim();
      const iteratorName = mapMatch[2].trim().replace(/\(|\)/g, ''); // e.g. 'f' or '(f)'
      const mapVal = mapMatch[3]; // e.g. f.id
      const mapLabel = mapMatch[4]; // e.g. {f.nome} or f.nome
      
      let finalLabel = mapLabel.includes('{') ? mapLabel.replace(/\{|\}/g, '') : mapLabel;
      optionsArrStr += `            ...(${arrayName} || []).map(${iteratorName} => ({ value: String(${mapVal}), label: String(${finalLabel}) })),\n`;
      foundOpts = true;
    }

    optionsArrStr += `          ]`;

    // Only convert if we actually found options
    if (!foundOpts) {
      console.log('Skipped due to no options found in:', path.basename(file), children.trim().substring(0, 50));
      return match;
    }

    let result = `        <SearchableSelect \n          value={${valueStr}}\n          onChange={${newOnChange}}\n          options={${optionsArrStr}}\n`;
    
    if (disabledMatch) {
      // Pass a comment or something since SearchableSelect doesn't support disabled yet?
      // Wait, we need to add disabled support to SearchableSelect!
      result += `          disabled={${disabledMatch[1]}}\n`;
    }

    result += `        />`;
    return result;
  });

  if (content !== originalContent) {
    // Add import if missing
    if (!content.includes('SearchableSelect')) {
      content = `import { SearchableSelect } from './SearchableSelect';\n` + content;
    }
    fs.writeFileSync(file, content, 'utf8');
    totalConverted++;
    console.log(`Converted selects in ${path.basename(file)}`);
  }
}

console.log(`Total files modified: ${totalConverted}`);
