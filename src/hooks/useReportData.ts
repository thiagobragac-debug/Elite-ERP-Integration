import { useQuery } from '@tanstack/react-query';
import { useFarmFilter } from './useFarmFilter';
import { isValidUUID } from '../utils/validation';
import type { ReportData } from '../types/reports';
import { handlers } from './report-handlers';
import { withTimeoutResilience, getGenericMockData } from '../utils/resilience';

export const fetchReportDataById = async (
  reportId: string,
  tenantId: string,
  fazendaId?: string,
  page = 1,
  pageSize = 20,
  filters: Record<string, unknown> = {}
): Promise<ReportData> => {
  if (!isValidUUID(tenantId)) {
    console.error('[fetchReportDataById] Invalid tenantId:', tenantId);
    return { data: [], stats: [], columns: [], totalCount: 0 };
  }

  const handler = handlers[reportId];

  if (!handler) {
    console.warn(`[fetchReportDataById] Report ID ${reportId} not found in registry.`);
    return { data: [], stats: [], columns: [], totalCount: 0 };
  }

  const fetchPromise = (async (): Promise<ReportData> => {
    const result = await handler(tenantId, fazendaId, page, pageSize, filters);
    return {
      data: result.data || [],
      stats: result.stats || [],
      columns: result.columns || [],
      totalCount: result.totalCount || result.data?.length || 0,
    };
  })();

  // Padrão Diamond Precision 5.0: Resiliência com timeout de 3s e fallback para mock
  return await withTimeoutResilience(
    fetchPromise,
    { ...getGenericMockData(reportId), totalCount: 0 },
    10000
  );
};

interface UseReportOptions {
  page?: number;
  pageSize?: number;
  filters?: Record<string, unknown>;
}

interface UseReportDataReturn {
  data: Array<Record<string, unknown>>;
  stats: Array<Record<string, unknown>>;
  columns: Array<Record<string, unknown>>;
  totalCount: number;
  healthScore: number;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export const useReportData = (
  reportId: string | null,
  options: UseReportOptions | number = 1,
  pageSizeParam = 20
): UseReportDataReturn => {
  const { activeTenantId, activeFarmId, isGlobalMode } = useFarmFilter();

  const isObjectOptions = typeof options === 'object' && options !== null;
  const page = isObjectOptions ? (options as UseReportOptions).page || 1 : (options as number);
  const pageSize = isObjectOptions ? (options as UseReportOptions).pageSize || 20 : pageSizeParam;
  const filters = isObjectOptions ? (options as UseReportOptions).filters || {} : {};

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [
      'report',
      reportId,
      activeTenantId,
      activeFarmId,
      page,
      pageSize,
      JSON.stringify(filters),
    ],
    queryFn: async () => {
      if (!reportId || !activeTenantId) {
        return { data: [], stats: [], columns: [], totalCount: 0 };
      }
      const result = await fetchReportDataById(
        reportId,
        activeTenantId,
        activeFarmId || undefined,
        page,
        pageSize,
        filters
      );
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
    refresh: refetch,
  };
};
