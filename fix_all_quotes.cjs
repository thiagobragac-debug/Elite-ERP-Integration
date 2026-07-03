const fs = require('fs');
const path = require('path');

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walkDir(file));
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walkDir('c:/Saas/src/pages/LandingPage');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  // Fix missing quotes for rgb
  let newContent = content.replace(/'rgb\(var\(--([a-zA-Z0-9_-]+)\)\)([^'])/g, "'rgb(var(--))'");
  // Fix missing quotes for rgba
  newContent = newContent.replace(/'rgba\(var\(--([a-zA-Z0-9_-]+)\),\s*([0-9.]+)\)([^'])/g, "'rgba(var(--),)'");
  
  if (content !== newContent) {
    fs.writeFileSync(file, newContent);
    console.log('Fixed quotes in', file);
  }
});
