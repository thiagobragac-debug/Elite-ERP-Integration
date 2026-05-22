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

function checkFiles(dirName, searchPath) {
  walkDir(searchPath, function(filePath) {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Look for any static array of numbers mapped: sparkline: [100, 200, ...]
      const matches = content.match(/sparkline:\s*\[[0-9.,\-\s]+\]\.map/g);
      if (matches) {
        console.log(`[${dirName}] Static sparkline found in ${filePath}: ${matches.length} matches`);
      }
    }
  });
}

checkFiles('Purchasing', 'C:/Saas/src/pages/Purchasing');
checkFiles('Reports', 'C:/Saas/src/pages/Reports');
checkFiles('ReportsComponents', 'C:/Saas/src/components/Reports');
checkFiles('Sales', 'C:/Saas/src/pages/Sales');
checkFiles('Finance', 'C:/Saas/src/pages/Finance');
checkFiles('Inventory', 'C:/Saas/src/pages/Inventory');
checkFiles('Fleet', 'C:/Saas/src/pages/Fleet');
checkFiles('PecuariaPages', 'C:/Saas/src/pages/Pecuaria');
checkFiles('AdminPages', 'C:/Saas/src/pages/Admin');
checkFiles('MarketPages', 'C:/Saas/src/pages/Market');

console.log("Check complete.");