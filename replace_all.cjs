const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const termsToReplace = [
  { regex: /\/pecuaria/g, replacement: '/bovinocultura' },
  { regex: /Pecu\u00e1ria/g, replacement: 'Bovinocultura' }, // Pecuária
  { regex: /pecu\u00e1ria/g, replacement: 'bovinocultura' }, // pecuária
  { regex: /Pecuaria/g, replacement: 'Bovinocultura' },
  { regex: /'pecuaria'/g, replacement: "'bovinocultura'" },
  { regex: /"pecuaria"/g, replacement: '"bovinocultura"' },
  { regex: /pecuaria_/g, replacement: "bovinocultura_" },
  { regex: /pecuariaRoutes/g, replacement: "bovinoculturaRoutes" },
  { regex: /pecuaria\.ts/g, replacement: "bovinocultura.ts" }
];

walkDir('./src', function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.js')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    termsToReplace.forEach(t => {
      newContent = newContent.replace(t.regex, t.replacement);
    });
    
    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log('Updated ' + filePath);
    }
  }
});
