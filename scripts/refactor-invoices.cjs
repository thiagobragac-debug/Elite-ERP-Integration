const fs = require('fs');

function refactorInvoices() {
  let content = fs.readFileSync('c:/Saas/src/pages/Sales/Invoices.tsx', 'utf8');

  if (!content.includes('useServerPagination')) {
    content = content.replace(
      /import \{ Breadcrumb \} from '\.\.\/\.\.\/components\/Navigation\/Breadcrumb';/,
      `import { Breadcrumb } from '../../components/Navigation/Breadcrumb';\nimport { useServerPagination } from '../../hooks/useServerPagination';`
    );

    content = content.replace(
      /const \[filterValues, setFilterValues\] = useState\(\{[\s\S]*?\}\);/,
      `$& \n  const { page, pageSize, totalCount, setTotalCount, setPage, getRange } = useServerPagination(20);`
    );

    content = content.replace(
      /\[activeFarmId, isGlobalMode, activeTenantId\]\);/g,
      `[activeFarmId, isGlobalMode, activeTenantId, page]);`
    );

    content = content.replace(
      /const fetchInvoices = async \(\) => \{\n\s*setLoading\(true\);\n\s*try \{\n\s*let query = supabase\.from\('notas_saida'\)\.select\('\*'\)\.order\('created_at', \{ ascending: false \}\)\.limit\(500\);\n\s*query = applyFarmFilter\(query\);\n\s*const \{ data, error \} = await query;/m,
      `const fetchInvoices = async () => {\n    setLoading(true);\n    try {\n      let baseQuery = supabase.from('notas_saida').select('*', { count: 'exact' }).order('created_at', { ascending: false });\n      baseQuery = applyFarmFilter(baseQuery);\n\n      // --- KPI QUERY ---\n      const { data: kpiData } = await supabase.from('notas_saida').select('valor_total, status, data_emissao, natureza_operacao').match(isGlobalMode ? { tenant_id: activeTenantId } : { fazenda_id: activeFarmId });\n\n      // --- PAGINATED QUERY ---\n      const range = getRange();\n      const { data, count, error } = await baseQuery.range(range.from, range.to);\n\n      if (count !== null && count !== totalCount) {\n        setTimeout(() => setTotalCount(count), 0);\n      }`
    );

    content = content.replace(
      /const totalValor = data\.reduce\(\(acc, curr\) => acc \+ Number\(curr\.valor_total \|\| 0\), 0\);\n\s*const totalTax = enrichedInvoices\.reduce\(\(acc, curr\) => acc \+ curr\.taxValue, 0\);/m,
      `const kpiInvoices = kpiData || [];\n        const totalValor = kpiInvoices.reduce((acc: number, curr: any) => acc + Number(curr.valor_total || 0), 0);\n        const totalTax = kpiInvoices.reduce((acc: number, curr: any) => acc + (Number(curr.valor_total || 0) * (curr.natureza_operacao?.toLowerCase().includes('venda') ? 0.023 : 0.015)), 0);`
    );

    content = content.replace(
      /const autorizadas = data\.filter\(\(d: any\) => d\.status === 'authorized'\)\.length;/g,
      `const autorizadas = kpiInvoices.filter((d: any) => d.status === 'authorized').length;`
    );

    content = content.replace(
      /const autorizadas = data\.filter\(d => d\.status === 'authorized'\)\.length;/g,
      `const autorizadas = kpiInvoices.filter((d: any) => d.status === 'authorized').length;`
    );

    content = content.replace(
      /return data\.length > 0 \? `\$\{\(\(autorizadas \/ data\.length\) \* 100\)\.toFixed\(0\)\}%\` : '--\-';/m,
      `return kpiInvoices.length > 0 ? \`\${((autorizadas / kpiInvoices.length) * 100).toFixed(0)}%\` : '---';`
    );

    content = content.replace(
      /return data\.length > 0 \? \(autorizadas \/ data\.length\) \* 100 : 0;/m,
      `return kpiInvoices.length > 0 ? (autorizadas / kpiInvoices.length) * 100 : 0;`
    );

    content = content.replace(
      /const max = Math\.max\(\.\.\.data\.map\(\(d: any\) => Number\(d\.valor_total \|\| 0\)\)\);/g,
      `const max = Math.max(...kpiInvoices.map((d: any) => Number(d.valor_total || 0)));`
    );

    content = content.replace(
      /const max = Math\.max\(\.\.\.data\.map\(d => Number\(d\.valor_total \|\| 0\)\)\);/g,
      `const max = Math.max(...kpiInvoices.map((d: any) => Number(d.valor_total || 0)));`
    );
    
    content = content.replace(
      /change: data\.length > 0 \? 'Maior NF emitida' : 'Sem dados',/g,
      `change: kpiInvoices.length > 0 ? 'Maior NF emitida' : 'Sem dados',`
    );

    content = content.replace(
      /sparkline: buildSparkline\(data \|\| \[\], 'data_emissao', 'valor_total'\)/g,
      `sparkline: buildSparkline(kpiInvoices || [], 'data_emissao', 'valor_total')`
    );

    content = content.replace(
      /<ModernTable([\s\S]*?)data=\{invoices\}/,
      `<ModernTable$1data={invoices}\n            totalCount={totalCount}\n            currentPage={page}\n            onPageChange={setPage}\n            itemsPerPage={pageSize}`
    );
  }

  fs.writeFileSync('c:/Saas/src/pages/Sales/Invoices.tsx', content, 'utf8');
  console.log('Refactored Invoices.tsx successfully');
}

refactorInvoices();
