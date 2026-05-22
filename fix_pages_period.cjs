const fs = require('fs');
const path = require('path');

function walkSync(dir, filelist = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    const stat = fs.statSync(filepath);
    if (stat.isDirectory()) {
      walkSync(filepath, filelist);
    } else if (file.endsWith('.tsx')) {
      filelist.push(filepath);
    }
  }
  return filelist;
}

const allTsx = walkSync('C:/Saas/src/pages');
let totalFixed = 0;

for (const fp of allTsx) {
  let content = fs.readFileSync(fp, 'utf8');
  let name = path.basename(fp);
  
  // Find <TauzeStatCard ... /> that DO NOT have periodLabel
  const regex = /(<TauzeStatCard\b(?![^>]*\bperiodLabel\b)[^>]*?)(?=\/?>)/g;
  
  const newContent = content.replace(regex, (match, p1) => {
    // Determine period based on context
    let period = 'Período Atual';
    if (name.includes('Finance') || name.includes('Bank') || name.includes('CashFlow') || name.includes('Billing') || name.includes('Invoice')) period = 'Mês Atual';
    if (name.includes('Inventory') || name.includes('Warehouse') || name.includes('Movement')) period = 'Estoque Atual';
    if (name.includes('Animal')) period = 'Pesagem Atual';
    if (name.includes('Market') || name.includes('Price')) period = 'Preço Atual';
    if (name.includes('Purchase') || name.includes('Quotation') || name.includes('Supplier')) period = 'Mês Atual';
    if (name.includes('Admin') || name.includes('Executive') || name.includes('Dashboard')) period = 'Mês Atual';
    
    // Ensure we don't mess up spread props if they exist and we missed them
    if (match.includes('{...')) return match; 
    
    totalFixed++;
    // Inject periodLabel
    return p1 + ` periodLabel="${period}" `;
  });
  
  if (newContent !== content) {
    fs.writeFileSync(fp, newContent, 'utf8');
    console.log(`FIXED ${name}`);
  }
}

console.log('Total cards fixed: ' + totalFixed);