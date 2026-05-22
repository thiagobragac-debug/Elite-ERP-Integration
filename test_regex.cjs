const fs = require('fs');
let content = fs.readFileSync('C:/Saas/src/hooks/report-handlers/pecuaria.ts', 'utf8');

// We just replace `sparkline: [whatever array].map((v,i) => ({ value: ..., label: ... })), value: X,`
// with a dynamic sparkline evaluating `X`!

// Simpler regex:
// match `sparkline: \[.*?\].map\(\(.*?\)\s*=>\s*\(\{.*?\}\)\), value: (.*?)(?=, change:|,\s*color|,\s*icon|,\s*trend|,\s*\n)`
const regex = /sparkline:\s*\[.*?\]\.map\(\(.*?\) => \(\{.*?\}\)\),\s*value:\s*(.*?),\s*(change|trend|icon|color|periodLabel|progress)/g;

let count = 0;
let replaced = content.replace(regex, (match, valueExpr, nextProp) => {
  count++;
  
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

console.log(count, "matches found");
if (count > 0) {
  fs.writeFileSync('C:/Saas/test_pecuaria.ts', replaced, 'utf8');
  console.log("Wrote to test_pecuaria.ts");
}