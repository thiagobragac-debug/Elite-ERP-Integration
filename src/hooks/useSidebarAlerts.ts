import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useFarmFilter } from './useFarmFilter';

export interface SidebarAlertsData {
  lotes: number;
  financeiro: number;
  sanidade: number;
  configuracoes: number;
}

export const useSidebarAlerts = () => {
  const { activeTenantId, activeFarmId, applyFarmFilter } = useFarmFilter();

  const fetchAlerts = async (): Promise<SidebarAlertsData> => {
    if (!activeTenantId) {
      return { lotes: 0, financeiro: 0, sanidade: 0, configuracoes: 0 };
    }

    const today = new Date().toISOString().split('T')[0];

    // 1. Query Lotes (status = 'PENDENTE' or 'DIVERGENTE')
    let lotesQuery = supabase
      .from('lotes')
      .select('id', { count: 'exact', head: true })
      .in('status', ['PENDENTE', 'DIVERGENTE', 'pendente', 'divergente']);
    lotesQuery = applyFarmFilter(lotesQuery);

    // 2. Query contas_pagar (status != 'PAGO', data_vencimento < today)
    let pagarQuery = supabase
      .from('contas_pagar')
      .select('id', { count: 'exact', head: true })
      .neq('status', 'PAGO')
      .lt('data_vencimento', today);
    pagarQuery = applyFarmFilter(pagarQuery);

    // 3. Query contas_receber (status != 'PAGO', data_vencimento < today)
    let receberQuery = supabase
      .from('contas_receber')
      .select('id', { count: 'exact', head: true })
      .neq('status', 'PAGO')
      .lt('data_vencimento', today);
    receberQuery = applyFarmFilter(receberQuery);

    // 4. Query sanidade carencia_dias (status = 'REALIZADO', carencia_dias > 0)
    let sanidadeQuery = supabase
      .from('sanidade')
      .select('data_manejo, carencia_dias')
      .eq('status', 'REALIZADO')
      .gt('carencia_dias', 0);
    sanidadeQuery = applyFarmFilter(sanidadeQuery);

    // 5. Query saas_invoices (status != 'pago') for configurations
    let invoicesQuery = supabase
      .from('saas_invoices')
      .select('id', { count: 'exact', head: true })
      .neq('status', 'pago')
      .eq('tenant_id', activeTenantId);

    // Parallel execution of queries
    const [
      lotesRes,
      pagarRes,
      receberRes,
      sanidadeRes,
      invoicesRes
    ] = await Promise.all([
      lotesQuery,
      pagarQuery,
      receberQuery,
      sanidadeQuery,
      invoicesQuery
    ]);

    // Calculate sanidade count based on carencia (data_manejo + carencia_dias > today)
    let sanidadeCount = 0;
    const todayDate = new Date();
    if (sanidadeRes.data && !sanidadeRes.error) {
      sanidadeCount = (sanidadeRes.data as any[]).filter((s: any) => {
        if (!s.data_manejo || !s.carencia_dias) return false;
        const release = new Date(s.data_manejo);
        release.setDate(release.getDate() + Number(s.carencia_dias));
        return release > todayDate;
      }).length;
    }

    const lotesCount = lotesRes.error ? 0 : (lotesRes.count || 0);
    const pagarCount = pagarRes.error ? 0 : (pagarRes.count || 0);
    const receberCount = receberRes.error ? 0 : (receberRes.count || 0);
    const financeiroCount = pagarCount + receberCount;
    const configCount = invoicesRes.error ? 0 : (invoicesRes.count || 0);

    return {
      lotes: lotesCount,
      financeiro: financeiroCount,
      sanidade: sanidadeCount,
      configuracoes: configCount
    };
  };

  const { data, isLoading, refetch } = useQuery<SidebarAlertsData>({
    queryKey: ['sidebar-alerts', activeTenantId, activeFarmId],
    queryFn: fetchAlerts,
    enabled: !!activeTenantId,
    staleTime: 30000, // 30s cache freshness
    refetchInterval: 60000, // Background updates every 1m
  });

  return {
    alerts: data || { lotes: 0, financeiro: 0, sanidade: 0, configuracoes: 0 },
    loading: isLoading,
    refresh: refetch
  };
};

