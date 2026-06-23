const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    if (fs.statSync(dirPath).isDirectory()) {
      walk(dirPath, callback);
    } else {
      callback(dirPath);
    }
  });
}

const filePaths = [];
walk(srcDir, (filepath) => {
  if (filepath.endsWith('.ts') || filepath.endsWith('.tsx')) {
    filePaths.push(filepath);
  }
});

let modifiedCount = 0;

for (const filepath of filePaths) {
  let content = fs.readFileSync(filepath, 'utf8');
  
  if (filepath.includes('ConfirmContext.tsx')) continue;

  // Check if it has window.confirm( or confirm(
  if (!content.includes('confirm(') && !content.includes('window.confirm(')) continue;

  // Wait, if it has `await confirm({` it's already using the hook!
  if (content.includes('await confirm({')) {
      // See if there's any remaining `confirm('` or `confirm("`
      if (!content.includes("confirm('") && !content.includes('confirm("') && !content.includes('confirm(`')) {
          continue;
      }
  }

  console.log(`Processing ${filepath}`);

  // 1. Add import if not present
  if (!content.includes('useConfirm')) {
    // calculate relative path to src/contexts/ConfirmContext
    const depth = filepath.replace(srcDir, '').split(path.sep).length - 2;
    const prefix = depth <= 0 ? './' : '../'.repeat(depth);
    const importStatement = `import { useConfirm } from '${prefix}contexts/ConfirmContext';\n`;
    
    // insert after last import
    const lastImportIndex = content.lastIndexOf('import ');
    if (lastImportIndex !== -1) {
      const endOfLine = content.indexOf('\n', lastImportIndex);
      content = content.slice(0, endOfLine + 1) + importStatement + content.slice(endOfLine + 1);
    } else {
      content = importStatement + content;
    }
  }

  // 2. Add hook call if not present
  if (!content.includes('const { confirm } = useConfirm();')) {
    // Find the main component definition. E.g. `export const Component: React.FC = () => {` or `export const Component = () => {` or `export default function`
    // We'll just look for `() => {` that has `return (` after it, but it's tricky.
    // A simpler heuristic: find the first `const [`, or `const {`, or `useQuery(`, or `useMutation(` or `useFarmFilter(`
    // and insert before it.
    
    const hookInsertion = `  const { confirm } = useConfirm();\n`;
    let inserted = false;
    
    const hooksToLookFor = [
      'const { activeFarm',
      'const { activeTenant',
      'const [',
      'const queryClient',
      'const { data'
    ];
    
    for (const hook of hooksToLookFor) {
      const index = content.indexOf(hook);
      if (index !== -1 && index > content.indexOf('export const')) {
        // find start of line
        const lineStart = content.lastIndexOf('\n', index) + 1;
        content = content.slice(0, lineStart) + hookInsertion + content.slice(lineStart);
        inserted = true;
        break;
      }
    }
    
    if (!inserted) {
      console.warn(`COULD NOT INSERT HOOK CALL IN ${filepath}`);
      continue; // Skip automatic replacement if we can't find where to put the hook safely
    }
  }

  // 3. Replace confirm(...) with await confirm({ ... })
  // Example: if (!confirm('Deseja excluir?')) return;
  // into: const isConfirmed = await confirm({ title: 'Atenção', description: 'Deseja excluir?', variant: 'danger' }); if (!isConfirmed) return;
  
  // We use regex to match `if (!confirm('...')) return;`
  const regex1 = /if\s*\(\s*!\s*(?:window\.)?confirm\(\s*(['"`])(.*?)\1\s*\)\s*\)\s*return(\s+[^;]+)?;/g;
  content = content.replace(regex1, (match, quote, msg, returnVal) => {
    return `const isConfirmed = await confirm({ title: 'Atenção', description: ${quote}${msg}${quote}, confirmText: 'Confirmar', cancelText: 'Cancelar', variant: 'danger' });\n    if (!isConfirmed) return${returnVal || ''};`;
  });

  // Example: const confirmClear = confirm('...');
  const regex2 = /const\s+(\w+)\s*=\s*(?:window\.)?confirm\(\s*(['"`])(.*?)\1\s*\);/g;
  content = content.replace(regex2, (match, varName, quote, msg) => {
    return `const ${varName} = await confirm({ title: 'Atenção', description: ${quote}${msg}${quote}, confirmText: 'Confirmar', cancelText: 'Cancelar', variant: 'warning' });`;
  });
  
  // Example: if (confirm('...')) {
  const regex3 = /if\s*\(\s*(?:window\.)?confirm\(\s*(['"`])(.*?)\1\s*\)\s*\)\s*\{/g;
  content = content.replace(regex3, (match, quote, msg) => {
    return `const isConfirmed = await confirm({ title: 'Atenção', description: ${quote}${msg}${quote}, confirmText: 'Confirmar', cancelText: 'Cancelar', variant: 'danger' });\n    if (isConfirmed) {`;
  });

  // Any remaining confirm('...') that wasn't caught above?
  const regexRemaining = /(?:window\.)?confirm\(\s*(['"`])(.*?)\1\s*\)/g;
  content = content.replace(regexRemaining, (match, quote, msg) => {
    return `await confirm({ title: 'Atenção', description: ${quote}${msg}${quote}, confirmText: 'Confirmar', cancelText: 'Cancelar', variant: 'danger' })`;
  });

  fs.writeFileSync(filepath, content, 'utf8');
  modifiedCount++;
}

console.log(`Successfully modified ${modifiedCount} files.`);
