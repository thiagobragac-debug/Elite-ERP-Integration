const fs = require('fs');
const fp = 'C:/Saas/src/hooks/report-handlers/ia.ts';
let content = fs.readFileSync(fp, 'utf8');
content = content.replace(/label:\s*`S\$\{i\+1\}\`\s*\}\)\),\s*value:\s*`R\$\s*\$\{baseProfit/g, 'label: `S${i+1}` })); })(), value: `R$ ${baseProfit');
fs.writeFileSync(fp, content, 'utf8');
console.log('Fixed ia.ts');