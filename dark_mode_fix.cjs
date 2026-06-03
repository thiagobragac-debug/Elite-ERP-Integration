const fs = require('fs');
const path = require('path');

const directoryToScan = path.join(__dirname, 'src');

const replacements = [
  // CSS files and style blocks
  { regex: /background:\s*white;?/gi, replace: 'background: hsl(var(--bg-card));' },
  { regex: /background-color:\s*white;?/gi, replace: 'background-color: hsl(var(--bg-card));' },
  { regex: /background:\s*#ffffff;?/gi, replace: 'background: hsl(var(--bg-card));' },
  { regex: /background:\s*#fff;?/gi, replace: 'background: hsl(var(--bg-card));' },
  { regex: /background:\s*#f8fafc;?/gi, replace: 'background: hsl(var(--bg-main));' },
  { regex: /background:\s*#f1f5f9;?/gi, replace: 'background: hsl(var(--bg-main));' },
  { regex: /border-color:\s*#e2e8f0;?/gi, replace: 'border-color: hsl(var(--border));' },
  { regex: /border:\s*1px\s+solid\s+#e2e8f0;?/gi, replace: 'border: 1px solid hsl(var(--border));' },

  // React inline styles
  { regex: /background:\s*['"]white['"]/gi, replace: "background: 'hsl(var(--bg-card))'" },
  { regex: /background:\s*['"]#ffffff['"]/gi, replace: "background: 'hsl(var(--bg-card))'" },
  { regex: /background:\s*['"]#fff['"]/gi, replace: "background: 'hsl(var(--bg-card))'" },
  { regex: /background:\s*['"]#f8fafc['"]/gi, replace: "background: 'hsl(var(--bg-main))'" },
  { regex: /background:\s*['"]#f1f5f9['"]/gi, replace: "background: 'hsl(var(--bg-main))'" },
  { regex: /backgroundColor:\s*['"]white['"]/gi, replace: "backgroundColor: 'hsl(var(--bg-card))'" },
  { regex: /backgroundColor:\s*['"]#fff['"]/gi, replace: "backgroundColor: 'hsl(var(--bg-card))'" },
  { regex: /borderColor:\s*['"]#e2e8f0['"]/gi, replace: "borderColor: 'hsl(var(--border))'" }
];

let filesModified = 0;

function processDirectory(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.css') || fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;

      for (const rule of replacements) {
        if (rule.regex.test(content)) {
          content = content.replace(rule.regex, rule.replace);
          modified = true;
        }
      }

      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Modified: ${fullPath}`);
        filesModified++;
      }
    }
  }
}

console.log('Starting dark mode fix...');
processDirectory(directoryToScan);
console.log(`Done! Modified ${filesModified} files.`);
