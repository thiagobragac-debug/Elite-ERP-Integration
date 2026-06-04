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

// Map module name to its Intelligence Hub / Dashboard href
const moduleHrefMap = {
  'Administração': '/admin/intelligence',
  'Dashboard': '/',
  'Financeiro': '/financeiro/intelligence',
  'Frota & Máquinas': '/frota/dashboard',
  'Estoque & Insumos': '/estoque/dashboard',
  'Mercado': '/mercado/indicadores',
  'Pecuária': '/pecuaria/dashboard',
  'Compras': '/compras/dashboard',
  'Vendas': '/vendas/dashboard'
};

let files = getAllFiles(srcDir, []);

files.forEach(file => {
  if (!file.endsWith('.tsx')) return;
  let content = fs.readFileSync(file, 'utf-8');
  
  if (content.includes('<Breadcrumb')) {
    let modified = false;

    // We want to replace { label: 'ModuleName' } with { label: 'ModuleName', href: '/path' }
    for (const [moduleName, href] of Object.entries(moduleHrefMap)) {
      // It might already have href if ran multiple times, or not
      const searchStr = `{ label: '${moduleName}' }`;
      const replaceStr = `{ label: '${moduleName}', href: '${href}' }`;
      
      if (content.includes(searchStr)) {
        content = content.replace(searchStr, replaceStr);
        modified = true;
      }
    }

    if (modified) {
      fs.writeFileSync(file, content, 'utf-8');
      console.log(`Added href to Breadcrumb in ${file}`);
    }
  }
});
