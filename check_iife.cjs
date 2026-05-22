const fs = require('fs');
const files = [
  'pecuaria.ts', 'logistica.ts', 'comercial.ts', 'ia.ts', 
  'panorama.ts', 'governanca.ts', 'financeiro.ts'
];

for (const file of files) {
  const fp = 'C:/Saas/src/hooks/report-handlers/' + file;
  if (!fs.existsSync(fp)) continue;
  let content = fs.readFileSync(fp, 'utf8');
  
  const mockDataMatch = content.match(/const mockData = \{[\s\S]*?try \{/g);
  if (!mockDataMatch) continue;

  for (const mockBlock of mockDataMatch) {
    const iifes = mockBlock.match(/\(\(\)\s*=>\s*\{[^}]+\}\)\(\)/g);
    if (iifes) {
      for (const iife of iifes) {
        // Find any identifier being used
        // This is crude, let's just print the IIFE so I can manually inspect it
        console.log(`[${file}] IIFE in mockData:`, iife);
      }
    }
  }
}