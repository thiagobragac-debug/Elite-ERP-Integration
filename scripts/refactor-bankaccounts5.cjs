const fs = require('fs');

function refactorBankAccounts() {
  let content = fs.readFileSync('c:/Saas/src/pages/Finance/BankAccounts.tsx', 'utf8');

  // Fix the broken arrays from previous tools
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

  // Inject useServerPagination cleanly without duplicates
  if (!content.includes('useServerPagination')) {
    content = content.replace(
      /import \{ useTenant \} from '\.\.\/\.\.\/contexts\/TenantContext';/,
      `import { useTenant } from '../../contexts/TenantContext';\nimport { useServerPagination } from '../../hooks/useServerPagination';`
    );

    // Inject state vars
    content = content.replace(
      /const \[accounts, setAccounts\] = useState<any\[\]>\(\[\]\);/,
      `const [accounts, setAccounts] = useState<any[]>([]);\n  const { page, pageSize, totalCount, setTotalCount, setPage, getRange } = useServerPagination(10);`
    );

    // Fix dependency array
    content = content.replace(
      /\[activeFarm, isGlobalMode, activeTenantId\]\);/g,
      `[activeFarm, isGlobalMode, activeTenantId, page]);`
    );

    // Completely replace fetchPromise body
    content = content.replace(
      /const fetchPromise = \(async \(\) => \{\n([\s\S]*?)return data;\n\s*\}\)\(\);/,
      `const fetchPromise = (async () => {
        let query = supabase
          .from('contas_bancarias')
          .select('*', { count: 'exact' })
          .order('banco', { ascending: true })
          .eq('tenant_id', activeTenantId);
        
        if (!isGlobalMode && activeCompany?.id) {
          query = query.or(\`unidade_id.eq.\${activeCompany.id},is_global.eq.true\`);
        }
        
        // --- KPI QUERY (Lightweight) ---
        let kpiQuery = supabase.from('contas_bancarias').select('*').order('banco', { ascending: true }).eq('tenant_id', activeTenantId);
        if (!isGlobalMode && activeCompany?.id) kpiQuery = kpiQuery.or(\`unidade_id.eq.\${activeCompany.id},is_global.eq.true\`);
        
        const { data: kpiData, error: kpiError } = await kpiQuery;
        if (kpiError) throw kpiError;
        
        // --- GRID QUERY (Paginated) ---
        const range = getRange();
        const { data: gridData, error: gridError, count } = await query
          .range(range.from, range.to);
          
        if (gridError) throw gridError;
        
        // Avoid infinite loop by checking if totalCount changed before updating state
        if (count !== null && count !== totalCount) {
          // Using setTimeout to avoid triggering state updates during render phase just in case
          setTimeout(() => setTotalCount(count), 0);
        }
        
        return { kpiData, gridData };
      })();`
    );

    // Fix data unpacking explicitly using \s* to consume newlines
    content = content.replace(
      /const data: any = await Promise\.race\(\[fetchPromise, timeoutPromise\]\);\s*const totalSaldos = kpiData\.reduce/,
      `const data: any = await Promise.race([fetchPromise, timeoutPromise]);\n      const kpiData = data?.kpiData || [];\n      const gridItems = data?.gridData || [];\n      setAccounts(gridItems);\n\n      const totalSaldos = kpiData.reduce`
    );

    // Fix ModernTable props
    content = content.replace(
      /<ModernTable([\s\S]*?)data=\{accounts\}/,
      `<ModernTable$1data={accounts}\n            totalCount={totalCount}\n            currentPage={page}\n            onPageChange={setPage}\n            itemsPerPage={pageSize}`
    );
  }

  // Remove limit(500)
  content = content.replace(/\.select\('\*'\)\.limit\(500\)/g, `.select('*')`);

  fs.writeFileSync('c:/Saas/src/pages/Finance/BankAccounts.tsx', content, 'utf8');
  console.log('Fixed and Refactored BankAccounts.tsx securely');
}

refactorBankAccounts();
