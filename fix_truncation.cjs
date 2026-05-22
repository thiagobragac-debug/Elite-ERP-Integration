const fs = require('fs');
const files = [
  'pecuaria.ts', 'logistica.ts', 'comercial.ts', 'ia.ts', 
  'panorama.ts', 'governanca.ts', 'financeiro.ts'
];

let fixed = 0;
for (const file of files) {
  const fp = 'C:/Saas/src/hooks/report-handlers/' + file;
  if (!fs.existsSync(fp)) continue;
  let content = fs.readFileSync(fp, 'utf8');
  let orig = content;

  // Fix truncated `S${i+1`
  content = content.replace(/label:\s*`S\$\{i\+1(\s*\}?)(\s*\)*)(\s*\}*)/g, 'label: `S${i+1}` }))');

  if (content !== orig) {
    fs.writeFileSync(fp, content, 'utf8');
    fixed++;
  }
}
console.log('Fixed truncation in ' + fixed + ' files.');