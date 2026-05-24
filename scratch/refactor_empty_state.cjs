const fs = require('fs');
const path = require('path');

const srcDir = 'c:/Saas/src/pages';

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      if (dirFile.endsWith('.tsx')) {
        filelist.push(dirFile);
      }
    }
  });
  return filelist;
};

const files = walkSync(srcDir);
let changedCount = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  // We are looking for patterns like:
  // {someArray.length === 0 && !loading ? (
  //   <EmptyState ... />
  // ) : (
  //   <ModernTable ... />
  // )}
  //
  // Because formatting varies, we can use a more generic approach:
  // We'll use a regex to match the conditional EmptyState block and the ModernTable block.
  // Actually, since JSX can be nested, regex is risky.
  
  // A simpler regex strategy for the exact pattern found in AccountsPayable:
  // \{([a-zA-Z0-9_\.]+)\.length === 0(?: && !loading)? \? \(\s*(<EmptyState[^>]*\/>)\s*\) : \(\s*(<ModernTable[\s\S]*?\/>)\s*\)\}
  // We must handle nested tags in ModernTable if any, but ModernTable usually has no children (self-closing).

  let match;
  let modified = false;

  const regex = /\{([^?]+?\.length === 0[^?]*?)\s*\?\s*\(\s*(<EmptyState[\s\S]*?\/>)\s*\)\s*:\s*\(\s*(<ModernTable[\s\S]*?\/>)\s*\)\s*\}/g;

  content = content.replace(regex, (fullMatch, condition, emptyStateCode, modernTableCode) => {
    modified = true;
    
    // Add emptyState={ emptyStateCode } to ModernTable
    // We inject it right before the closing "/>" of ModernTable
    const modernTableWithEmptyState = modernTableCode.replace(/\/>$/, ` emptyState={${emptyStateCode}} />`);
    
    return modernTableWithEmptyState;
  });
  
  // Sometimes it's without the parenthesis for EmptyState:
  const regex2 = /\{([^?]+?\.length === 0[^?]*?)\s*\?\s*(<EmptyState[\s\S]*?\/>)\s*:\s*\(\s*(<ModernTable[\s\S]*?\/>)\s*\)\s*\}/g;
  content = content.replace(regex2, (fullMatch, condition, emptyStateCode, modernTableCode) => {
    modified = true;
    const modernTableWithEmptyState = modernTableCode.replace(/\/>$/, ` emptyState={${emptyStateCode}} />`);
    return modernTableWithEmptyState;
  });

  // Sometimes ModernTable is without parenthesis:
  const regex3 = /\{([^?]+?\.length === 0[^?]*?)\s*\?\s*\(\s*(<EmptyState[\s\S]*?\/>)\s*\)\s*:\s*(<ModernTable[\s\S]*?\/>)\s*\}/g;
  content = content.replace(regex3, (fullMatch, condition, emptyStateCode, modernTableCode) => {
    modified = true;
    const modernTableWithEmptyState = modernTableCode.replace(/\/>$/, ` emptyState={${emptyStateCode}} />`);
    return modernTableWithEmptyState;
  });

  const regex4 = /\{([^?]+?\.length === 0[^?]*?)\s*\?\s*(<EmptyState[\s\S]*?\/>)\s*:\s*(<ModernTable[\s\S]*?\/>)\s*\}/g;
  content = content.replace(regex4, (fullMatch, condition, emptyStateCode, modernTableCode) => {
    modified = true;
    const modernTableWithEmptyState = modernTableCode.replace(/\/>$/, ` emptyState={${emptyStateCode}} />`);
    return modernTableWithEmptyState;
  });

  if (modified) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Modified:', file);
    changedCount++;
  }
}

console.log(`Finished. Modified ${changedCount} files.`);
