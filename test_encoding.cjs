const fs = require('fs');
const content = fs.readFileSync('C:/Saas/src/hooks/report-handlers/pecuaria.ts');
const str = content.toString('utf8');
const match = str.match(/Estoque Bi(?:.+)gico/);
if (match) {
  console.log("Found:", match[0]);
  console.log("Bytes:", Buffer.from(match[0]).toString('hex'));
}