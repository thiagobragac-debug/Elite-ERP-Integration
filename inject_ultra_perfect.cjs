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
  let content = fs.readFileSync(fp, 'utf8');
  let orig = content;
  
  if (!sparklines[file]) continue;
  const fileSparklines = sparklines[file];
  
  const normalizedMap = new Map();
  for (const [corruptedLabel, sparklineRaw] of Object.entries(fileSparklines)) {
    const normalized = corruptedLabel.replace(/[^\x20-\x7E]/g, '').replace(/\s+/g, '').toLowerCase();
    
    let fixed = sparklineRaw.replace(/label:\s*`S\$\{i\+1(\s*\}?)(\s*\)*)(\s*\}*)$/, 'label: `S${i+1}` }))');
    
    let extracted = fixed;
    const arrayMatch = fixed.match(/\[[\s\S]*?\]\.map\([^)]+\)\s*=>\s*\(\{[^}]+\}\)\)/);
    const iifeMatch = fixed.match(/\(\(\)\s*=>\s*\{[\s\S]*?\}\)\(\)/);
    
    if (arrayMatch) {
      extracted = arrayMatch[0];
    } else if (iifeMatch) {
      extracted = iifeMatch[0];
    } else {
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

  // Inject right after label
  content = content.replace(/label:\s*(['"]([^'"]+)['"])\s*,?/g, (fullMatch, quotedLabel, label) => {
    const normalizedLabel = label.replace(/[^\x20-\x7E]/g, '').replace(/\s+/g, '').toLowerCase();
    if (normalizedMap.has(normalizedLabel)) {
      totalInjected++;
      return `label: ${quotedLabel}, sparkline: ${normalizedMap.get(normalizedLabel)},`;
    }
    return fullMatch;
  });

  if (content !== orig) {
    fs.writeFileSync(fp, content, 'utf8');
    console.log(`Injected sparklines in ${file}`);
  }
}
console.log(`Total injected: ${totalInjected}`);