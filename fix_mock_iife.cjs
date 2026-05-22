const fs = require('fs');
const files = [
  'pecuaria.ts', 'logistica.ts', 'comercial.ts', 'ia.ts', 
  'panorama.ts', 'governanca.ts', 'financeiro.ts'
];

let totalFixed = 0;

for (const file of files) {
  const fp = 'C:/Saas/src/hooks/report-handlers/' + file;
  if (!fs.existsSync(fp)) continue;
  let content = fs.readFileSync(fp, 'utf8');
  let original = content;

  // Find the mockData block(s) and replace IIFEs inside it
  content = content.replace(/const mockData = \{[\s\S]*?try \{/g, (match) => {
    // Replace any sparkline: (() => { ... })() with sparkline: [1,2,3,4,5,6,7].map((v,i) => ({ value: v, label: `${v}` }))
    return match.replace(/sparkline:\s*\(\(\)\s*=>\s*\{[^}]+\}\)\(\)/g, "sparkline: [1,2,3,4,5,6,7].map((v,i) => ({ value: v, label: `${v}` }))");
  });

  if (content !== original) {
    fs.writeFileSync(fp, content, 'utf8');
    console.log(`Fixed mockData in ${file}`);
    totalFixed++;
  }
}
console.log(`Fixed mockData in ${totalFixed} files`);