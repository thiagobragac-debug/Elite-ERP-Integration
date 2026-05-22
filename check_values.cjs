const fs = require('fs');
const files = [
  'pecuaria.ts', 'logistica.ts', 'comercial.ts', 'ia.ts', 
  'panorama.ts', 'governanca.ts', 'financeiro.ts'
];

for (const file of files) {
  const fp = 'C:/Saas/src/hooks/report-handlers/' + file;
  if (!fs.existsSync(fp)) continue;
  let content = fs.readFileSync(fp, 'utf8');
  
  const regex = /sparkline:\s*\[.*?\]\.map\(\(.*?\) => \(\{.*?\}\)\),\s*value:\s*(.*?),\s*(change|trend|icon|color|periodLabel|progress)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    if (match[1].includes('.toLocaleString(') || match[1].includes('1.000') || match[1].includes('1.')) {
      // console.log(`[${file}] value: ${match[1]}`);
    }
  }
}
console.log('Checked values');