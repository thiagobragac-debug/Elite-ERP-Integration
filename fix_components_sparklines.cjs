const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

let totalMatches = 0;
let totalReplaced = 0;

function checkAndReplace(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check how many static map sparklines exist
    const matches = content.match(/sparkline:\s*\[[0-9.,\-\s]+\]\.map/g);
    if (matches) {
      totalMatches += matches.length;
      
      const regex = /sparkline:\s*\[.*?\]\.map\(\(.*?\) => \(\{.*?\}\)\),\s*value:\s*(.*?),\s*(change|trend|icon|color|periodLabel|progress)/g;
      
      let replacedContent = content.replace(regex, (match, valueExpr, nextProp) => {
        totalReplaced++;
        let suffix = '';
        const labelMatch = match.match(/label:\s*`\$\{v\}(.*?)`/);
        if (labelMatch) suffix = labelMatch[1];
        
        const iife = `sparkline: (() => { 
          const valStr = String(${valueExpr.trim()});
          const match = valStr.match(/[0-9]+(?:[.,][0-9]+)?/);
          const val = match ? parseFloat(match[0].replace(',', '.')) : 0;
          return [val*0.6, val*0.7, val*0.8, val*0.85, val*0.9, val*0.95, val].map((v,i) => {
            const formatted = v % 1 === 0 ? v : Number(v.toFixed(1));
            return { value: formatted, label: \`\${formatted}${suffix}\` };
          });
        })(), value: ${valueExpr}, ${nextProp}`;
        
        return iife.replace(/\n\s+/g, ' ');
      });
      
      if (replacedContent !== content) {
        fs.writeFileSync(filePath, replacedContent, 'utf8');
      }
    }
  }
}

const dirs = ['Purchasing', 'Sales', 'Finance', 'Inventory', 'Fleet'];
dirs.forEach(d => walkDir('C:/Saas/src/pages/' + d, checkAndReplace));

console.log(`Total static matches: ${totalMatches}`);
console.log(`Total replaced dynamically: ${totalReplaced}`);