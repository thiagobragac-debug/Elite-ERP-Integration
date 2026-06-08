const fs = require('fs');

function refactorBankAccounts() {
  let content = fs.readFileSync('c:/Saas/src/pages/Finance/BankAccounts.tsx', 'utf8');

  // Fix the broken arrays from previous tools
  content = content.replace(/const \[\] = data \|\| \[\];/g, '');
  content = content.replace(/setAccounts\(\[\]\);/g, '');
  content = content.replace(/const totalSaldos = \[\].reduce/g, 'const totalSaldos = kpiData.reduce');
  content = content.replace(/const totalLimites = \[\].reduce/g, 'const totalLimites = kpiData.reduce');
  
  // CAREFUL! We must NOT replace `[]` in the top level `useState` initialization!
  // We only replace inside `fetchAccounts`.
  content = content.replace(/sparkline: buildSparkline\(\[\] \|\| \[\]/g, 'sparkline: buildSparkline(kpiData || []');
  
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

  // FIX THE REFERENCE ERROR IN INITIAL STATE!
  content = content.replace(
    /const \[stats, setStats\] = useState<any\[\]>\(\[\n\s+\{ label: 'Liquidez Disponível',([^\]]*?)sparkline: buildSparkline\(kpiData \|\| \[\], 'created_at', 'saldo_atual'\) \},\n\s+\{ label: 'Utilização de Limites',([^\]]*?)sparkline: buildSparkline\(kpiData \|\| \[\], 'created_at', 'saldo_atual'\) \},\n\s+\{ label: 'Custódia Bancária',([^\]]*?)sparkline: buildSparkline\(kpiData \|\| \[\], 'created_at', 'saldo_atual'\) \},\n\s+\{ label: 'Yield Estratégico',([^\]]*?)sparkline: buildSparkline\(kpiData \|\| \[\], 'created_at', 'saldo_atual'\) \},\n\s+\]\);/g,
    `const [stats, setStats] = useState<any[]>([\n    { label: 'Liquidez Disponível',$1sparkline: buildSparkline([], 'created_at', 'saldo_atual') },\n    { label: 'Utilização de Limites',$2sparkline: buildSparkline([], 'created_at', 'saldo_atual') },\n    { label: 'Custódia Bancária',$3sparkline: buildSparkline([], 'created_at', 'saldo_atual') },\n    { label: 'Yield Estratégico',$4sparkline: buildSparkline([], 'created_at', 'saldo_atual') },\n  ]);`
  );
  
  // Just in case the regex doesn't match due to accents or line endings, let's do a brute force generic replace on the first 100 lines for kpiData in buildSparkline
  let lines = content.split('\\n');
  for (let i = 0; i < Math.min(150, lines.length); i++) {
    if (lines[i].includes('const [stats, setStats]') || lines[i].includes('label:')) {
      if (i < 100 && !lines[i].includes('setStats([')) {
        lines[i] = lines[i].replace(/buildSparkline\(kpiData \|\| \[\],/g, 'buildSparkline([],');
      }
    }
  }
  content = lines.join('\\n');

  fs.writeFileSync('c:/Saas/src/pages/Finance/BankAccounts.tsx', content, 'utf8');
  console.log('Fixed and Refactored BankAccounts.tsx securely');
}

refactorBankAccounts();
