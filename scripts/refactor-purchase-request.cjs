const fs = require('fs');

function refactorPurchaseRequest() {
  let content = fs.readFileSync('c:/Saas/src/pages/Purchasing/PurchaseRequest.tsx', 'utf8');

  if (!content.includes('useServerPagination')) {
    content = content.replace(
      /import \{ Breadcrumb \} from '\.\.\/\.\.\/components\/Navigation\/Breadcrumb';/,
      `import { Breadcrumb } from '../../components/Navigation/Breadcrumb';\nimport { useServerPagination } from '../../hooks/useServerPagination';`
    );

    content = content.replace(
      /const \[stats, setStats\] = useState<any\[\]>\(\[\]\);\n\s*const \[showOnlyUrgent, setShowOnlyUrgent\] = useState\(false\);/,
      `const [stats, setStats] = useState<any[]>([]);\n  const [showOnlyUrgent, setShowOnlyUrgent] = useState(false);\n  const { page, pageSize, totalCount, setTotalCount, setPage, getRange } = useServerPagination(20);`
    );

    content = content.replace(
      /\[activeFarmId, isGlobalMode, activeTenantId\]\);/g,
      `[activeFarmId, isGlobalMode, activeTenantId, page]);`
    );

    content = content.replace(
      /const fetchRequests = async \(\) => \{\n\s*setLoading\(true\);\n\s*try \{\n\s*let query = supabase\.from\('solicitacoes_compra'\)\.select\('id, titulo, departamento, prioridade, status, descricao, valor_estimado, solicitante, fazenda_id, tenant_id, created_at'\)\.limit\(500\)\.order\('created_at', \{ ascending: false \}\);\n\s*query = applyFarmFilter\(query\);\n\s*const \{ data \} = await query;/m,
      `const fetchRequests = async () => {\n    setLoading(true);\n    try {\n      let baseQuery = supabase.from('solicitacoes_compra').select('*', { count: 'exact' }).order('created_at', { ascending: false });\n      baseQuery = applyFarmFilter(baseQuery);\n\n      // --- KPI QUERY (Lightweight) ---\n      const { data: kpiData, error: kpiError } = await supabase.from('solicitacoes_compra').select('status, prioridade, valor_estimado, created_at').match(isGlobalMode ? { tenant_id: activeTenantId } : { fazenda_id: activeFarmId });\n\n      // --- PAGINATED QUERY ---\n      const range = getRange();\n      const { data, count, error } = await baseQuery.range(range.from, range.to);\n\n      if (count !== null && count !== totalCount) {\n        setTimeout(() => setTotalCount(count), 0);\n      }`
    );

    content = content.replace(
      /if \(data\) \{\n\s*setRequests\(data\);\n\s*const abertas = data\.filter\(r => r\.status === 'pending'\)\.length;\n\s*const urgentes = data\.filter\(r => r\.prioridade === 'high' \|\| r\.prioridade === 'Urgente'\)\.length;\n\s*const valorTotal = data\.reduce\(\(acc, curr\) => acc \+ Number\(curr\.valor_estimado \|\| 0\), 0\);\n\s*const totalRequests = data\.length \|\| 1;\n\s*const avgValue = valorTotal \/ totalRequests;/m,
      `if (data) {\n        setRequests(data);\n        const kpiOrders = kpiData || [];\n        const abertas = kpiOrders.filter(r => r.status === 'pending').length;\n        const urgentes = kpiOrders.filter(r => r.prioridade === 'high' || r.prioridade === 'Urgente').length;\n        const valorTotal = kpiOrders.reduce((acc, curr) => acc + Number(curr.valor_estimado || 0), 0);\n        const totalRequests = kpiOrders.length || 1;\n        const avgValue = valorTotal / totalRequests;`
    );

    content = content.replace(
      /sparkline: buildSparkline\(requests \|\| \[\], 'created_at', null\)/g,
      `sparkline: buildSparkline(kpiOrders, 'created_at', null)`
    );

    content = content.replace(
      /const pendentes = data\.filter\(\(r: any\) => r\.status === 'pending'\);/g,
      `const pendentes = kpiOrders.filter((r: any) => r.status === 'pending');`
    );

    content = content.replace(
      /progress: totalRequests > 1 \? \(urgentes \/ totalRequests\) \* 100 : 0/g,
      `progress: totalRequests > 0 ? (urgentes / totalRequests) * 100 : 0`
    );

    content = content.replace(
      /setStats\(\[\n\s*\{\n\s*label: 'Requisições Ativas',\n\s*value: 0,\n\s*icon: ShoppingCart, color: '#10b981', progress: 0, change: 'Sem dados',\n\s*sparkline: buildSparkline\(requests \|\| \[\], 'created_at', null\)\n\s*\},\n\s*\{\n\s*label: 'Ticket Médio \(Est\.\)',\n\s*value: 'R\$ 0,00',\n\s*icon: Zap, color: '#3b82f6', progress: 0, change: 'Sem dados',\n\s*sparkline: buildSparkline\(requests \|\| \[\], 'created_at', null\)\n\s*\},\n\s*\{\n\s*label: 'Agilidade de Fluxo',\n\s*value: '---',\n\s*icon: Clock, color: '#f59e0b', progress: 0, change: 'SLA',\n\s*sparkline: buildSparkline\(requests \|\| \[\], 'created_at', null\)\n\s*\},\n\s*\{\n\s*label: 'Nível de Urgência',\n\s*value: 0,\n\s*icon: AlertTriangle, color: '#ef4444', progress: 0, change: 'Prioridade',\n\s*sparkline: buildSparkline\(requests \|\| \[\], 'created_at', null\)\n\s*\}\n\s*\]\);/g,
      `setStats([\n        { label: 'Requisições Ativas', value: 0, icon: ShoppingCart, color: '#10b981', progress: 0, change: 'Sem dados',\n          sparkline: buildSparkline([], 'created_at', null) },\n        { label: 'Ticket Médio (Est.)', value: 'R$ 0,00', icon: Zap, color: '#3b82f6', progress: 0, change: 'Sem dados',\n          sparkline: buildSparkline([], 'created_at', null) },\n        { label: 'Agilidade de Fluxo', value: '---', icon: Clock, color: '#f59e0b', progress: 0, change: 'SLA',\n          sparkline: buildSparkline([], 'created_at', null) },\n        { label: 'Nível de Urgência', value: 0, icon: AlertTriangle, color: '#ef4444', progress: 0, change: 'Prioridade',\n          sparkline: buildSparkline([], 'created_at', null) },\n      ]);`
    );
    
    // Also fix the initial ones
    content = content.replace(
      /setStats\(\[\n\s*\{\n\s*label: 'Requisições Ativas',\n\s*value: 0,\n\s*icon: ShoppingCart, color: '#10b981', progress: 0, change: 'Aguardando',\n\s*sparkline: buildSparkline\(requests \|\| \[\], 'created_at', null\)\n\s*\},\n\s*\{\n\s*label: 'Ticket Médio \(Est\.\)',\n\s*value: 'R\$ 0,00',\n\s*icon: Zap, color: '#3b82f6', progress: 0, change: 'Aguardando',\n\s*sparkline: buildSparkline\(requests \|\| \[\], 'created_at', null\)\n\s*\},\n\s*\{\n\s*label: 'Agilidade de Fluxo',\n\s*value: '---',\n\s*icon: Clock, color: '#f59e0b', progress: 0, change: 'SLA',\n\s*sparkline: buildSparkline\(requests \|\| \[\], 'created_at', null\)\n\s*\},\n\s*\{\n\s*label: 'Nível de Urgência',\n\s*value: 0,\n\s*icon: AlertTriangle, color: '#ef4444', progress: 0, change: 'Prioridade',\n\s*sparkline: buildSparkline\(requests \|\| \[\], 'created_at', null\)\n\s*\}\n\s*\]\);/g,
      `setStats([\n        { label: 'Requisições Ativas', value: 0, icon: ShoppingCart, color: '#10b981', progress: 0, change: 'Aguardando',\n          sparkline: buildSparkline([], 'created_at', null) },\n        { label: 'Ticket Médio (Est.)', value: 'R$ 0,00', icon: Zap, color: '#3b82f6', progress: 0, change: 'Aguardando',\n          sparkline: buildSparkline([], 'created_at', null) },\n        { label: 'Agilidade de Fluxo', value: '---', icon: Clock, color: '#f59e0b', progress: 0, change: 'SLA',\n          sparkline: buildSparkline([], 'created_at', null) },\n        { label: 'Nível de Urgência', value: 0, icon: AlertTriangle, color: '#ef4444', progress: 0, change: 'Prioridade',\n          sparkline: buildSparkline([], 'created_at', null) },\n      ]);`
    );

    content = content.replace(
      /<ModernTable([\s\S]*?)data=\{requests\}/,
      `<ModernTable$1data={requests}\n            totalCount={totalCount}\n            currentPage={page}\n            onPageChange={setPage}\n            itemsPerPage={pageSize}`
    );

    // One brute force replace just in case
    content = content.replace(/buildSparkline\(requests \|\| \[\],/g, 'buildSparkline([],');

  }

  fs.writeFileSync('c:/Saas/src/pages/Purchasing/PurchaseRequest.tsx', content, 'utf8');
  console.log('Refactored PurchaseRequest.tsx successfully');
}

refactorPurchaseRequest();
