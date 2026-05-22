const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('C:/Saas/src/pages/Admin', function(filePath) {
  if (filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('sparkline:') && content.includes('[') && content.includes('.map')) {
      console.log(`[Admin] Found static sparkline in ${filePath}`);
    }
  }
});

walkDir('C:/Saas/src/pages/Market', function(filePath) {
  if (filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('sparkline:') && content.includes('[') && content.includes('.map')) {
      console.log(`[Market] Found static sparkline in ${filePath}`);
    }
  }
});