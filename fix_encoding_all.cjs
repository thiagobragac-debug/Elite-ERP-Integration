const fs = require('fs');
const files = [
  'pecuaria.ts', 'logistica.ts', 'comercial.ts', 'ia.ts', 
  'panorama.ts', 'governanca.ts', 'financeiro.ts'
];

function fixEncoding(str) {
  try {
    return Buffer.from(str, 'latin1').toString('utf8');
  } catch(e) {
    return str;
  }
}

let fixedCount = 0;
for (const file of files) {
  const fp = 'C:/Saas/src/hooks/report-handlers/' + file;
  if (!fs.existsSync(fp)) continue;
  let content = fs.readFileSync(fp, 'utf8');
  
  if (content.includes('Ã')) {
    let fixed = fixEncoding(content);
    // Strip BOM if it got mangled into something weird at the very beginning
    if (fixed.charCodeAt(0) === 0xFEFF || fixed.charCodeAt(0) === 0xEFBBBF) {
      fixed = fixed.substring(1);
    } else if (fixed.startsWith('ï»¿')) {
      fixed = fixed.substring(3);
    }
    fs.writeFileSync(fp, fixed, 'utf8');
    console.log("Fixed encoding in " + file);
    fixedCount++;
  }
}
console.log("Total fixed encoding: " + fixedCount);