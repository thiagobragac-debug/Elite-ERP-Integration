const fs = require('fs');

function fixSafe(str) {
  const dict = {
    'Ã¡': 'á', 'Ã ': 'à', 'Ã¢': 'â', 'Ã£': 'ã', 'Ã¤': 'ä',
    'Ã©': 'é', 'Ã¨': 'è', 'Ãª': 'ê', 'Ã«': 'ë',
    'Ã\xad': 'í', 'Ã¬': 'ì', 'Ã®': 'î', 'Ã¯': 'ï',
    'Ã³': 'ó', 'Ã²': 'ò', 'Ã´': 'ô', 'Ãµ': 'õ', 'Ã¶': 'ö',
    'Ãº': 'ú', 'Ã¹': 'ù', 'Ã»': 'û', 'Ã¼': 'ü',
    'Ã§': 'ç', 'Ã±': 'ñ',
    'Ã\x81': 'Á', 'Ã\x80': 'À', 'Ã\x82': 'Â', 'Ã\x83': 'Ã', 'Ã\x84': 'Ä',
    'Ã\x89': 'É', 'Ã\x88': 'È', 'Ã\x8a': 'Ê', 'Ã\x8b': 'Ë',
    'Ã\x8d': 'Í', 'Ã\x8c': 'Ì', 'Ã\x8e': 'Î', 'Ã\x8f': 'Ï',
    'Ã\x93': 'Ó', 'Ã\x92': 'Ò', 'Ã\x94': 'Ô', 'Ã\x95': 'Õ', 'Ã\x96': 'Ö',
    'Ã\x9a': 'Ú', 'Ã\x99': 'Ù', 'Ã\x9b': 'Û', 'Ã\x9c': 'Ü',
    'Ã\x87': 'Ç', 'Ã\x91': 'Ñ',
    'Âº': 'º', 'Âª': 'ª'
  };

  let fixed = str.replace(/[\xc2\xc3][\x80-\xbf]/g, match => {
    return Buffer.from(match, 'latin1').toString('utf8');
  });
  
  for (const [bad, good] of Object.entries(dict)) {
    fixed = fixed.split(bad).join(good);
  }
  
  return fixed;
}

let content = fs.readFileSync('C:/Saas/src/components/Sidebar/Sidebar.tsx', 'utf8');
let fixed = fixSafe(content);
if (fixed !== content) {
  fs.writeFileSync('C:/Saas/src/components/Sidebar/Sidebar.tsx', fixed, 'utf8');
  console.log("Fixed mojibake in Sidebar.tsx");
} else {
  console.log("No changes");
}