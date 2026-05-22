const fs = require('fs');
let content = fs.readFileSync('C:/Saas/src/hooks/report-handlers/pecuaria.ts', 'utf8');

// Match only inside the try blocks
const tryBlocks = [];
let currentIndex = 0;
while (true) {
  const tryIndex = content.indexOf('try {', currentIndex);
  if (tryIndex === -1) break;
  const nextFunction = content.indexOf('export const', tryIndex);
  const end = nextFunction !== -1 ? nextFunction : content.length;
  
  let block = content.substring(tryIndex, end);
  
  // Replace static sparklines with dynamic ones based on the value property!
  // Pattern: sparkline: [1,2,3].map((v,i) => ({ value: v, label: `${v}kg` })), value: `10 kg`
  block = block.replace(/sparkline:\s*\[([0-9.,\-]+)\]\.map\(\(v,i\)\s*=>\s*\(\{\s*value:\s*(?:Math\.max[^,]+,\s*)?v,\s*label:\s*`\$\{[^}]+\}([^`]*)`\s*\}\)\)\s*,\s*value:\s*([^,]+),/g, (match, arrayStr, suffix, valueExpr) => {
    
    // We want to create an IIFE that parses valueExpr and generates a sparkline!
    const iife = `sparkline: (() => { 
            const valStr = String(${valueExpr.trim()});
            const match = valStr.match(/[0-9]+(?:[.,][0-9]+)?/);
            const val = match ? parseFloat(match[0].replace(',', '.')) : 0;
            return [val*0.6, val*0.7, val*0.8, val*0.85, val*0.9, val*0.95, val].map((v,i) => {
              const formatted = v % 1 === 0 ? v : Number(v.toFixed(1));
              return { value: formatted, label: \`\${formatted}${suffix}\` };
            });
          })(), value: ${valueExpr},`;
          
    return iife.replace(/\n\s+/g, ' ');
  });

  // also handle some cases where value is parsed and might be `String(...)` etc
  
  content = content.substring(0, tryIndex) + block + content.substring(end);
  currentIndex = tryIndex + block.length;
}

// See how many were replaced
console.log((content.match(/sparkline: \(\(\) => \{ const valStr/g) || []).length, "dynamic sparklines injected");
