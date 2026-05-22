const fs = require('fs');
const files = [
  'pecuaria.ts', 'logistica.ts', 'comercial.ts', 'ia.ts', 
  'panorama.ts', 'governanca.ts', 'financeiro.ts'
];

for (const file of files) {
  const fp = 'C:/Saas/src/hooks/report-handlers/' + file;
  if (!fs.existsSync(fp)) continue;
  let content = fs.readFileSync(fp, 'utf8');
  
  // Find all matches for stats: [ ... ]
  // It's a bit tricky to parse with regex, we can just look for { label: ... } that don't have sparkline:
  const statRegex = /\{\s*label:\s*'[^']+'[^}]*?\}/g;
  let matches;
  let missing = 0;
  while ((matches = statRegex.exec(content)) !== null) {
    if (!matches[0].includes('sparkline:')) {
      console.log(`${file}: Missing sparkline for ${matches[0].substring(0, 50)}...`);
      missing++;
    }
  }
}