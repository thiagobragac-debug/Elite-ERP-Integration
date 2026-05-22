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
    
    // 1. Fix truncation
    let fixed = sparklineRaw.replace(/label:\s*`S\$\{i\+1(\s*\}?)(\s*\)*)(\s*\}*)$/, 'label: `S${i+1}` }))');
    
    // 2. Extract EXACTLY the array/function part (remove "sparkline:" prefix or object braces)
    let extracted = fixed;
    const match = fixed.match(/sparkline:\s*(\[.*?\]\.map\(.*?\)|\(\(\)\s*=>\s*\{.*?\}\)\(\))/);
    if (match) {
      extracted = match[1];
    } else {
      // fallback cleanup if regex didn't catch it perfectly
      if (extracted.startsWith('sparkline:')) {
        extracted = extracted.substring(10).trim();
      }
      if (extracted.endsWith('}')) extracted = extracted.slice(0, -1).trim();
      if (extracted.endsWith(',')) extracted = extracted.slice(0, -1).trim();
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