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
      if (file.endsWith('.tsx') && !file.endsWith('FormModal.tsx') && !file.endsWith('SidePanel.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(path.join(__dirname, 'src'));

let count = 0;
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('import { FormModal }')) {
    // Determine relative path to SidePanel.tsx
    // Since we don't know depth, let's just use absolute-like import or calculate it.
    // Actually, in vite/react we can often use absolute if configured, but let's calculate relative.
    const sidePanelPath = path.join(__dirname, 'src', 'components', 'Layout', 'SidePanel.tsx');
    let relativePath = path.relative(path.dirname(file), sidePanelPath).replace(/\\/g, '/');
    relativePath = relativePath.replace('.tsx', '');
    if (!relativePath.startsWith('.')) relativePath = './' + relativePath;

    // Replace import
    content = content.replace(/import\s*\{\s*FormModal\s*\}\s*from\s*['"][^'"]*FormModal['"];/, `import { SidePanel } from '${relativePath}';`);
    
    // Replace opening tag
    content = content.replace(/<FormModal/g, '<SidePanel size="large"');
    
    // Replace closing tag
    content = content.replace(/<\/FormModal>/g, '</SidePanel>');
    
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Converted ${path.basename(file)}`);
    count++;
  }
}
console.log(`Total files converted: ${count}`);
