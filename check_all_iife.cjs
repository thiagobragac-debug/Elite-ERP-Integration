const fs = require('fs');
const files = [
  'pecuaria.ts', 'logistica.ts', 'comercial.ts', 'ia.ts', 
  'panorama.ts', 'governanca.ts', 'financeiro.ts'
];

for (const file of files) {
  const fp = 'C:/Saas/src/hooks/report-handlers/' + file;
  if (!fs.existsSync(fp)) continue;
  let content = fs.readFileSync(fp, 'utf8');
  
  const mockBlocks = content.split('const mockData = {').slice(1).map(block => block.split('try {')[0]);
  
  for (const block of mockBlocks) {
    if (block.includes('sparkline: (() => {')) {
      console.log(`[${file}] Found IIFE in mockData:`);
      // print the line containing it
      const lines = block.split('\n');
      for (const line of lines) {
        if (line.includes('sparkline: (() => {')) {
          console.log(line.trim());
        }
      }
    }
  }
}