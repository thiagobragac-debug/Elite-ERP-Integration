const fs = require('fs');
let content = fs.readFileSync('C:/Saas/src/pages/Admin/UserManagement.tsx', 'utf8');

// Check if there are characters > 255 that are NOT part of the mojibake
let hasHighChars = false;
for (let i = 0; i < content.length; i++) {
  if (content.charCodeAt(i) > 255) {
    // console.log("High char:", content[i], content.charCodeAt(i));
    hasHighChars = true;
  }
}

// If we use the manual mojibake replacement dictionary, it's safer for files that might have mixed encoding!
const dict = {
  'Ã¡': 'á', 'Ã ': 'à', 'Ã¢': 'â', 'Ã£': 'ã', 'Ã¤': 'ä',
  'Ã©': 'é', 'Ã¨': 'è', 'Ãª': 'ê', 'Ã«': 'ë',
  'Ã­': 'í', 'Ã¬': 'ì', 'Ã®': 'î', 'Ã¯': 'ï',
  'Ã³': 'ó', 'Ã²': 'ò', 'Ã´': 'ô', 'Ãµ': 'õ', 'Ã¶': 'ö',
  'Ãº': 'ú', 'Ã¹': 'ù', 'Ã»': 'û', 'Ã¼': 'ü',
  'Ã§': 'ç', 'Ã±': 'ñ',
  'Ã\u0081': 'Á', 'Ã\u0080': 'À', 'Ã\u0082': 'Â', 'Ã\u0083': 'Ã', 'Ã\u0084': 'Ä',
  'Ã\u0089': 'É', 'Ã\u0088': 'È', 'Ã\u008A': 'Ê', 'Ã\u008B': 'Ë',
  'Ã\u008D': 'Í', 'Ã\u008C': 'Ì', 'Ã\u008E': 'Î', 'Ã\u008F': 'Ï',
  'Ã\u0093': 'Ó', 'Ã\u0092': 'Ò', 'Ã\u0094': 'Ô', 'Ã\u0095': 'Õ', 'Ã\u0096': 'Ö',
  'Ã\u009A': 'Ú', 'Ã\u0099': 'Ù', 'Ã\u009B': 'Û', 'Ã\u009C': 'Ü',
  'Ã\u0087': 'Ç', 'Ã\u0091': 'Ñ',
  'Âº': 'º', 'Âª': 'ª',
  'Ã‡': 'Ç', 'Ãƒ': 'Ã', 'Ã•': 'Õ', 'Ã‰': 'É', 'Ãš': 'Ú', 'Ã\u008D': 'Í'
};

// Instead of latin1->utf8 for the whole file, let's just do latin1->utf8 but ONLY for characters that look like mojibake!
function fixSafe(str) {
  return str.replace(/[\xc2-\xc3][\x80-\xbf]/g, match => {
    return Buffer.from(match, 'latin1').toString('utf8');
  });
}

const safeFix = fixSafe(content);
if (safeFix.includes("Gestão de Sessões")) {
  console.log("Safe fix worked!");
} else {
  console.log("Safe fix failed", safeFix.substring(0, 100));
}