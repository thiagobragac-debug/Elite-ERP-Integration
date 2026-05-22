const fs = require('fs');
const files = [
  'pecuaria.ts', 'logistica.ts', 'comercial.ts', 'ia.ts', 
  'panorama.ts', 'governanca.ts', 'financeiro.ts'
];

const sparklines = JSON.parse(fs.readFileSync('C:/Saas/sparklines.json', 'utf8'));

let totalInjected = 0;

for (const file of files) {
  const fp = 'C:/Saas/src/hooks/report-handlers/' + file;
  if (!fs.existsSync(fp)) continue;
  let lines = fs.readFileSync(fp, 'utf8').split('\n');
  let newLines = [];
  
  if (!sparklines[file]) continue;
  const fileSparklines = sparklines[file];
  
  const normalizedMap = new Map();
  for (const [corruptedLabel, sparkline] of Object.entries(fileSparklines)) {
    const normalized = corruptedLabel.replace(/[^\x20-\x7E]/g, '').replace(/\s+/g, '').toLowerCase();
    
    // Fix truncation that was previously in the JSON
    let fixedSparkline = sparkline;
    fixedSparkline = fixedSparkline.replace(/label:\s*`S\$\{i\+1(\s*\}?)(\s*\)*)(\s*\}*)$/, 'label: `S${i+1}` }))');
    
    normalizedMap.set(normalized, fixedSparkline);
  }

  // We only want to inject if it's NOT already there.
  // Actually, since we checkout pristine files, NONE of the dynamic or mock objects have sparklines!
  // Wait, mock objects didn't have them in git HEAD! So injecting everywhere is correct!
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    newLines.push(line);
    
    const labelMatch = line.match(/label:\s*['"]([^'"]+)['"]/);
    if (labelMatch) {
      const label = labelMatch[1];
      const normalizedLabel = label.replace(/[^\x20-\x7E]/g, '').replace(/\s+/g, '').toLowerCase();
      
      if (normalizedMap.has(normalizedLabel)) {
        // Look ahead 10 lines to ensure we don't inject if sparkline already exists
        let hasSparkline = false;
        for (let j = i; j < Math.min(i + 15, lines.length); j++) {
          if (lines[j].includes('sparkline:')) hasSparkline = true;
          if (lines[j].includes('}') && j > i) break; // simplistic check
        }
        
        if (!hasSparkline) {
          // Inject it!
          // Maintain indentation of the label line
          const indent = line.match(/^\s*/)[0];
          newLines.push(`${indent}sparkline: ${normalizedMap.get(normalizedLabel)},`);
          totalInjected++;
        }
      }
    }
  }

  fs.writeFileSync(fp, newLines.join('\n'), 'utf8');
  console.log(`Injected sparklines in ${file}`);
}
console.log(`Total injected: ${totalInjected}`);