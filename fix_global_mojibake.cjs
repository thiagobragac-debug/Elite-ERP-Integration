const fs = require('fs');
const path = require('path');

function fixSafe(str) {
  // We match double-encoded UTF-8 characters typical of ISO-8859-1 -> UTF-8 mojibake
  // These are usually 2 bytes where the first is C2 or C3.
  // Actually, sometimes it's 3 bytes, e.g., "Ã¢" is 2 bytes, but "â" was originally 1 byte in Latin1, so it became 2 bytes.
  // Wait, if it's C2/C3 followed by 80-BF, it's 2 bytes. 
  // Let's use the explicit dictionary to be 1000% safe.
  
  const dict = {
    'Ã¡': 'á', 'Ã ': 'à', 'Ã¢': 'â', 'Ã£': 'ã', 'Ã¤': 'ä',
    'Ã©': 'é', 'Ã¨': 'è', 'Ãª': 'ê', 'Ã«': 'ë',
    'Ã\xad': 'í', 'Ã¬': 'ì', 'Ã®': 'î', 'Ã¯': 'ï', // \xad is '­' (soft hyphen) but in latin1 it's 'í'
    'Ã³': 'ó', 'Ã²': 'ò', 'Ã´': 'ô', 'Ãµ': 'õ', 'Ã¶': 'ö',
    'Ãº': 'ú', 'Ã¹': 'ù', 'Ã»': 'û', 'Ã¼': 'ü',
    'Ã§': 'ç', 'Ã±': 'ñ',
    'Ã\x81': 'Á', 'Ã\x80': 'À', 'Ã\x82': 'Â', 'Ã\x83': 'Ã', 'Ã\x84': 'Ä',
    'Ã\x89': 'É', 'Ã\x88': 'È', 'Ã\x8a': 'Ê', 'Ã\x8b': 'Ë',
    'Ã\x8d': 'Í', 'Ã\x8c': 'Ì', 'Ã\x8e': 'Î', 'Ã\x8f': 'Ï',
    'Ã\x93': 'Ó', 'Ã\x92': 'Ò', 'Ã\x94': 'Ô', 'Ã\x95': 'Õ', 'Ã\x96': 'Ö',
    'Ã\x9a': 'Ú', 'Ã\x99': 'Ù', 'Ã\x9b': 'Û', 'Ã\x9c': 'Ü',
    'Ã\x87': 'Ç', 'Ã\x91': 'Ñ',
    'Âº': 'º', 'Âª': 'ª',
    'Ã‡': 'Ç', 'Ãƒ': 'Ã', 'Ã•': 'Õ', 'Ã‰': 'É', 'Ãš': 'Ú', 'Ã\x8d': 'Í', 'Ã\x81': 'Á', 'Ã\x89': 'É', 'Ã\x8D': 'Í', 'Ã\x93': 'Ó', 'Ã\x9A': 'Ú', 'Ã\x95': 'Õ'
  };

  let fixed = str;
  // Also try the generic buffer method for C2/C3 followed by 80-BF
  fixed = fixed.replace(/[\xc2\xc3][\x80-\xbf]/g, match => {
    return Buffer.from(match, 'latin1').toString('utf8');
  });
  
  // Clean up any stray literal 'Ã£' that might not have been caught if they were string literals
  for (const [bad, good] of Object.entries(dict)) {
    fixed = fixed.split(bad).join(good);
  }
  
  return fixed;
}

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

let totalFixed = 0;
walkDir('C:/Saas/src', function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let fixed = fixSafe(content);
    if (fixed !== content) {
      fs.writeFileSync(filePath, fixed, 'utf8');
      console.log("Fixed mojibake in", filePath);
      totalFixed++;
    }
  }
});
console.log("Total files fixed:", totalFixed);