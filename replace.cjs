const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('./src/pages/Bovinocultura', function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let newContent = content
      .replace(/\/pecuaria/g, '/bovinocultura')
      .replace(/Pecuária/g, 'Bovinocultura')
      .replace(/pecuária/g, 'bovinocultura')
      .replace(/Pecuaria/g, 'Bovinocultura')
      .replace(/'pecuaria'/g, "'bovinocultura'")
      .replace(/pecuaria_/g, "bovinocultura_");
    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log('Updated ' + filePath);
    }
  }
});
