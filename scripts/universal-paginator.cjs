const fs = require('fs');

const filesToPaginate = [
  'src/pages/Admin/ApprovalCenter.tsx',
  'src/pages/Admin/CategoryManagement.tsx',
  'src/pages/Admin/CompanyManagement.tsx',
  'src/pages/Admin/RoleManagement.tsx',
  'src/pages/Admin/SaaSAdminPanel.tsx',
  'src/pages/Admin/UserManagement.tsx',
  'src/pages/Fleet/FleetManagement.tsx',
  'src/pages/Fleet/FuelManagement.tsx',
  'src/pages/Fleet/MaintenanceManagement.tsx',
  'src/pages/Inventory/WarehouseDetails.tsx',
  'src/pages/Inventory/WarehouseManagement.tsx',
  'src/pages/Purchasing/PriceAnalysis.tsx',
  'src/pages/Sales/ClientManagement.tsx',
  'src/pages/Sales/Contracts.tsx'
];

let successCount = 0;

filesToPaginate.forEach(file => {
  const fullPath = `c:/Saas/${file}`;
  if (!fs.existsSync(fullPath)) return;
  
  let content = fs.readFileSync(fullPath, 'utf8');
  if (content.includes('useServerPagination')) {
    console.log(`[SKIP] ${file} already has useServerPagination`);
    return;
  }

  // 1. Import useServerPagination
  const importMatch = content.match(/import\s+\{([^}]+)\}\s+from\s+['"]\.\.\/(?:\.\.\/)?components\/Navigation\/Breadcrumb['"];/);
  if (importMatch) {
    content = content.replace(importMatch[0], `${importMatch[0]}\nimport { useServerPagination } from '${file.split('/').length === 4 ? '../../' : '../../../'}hooks/useServerPagination';`);
  } else {
    // fallback, insert after lucide-react
    content = content.replace(/import\s+\{[^}]+\}\s+from\s+['"]lucide-react['"];/, `$& \nimport { useServerPagination } from '${file.split('/').length === 4 ? '../../' : '../../../'}hooks/useServerPagination';`);
  }

  // 2. Inject hook in the component
  const componentMatch = content.match(/export const [a-zA-Z0-9_]+:\s*React\.FC\s*=\s*\(\)\s*=>\s*\{/);
  if (componentMatch) {
    const hookInject = `\n  const { page, pageSize, totalCount, setTotalCount, setPage, getRange } = useServerPagination(20);`;
    content = content.replace(componentMatch[0], `${componentMatch[0]}${hookInject}`);
  }

  // 3. Add page to useEffect
  content = content.replace(/(\}, \[.*?)(isGlobalMode|activeTenantId|activeFarm|activeFarmId)(.*?\]\);)/g, (match, p1, p2, p3) => {
    if (!match.includes('page')) {
      return `${p1}${p2}${p3}`.replace(']);', ', page]);');
    }
    return match;
  });

  // 4. Update Supabase query to remove limit and add range
  // We look for: .from('table').select('...') -> add count exact
  // We look for: const { data, error } = await query -> add count
  
  // Replace .select('...') with .select('...', { count: 'exact' })
  content = content.replace(/\.select\((['"][^'"]+['"])\)/g, (match, p1) => {
    if (p1.includes('count')) return match;
    return `.select(${p1}, { count: 'exact' })`;
  });

  // Remove .limit(x) if it's on a query builder
  content = content.replace(/\.limit\(\d+\)/g, '');

  // Add .range() before await
  content = content.replace(/const\s+\{\s*data\s*(?:,\s*error)?\s*\}\s*=\s*await\s+(query|supabase\.[^;]+);/g, (match, queryVar) => {
    return `const range = getRange();\n      const { data, count, error } = await ${queryVar}.range(range.from, range.to);\n      if (count !== null && count !== totalCount) setTimeout(() => setTotalCount(count), 0);`;
  });

  content = content.replace(/const\s+\{\s*data\s*:\s*([^,]+)(?:,\s*error\s*:\s*[^}]+)?\s*\}\s*=\s*await\s+(query|supabase\.[^;]+);/g, (match, dataAlias, queryVar) => {
    return `const range = getRange();\n      const { data: ${dataAlias}, count, error } = await ${queryVar}.range(range.from, range.to);\n      if (count !== null && count !== totalCount) setTimeout(() => setTotalCount(count), 0);`;
  });

  // 5. Inject props into ModernTable
  content = content.replace(/<ModernTable([^>]*?)data=\{([^}]+)\}/g, `<ModernTable$1data={$2}\n            totalCount={totalCount}\n            currentPage={page}\n            onPageChange={setPage}\n            itemsPerPage={pageSize}`);

  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`[SUCCESS] Refactored ${file}`);
  successCount++;
});

console.log(`\nCompleted ${successCount} files.`);
