const fs = require('fs');
const files = [
  'pecuaria.ts', 'logistica.ts', 'comercial.ts', 'ia.ts', 
  'panorama.ts', 'governanca.ts', 'financeiro.ts'
];

let words = new Set();
for (const file of files) {
  const fp = 'C:/Saas/src/hooks/report-handlers/' + file;
  if (!fs.existsSync(fp)) continue;
  let content = fs.readFileSync(fp, 'utf8');
  
  // Find sequences of letters and the replacement character (65533)
  const regex = /[A-Za-z\uFFFD]+/g;
  let matches = content.match(regex);
  if (matches) {
    matches.filter(m => m.includes('\uFFFD')).forEach(m => words.add(m));
  }
}
console.log(Array.from(words).join('\n'));