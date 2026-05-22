const fs = require('fs');
let content = fs.readFileSync('C:/Saas/src/pages/Admin/UserManagement.tsx');
let str = content.toString('utf8');
const match = str.match(/Gest.o estrat.gica/);
if (match) {
  console.log("Found:", match[0]);
  console.log("Bytes:", Buffer.from(match[0]).toString('hex'));
}