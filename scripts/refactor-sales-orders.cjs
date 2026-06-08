const fs = require('fs');

function refactorSalesOrders() {
  let content = fs.readFileSync('c:/Saas/src/pages/Sales/SalesOrders.tsx', 'utf8');

  if (!content.includes('useServerPagination')) {
    content = content.replace(
      /import \{ useDebounce \} from '\.\.\/\.\.\/hooks\/useDebounce';/,
      `import { useDebounce } from '../../hooks/useDebounce';\nimport { useServerPagination } from '../../hooks/useServerPagination';`
    );

    content = content.replace(
      /const \[updatingStatus, setUpdatingStatus\] = useState<string \| null>\(null\);\n\s*const debouncedSearch = useDebounce\(searchTerm, 500\);/,
      `const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);\n  const debouncedSearch = useDebounce(searchTerm, 500);\n  const { page, pageSize, totalCount, setTotalCount, setPage, getRange } = useServerPagination(20);`
    );

    content = content.replace(
      /\[activeFarmId, activeTenantId, isGlobalMode, debouncedSearch, filterValues, activeTab\]\);/,
      `[activeFarmId, activeTenantId, isGlobalMode, debouncedSearch, filterValues, activeTab, page]);`
    );

    content = content.replace(
      /const fetchOrders = async \(\) => \{\n\s*setLoading\(true\);\n\s*try \{\n\s*let query = supabase\n\s*\.from\('pedidos_venda'\)\n\s*\.select\('\*'\)\n\s*\.order\('created_at', \{ ascending: false \}\);\n\s*query = applyFarmFilter\(query\);/m,
      `const fetchOrders = async () => {\n    setLoading(true);\n    try {\n      let baseQuery = supabase\n        .from('pedidos_venda')\n        .select('*', { count: 'exact' })\n        .order('created_at', { ascending: false });\n      \n      baseQuery = applyFarmFilter(baseQuery);`
    );

    content = content.replace(
      /if \(debouncedSearch\) \{\n\s*query = query\.ilike\('numero_pedido', `%[\$]\{debouncedSearch\}%`\);\n\s*\}/m,
      `if (debouncedSearch) {\n        baseQuery = baseQuery.ilike('numero_pedido', \`%\${debouncedSearch}%\`);\n      }`
    );

    content = content.replace(
      /if \(activeTab === 'OPEN'\) \{\n\s*query = query\.neq\('status', 'delivered'\);\n\s*\} else \{\n\s*query = query\.eq\('status', 'delivered'\);\n\s*\}/m,
      `if (activeTab === 'OPEN') {\n        baseQuery = baseQuery.neq('status', 'delivered');\n      } else {\n        baseQuery = baseQuery.eq('status', 'delivered');\n      }`
    );

    content = content.replace(
      /if \(filterValues\.status !== 'all'\) \{\n\s*query = query\.eq\('status', filterValues\.status\);\n\s*\}/m,
      `if (filterValues.status !== 'all') {\n        baseQuery = baseQuery.eq('status', filterValues.status);\n      }`
    );

    content = content.replace(
      /if \(filterValues\.dateStart\) \{\n\s*query = query\.gte\('created_at', filterValues\.dateStart\);\n\s*\}\n\s*if \(filterValues\.dateEnd\) \{\n\s*query = query\.lte\('created_at', filterValues\.dateEnd\);\n\s*\}/m,
      `if (filterValues.dateStart) {\n        baseQuery = baseQuery.gte('created_at', filterValues.dateStart);\n      }\n      if (filterValues.dateEnd) {\n        baseQuery = baseQuery.lte('created_at', filterValues.dateEnd);\n      }`
    );

    content = content.replace(
      /const \{ data, error \} = await query;/m,
      `// --- KPI QUERY (Lightweight) ---\n      const { data: kpiData, error: kpiError } = await supabase\n        .from('pedidos_venda')\n        .select('*')\n        .match(isGlobalMode ? { tenant_id: activeTenantId } : { fazenda_id: activeFarmId });\n\n      // --- PAGINATED QUERY ---\n      const range = getRange();\n      const { data, count, error } = await baseQuery.range(range.from, range.to);\n\n      if (count !== null && count !== totalCount) {\n        setTimeout(() => setTotalCount(count), 0);\n      }`
    );

    content = content.replace(
      /setStats\(\[\n\s*\{\n\s*label: 'Pipeline Comercial',\n\s*value: valorTotal\.toLocaleString\('pt-BR', \{ style: 'currency', currency: 'BRL' \}\),\n\s*icon: DollarSign, color: '#10b981', progress: 100, change: `\$\{finalOrders\.length\} ordens`, periodLabel: 'Faturamento Bruto',\n\s*sparkline: buildSparkline\(data \|\| \[\], 'created_at', 'valor_total'\)\n\s*\}/m,
      `const kpiOrders = kpiData || [];\n        const kpiValorTotal = kpiOrders.reduce((acc: number, curr: any) => acc + Number(curr.valor_total || 0), 0);\n        const kpiAvgMargin = kpiOrders.reduce((acc: number, curr: any) => acc + (((curr.valor_total - (curr.valor_total * 0.72)) / (curr.valor_total || 1)) * 100), 0) / (kpiOrders.length || 1);\n        const kpiHighRisk = kpiOrders.filter((o: any) => o.valor_total > 500000).length;\n\n        setStats([\n          { \n            label: 'Pipeline Comercial', \n            value: kpiValorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), \n            icon: DollarSign, color: '#10b981', progress: 100, change: \`\${kpiOrders.length} ordens\`, periodLabel: 'Faturamento Bruto',\n            sparkline: buildSparkline(kpiOrders, 'created_at', 'valor_total')\n          }`
    );

    content = content.replace(
      /label: 'Saúde da Margem',\n\s*value: `\$\{avgMargin\.toFixed\(1\)\}%\`,\n\s*icon: TrendingUp, color: avgMargin > 20 \? '#10b981' : '#f59e0b',\n\s*progress: Math\.min\(avgMargin \* 2, 100\), change: 'Margem Operacional', periodLabel: 'Lucratividade Est\.',\n\s*sparkline: buildSparkline\(data \|\| \[\], 'created_at', 'valor_total'\)/m,
      `label: 'Saúde da Margem',\n            value: \`\${kpiAvgMargin.toFixed(1)}%\`,\n            icon: TrendingUp, color: kpiAvgMargin > 20 ? '#10b981' : '#f59e0b', \n            progress: Math.min(kpiAvgMargin * 2, 100), change: 'Margem Operacional', periodLabel: 'Lucratividade Est.',\n            sparkline: buildSparkline(kpiOrders, 'created_at', 'valor_total')`
    );

    content = content.replace(
      /label: 'Exposição de Risco',\n\s*value: enrichedOrders\.filter\(\(o: any\) => o\.isHighRisk\)\.length,\n\s*icon: AlertTriangle, color: '#ef4444',\n\s*progress: \(enrichedOrders\.filter\(\(o: any\) => o\.isHighRisk\)\.length \/ \(data\.length \|\| 1\)\) \* 100,\n\s*change: 'Acima do Limite', periodLabel: 'Auditoria',\n\s*sparkline: buildSparkline\(data \|\| \[\], 'created_at', 'valor_total'\)/m,
      `label: 'Exposição de Risco',\n            value: kpiHighRisk, \n            icon: AlertTriangle, color: '#ef4444', \n            progress: (kpiHighRisk / (kpiOrders.length || 1)) * 100, \n            change: 'Acima do Limite', periodLabel: 'Auditoria',\n            sparkline: buildSparkline(kpiOrders, 'created_at', 'valor_total')`
    );

    content = content.replace(
      /label: 'Taxa de Conclusão',\n\s*value: \(\(\) => \{\n\s*const entregues = data\.filter\(\(o: any\) => o\.status === 'delivered'\)\.length;\n\s*return data\.length > 0 \? `\$\{\(\(entregues \/ data\.length\) \* 100\)\.toFixed\(0\)\}%\` : '--\-';\n\s*\}\)\(\),\n\s*icon: Zap, color: '#3b82f6',\n\s*progress: \(\(\) => \{\n\s*const entregues = data\.filter\(\(o: any\) => o\.status === 'delivered'\)\.length;/m,
      `label: 'Taxa de Conclusão',\n            value: (() => {\n              const entregues = kpiOrders.filter((o: any) => o.status === 'delivered').length;\n              return kpiOrders.length > 0 ? \`\${((entregues / kpiOrders.length) * 100).toFixed(0)}%\` : '---';\n            })(),\n            icon: Zap, color: '#3b82f6', \n            progress: (() => {\n              const entregues = kpiOrders.filter((o: any) => o.status === 'delivered').length;`
    );

    content = content.replace(
      /return data\.length > 0 \? \(entregues \/ data\.length\) \* 100 : 0;\n\s*\}\)\(\),\n\s*change: 'Pedidos Fechados', periodLabel: 'Eficiência',\n\s*sparkline: buildSparkline\(data \|\| \[\], 'created_at', 'valor_total'\)/m,
      `return kpiOrders.length > 0 ? (entregues / kpiOrders.length) * 100 : 0;\n            })(),\n            change: 'Pedidos Fechados', periodLabel: 'Eficiência',\n            sparkline: buildSparkline(kpiOrders, 'created_at', 'valor_total')`
    );

    content = content.replace(
      /data=\{viewMode === 'list' \? orders : orders\}/m,
      `data={viewMode === 'list' ? orders : orders}\n                totalCount={totalCount}\n                currentPage={page}\n                onPageChange={setPage}\n                itemsPerPage={pageSize}`
    );

  }

  fs.writeFileSync('c:/Saas/src/pages/Sales/SalesOrders.tsx', content, 'utf8');
  console.log('Refactored SalesOrders.tsx successfully');
}

refactorSalesOrders();
