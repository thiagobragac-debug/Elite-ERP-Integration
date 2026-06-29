const fs = require('fs');
const path = require('path');

const formsDir = path.join(__dirname, 'src', 'components', 'Forms');
const files = fs.readdirSync(formsDir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(formsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  if (content.includes('showValidationAlert(') && !content.includes('import { showValidationAlert }')) {
    content = "import { showValidationAlert } from '../../utils/validationAlert';\n" + content;
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed import in ${file}`);
  }
}
