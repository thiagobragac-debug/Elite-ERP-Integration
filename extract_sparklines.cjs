const fs = require('fs');
// handlers.diff was created by PowerShell '>', which is UTF-16 LE (UCS-2)
const diff = fs.readFileSync('C:/Saas/handlers.diff', 'utf16le');

const map = {};
let currentFile = '';
let currentLabel = '';

const lines = diff.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.startsWith('+++ b/src/hooks/report-handlers/')) {
    currentFile = line.split('/').pop().trim();
    console.log("Found file: " + currentFile);
  }
  
  const labelMatch = line.match(/label:\s*['"]([^'"]+)['"]/);
  if (labelMatch) {
    currentLabel = labelMatch[1];
  }
  
  if (line.startsWith('+') && line.includes('sparkline:')) {
    if (currentLabel) {
      let sparklineLine = line.substring(1).trim();
      if (sparklineLine.endsWith(',')) sparklineLine = sparklineLine.slice(0, -1);
      
      if (!map[currentFile]) map[currentFile] = {};
      map[currentFile][currentLabel] = sparklineLine;
      currentLabel = '';
    }
  }
}

fs.writeFileSync('C:/Saas/sparklines.json', JSON.stringify(map, null, 2), 'utf8');
console.log(Object.keys(map).length + ' files with sparklines extracted.');