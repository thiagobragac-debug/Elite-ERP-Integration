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
  const lines = content.split('\n');
  const newLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/^\s*periodLabel:\s*'[^']+',?\s*\r?$/)) {
      // Check the previous line
      if (newLines.length > 0) {
        let prev = newLines[newLines.length - 1];
        if (!prev.trim().endsWith(',') && !prev.trim().endsWith('{')) {
          newLines[newLines.length - 1] = prev.replace(/(\r?)$/, ',$1');
          totalFixed++;
        }
      }
    }
    newLines.push(lines[i]);
  }
  
  const newContent = newLines.join('\n');
  if (newContent !== content) {
    fs.writeFileSync(fp, newContent, 'utf8');
    console.log('FIXED ' + file);
  }
}
console.log('Total fixed: ' + totalFixed);