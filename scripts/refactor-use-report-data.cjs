const fs = require('fs');

const path = 'c:/Saas/src/hooks/useReportData.ts';
let content = fs.readFileSync(path, 'utf8');

// Add import
if (!content.includes('@tanstack/react-query')) {
  content = content.replace(
    /import \{ useState, useEffect \} from 'react';/,
    `import { useQuery } from '@tanstack/react-query';\nimport { useFarmFilter } from './useFarmFilter';`
  );
  // Remove duplicate useFarmFilter if any
  content = content.replace(/import \{ useFarmFilter \} from '\.\/useFarmFilter';\nimport \{ useFarmFilter \} from '\.\/useFarmFilter';/, `import { useFarmFilter } from './useFarmFilter';`);
}

const replacement = `export const useReportData = (reportId: string | null, options: UseReportOptions | number = 1, pageSizeParam: number = 20) => {
  const { activeTenantId, activeFarmId, isGlobalMode } = useFarmFilter();
  
  const isObjectOptions = typeof options === 'object' && options !== null;
  const page = isObjectOptions ? (options as UseReportOptions).page || 1 : (options as number);
  const pageSize = isObjectOptions ? (options as UseReportOptions).pageSize || 20 : pageSizeParam;
  const filters = isObjectOptions ? (options as UseReportOptions).filters || {} : {};

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['report', reportId, activeTenantId, activeFarmId, page, pageSize, JSON.stringify(filters)],
    queryFn: async () => {
      if (!reportId || !activeTenantId) return { data: [], stats: [], columns: [], totalCount: 0 };
      const result = await fetchReportDataById(reportId, activeTenantId, activeFarmId || undefined, page, pageSize, filters);
      return result;
    },
    enabled: !!reportId && !!activeTenantId,
  });

  return {
    data: data?.data || [],
    stats: data?.stats || [],
    columns: data?.columns || [],
    totalCount: data?.totalCount || 0,
    healthScore: (data as any)?.healthScore || 0,
    loading: isLoading,
    error: error ? (error as any).message : null,
    refresh: refetch
  };
};`;

content = content.replace(/export const useReportData = \([\s\S]*?\}\s*;\s*\}\s*;\s*fetchReportData\(\);\s*\}, \[.*?\]\);\s*return \{ \.\.\.reportState, refresh \};\s*\};/m, replacement);

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully refactored useReportData.ts with React Query');
