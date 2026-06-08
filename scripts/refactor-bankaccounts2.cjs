const fs = require('fs');

function refactorBankAccounts() {
  let content = fs.readFileSync('c:/Saas/src/pages/Finance/BankAccounts.tsx', 'utf8');

  // Fix the broken arrays
  content = content.replace(/const \[\] = data \|\| \[\];/g, '');
  content = content.replace(/setAccounts\(\[\]\);/g, '');
  content = content.replace(/const totalSaldos = \[\].reduce/g, 'const totalSaldos = kpiData.reduce');
  content = content.replace(/const totalLimites = \[\].reduce/g, 'const totalLimites = kpiData.reduce');
  content = content.replace(/buildSparkline\(\[\] \|\| \[\]/g, 'buildSparkline(kpiData || []');
  content = content.replace(/value: \[\].length > 0 \? \[\].length/g, 'value: kpiData.length > 0 ? kpiData.length');
  content = content.replace(/progress: \[\].length > 0/g, 'progress: kpiData.length > 0');
  content = content.replace(/change: \[\].length > 0/g, 'change: kpiData.length > 0');
  content = content.replace(/const withBenchmark = \[\].filter/g, 'const withBenchmark = kpiData.filter');
  content = content.replace(/change: \[\].filter/g, 'change: kpiData.filter');
  content = content.replace(/sparkline: \[\]/g, 'sparkline: []');

  // Add the import for useServerPagination and usePersistentState
  if (!content.includes('useServerPagination')) {
    content = content.replace(
      /import \{ useTenant \} from '\.\.\/\.\.\/contexts\/TenantContext';/,
      `import { useTenant } from '../../contexts/TenantContext';\nimport { usePersistentState } from '../../hooks/usePersistentState';\nimport { useServerPagination } from '../../hooks/useServerPagination';`
    );

    // Inject useServerPagination
    content = content.replace(
      /const \[accounts, setAccounts\] = useState<any\[\]>\(\[\]\);/,
      `const [accounts, setAccounts] = useState<any[]>([]);\n  const { page, pageSize, totalCount, setTotalCount, setPage, getRange } = useServerPagination(10);`
    );

    // Fix dependency array
    content = content.replace(
      /\[activeFarm, isGlobalMode, activeTenantId\]\);/g,
      `[activeFarm, isGlobalMode, activeTenantId, page]);`
    );

    // Split query logic
    content = content.replace(
      /const fetchPromise = \(async \(\) => \{\n([\s\S]*?)return data;\n\s*\}\)\(\);/,
      `const fetchPromise = (async () => {
$1
        // --- KPI QUERY (Lightweight) ---
        // Clone query for KPI by re-applying base constraints to avoid mutation issues
        let kpiQuery = supabase.from('contas_bancarias').select('*').order('banco', { ascending: true }).eq('tenant_id', activeTenantId);
        if (!isGlobalMode && activeCompany?.id) kpiQuery = kpiQuery.or(\`unidade_id.eq.\${activeCompany.id},is_global.eq.true\`);
        
        const { data: kpiData, error: kpiError } = await kpiQuery;
        if (kpiError) throw kpiError;
        
        // --- GRID QUERY (Paginated) ---
        const range = getRange();
        const { data: gridData, error: gridError, count } = await query
          .select('*', { count: 'exact' })
          .range(range.from, range.to);
          
        if (gridError) throw gridError;
        if (count !== null) setTotalCount(count);
        
        return { kpiData, gridData };
      })();`
    );

    // Now update data unpacking because we return an object instead of array
    content = content.replace(
      /const data: any = await Promise\.race\(\[fetchPromise, timeoutPromise\]\);\n\s*(.*)/,
      `const data: any = await Promise.race([fetchPromise, timeoutPromise]);\n      const kpiData = data?.kpiData || [];\n      const gridItems = data?.gridData || [];\n      setAccounts(gridItems); // Set paginated data to table\n`
    );

    // Fix ModernTable
    content = content.replace(
      /<ModernTable([\s\S]*?)data=\{accounts\}/,
      `<ModernTable$1data={accounts}\n            totalCount={totalCount}\n            currentPage={page}\n            onPageChange={setPage}\n            itemsPerPage={pageSize}`
    );
  }

  // Also remove .limit(500) if it's there
  content = content.replace(/\.select\('\*'\)\.limit\(500\)/g, `.select('*')`);

  fs.writeFileSync('c:/Saas/src/pages/Finance/BankAccounts.tsx', content, 'utf8');
  console.log('Fixed and Refactored BankAccounts.tsx');
}

refactorBankAccounts();
