const fs = require('fs');
const files = [
  'pecuaria.ts', 'logistica.ts', 'comercial.ts', 'ia.ts', 
  'panorama.ts', 'governanca.ts', 'financeiro.ts'
];

let totalFixed = 0;
for (const file of files) {
  const fp = 'C:/Saas/src/hooks/report-handlers/' + file;
  if (!fs.existsSync(fp)) continue;
  let content = fs.readFileSync(fp, 'utf8');
  
  // Replace periodLabel: '...', \n };
  const newContent = content.replace(/\s*periodLabel:\s*'[^']+',?\s*\n\s*\};/g, '\n};');
  
  if (newContent !== content) {
    fs.writeFileSync(fp, newContent, 'utf8');
    console.log('FIXED ' + file);
    totalFixed++;
  }
}
console.log('Total fixed: ' + totalFixed);