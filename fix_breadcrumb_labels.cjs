const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const getAllFiles = (dirPath, arrayOfFiles) => {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach((file) => {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, "/", file));
    }
  });
  return arrayOfFiles;
};

const regexH1 = /<h1[^>]*className="page-title"[^>]*>([\s\S]*?)<\/h1>/i;

let files = getAllFiles(srcDir, []);

files.forEach(file => {
  if (!file.endsWith('.tsx')) return;
  let content = fs.readFileSync(file, 'utf-8');
  if (content.includes('<Breadcrumb')) {
    // extract h1 text
    const matchH1 = content.match(regexH1);
    if (matchH1 && matchH1[1]) {
      // Clean up text, remove tags
      const pageTitle = matchH1[1].replace(/<[^>]*>?/gm, '').trim();
      
      // We need to replace the last label in Breadcrumb.
      // Format is usually <Breadcrumb paths={[{ label: 'Módulo' }, { label: 'TEXTO ERRADO' }]} />
      const regexBreadcrumb = /(<Breadcrumb paths=\{\[\{ label: '[^']+' \}, \{ label: ')([^']+)(' \}\]\} \/>)/;
      
      if (regexBreadcrumb.test(content)) {
        content = content.replace(regexBreadcrumb, `$1${pageTitle}$3`);
        fs.writeFileSync(file, content, 'utf-8');
        console.log(`Fixed label in ${file} to "${pageTitle}"`);
      }
    }
  }
});
