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

  // We need to fix ReferenceErrors in mock blocks.
  // The easiest way is to find the mockData block and replace variables with literal values.
  
  // We can do this safely: we replace specific known variables inside the mockData block ONLY.
  // We don't want to break the dynamic block!
  
  // To replace only in mockData blocks:
  content = content.replace(/const mockData = \{[\s\S]*?try \{/g, (match) => {
    return match
      .replace(/deadAnimals/g, '45')
      .replace(/baseProfit/g, '1700000')
      .replace(/conf \|\| \[\]/g, '[]')
      .replace(/conf/g, '[]')
      .replace(/Math\.max\(0,\s*\[\]\+3\)/g, '10') // Handle array math
      .replace(/Math\.max\(0,\s*\[\]\+2\)/g, '10')
      .replace(/Math\.max\(0,\s*\[\]\+1\)/g, '10')
      .replace(/Math\.max\([^)]+\[\][^)]+\)/g, '10') // Catch any conf math
  });

  if (content !== original) {
    fs.writeFileSync(fp, content, 'utf8');
    console.log(`Fixed references in mockData for ${file}`);
    totalFixed++;
  }
}
console.log(`Fixed ${totalFixed} files`);