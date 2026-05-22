const fs = require('fs');
let content = fs.readFileSync('C:/Saas/src/pages/Admin/UserManagement.tsx', 'utf8');

// The file was saved as UTF-8, but it contains literal "Ã§", etc.
// In JS, we can fix it by treating the string as Latin-1 and buffering it back to UTF-8
function fixMojibake(str) {
  try {
    // Escape characters that we want to turn into bytes
    return Buffer.from(str, 'latin1').toString('utf8');
  } catch (e) {
    return str;
  }
}

// Let's test on a substring
const testStr = "GestÃ£o de SessÃµes";
console.log("Fixed test:", fixMojibake(testStr));

const fixedContent = fixMojibake(content);
if (fixedContent.includes("Gestão de Sessões")) {
  fs.writeFileSync('C:/Saas/test_fix.tsx', fixedContent, 'utf8');
  console.log("Success! Wrote test_fix.tsx");
} else {
  console.log("Failed to fix.");
}