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
  let originalContent = content;

  // Find any line that has `sparkline:` and ends with `} }` or `} },`
  // Actually, we can just replace `} \n        }` with `\n        }`
  // Let's just fix the specific pattern: `sparkline: [^]+ } \n        }`
  content = content.replace(/sparkline:\s*([^]+?)\s*\}\s*\n\s*\}/g, (match, inner) => {
    fixedCount++;
    return `sparkline: ${inner}\n        }`;
  });

  if (content !== originalContent) {
    fs.writeFileSync(fp, content, 'utf8');
    console.log(`Fixed trailing braces in ${file}`);
  }
}
console.log(`Total fixed: ${fixedCount}`);