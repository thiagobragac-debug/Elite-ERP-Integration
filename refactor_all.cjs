const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'components', 'Forms');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx') && f !== 'FormModal.tsx');

let count = 0;
for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (content.includes('import { FormModal }')) {
    // Replace import
    content = content.replace(/import\s*\{\s*FormModal\s*\}\s*from\s*['"]\.\/FormModal['"];/, "import { SidePanel } from '../Layout/SidePanel';");
    
    // Replace opening tag
    content = content.replace(/<FormModal/g, '<SidePanel size="medium"');
    
    // Replace closing tag
    content = content.replace(/<\/FormModal>/g, '</SidePanel>');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Converted ${file}`);
    count++;
  }
}
console.log(`Total files converted: ${count}`);
