const fs = require('fs');
const files = [
  'pecuaria.ts', 'logistica.ts', 'comercial.ts', 'ia.ts', 
  'panorama.ts', 'governanca.ts', 'financeiro.ts'
];

for (const file of files) {
  const fp = 'C:/Saas/src/hooks/report-handlers/' + file;
  if (!fs.existsSync(fp)) continue;
  let content = fs.readFileSync(fp, 'utf8');
  
  if (content.charCodeAt(0) !== 105) { // 'i' is 105
    console.log(`Fixing ${file}, first char is: ${content.charCodeAt(0)}`);
    while (content.length > 0 && content.charCodeAt(0) !== 105) {
      content = content.substring(1);
    }
    fs.writeFileSync(fp, content, 'utf8');
  }
}