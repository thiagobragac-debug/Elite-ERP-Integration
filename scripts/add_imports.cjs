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

files.forEach(file => {
  if (file.includes('DateInput.tsx')) return;
  
  let content = fs.readFileSync(file, 'utf-8');
  let originalContent = content;

  if (content.includes('<DateInput') && !content.includes('import { DateInput }')) {
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

  // Also fix the implicit 'e' any type issue: e =>  -> (e: any) =>
  // because TS complains about parameter 'e' implicitly having 'any' type.
  // Actually, we can just replace 'e =>' with '(e: any) =>' inside onChange
  // But regex for that is error prone.
  // Wait, if DateInput has onChange?: React.ChangeEventHandler<HTMLInputElement>;
  // Then e => setForm(...) SHOULD be correctly inferred!
  // Why was TS complaining about implicitly 'any' type?
  // Because DateInput might not be imported, so DateInput falls back to 'any' in TS parser!
  // If DateInput is properly imported and typed, the implicit any will disappear!

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf-8');
    changedFilesCount++;
    console.log(`Added import to: ${file}`);
  }
});

console.log(`\nImport fix complete! Updated ${changedFilesCount} files.`);
