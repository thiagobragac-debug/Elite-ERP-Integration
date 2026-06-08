const fs = require('fs');
const path = require('path');

const formsDir = path.join('c:/Saas/src/components/Forms');

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // If the component receives `initialData` or has `formData`, inject locking
      if (content.includes('initialData') && !content.includes('useRecordLock')) {
        const importStatement = `import { useRecordLock } from '../../hooks/useRecordLock';\n`;
        
        const firstImportMatch = content.match(/import .*?;/);
        if (firstImportMatch) {
            const insertPos = firstImportMatch.index + firstImportMatch[0].length;
            content = content.slice(0, insertPos) + '\n' + importStatement + content.slice(insertPos);
        } else {
            content = importStatement + content;
        }

        // Find component body start
        const componentRegex = /=>\s*\{/;
        const match = content.match(componentRegex);
        if (match) {
            const tableName = file.replace('Form.tsx', '').toLowerCase() + 's';
            const hookCall = `\n  const { isLocked, lockedBy } = useRecordLock('${tableName}', initialData?.id);\n`;
            
            const insertPos = match.index + match[0].length;
            content = content.slice(0, insertPos) + hookCall + content.slice(insertPos);
        }

        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Injected lock in:', file);
      }
    }
  }
}

walk(formsDir);
