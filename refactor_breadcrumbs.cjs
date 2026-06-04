const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

// Helper to recursively get all files
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

// Map folder to Module Label
const folderModuleMap = {
  'Admin': 'Administração',
  'Dashboard': 'Dashboard',
  'Finance': 'Financeiro',
  'Fleet': 'Frota & Máquinas',
  'Inventory': 'Estoque & Insumos',
  'Market': 'Mercado',
  'Pecuaria': 'Pecuária',
  'Purchasing': 'Compras',
  'Sales': 'Vendas'
};

const regexDiv = /<div\s+className="brand-badge"[^>]*>([\s\S]*?)<\/div>/g;
const regexText = />([^<]+)</g;

let files = getAllFiles(srcDir, []);

files.forEach(file => {
  if (!file.endsWith('.tsx')) return;

  let content = fs.readFileSync(file, 'utf-8');

  if (content.includes('brand-badge')) {
    let modified = false;

    // determine module name from path
    let moduleName = 'Tauze Pecuária';
    for (const folder of Object.keys(folderModuleMap)) {
      if (file.includes(`\\${folder}\\`) || file.includes(`/${folder}/`)) {
        moduleName = folderModuleMap[folder];
        break;
      }
    }

    content = content.replace(regexDiv, (match, innerContent) => {
      // Try to extract text content
      let textMatch = [...innerContent.matchAll(regexText)];
      let badgeText = textMatch.map(m => m[1].trim()).filter(t => t.length > 0).join(' ');
      
      // Default if no text found
      if (!badgeText) {
        if (innerContent.includes('TAUZE AUDIT')) badgeText = 'Rastreabilidade';
        else badgeText = 'Página';
      }

      modified = true;
      return `<Breadcrumb paths={[{ label: '${moduleName}' }, { label: '${badgeText}' }]} />`;
    });

    if (modified) {
      // inject import
      if (!content.includes("import { Breadcrumb }")) {
        // calculate relative path from current file to src/components/Navigation/Breadcrumb
        const fileDir = path.dirname(file);
        const breadcrumbDir = path.join(srcDir, 'components', 'Navigation');
        let relativePath = path.relative(fileDir, breadcrumbDir);
        // ensure format
        relativePath = relativePath.split(path.sep).join('/');
        if (!relativePath.startsWith('.')) relativePath = './' + relativePath;

        const importStr = `import { Breadcrumb } from '${relativePath}/Breadcrumb';\n`;
        
        // put after last import
        const lastImportIndex = content.lastIndexOf('import ');
        if (lastImportIndex !== -1) {
          const endOfImport = content.indexOf('\n', lastImportIndex);
          content = content.slice(0, endOfImport + 1) + importStr + content.slice(endOfImport + 1);
        } else {
          content = importStr + content;
        }
      }
      fs.writeFileSync(file, content, 'utf-8');
      console.log(`Refactored: ${file}`);
    }
  }
});
