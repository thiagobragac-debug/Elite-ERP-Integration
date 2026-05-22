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
  
  let i = 0;
  while (i < lines.length) {
    if (
      i + 2 < lines.length && 
      lines[i].match(/^\s*\{\s*label:/) && 
      lines[i+1].match(/periodLabel:/) && 
      lines[i].trim() === lines[i+2].trim()
    ) {
      const origLine = lines[i];
      const periodLine = lines[i+1];
      const periodMatch = periodLine.match(/(periodLabel:\s*'[^']+'),?/);
      if (!periodMatch) {
         newLines.push(lines[i]);
         i++;
         continue;
      }
      const periodText = periodMatch[1];
      
      if (origLine.match(/\s*\},?\s*$/)) {
         const replaced = origLine.replace(/\s*(\},?\s*)$/, `, ${periodText}$1`);
         newLines.push(replaced);
         i += 3;
         totalFixed++;
         continue;
      } else {
         let fixedOrig = origLine;
         if (!fixedOrig.trim().endsWith(',')) {
            fixedOrig += ',';
         }
         newLines.push(fixedOrig);
         newLines.push(periodLine + (periodLine.trim().endsWith(',') ? '' : ','));
         i += 3;
         totalFixed++;
         continue;
      }
    }
    
    if (lines[i].match(/^\s*periodLabel:\s*'[^']+',$|^\s*periodLabel:\s*'[^']+'$/)) {
      i++;
      continue;
    }
    
    newLines.push(lines[i]);
    i++;
  }
  
  const newContent = newLines.join('\n');
  if (newContent !== content) {
    fs.writeFileSync(fp, newContent, 'utf8');
    console.log('FIXED ' + file);
  }
}
console.log('Total fixed: ' + totalFixed);