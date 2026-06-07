const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  try {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      const p = path.join(dir, file);
      const stat = fs.statSync(p);
      if (stat.isDirectory()) results = results.concat(walk(p));
      else if (p.endsWith('.tsx') && 
               !p.includes('.bkp.') && 
               !p.includes('_OLDD') && 
               !p.includes('_old') &&
               !p.includes('LandingPage')) results.push(p);
    });
  } catch(e) {}
  return results;
}

const files = walk(path.resolve('src/pages'));
const issues = [];
const ok = [];
const ignored = [];

// These pages use useSearchParams for IDs/other purposes, their activeTab is intentionally useState
const ALLOWLIST_BOTH = [
  'AccountsPayable.tsx',
  'AnimalManagement.tsx',
  'ClientManagement.tsx',
  'UserManagement.tsx',
];

// These use tauze-tab-item for FILTERS (category selectors), NOT navigation tabs
const FILTER_ONLY_TABS = [
  'AuditLog.tsx',
  'FleetManagement.tsx',
  'InventoryManagement.tsx',
];

for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');
  const relPath = path.relative(process.cwd(), f).replace(/\\/g, '/');
  const basename = path.basename(f);
  
  const isModal = relPath.includes('/components/') || 
                  relPath.toLowerCase().includes('modal') || 
                  relPath.toLowerCase().includes('drawer');

  const hasSearchParams = content.includes('useSearchParams');
  const hasRouterImport = content.includes("from 'react-router-dom'");
  const hasActiveTabUseState = /const \[activeTab, setActiveTab\] = useState[^;]+;/.test(content);
  const hasSearchParamsTab = content.includes("searchParams.get('tab')");

  // Skip modals/components - they correctly use useState
  if (isModal) { ignored.push(`${relPath} (modal/component - correct)`); continue; }

  // Skip filter-only tab pages
  if (FILTER_ONLY_TABS.includes(basename)) { ignored.push(`${relPath} (filter tabs - correct)`); continue; }

  // Skip allowlisted pages that legitimately use both
  if (ALLOWLIST_BOTH.includes(basename) && hasActiveTabUseState && hasSearchParams) {
    // These use searchParams for ID lookup, activeTab stays as useState
    ignored.push(`${relPath} (uses searchParams for ID lookup, activeTab useState is correct)`);
    ok.push(relPath);
    continue;
  }

  // ISSUE 1: Has activeTab useState but no useSearchParams-based tab (not migrated)
  if (hasActiveTabUseState && !hasSearchParamsTab && !isModal) {
    issues.push({ file: relPath, issue: 'activeTab NOT migrated to useSearchParams', type: 'NOT_MIGRATED' });
    continue;
  }

  // ISSUE 2: useSearchParams used but react-router-dom not imported
  if (hasSearchParams && !hasRouterImport) {
    issues.push({ file: relPath, issue: 'useSearchParams used but react-router-dom NOT imported', type: 'BROKEN_IMPORT' });
    continue;
  }

  // ISSUE 3: Duplicate [searchParams, setSearchParams] declarations
  const dupeCount = (content.match(/const \[searchParams, setSearchParams\] = useSearchParams\(\)/g) || []).length;
  if (dupeCount > 1) {
    issues.push({ file: relPath, issue: `Duplicate useSearchParams: ${dupeCount}x`, type: 'DUPLICATE' });
    continue;
  }

  ok.push(relPath);
}

console.log('\n============================================================');
console.log(`FINAL AUDIT - ${files.length} files scanned`);
console.log('============================================================\n');

if (issues.length === 0) {
  console.log('✅ ALL CLEAR - Zero real issues found!\n');
} else {
  console.log(`❌ ISSUES: ${issues.length}\n`);
  issues.forEach(i => console.log(`  [${i.type}] ${i.file}\n    → ${i.issue}\n`));
}

console.log(`\n📊 Summary:`);
console.log(`  ✅ Correctly migrated pages: ${ok.length}`);
console.log(`  ⚪ Skipped (correct by design): ${ignored.length}`);
console.log(`  ❌ Issues: ${issues.length}`);
