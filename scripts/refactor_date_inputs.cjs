const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
        arrayOfFiles.push(path.join(dirPath, file));
      }
    }
  });

  return arrayOfFiles;
}

const files = getAllFiles(srcDir);
let changedFilesCount = 0;

function replaceInputs(content) {
  let result = '';
  let i = 0;
  let changed = false;

  while (i < content.length) {
    if (content.substr(i, 6) === '<input') {
      let start = i;
      let j = i + 6;
      let braceCount = 0;
      let insideQuotes = false;
      let quoteChar = '';

      while (j < content.length) {
        const c = content[j];
        if (!insideQuotes && (c === '"' || c === "'")) {
          insideQuotes = true;
          quoteChar = c;
        } else if (insideQuotes && c === quoteChar) {
          insideQuotes = false;
        } else if (!insideQuotes && c === '{') {
          braceCount++;
        } else if (!insideQuotes && c === '}') {
          braceCount--;
        } else if (!insideQuotes && braceCount === 0 && c === '>') {
          break; 
        }
        j++;
      }
      
      const tagContent = content.substring(start, j + 1);
      if (tagContent.includes('type="date"') || tagContent.includes("type='date'")) {
        let newTag = tagContent.replace(/^<input/, '<DateInput');
        // Se a tag original terminava em ></input>, não vamos nos preocupar pois quase ninguem usa. 
        // Vamos garantir que se não for /> vire />
        if (!newTag.endsWith('/>')) {
           newTag = newTag.substring(0, newTag.length - 1) + ' />';
        }
        result += newTag;
        i = j + 1;
        changed = true;
        continue;
      }
    }
    result += content[i];
    i++;
  }
  return { result, changed };
}

files.forEach(file => {
  if (file.includes('DateInput.tsx')) return;

  let content = fs.readFileSync(file, 'utf-8');
  let originalContent = content;

  const parsed = replaceInputs(content);
  
  if (parsed.changed) {
    content = parsed.result;

    if (!content.includes('DateInput')) {
      const depth = file.split(path.sep).length - srcDir.split(path.sep).length;
      let importPath = '';
      if (depth === 1) {
        importPath = './components/Form/DateInput';
      } else {
        const backDirs = new Array(depth - 1).fill('..').join('/');
        importPath = `${backDirs}/components/Form/DateInput`;
      }
      
      const importStatement = `import { DateInput } from '${importPath}';\n`;
      const lines = content.split('\n');
      let lastImportIndex = -1;
      for (let k = 0; k < lines.length; k++) {
        if (lines[k].startsWith('import ')) {
          lastImportIndex = k;
        }
      }
      if (lastImportIndex !== -1) {
        lines.splice(lastImportIndex + 1, 0, importStatement);
        content = lines.join('\n');
      } else {
        content = importStatement + content;
      }
    }

    if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf-8');
      changedFilesCount++;
      console.log(`Updated: ${file}`);
    }
  }
});

console.log(`\nRefactoring complete! Updated ${changedFilesCount} files.`);
