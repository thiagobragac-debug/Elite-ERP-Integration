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

  // fix `})(), value:` -> `})), value:`
  content = content.replace(/\}\)\)\(\),\s*value:/g, '})), value:');
  
  // wait, what if it's `...})()`, inside an IIFE?
  // `(() => { ... return [...].map(...) })()`
  // If it's an IIFE, it should end with `})(), value:`
  // If it's just `.map`, it ends with `})), value:`
  
  // Let's just manually fix them.
  if (file === 'financeiro.ts') {
    content = content.replace(/label:\s*`S\$\{i\+1\}\`\s*\}\)\(\),\s*value:\s*'R\$\s*1\.700\.000'/g, 'label: `S${i+1}` })), value: \'R$ 1.700.000\'');
  }
  if (file === 'ia.ts') {
    content = content.replace(/label:\s*`S\$\{i\+1\}\`\s*\}\)\(\),\s*value:\s*'R\$\s*1\.700\.000'/g, 'label: `S${i+1}` })); })(), value: \'R$ 1.700.000\'');
  }

  if (content !== orig) {
    fs.writeFileSync(fp, content, 'utf8');
    fixedCount++;
  }
}
console.log('Fixed ' + fixedCount + ' files.');