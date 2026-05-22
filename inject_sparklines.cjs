const fs = require('fs');
const files = [
  'pecuaria.ts', 'logistica.ts', 'comercial.ts', 'ia.ts', 
  'panorama.ts', 'governanca.ts', 'financeiro.ts'
];

let totalInjected = 0;

for (const file of files) {
  const fp = 'C:/Saas/src/hooks/report-handlers/' + file;
  if (!fs.existsSync(fp)) continue;
  let content = fs.readFileSync(fp, 'utf8');
  let originalContent = content;

  // 1. Extract all sparklines mapped by their label
  const sparklineMap = new Map();
  const extractRegex = /\{\s*label:\s*['"]([^'"]+)['"][\s\S]*?(sparkline:\s*[^}]+)\s*\}/g;
  let match;
  while ((match = extractRegex.exec(content)) !== null) {
    const label = match[1];
    let sparklineStr = match[2].trim();
    // Some sparklines have trailing commas, remove them for map
    if (sparklineStr.endsWith(',')) {
      sparklineStr = sparklineStr.slice(0, -1);
    }
    if (!sparklineMap.has(label)) {
      sparklineMap.set(label, sparklineStr);
    }
  }

  // 2. Inject missing sparklines
  // We look for objects inside the stats array that lack 'sparkline:'
  // Pattern: { label: '...', ... } without sparkline before the closing }
  const injectRegex = /(\{\s*label:\s*['"]([^'"]+)['"](?:(?!\bsparkline\b)[^}])+)(\})/g;
  
  content = content.replace(injectRegex, (fullMatch, p1, label, p3) => {
    if (sparklineMap.has(label)) {
      // Add a comma if p1 doesn't end with one or a newline
      let prefix = p1;
      if (!prefix.trim().endsWith(',')) {
        prefix += ',';
      }
      totalInjected++;
      return `${prefix}\n          ${sparklineMap.get(label)}\n        ${p3}`;
    }
    return fullMatch;
  });

  if (content !== originalContent) {
    fs.writeFileSync(fp, content, 'utf8');
    console.log(`Injected sparklines in ${file}`);
  }
}
console.log(`Total injected: ${totalInjected}`);