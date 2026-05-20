const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let fullPath = path.join(dir, f);
    if (fs.statSync(fullPath).isDirectory()) walkDir(fullPath, callback);
    else callback(fullPath);
  });
}

let issues = [];

walkDir(path.join(process.cwd(), 'src/pages'), (filePath) => {
  if (!filePath.endsWith('.tsx')) return;
  const content = fs.readFileSync(filePath, 'utf8');
  const rel = path.relative(process.cwd(), filePath);

  // Check if uses activeTenantId or isGlobalMode but doesn't have them in destructuring from useFarmFilter or useTenant
  const usesActiveTenantId = content.includes('activeTenantId');
  const usesIsGlobalMode = content.includes('isGlobalMode');
  
  const hasFarmFilterDestructure = content.includes('useFarmFilter()');
  const hasTenantDestructure = content.includes('useTenant()');

  if (usesActiveTenantId || usesIsGlobalMode) {
    // Check if they are in the destructure
    const farmFilterDestructureMatch = content.match(/const\s*\{([^}]+)\}\s*=\s*useFarmFilter\(\)/);
    const tenantDestructureMatch = content.match(/const\s*\{([^}]+)\}\s*=\s*useTenant\(\)/);
    
    let destructuredVars = '';
    if (farmFilterDestructureMatch) destructuredVars += farmFilterDestructureMatch[1];
    if (tenantDestructureMatch) destructuredVars += tenantDestructureMatch[1];

    const hasActiveTenantId = destructuredVars.includes('activeTenantId');
    const hasIsGlobalMode = destructuredVars.includes('isGlobalMode');

    if (usesActiveTenantId && !hasActiveTenantId) {
      issues.push({ file: rel, missing: 'activeTenantId', hook: hasFarmFilterDestructure ? 'useFarmFilter' : 'useTenant' });
    }
    if (usesIsGlobalMode && !hasIsGlobalMode) {
      issues.push({ file: rel, missing: 'isGlobalMode', hook: hasFarmFilterDestructure ? 'useFarmFilter' : 'useTenant' });
    }
  }
});

if (issues.length === 0) {
  console.log('No issues found!');
} else {
  issues.forEach(i => console.log(`MISSING ${i.missing} in ${i.file} (hook: ${i.hook})`));
}
