const fs = require('fs');
const path = require('path');

const formsDir = path.join(__dirname, 'src', 'components', 'Forms');
const files = fs.readdirSync(formsDir).filter(f => f.endsWith('.tsx'));

let updatedCount = 0;

for (const file of files) {
  const filePath = path.join(formsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // 1. replace: parsed.error.errors.forEach(err => toast.error(err.message, { id: err.message }));
  content = content.replace(/parsed\.error\.errors\.forEach\([^\)]+toast\.error[^\)]+\)\);?/g, "showValidationAlert(parsed.error);");
  content = content.replace(/parsed\.error\.errors\.map\([^\)]+toast\.error[^\)]+\)\);?/g, "showValidationAlert(parsed.error);");

  // 2. replace: toast.error(`⚠️ ${err.errors[0].message}`);
  content = content.replace(/toast\.error\(\s*`[^`]*\$\{err\.errors\[0\]\.message\}[^`]*`\s*\);?/g, "showValidationAlert(err);");

  // 3. replace generic validation messages
  const genericValidationRegex = /toast\.error\(\s*(['"`]).*?(Preencha|Selecione|Informe|Adicione|Confirme|Obrigatório)[^'"`]+\1\s*\);?/gi;
  content = content.replace(genericValidationRegex, (match) => {
    // Extract the string literal from the toast.error
    const strMatch = match.match(/toast\.error\(\s*(['"`].*?['"`])\s*\);?/);
    if (strMatch && strMatch[1]) {
      return `showValidationAlert(${strMatch[1]});`;
    }
    return match;
  });

  // 4. AnimalForm custom code block
  const animalCustomBlockRegex = /toast\.error\([\s\S]*?Campos Obrigatórios Pendentes[\s\S]*?\);/;
  if (animalCustomBlockRegex.test(content)) {
    content = content.replace(animalCustomBlockRegex, "showValidationAlert(validation.error);");
  }

  if (content !== originalContent) {
    // Add import if not present
    if (!content.includes('showValidationAlert')) {
      const importStatement = "import { showValidationAlert } from '../../utils/validationAlert';\n";
      // insert after the last import
      const lastImportIndex = content.lastIndexOf('import ');
      if (lastImportIndex !== -1) {
        const nextLineIndex = content.indexOf('\n', lastImportIndex);
        content = content.slice(0, nextLineIndex + 1) + importStatement + content.slice(nextLineIndex + 1);
      } else {
        content = importStatement + content;
      }
    }
    fs.writeFileSync(filePath, content, 'utf8');
    updatedCount++;
    console.log(`Updated ${file}`);
  }
}

console.log(`Updated ${updatedCount} files.`);
