const fs = require('fs');
const path = 'c:/Saas/src/pages/Admin/SaaSAdminPanel.tsx';
let content = fs.readFileSync(path, 'utf8');

const lines = content.split('\n');
// Find the ModernTable in tenants tab by searching for columns={tenantColumns}
const tableIndex = lines.findIndex(l => l.includes('columns={tenantColumns}'));

if (tableIndex !== -1) {
    console.log('Found table at line', tableIndex + 1);
    // Look for the next '/>'
    let closingIdx = -1;
    for (let i = tableIndex; i < lines.length; i++) {
        if (lines[i].includes('/>')) {
            closingIdx = i;
            break;
        }
    }

    if (closingIdx !== -1) {
        console.log('Found closing tag at line', closingIdx + 1);
        // Now look for the next ') : (' which starts the grid view
        let gridStartIdx = -1;
        for (let i = closingIdx; i < lines.length; i++) {
            if (lines[i].includes(') : (')) {
                gridStartIdx = i;
                break;
            }
        }

        if (gridStartIdx !== -1) {
            console.log('Found grid start at line', gridStartIdx + 1);
            // Delete everything between closingIdx and gridStartIdx (exclusive of gridStartIdx line)
            // But we want to keep the closing tag of the condition if it was there?
            // Actually, looking at the code:
            // 803:                 />
            // 804:               ) : (
            // So we just need to keep line 804 onwards.
            
            const head = lines.slice(0, closingIdx + 1);
            const tail = lines.slice(gridStartIdx);
            fs.writeFileSync(path, head.join('\n') + '\n' + tail.join('\n'));
            console.log('Successfully fixed syntax errors');
        } else {
            console.log('Could not find grid view start');
        }
    } else {
        console.log('Could not find closing tag of ModernTable');
    }
} else {
    console.log('Could not find ModernTable in tenants tab');
}
