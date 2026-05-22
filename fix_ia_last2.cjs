const fs = require('fs');
const fp = 'C:/Saas/src/hooks/report-handlers/ia.ts';
let content = fs.readFileSync(fp, 'utf8');
content = content.replace(/label:\s*String\(v\)\+'\s*UA',\s*value:/g, 'label: String(v)+\' UA\' })), value:');
fs.writeFileSync(fp, content, 'utf8');
console.log('Fixed ia.ts second error');