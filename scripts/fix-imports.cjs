const fs = require('fs');
const path = require('path');

const srcDir = path.join('c:/Saas/src');
let modifiedCount = 0;

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      if (content.includes('usePersistentState') && !content.includes('import { usePersistentState }')) {
        const depth = fullPath.substring(srcDir.length + 1).split(path.sep).length - 1;
        let relativePrefix = '../'.repeat(depth) || './';
        const importStatement = `import { usePersistentState } from '${relativePrefix}hooks/usePersistentState';\n`;
        
        const firstImportMatch = content.match(/import .*?;/);
        if (firstImportMatch) {
            const insertPos = firstImportMatch.index + firstImportMatch[0].length;
            content = content.slice(0, insertPos) + '\n' + importStatement + content.slice(insertPos);
        } else {
            content = importStatement + content;
        }

        fs.writeFileSync(fullPath, content, 'utf8');
        modifiedCount++;
        console.log('Fixed imports in:', fullPath);
      }
    }
  }
}

walk(srcDir);
console.log('Fixed files:', modifiedCount);
