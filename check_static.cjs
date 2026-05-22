const fs = require('fs');
const files = [
  'pecuaria.ts', 'logistica.ts', 'comercial.ts', 'ia.ts', 
  'panorama.ts', 'governanca.ts', 'financeiro.ts'
];

let found = 0;
for (const file of files) {
  const content = fs.readFileSync('C:/Saas/src/hooks/report-handlers/' + file, 'utf8');
  // Look for any static array of numbers mapped: sparkline: [100, 200, ...]
  const matches = content.match(/sparkline:\s*\[[0-9.,\-\s]+\]\.map/g);
  if (matches) {
    // Only count ones that are NOT the fallback mock ones [1,2,3,4,5,6,7]
    const realStatics = matches.filter(m => !m.includes('[1,2,3,4,5,6,7]'));
    if (realStatics.length > 0) {
      console.log(`[${file}] Found ${realStatics.length} hardcoded sparklines!`);
      found += realStatics.length;
    }
  }
}
console.log("Total remaining hardcoded sparklines:", found);