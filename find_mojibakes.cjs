const fs = require('fs');
const path = require('path');

const dict = [
  'Ã¡', 'Ã ', 'Ã¢', 'Ã£', 'Ã¤',
  'Ã©', 'Ã¨', 'Ãª', 'Ã«',
  'Ã\xad', 'Ã¬', 'Ã®', 'Ã¯', 
  'Ã³', 'Ã²', 'Ã´', 'Ãµ', 'Ã¶',
  'Ãº', 'Ã¹', 'Ã»', 'Ã¼',
  'Ã§', 'Ã±',
  'Ã\x81', 'Ã\x80', 'Ã\x82', 'Ã\x83', 'Ã\x84',
  'Ã\x89', 'Ã\x88', 'Ã\x8a', 'Ã\x8b',
  'Ã\x8d', 'Ã\x8c', 'Ã\x8e', 'Ã\x8f',
  'Ã\x93', 'Ã\x92', 'Ã\x94', 'Ã\x95', 'Ã\x96',
  'Ã\x9a', 'Ã\x99', 'Ã\x9b', 'Ã\x9c',
  'Ã\x87', 'Ã\x91',
  'Âº', 'Âª',
  'Ã‡', 'Ãƒ', 'Ã•', 'Ã‰', 'Ãš', 'ÃŠ', 'Ã—'
];

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

let found = 0;
walkDir('C:/Saas/src', function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasMojibake = false;
    for (const bad of dict) {
      if (content.includes(bad)) {
        hasMojibake = true;
        break;
      }
    }
    if (hasMojibake) {
      console.log("Found in:", filePath);
      found++;
    }
  }
});
console.log("Total files with mojibake:", found);
