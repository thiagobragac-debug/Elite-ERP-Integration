import re

with open('c:/Saas/src/pages/Inventory/InventoryDashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

new_queries = """
  // Query 1: Dashboard Stats (Replaces valuation for KPIs)
  const { data: dashboardData, isLoading: dashboardStatsLoading } = useQuery({
    queryKey: ['inventory_dashboard_stats', activeTenantId, activeFarmId, isGlobalMode, selectedWarehouse],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_inventory_dashboard_stats', {
        p_tenant_id: activeTenantId,
        p_fazenda_id: isGlobalMode ? null : activeFarmId,
      });
      if (error) throw error;
      return data;
    },
    enabled: isReady,
  });

  // Query 2: Recent Movements
  const { data: movements = [], isLoading: movementsLoading } = useQuery({
    queryKey: ['inventory_recent_movements', activeFarmId, activeTenantId, isGlobalMode],
    queryFn: async () => {
      let query = supabase
        .from('movimentacoes_estoque')
        .select('id, tipo, data_movimentacao, quantidade, responsavel, produtos(nome, unidade)')
        .eq('tenant_id', activeTenantId)
        .order('created_at', { ascending: false })
        .limit(6);
      query = applyFarmFilter(query);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: isReady,
  });

  // Query 3: ABC Curve (Server-side)
  const { data: abcCurve = [], isLoading: abcLoading } = useQuery({
    queryKey: ['inventory_abc_curve', activeFarmId, activeTenantId, isGlobalMode, selectedWarehouse],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_abc_curve', {
        p_tenant_id: activeTenantId,
        p_warehouse_id: selectedWarehouse === 'ALL' ? null : selectedWarehouse,
      });
      if (error) throw error;
      return data || [];
    },
    enabled: isReady,
  });

  // Query 4: Stock Coverage (Server-side)
  const { data: stockCoverage = [], isLoading: coverageLoading } = useQuery({
    queryKey: ['inventory_stock_coverage', activeFarmId, activeTenantId, isGlobalMode, selectedWarehouse],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_stock_coverage', {
        p_tenant_id: activeTenantId,
        p_warehouse_id: selectedWarehouse === 'ALL' ? null : selectedWarehouse,
      });
      if (error) throw error;
      return data || [];
    },
    enabled: isReady,
  });

  // Query 5: Critical Items (Server-side)
  const { data: criticalItems = [], isLoading: criticalLoading } = useQuery({
    queryKey: ['inventory_critical_items', activeFarmId, activeTenantId, isGlobalMode, selectedWarehouse],
    queryFn: async () => {
      let query = supabase
        .from('vw_inventory_valuation_summary')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .eq('status_estoque', 'CRITICO');
      query = applyFarmFilter(query);
      const { data, error } = await query.limit(4);
      if (error) throw error;
      
      return (data || []).map((p: any) => ({
        ...p,
        nome: p.produto_nome,
        categoria: p.categoria_nome,
        quantidade_total: p.estoque_total,
        estoque_minimo: p.estoque_minimo || 0
      }));
    },
    enabled: isReady,
  });

  const loading = dashboardStatsLoading || movementsLoading || abcLoading || coverageLoading || criticalLoading;

  const stats = useMemo(() => {
    // get_inventory_dashboard_stats currently returns { capital_imobilizado, itens_ruptura, itens_maturidade } (assuming)
    // If it returns an array, we'll take the first element or map it.
    const data = Array.isArray(dashboardData) ? dashboardData[0] : (dashboardData || {});
    const totalValue = data.capital_imobilizado || 0;
    const criticalCount = data.itens_ruptura || 0;
    const maturityCount = data.itens_maturidade || 0;
    const turnover = 0; // Requires specific Turnover KPI in DB

    return [
      {
        label: 'Patrimônio em Insumos',
        value: totalValue > 0 ? `R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'R$ 0,00',
        icon: DollarSign,
        color: '#10b981',
        progress: totalValue > 0 ? 85 : 0,
        trend: 'none' as const,
        change: 'Capital Imobilizado',
        sparkline: [],
      },
      {
        label: 'Ruptura de Estoque',
        value: String(criticalCount),
        icon: AlertTriangle,
        color: '#ef4444',
        progress: criticalCount > 0 ? 100 : 0,
        trend: criticalCount > 0 ? ('up' as const) : ('none' as const),
        change: 'Itens p/ Reposição',
        sparkline: [],
      },
      {
        label: 'Vencimentos Próximos',
        value: `${maturityCount} itens`,
        icon: FlaskConical,
        color: '#f59e0b',
        progress: maturityCount > 0 ? 100 : 0,
        trend: maturityCount > 0 ? ('up' as const) : ('none' as const),
        change: 'Risco de Perda',
        sparkline: [],
      },
      {
        label: 'Giro de Estoque',
        value: turnover > 0 ? `${turnover.toFixed(1)}x` : '0.0x',
        icon: Zap,
        color: '#3b82f6',
        progress: 0,
        trend: turnover > 1.0 ? ('up' as const) : ('none' as const),
        change: 'Eficiência Logística',
        sparkline: [],
      },
    ];
  }, [dashboardData]);

  const recentMovements = useMemo(() => {
    return movements.map((m: any) => ({
      type: m?.tipo === 'ENTRADA' || m?.tipo === 'in' ? 'in' : 'out',
      date: m?.data_movimentacao || new Date().toISOString(),
      title: m?.produtos?.nome || 'Item',
      subtitle: `${m?.quantidade || 0} ${m?.produtos?.unidade || ''} • ${m?.responsavel || 'N/A'}`,
      value: m?.tipo === 'ENTRADA' || m?.tipo === 'in' ? 'Entrada' : 'Saída',
    }));
  }, [movements]);
"""

start_idx = content.find('  // Query 1: Inventory Valuation View')
end_idx = content.find('  // Import React useMemo')

if start_idx != -1 and end_idx != -1:
    new_content = content[:start_idx] + new_queries + content[end_idx:]
    with open('c:/Saas/src/pages/Inventory/InventoryDashboard.tsx', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print('Refactored successfully.')
else:
    print('Could not find indices.')
    print('Start:', start_idx)
    print('End:', end_idx)
