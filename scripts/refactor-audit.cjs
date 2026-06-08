const fs = require('fs');

function refactorAuditManagement() {
  let content = fs.readFileSync('c:/Saas/src/pages/Inventory/AuditManagement.tsx', 'utf8');

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
      /\[activeFarmId, activeTenantId, isGlobalMode\]\);/g,
      `[activeFarmId, activeTenantId, isGlobalMode, page]);`
    );

    content = content.replace(
      /const fetchPromise = \(async \(\) => \{\n\s*let query = supabase\n\s*\.from\('auditorias_estoque'\)\n\s*\.select\('\*'\)\n\s*\.order\('created_at', \{ ascending: false \}\)\n\s*\.limit\(500\);\n\s*query = applyFarmFilter\(query\);\n\s*const \{ data, error \} = await query;\n\s*if \(error\) throw error;\n\s*return data;\n\s*\}\)\(\);/m,
      `const fetchPromise = (async () => {\n        let baseQuery = supabase\n          .from('auditorias_estoque')\n          .select('*', { count: 'exact' })\n          .order('created_at', { ascending: false });\n        \n        baseQuery = applyFarmFilter(baseQuery);\n\n        // --- KPI QUERY ---\n        const { data: kpiData } = await supabase.from('auditorias_estoque').select('status, accuracy, custo_divergencia, tempo_auditoria_horas, data_inicio').match(isGlobalMode ? { tenant_id: activeTenantId } : { fazenda_id: activeFarmId });\n\n        // --- PAGINATED QUERY ---\n        const range = getRange();\n        const { data, count, error } = await baseQuery.range(range.from, range.to);\n        if (error) throw error;\n\n        if (count !== null && count !== totalCount) {\n          setTimeout(() => setTotalCount(count), 0);\n        }\n\n        return { data, kpiData };\n      })();`
    );

    content = content.replace(
      /const data: any = await Promise\.race\(\[fetchPromise, timeoutPromise\]\);\n\s*if \(data\) \{\n\s*setAudits\(data\);\n\s*const concluidas = data\.filter\(\(a: any\) => a\.status === 'completed'\)\.length;\n\s*const emAndamento = data\.filter\(\(a: any\) => a\.status === 'in_progress'\)\.length;\n\s*const avgAccuracy = data\.length > 0 \n\s*\? data\.reduce\(\(acc: number, curr: any\) => acc \+ \(curr\.accuracy \|\| 0\), 0\) \/ data\.length \n\s*: 0;\n\s*const custoPerdas = data\.reduce\(\(acc: number, curr: any\) => acc \+ \(curr\.custo_divergencia \|\| 0\), 0\);\n\s*const tempoMedio = data\.length > 0\n\s*\? data\.reduce\(\(acc: number, curr: any\) => acc \+ \(curr\.tempo_auditoria_horas \|\| 0\), 0\) \/ data\.length\n\s*: 0;/m,
      `const result: any = await Promise.race([fetchPromise, timeoutPromise]);\n      const { data, kpiData } = result || {};\n      \n      if (data) {\n        setAudits(data);\n        const kpiAudits = kpiData || [];\n        const concluidas = kpiAudits.filter((a: any) => a.status === 'completed').length;\n        const emAndamento = kpiAudits.filter((a: any) => a.status === 'in_progress').length;\n        const avgAccuracy = kpiAudits.length > 0 \n          ? kpiAudits.reduce((acc: number, curr: any) => acc + (curr.accuracy || 0), 0) / kpiAudits.length \n          : 0;\n        const custoPerdas = kpiAudits.reduce((acc: number, curr: any) => acc + (curr.custo_divergencia || 0), 0);\n        const tempoMedio = kpiAudits.length > 0\n          ? kpiAudits.reduce((acc: number, curr: any) => acc + (curr.tempo_auditoria_horas || 0), 0) / kpiAudits.length\n          : 0;`
    );

    content = content.replace(
      /sparkline: buildSparkline\(data \|\| \[\], 'data_inicio',/g,
      `sparkline: buildSparkline(kpiAudits || [], 'data_inicio',`
    );

    content = content.replace(
      /progress: data\.length > 0 \? \(concluidas \/ data\.length\) \* 100 : 0,/g,
      `progress: kpiAudits.length > 0 ? (concluidas / kpiAudits.length) * 100 : 0,`
    );

    content = content.replace(
      /<ModernTable([\s\S]*?)data=\{audits\}/,
      `<ModernTable$1data={audits}\n            totalCount={totalCount}\n            currentPage={page}\n            onPageChange={setPage}\n            itemsPerPage={pageSize}`
    );
  }

  fs.writeFileSync('c:/Saas/src/pages/Inventory/AuditManagement.tsx', content, 'utf8');
  console.log('Refactored AuditManagement.tsx successfully');
}

refactorAuditManagement();
