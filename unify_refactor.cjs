const fs = require('fs');
const path = require('path');

function getAllFiles(dirPath, arrayOfFiles) {
  let files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        arrayOfFiles.push(path.join(dirPath, "/", file));
      }
    }
  });

  return arrayOfFiles;
}

const files = getAllFiles('C:\\Saas\\src');
let modifiedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  let originalContent = content;

  // Replacements for Supabase API calls
  content = content.replace(/\.from\(['"`]fornecedores['"`]\)/g, ".from('parceiros')");
  content = content.replace(/\.from\(['"`]clientes['"`]\)/g, ".from('parceiros')");
  
  content = content.replace(/fornecedor:fornecedores\(/g, "fornecedor:parceiros(");
  content = content.replace(/cliente:clientes\(/g, "cliente:parceiros(");
  
  content = content.replace(/fornecedores\(/g, "parceiros(");
  content = content.replace(/clientes\(/g, "parceiros(");

  // Note: we will not blindly replace fornecedor_id and cliente_id strings, 
  // because we don't want to break local variable names unless necessary.
  // Actually, we must replace them in the database API calls or if we rename the DB columns.
  // Let's assume we do rename the columns in the DB.
  content = content.replace(/fornecedor_id/g, "parceiro_id");
  content = content.replace(/cliente_id/g, "parceiro_id");
  content = content.replace(/fornecedor/g, "parceiro");
  content = content.replace(/cliente/g, "parceiro");
  content = content.replace(/Fornecedor/g, "Parceiro");
  content = content.replace(/Cliente/g, "Parceiro");
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf-8');
    modifiedCount++;
    console.log(`Modified: ${file}`);
  }
});

console.log(`Refactoring complete. Modified ${modifiedCount} files.`);
