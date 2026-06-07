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
      let changed = false;
      const fileName = path.parse(file).name;

      // 1. Replace isModalOpen
      const modalRegex = /const \[isModalOpen,\s*setIsModalOpen\]\s*=\s*useState\(false\);/g;
      if (modalRegex.test(content)) {
        content = content.replace(modalRegex, `const [isModalOpen, setIsModalOpen] = usePersistentState('${fileName}_isModalOpen', false);`);
        changed = true;
      }

      // 2. Replace formData
      const formRegex = /const \[formData,\s*setFormData\]\s*=\s*useState\(([\s\S]*?)\);/g;
      if (formRegex.test(content)) {
        content = content.replace(formRegex, (match, inner) => {
           if (match.includes('usePersistentState')) return match;
           return `const [formData, setFormData] = usePersistentState('${fileName}_formData', ${inner});`;
        });
        changed = true;
      }
      
      // 3. Replace isMovementModalOpen
      const movementRegex = /const \[isMovementModalOpen,\s*setIsMovementModalOpen\]\s*=\s*useState\(false\);/g;
      if (movementRegex.test(content)) {
         content = content.replace(movementRegex, `const [isMovementModalOpen, setIsMovementModalOpen] = usePersistentState('${fileName}_isMovementModalOpen', false);`);
         changed = true;
      }

      // Add import if changed
      if (changed && !content.includes('usePersistentState')) {
        const depth = fullPath.substring(srcDir.length + 1).split(path.sep).length - 1;
        let relativePrefix = '../'.repeat(depth) || './';
        const importStatement = `import { usePersistentState } from '${relativePrefix}hooks/usePersistentState';\n`;
        
        const importMatches = [...content.matchAll(/import .*?from .*?;?/g)];
        if (importMatches.length > 0) {
          const lastMatch = importMatches[importMatches.length - 1];
          const insertPos = lastMatch.index + lastMatch[0].length;
          content = content.slice(0, insertPos) + '\n' + importStatement + content.slice(insertPos);
        } else {
          content = importStatement + content;
        }
      }

      // Also ensure that if the component unmounts with !isOpen we don't need to do anything since it persists.
      // Wait, let's just do the replace and write back.

      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        modifiedCount++;
        console.log('Modified:', fullPath);
      }
    }
  }
}

walk(srcDir);
console.log('Total files modified:', modifiedCount);
