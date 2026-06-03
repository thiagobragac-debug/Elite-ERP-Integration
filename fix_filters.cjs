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
        } else if (file.endsWith('FilterModal.tsx')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('C:/Saas/src');
let modifiedCount = 0;

files.forEach(file => {
    const original = fs.readFileSync(file, 'utf8');
    
    let content = original
        .replace(/(background\s*:\s*[^?]+\?\s*[^:]+\s*:\s*)'white'/g, "$1'hsl(var(--bg-card))'")
        .replace(/(background\s*:\s*[^?]+\?\s*)'white'(\s*:\s*'transparent')/g, "$1'hsl(var(--bg-card))'$2")
        .replace(/#e2e8f0/g, 'hsl(var(--border))')
        .replace(/#64748b/g, 'hsl(var(--text-muted))');

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        modifiedCount++;
        console.log('Fixed:', file);
    }
});

console.log(`Successfully fixed ${modifiedCount} FilterModal files.`);
