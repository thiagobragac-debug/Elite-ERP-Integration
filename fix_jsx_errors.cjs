const fs = require('fs');
const path = require('path');

function walkSync(dir, filelist = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    const stat = fs.statSync(filepath);
    if (stat.isDirectory()) {
      walkSync(filepath, filelist);
    } else if (file.endsWith('.tsx')) {
      filelist.push(filepath);
    }
  }
  return filelist;
}

const allTsx = walkSync('C:/Saas/src/pages');
let totalFixed = 0;

for (const fp of allTsx) {
  let content = fs.readFileSync(fp, 'utf8');
  let orig = content;
  
  // Fix arrow functions: = periodLabel="Mês Atual" > becomes =>
  content = content.replace(/=\s*periodLabel="[^"]+"\s*>/g, '=>');
  
  // Fix greater than operators: value periodLabel="Mês Atual" > becomes value >
  content = content.replace(/([a-zA-Z0-9_.])\s+periodLabel="[^"]+"\s*>/g, '$1 >');
  
  if (content !== orig) {
    fs.writeFileSync(fp, content, 'utf8');
    console.log(`FIXED ${path.basename(fp)}`);
    totalFixed++;
  }
}
console.log("Total files fixed: " + totalFixed);