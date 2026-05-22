const fs = require('fs');
const files = [
  'pecuaria.ts', 'logistica.ts', 'comercial.ts', 'ia.ts', 
  'panorama.ts', 'governanca.ts', 'financeiro.ts'
];

let totalReplaced = 0;

for (const file of files) {
  const fp = 'C:/Saas/src/hooks/report-handlers/' + file;
  if (!fs.existsSync(fp)) continue;
  let content = fs.readFileSync(fp, 'utf8');
  let original = content;
  
  const regex = /sparkline:\s*\[.*?\]\.map\(\(.*?\) => \(\{.*?\}\)\),\s*value:\s*(.*?),\s*(change|trend|icon|color|periodLabel|progress)/g;
  
  content = content.replace(regex, (match, valueExpr, nextProp) => {
    totalReplaced++;
    
    // Extract suffix if possible, e.g. from label: `${v}kg`
    let suffix = '';
    const labelMatch = match.match(/label:\s*`\$\{v\}(.*?)`/);
    if (labelMatch) suffix = labelMatch[1];
  
    const iife = `sparkline: (() => { 
      const valStr = String(${valueExpr.trim()});
      const match = valStr.match(/[0-9]+(?:[.,][0-9]+)?/);
      const val = match ? parseFloat(match[0].replace(',', '.')) : 0;
      return [val*0.6, val*0.7, val*0.8, val*0.85, val*0.9, val*0.95, val].map((v,i) => {
        const formatted = v % 1 === 0 ? v : Number(v.toFixed(1));
        return { value: formatted, label: \`\${formatted}${suffix}\` };
      });
    })(), value: ${valueExpr}, ${nextProp}`;
    
    return iife.replace(/\n\s+/g, ' ');
  });

  if (content !== original) {
    fs.writeFileSync(fp, content, 'utf8');
    console.log(`Replaced static sparklines in ${file}`);
  }
}
console.log(`Successfully replaced ${totalReplaced} static sparklines with dynamic value-based curves!`);