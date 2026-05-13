const fs = require('fs');
const path = 'c:/Saas/src/pages/Admin/SaaSAdminPanel.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add margin to icons in tenants grid if they don't have it yet
content = content.replace(/<Users size=\{14\} className="meta-icon" \/>/g, '<Users size={14} className="meta-icon" style={{ marginRight: "8px" }} />');
content = content.replace(/<HardDrive size=\{14\} className="meta-icon" \/>/g, '<HardDrive size={14} className="meta-icon" style={{ marginRight: "8px" }} />');
content = content.replace(/<Shield size=\{14\} className="meta-icon" \/>/g, '<Shield size={14} className="meta-icon" style={{ marginRight: "8px" }} />');

fs.writeFileSync(path, content);
console.log('Successfully added spacing to tenant icons');
