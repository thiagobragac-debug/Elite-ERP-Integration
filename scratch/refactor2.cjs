const fs = require('fs');

const files = [
  'c:/Saas/src/pages/Finance/BankAccounts.tsx',
  'c:/Saas/src/pages/Fleet/FleetManagement.tsx',
  'c:/Saas/src/pages/Inventory/InventoryManagement.tsx',
  'c:/Saas/src/pages/Pecuaria/AnimalManagement.tsx',
  'c:/Saas/src/pages/Pecuaria/ConfinementManagement.tsx',
  'c:/Saas/src/pages/Pecuaria/LotManagement.tsx',
  'c:/Saas/src/pages/Pecuaria/PastureManagement.tsx',
  'c:/Saas/src/pages/Sales/SalesOrders.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // Replace viewMode === 'list' pattern
  // Pattern: {accounts.length === 0 && !loading ? ( <EmptyState ... /> ) : viewMode === 'list' ? ( <ModernTable ... /> ) : ( <motion.div ... /> )}
  
  const regexViewMode = /\{([a-zA-Z0-9_]+)\.length === 0\s*(?:&&\s*!loading)?\s*\?\s*\(\s*(<EmptyState[\s\S]*?\/>)\s*\)\s*:\s*viewMode\s*===\s*'list'\s*\?\s*\(\s*(<ModernTable[\s\S]*?\/>)\s*\)/g;
  
  let modified = false;
  content = content.replace(regexViewMode, (fullMatch, arrayName, emptyStateCode, modernTableCode) => {
    modified = true;
    const modernTableWithEmptyState = modernTableCode.replace(/\/>$/, ` emptyState={${emptyStateCode}} />`);
    // Now return just the viewMode ternary, the array.length === 0 condition is removed!
    return `{viewMode === 'list' ? ( ${modernTableWithEmptyState} )`;
  });

  // What if it doesn't have parenthesis around ModernTable?
  const regexViewMode2 = /\{([a-zA-Z0-9_]+)\.length === 0\s*(?:&&\s*!loading)?\s*\?\s*\(\s*(<EmptyState[\s\S]*?\/>)\s*\)\s*:\s*viewMode\s*===\s*'list'\s*\?\s*(<ModernTable[\s\S]*?\/>)/g;
  
  content = content.replace(regexViewMode2, (fullMatch, arrayName, emptyStateCode, modernTableCode) => {
    modified = true;
    const modernTableWithEmptyState = modernTableCode.replace(/\/>$/, ` emptyState={${emptyStateCode}} />`);
    return `{viewMode === 'list' ? ${modernTableWithEmptyState}`;
  });

  // Let's also handle standard ternaries if the generic script failed on them due to some spacing
  const regexStandard = /\{([a-zA-Z0-9_]+)\.length === 0\s*(?:&&\s*!loading)?\s*\?\s*\(\s*(<EmptyState[\s\S]*?\/>)\s*\)\s*:\s*\(\s*(<ModernTable[\s\S]*?\/>)\s*\)\}/g;
  content = content.replace(regexStandard, (fullMatch, arrayName, emptyStateCode, modernTableCode) => {
    modified = true;
    const modernTableWithEmptyState = modernTableCode.replace(/\/>$/, ` emptyState={${emptyStateCode}} />`);
    return `{${modernTableWithEmptyState}}`;
  });

  const regexStandard2 = /\{([a-zA-Z0-9_]+)\.length === 0\s*(?:&&\s*!loading)?\s*\?\s*\(\s*(<EmptyState[\s\S]*?\/>)\s*\)\s*:\s*(<ModernTable[\s\S]*?\/>)\s*\}/g;
  content = content.replace(regexStandard2, (fullMatch, arrayName, emptyStateCode, modernTableCode) => {
    modified = true;
    const modernTableWithEmptyState = modernTableCode.replace(/\/>$/, ` emptyState={${emptyStateCode}} />`);
    return `{${modernTableWithEmptyState}}`;
  });

  // If there are other variations, log them
  if (modified) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Modified:', file);
  } else {
    console.log('No changes in:', file);
  }
}
