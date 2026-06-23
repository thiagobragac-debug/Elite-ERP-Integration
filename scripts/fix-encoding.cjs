const fs = require('fs');
const path = require('path');

const replacements = {
  'Ã£': 'ã',
  'Ã§': 'ç',
  'Ã¡': 'á',
  'Ã©': 'é',
  'Ã³': 'ó',
  'Ãº': 'ú',
  'Ãµ': 'õ',
  'Ã¢': 'â',
  'Ãª': 'ê',
  'Ã®': 'î',
  'Ã´': 'ô',
  'Ã‡': 'Ç',
  'Ãƒ': 'Ã',
  'Ã“': 'Ó',
  'Ã‰': 'É',
  'Ãš': 'Ú',
  'Ã€': 'À',
  'Ã\xad': 'í',
  'Ã\x8d': 'Í',
  'Ã\x81': 'Á'
};

const exactReplacements = {
  'DESCRIÃ‡ÃƒO': 'DESCRIÇÃO',
  'NÃƒO': 'NÃO',
  'SESSÃƒO': 'SESSÃO',
  'ALTERAÃ‡ÃƒO': 'ALTERAÇÃO',
  'MANUTENÃ‡ÃƒO': 'MANUTENÇÃO',
  'Ãšnico': 'Único',
  'Ã€ Vista': 'À Vista',
  'CLASSIFICAÃ‡ÃƒO': 'CLASSIFICAÇÃO',
  'SOLICITAÃ‡ÃƒO': 'SOLICITAÇÃO',
  'OBRIGATÃ“RIO': 'OBRIGATÓRIO',
  'EVIDÃŠNCIAS': 'EVIDÊNCIAS'
};

function walkSync(currentDirPath, callback) {
  fs.readdirSync(currentDirPath).forEach(function (name) {
    var filePath = path.join(currentDirPath, name);
    var stat = fs.statSync(filePath);
    if (stat.isFile() && (filePath.endsWith('.tsx') || filePath.endsWith('.ts'))) {
      callback(filePath, stat);
    } else if (stat.isDirectory() && name !== 'node_modules' && name !== '.git') {
      walkSync(filePath, callback);
    }
  });
}

let modifiedFiles = 0;
walkSync('src', function(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  
  for (const [bad, good] of Object.entries(exactReplacements)) {
    content = content.split(bad).join(good);
  }
  
  for (const [bad, good] of Object.entries(replacements)) {
    content = content.split(bad).join(good);
  }
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    modifiedFiles++;
    console.log('Fixed:', filePath);
  }
});
console.log('Total files fixed:', modifiedFiles);
