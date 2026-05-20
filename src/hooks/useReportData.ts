import { useState, useEffect } from 'react';
import { useFarmFilter } from './useFarmFilter';
import { isValidUUID } from '../utils/validation';
import type { ReportData } from '../types/reports';
import { handlers } from './report-handlers';
import { withTimeoutResilience, getGenericMockData } from '../utils/resilience';

export const fetchReportDataById = async (
  reportId: string, 
  tenantId: string, 
  fazendaId?: string,
  page: number = 1,
  pageSize: number = 20,
  filters: any = {}
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
      totalCount: result.totalCount || (result.data?.length || 0)
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
  filters?: any;
}

export const useReportData = (reportId: string | null, options: UseReportOptions | number = 1, pageSizeParam: number = 20) => {
  const { activeTenantId, activeFarmId, isGlobalMode } = useFarmFilter();
  
  // Handle both old positional and new object-based signatures
  const isObjectOptions = typeof options === 'object' && options !== null;
  const page = isObjectOptions ? (options as UseReportOptions).page || 1 : (options as number);
  const pageSize = isObjectOptions ? (options as UseReportOptions).pageSize || 20 : pageSizeParam;
  const filters = isObjectOptions ? (options as UseReportOptions).filters || {} : {};

  const [reportState, setReportState] = useState<ReportData & { totalCount: number, loading: boolean, error: string | null }>({
    data: [],
    stats: [],
    columns: [],
    totalCount: 0,
    loading: false,
    error: null,
  });

  const [refreshSalt, setRefreshSalt] = useState(0);
  const refresh = () => setRefreshSalt(prev => prev + 1);

  useEffect(() => {
    if (!reportId || !activeTenantId) return;

    const fetchReportData = async () => {
      setReportState(prev => ({ ...prev, loading: true, error: null }));
      
      try {
        const result = await fetchReportDataById(reportId, activeTenantId, activeFarmId || undefined, page, pageSize, filters);
        setReportState({
          ...result,
          healthScore: (result as any).healthScore || 0,
          totalCount: result.totalCount || 0,
          loading: false,
          error: null
        });
      } catch (err: any) {
        console.error(`[useReportData] Erro ao carregar relatório ${reportId}:`, err);
        setReportState({ 
          data: [], 
          stats: [], 
          columns: [], 
          totalCount: 0,
          loading: false, 
          error: err.message || 'Erro inesperado ao processar dados.'
        });
      }
    };

    fetchReportData();
  }, [reportId, activeTenantId, activeFarmId, isGlobalMode, page, pageSize, JSON.stringify(filters), refreshSalt]);

  return { ...reportState, refresh };
};
