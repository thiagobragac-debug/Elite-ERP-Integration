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
  let originalContent = content;
  
  if (!sparklines[file]) continue;
  
  const fileSparklines = sparklines[file];
  
  // Create a normalized map
  const normalizedMap = new Map();
  for (const [corruptedLabel, sparkline] of Object.entries(fileSparklines)) {
    const normalized = corruptedLabel.replace(/[^\x20-\x7E]/g, '').replace(/\s+/g, '').toLowerCase();
    normalizedMap.set(normalized, sparkline);
  }

  // Find all objects with `label: '...'` inside the `stats: [...]` array that lack sparkline
  // We use replace to inject
  const injectRegex = /(\{\s*label:\s*['"]([^'"]+)['"](?:(?!\bsparkline\b)[^}])+)(\})/g;
  
  content = content.replace(injectRegex, (fullMatch, p1, label, p3) => {
    const normalizedLabel = label.replace(/[^\x20-\x7E]/g, '').replace(/\s+/g, '').toLowerCase();
    if (normalizedMap.has(normalizedLabel)) {
      let prefix = p1;
      if (!prefix.trim().endsWith(',')) {
        prefix += ',';
      }
      totalInjected++;
      return `${prefix}\n          ${normalizedMap.get(normalizedLabel)}\n        ${p3}`;
    }
    return fullMatch; // unchanged
  });

  if (content !== originalContent) {
    fs.writeFileSync(fp, content, 'utf8');
    console.log(`Injected sparklines in ${file}`);
  }
}
console.log(`Total injected: ${totalInjected}`);