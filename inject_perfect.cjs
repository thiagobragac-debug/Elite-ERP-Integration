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
  for (const [corruptedLabel, sparklineRaw] of Object.entries(fileSparklines)) {
    const normalized = corruptedLabel.replace(/[^\x20-\x7E]/g, '').replace(/\s+/g, '').toLowerCase();
    
    // Fix truncation
    let fixed = sparklineRaw.replace(/label:\s*`S\$\{i\+1(\s*\}?)(\s*\)*)(\s*\}*)$/, 'label: `S${i+1}` }))');
    
    // Extract everything that is an array `[...]` or an IIFE `(() => { ... })()`
    let extracted = fixed;
    const arrayMatch = fixed.match(/\[[\s\S]*?\]\.map\([^)]+\)\s*=>\s*\(\{[^}]+\}\)\)/);
    const iifeMatch = fixed.match(/\(\(\)\s*=>\s*\{[\s\S]*?\}\)\(\)/);
    
    if (arrayMatch) {
      extracted = arrayMatch[0];
    } else if (iifeMatch) {
      extracted = iifeMatch[0];
    } else {
      // Basic fallback
      let s = fixed;
      if (s.startsWith('{')) {
         const sm = s.match(/sparkline:\s*([^,]+)/);
         if (sm) s = sm[1];
      }
      if (s.startsWith('sparkline:')) s = s.substring(10).trim();
      if (s.endsWith('}')) s = s.slice(0, -1).trim();
      if (s.endsWith(',')) s = s.slice(0, -1).trim();
      extracted = s;
    }
    
    normalizedMap.set(normalized, extracted);
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    newLines.push(line);
    
    const labelMatch = line.match(/label:\s*['"]([^'"]+)['"]/);
    if (labelMatch) {
      const label = labelMatch[1];
      const normalizedLabel = label.replace(/[^\x20-\x7E]/g, '').replace(/\s+/g, '').toLowerCase();
      
      if (normalizedMap.has(normalizedLabel)) {
        let hasSparkline = false;
        for (let j = i; j < Math.min(i + 15, lines.length); j++) {
          if (lines[j].includes('sparkline:')) hasSparkline = true;
          if (lines[j].includes('}') && j > i) break;
        }
        
        if (!hasSparkline) {
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