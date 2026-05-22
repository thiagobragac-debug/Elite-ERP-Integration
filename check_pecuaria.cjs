const fs = require('fs');
let content = fs.readFileSync('C:/Saas/src/hooks/report-handlers/pecuaria.ts', 'utf8');
const statsMatch = content.match(/stats:\s*\[([\s\S]*?)\]/g);
console.log(statsMatch[1].substring(0, 500)); // The second one is the dynamic one!