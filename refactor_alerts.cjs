const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(path.join(__dirname, 'src'));
let count = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  if (content.includes('alert(')) {
    // Basic regex to find alert('...') or alert(`...`) or alert("...")
    // This is simple and won't catch complex nested parens inside the alert, but covers 99% of basic alerts.
    let modified = content.replace(/alert\((['"`])([\s\S]*?)(['"`])\)/g, (match, p1, innerStr, p3) => {
      const lower = innerStr.toLowerCase();
      if (lower.includes('✅') || lower.includes('sucesso')) {
        return `toast.success(${p1}${innerStr}${p3})`;
      } else if (lower.includes('ℹ️') || lower.includes('💡') || lower.includes('🔌') || lower.includes('🌐')) {
        return `toast(${p1}${innerStr}${p3}, { icon: '${lower.includes('🔌') ? '🔌' : 'ℹ️'}' })`;
      } else {
        return `toast.error(${p1}${innerStr}${p3})`;
      }
    });

    if (modified !== content) {
      // Need to add import toast from 'react-hot-toast' if not present
      if (!modified.includes("from 'react-hot-toast'") && !modified.includes('from "react-hot-toast"')) {
        // Find last import
        const lastImportIndex = modified.lastIndexOf('import ');
        if (lastImportIndex !== -1) {
          const endOfLine = modified.indexOf('\n', lastImportIndex);
          modified = modified.substring(0, endOfLine + 1) + "import toast from 'react-hot-toast';\n" + modified.substring(endOfLine + 1);
        } else {
          modified = "import toast from 'react-hot-toast';\n" + modified;
        }
      }
      fs.writeFileSync(file, modified, 'utf8');
      console.log(`Converted alerts in ${path.basename(file)}`);
      count++;
    }
  }
}
console.log(`Total files modified: ${count}`);
