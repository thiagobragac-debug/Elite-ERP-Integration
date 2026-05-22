const fs = require('fs');
const files = [
  'pecuaria.ts', 'logistica.ts', 'comercial.ts', 'ia.ts', 
  'panorama.ts', 'governanca.ts', 'financeiro.ts'
];

let fixedCount = 0;
for (const file of files) {
  const fp = 'C:/Saas/src/hooks/report-handlers/' + file;
  if (!fs.existsSync(fp)) continue;
  let content = fs.readFileSync(fp, 'utf8');
  let orig = content;

  // fix `label: \`${v, value:` -> `label: \`${v}%\` })), value:` or similar
  content = content.replace(/label:\s*`\$\{v(, value:)/g, 'label: `${v}` })), value:');
  content = content.replace(/label:\s*`S\$\{i\+1\}\`\s*\)\),?(\s*)value:/g, 'label: `S${i+1}` })),$1value:');
  content = content.replace(/\}\)\)\(\)\),?\s*value:/g, '})(), value:');
  
  // Actually, the previous run did:
  // `label: \`${v, value: '98.5%'`
  // It should be `label: \`${v}%\` })), value: '98.5%'`
  // Or just `label: \`${v}\` })), value:`
  
  // Let's just fix the exact 3 errors:
  // 1. pecuaria.ts:119 `label: \`${v, value:`
  content = content.replace(/label:\s*`\$\{v,\s*value:/g, 'label: `${v}%` })), value:');
  
  // 2. ia.ts:36 `})), value:` when it's an IIFE:
  content = content.replace(/\}\)\),\s*value:\s*'R\$\s*1\.700\.000'/g, '})(), value: \'R$ 1.700.000\'');
  
  // 3. logistica.ts:35 `label: \`${v, value:`
  content = content.replace(/label:\s*`\$\{v,\s*value:/g, 'label: `${v}` })), value:');

  if (content !== orig) {
    fs.writeFileSync(fp, content, 'utf8');
    fixedCount++;
  }
}
console.log('Fixed ' + fixedCount + ' files.');