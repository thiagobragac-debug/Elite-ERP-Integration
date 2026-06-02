const fs = require('fs');
const path = require('path');

const filesToConvert = [
  'MovementForm.tsx',
  'WeightForm.tsx',
  'FuelForm.tsx',
  'EntryInvoiceForm.tsx',
  'TransactionForm.tsx',
  'SalesOrderForm.tsx',
  'PurchaseOrderForm.tsx'
];

const dir = path.join(__dirname, 'src', 'components', 'Forms');

for (const file of filesToConvert) {
  const filePath = path.join(dir, file);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${file}`);
    continue;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace import
  content = content.replace(/import\s*\{\s*FormModal\s*\}\s*from\s*['"]\.\/FormModal['"];/, "import { SidePanel } from '../Layout/SidePanel';");
  
  // Replace opening tag
  content = content.replace(/<FormModal/g, '<SidePanel');
  
  // Replace closing tag
  content = content.replace(/<\/FormModal>/g, '</SidePanel>');
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Converted ${file}`);
}
