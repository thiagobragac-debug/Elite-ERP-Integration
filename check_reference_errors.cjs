const fs = require('fs');
const files = [
  'pecuaria.ts', 'logistica.ts', 'comercial.ts', 'ia.ts', 
  'panorama.ts', 'governanca.ts', 'financeiro.ts'
];

for (const file of files) {
  const fp = 'C:/Saas/src/hooks/report-handlers/' + file;
  if (!fs.existsSync(fp)) continue;
  let content = fs.readFileSync(fp, 'utf8');
  
  // Try to find any IIFE that uses undefined variables
  const iifes = content.match(/\(\(\)\s*=>\s*\{[^}]+\}\)\(\)/g);
  if (iifes) {
    for (const iife of iifes) {
      if (iife.includes('conf ') || iife.includes('conf.') || iife.includes('conf||') || iife.includes('conf ||') || iife.includes('baseProfit')) {
        console.log(file, 'Potential ReferenceError:', iife);
      }
    }
  }
}