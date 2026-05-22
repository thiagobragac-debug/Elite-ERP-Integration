const fs = require('fs');
const path = require('path');

function getAllFiles(dirPath, arrayOfFiles) {
  files = fs.readdirSync(dirPath);

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
  
  // Replace the PostgREST alias in select queries
  // e.g. select('..., fornecedores(...)') -> select('..., parceiros(...)')
  content = content.replace(/fornecedor:fornecedores\(/g, "fornecedor:parceiros(");
  content = content.replace(/cliente:clientes\(/g, "cliente:parceiros(");
  
  // What about just 'fornecedores(' or 'clientes(' in select strings?
  // We need to be careful with things like `.select('*, fornecedores(*)')`
  content = content.replace(/fornecedores\(/g, "parceiros(");
  content = content.replace(/clientes\(/g, "parceiros(");
  content = content.replace(/fornecedor_id/g, "parceiro_id");
  content = content.replace(/cliente_id/g, "parceiro_id");

  // Type usages
  content = content.replace(/Fornecedor/g, "Parceiro");
  content = content.replace(/Cliente/g, "Parceiro");
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf-8');
    modifiedCount++;
    console.log(`Modified: ${file}`);
  }
});

console.log(`Refactoring complete. Modified ${modifiedCount} files.`);
