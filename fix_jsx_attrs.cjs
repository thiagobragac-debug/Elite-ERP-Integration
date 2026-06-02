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
      if (file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(path.join(__dirname, 'src'));

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Find <SidePanel size="large" ... size="..."
  // And replace it so we only have the ORIGINAL size.
  // We added size="large" right after <SidePanel. 
  // Let's remove our injected size="large" if there is another size attribute inside the same tag.
  
  content = content.replace(/<SidePanel size="large"([\s\S]*?)size=(['"][^'"]*['"])/g, "<SidePanel$1size=$2");

  // Also remove submitColor from BIConfigurationModal (it's not in SidePanelProps)
  if (content.includes('submitColor="')) {
    content = content.replace(/submitColor="[^"]*"/g, "");
  }

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Fixed duplicate attributes in ${path.basename(file)}`);
  }
}
