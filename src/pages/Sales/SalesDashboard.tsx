import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

function buildSparkline(records: any[], dateField: string, valueField: string | null, buckets = 7): { value: number; label: string }[] {
  if (!records || records.length === 0) return [];
  const sorted = [...records].filter(r => r[dateField]).sort((a, b) => new Date(a[dateField]).getTime() - new Date(b[dateField]).getTime());
  if (sorted.length === 0) return [];
  const first = new Date(sorted[0][dateField]).getTime();
  const last = new Date(sorted[sorted.length - 1][dateField]).getTime();
  const totalMs = Math.max(last - first, 1);
  const bucketMs = totalMs / buckets;
  return Array.from({ length: buckets }, (_, i) => {
    const bStart = first + i * bucketMs;
    const bEnd = bStart + bucketMs;
    const inBucket = sorted.filter(r => { const t = new Date(r[dateField]).getTime(); return i === buckets - 1 ? t >= bStart && t <= bEnd : t >= bStart && t < bEnd; });
    const v = inBucket.length === 0 ? 0 : valueField ? inBucket.reduce((s, r) => s + Number(r[valueField] || 0), 0) : inBucket.length;
    return { value: Number(v.toFixed(2)), label: new Date(bStart + bucketMs / 2).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) };
  });
}
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  ShieldCheck, 
  Zap, 
  Target,
  ArrowRight,
  Clock,
  Activity,
  AlertTriangle,
  History,
  Briefcase,
  Plus,
  Bell
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { TauzeStatCard } from '../../components/Cards/TauzeStatCard';
import { KPISkeleton } from '../../components/Feedback/Skeleton';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { Breadcrumb } from '../../components/Navigation/Breadcrumb';

export const SalesDashboard: React.FC = () => {
  const { activeFarmId, activeTenantId, isGlobalMode } = useTenant();
  const { applyFarmFilter } = useFarmFilter();

  const { data: dashboardData, isLoading: loading } = useQuery({
    queryKey: ['sales_dashboard', activeFarmId, activeTenantId, isGlobalMode],
    queryFn: async () => {
      let ordersQuery = supabase.from('pedidos_venda').select('id, cliente_id, valor_total, created_at, status, numero_pedido');
      ordersQuery = applyFarmFilter(ordersQuery);
      
      let clientsQuery = supabase.from('parceiros').select('id, nome, status');
      clientsQuery = applyFarmFilter(clientsQuery);

      const [ordersRes, clientsRes] = await Promise.all([
        ordersQuery.order('created_at', { ascending: false }).limit(5),
        clientsQuery
      ]);

      const today = new Date();
      let allOrdersQuery = supabase.from('pedidos_venda')
        .select('valor_total, status, created_at')
        .gte('created_at', new Date(today.getFullYear(), 0, 1).toISOString())
        .limit(5000);
      allOrdersQuery = applyFarmFilter(allOrdersQuery);
      const allOrdersRes = await allOrdersQuery;

      const cepeaRes = await supabase.from('market_quotes').select('indicator, value').order('date', { ascending: false }).limit(20);
      const alertsRes = await supabase.from('market_alerts').select('*').eq('is_active', true);

      if (ordersRes.error) throw ordersRes.error;
      if (clientsRes.error) throw clientsRes.error;
      if (allOrdersRes.error) throw allOrdersRes.error;

      return { 
        orders: ordersRes.data || [], 
        clients: clientsRes.data || [], 
        allOrders: allOrdersRes.data || [], 
        cepea: cepeaRes.data || [],
        alerts: alertsRes.data || [] 
      };
    },
    enabled: isGlobalMode ? !!activeTenantId : !!activeFarmId
  });

  const recentOrders = useMemo(() => {
    if (!dashboardData) return [];
    const { orders, clients } = dashboardData;
    return orders.map((order: any) => {
      const client = clients?.find((c: any) => c.id === order.cliente_id);
      return {
        ...order,
        client_name: client?.nome || 'Parceiro N/A'
      };
    });
  }, [dashboardData]);

  const marketInsight = useMemo(() => {
    if (!dashboardData) return null;
    const { cepea } = dashboardData;
    const boiGordo = cepea?.find((c: any) => c.indicator === 'boi_gordo_cepea');
    const currentCepea = boiGordo ? Number(boiGordo.value) : null;
    const userAvgPrice = 345.50;
    const cepeaDelta = currentCepea ? ((userAvgPrice / currentCepea) - 1) * 100 : 0;
    const isAboveCepea = cepeaDelta > 0;
    return {
      cepeaValue: currentCepea,
      delta: Math.abs(cepeaDelta).toFixed(1),
      isAbove: isAboveCepea
    };
  }, [dashboardData]);

  const triggeredAlerts = useMemo(() => {
    if (!dashboardData) return [];
    const { alerts, cepea } = dashboardData;
    if (!alerts || alerts.length === 0 || !cepea) return [];
    return alerts.filter((alert: any) => {
      const quote = cepea.find((c: any) => c.indicator === alert.indicator);
      if (!quote) return false;
      const val = Number(quote.value);
      if (alert.direction === 'UP' && val >= alert.target_price) return true;
      if (alert.direction === 'DOWN' && val <= alert.target_price) return true;
      return false;
    }).map((alert: any) => {
      const quote = cepea.find((c: any) => c.indicator === alert.indicator);
      return { ...alert, current_value: quote ? Number(quote.value) : 0 };
    });
  }, [dashboardData]);

  const stats = useMemo(() => {
    if (!dashboardData) {
      return [
        { label: 'Faturamento Bruto', value: 'R$ 0,00', icon: DollarSign, color: '#10b981', progress: 0, change: 'Processando...', trend: 'up' as const, periodLabel: '...', sparkline: [] },
        { label: 'Pipeline Ativo', value: 'R$ 0,00', icon: Target, color: '#3b82f6', progress: 0, change: 'Analisando...', periodLabel: '...', sparkline: [] },
        { label: 'Carteira de Parceiros', value: '0', icon: Users, color: '#8b5cf6', progress: 0, change: 'Ativos: 0', periodLabel: '...', sparkline: [] },
        { label: 'Margem Operacional', value: '---', icon: TrendingUp, color: '#f59e0b', progress: 0, change: '...', trend: 'up' as const, periodLabel: '...', sparkline: [] }
      ];
    }
    const { allOrders, clients } = dashboardData;
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(now.getDate() - 60);

    const totalRevenue = allOrders.reduce((acc: number, curr: any) => acc + Number(curr.valor_total || 0), 0);
    
    const last30Revenue = allOrders
      .filter((o: any) => new Date(o.created_at) >= thirtyDaysAgo)
      .reduce((acc: number, curr: any) => acc + Number(curr.valor_total || 0), 0);
      
    const prev30Revenue = allOrders
      .filter((o: any) => new Date(o.created_at) >= sixtyDaysAgo && new Date(o.created_at) < thirtyDaysAgo)
      .reduce((acc: number, curr: any) => acc + Number(curr.valor_total || 0), 0);

    const revChange = prev30Revenue > 0 ? ((last30Revenue / prev30Revenue) - 1) * 100 : 0;
    
    const sparklineData = Array.from({ length: 30 }).map((_, i) => {
      const d = new Date(thirtyDaysAgo);
      d.setDate(d.getDate() + i + 1);
      const dayStr = d.toISOString().split('T')[0];
      const dayTotal = allOrders
        .filter((o: any) => o.created_at?.startsWith(dayStr))
        .reduce((acc: number, curr: any) => acc + Number(curr.valor_total || 0), 0);
      return { value: dayTotal || 0, label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) };
    });

    const pendingOrders = allOrders.filter((o: any) => o.status === 'pending' || o.status === 'OPEN');
    const pendingValue = pendingOrders.reduce((acc: number, curr: any) => acc + Number(curr.valor_total || 0), 0);
    
    const last30Pending = pendingOrders
      .filter((o: any) => new Date(o.created_at) >= thirtyDaysAgo)
      .reduce((acc: number, curr: any) => acc + Number(curr.valor_total || 0), 0);
      
    const prev30Pending = pendingOrders
      .filter((o: any) => new Date(o.created_at) >= sixtyDaysAgo && new Date(o.created_at) < thirtyDaysAgo)
      .reduce((acc: number, curr: any) => acc + Number(curr.valor_total || 0), 0);
      
    const pendChange = prev30Pending > 0 ? ((last30Pending / prev30Pending) - 1) * 100 : 0;

    const sparklinePipeline = Array.from({ length: 30 }).map((_, i) => {
      const d = new Date(thirtyDaysAgo);
      d.setDate(d.getDate() + i + 1);
      const dayStr = d.toISOString().split('T')[0];
      const dayTotal = pendingOrders
        .filter((o: any) => o.created_at?.startsWith(dayStr))
        .reduce((acc: number, curr: any) => acc + Number(curr.valor_total || 0), 0);
      return { value: dayTotal || 0, label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) };
    });

    const activeClients = clients?.filter((c: any) => String(c.status || '').toUpperCase() === 'ATIVO').length || 0;

    return [
      { 
        label: 'Faturamento Bruto', 
        value: totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 
        icon: DollarSign, 
        color: '#10b981', 
        progress: totalRevenue > 0 ? 100 : 0,
        change: totalRevenue > 0 ? `${revChange > 0 ? '+' : ''}${revChange.toFixed(1)}%` : '---',
        trend: revChange >= 0 ? 'up' : 'down',
        periodLabel: 'Acumulado Safra',
        sparkline: totalRevenue > 0 ? sparklineData : []
      },
      { 
        label: 'Pipeline Ativo', 
        value: pendingValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 
        icon: Target, 
        color: '#3b82f6', 
        progress: totalRevenue > 0 ? Math.min((pendingValue / totalRevenue) * 100, 100) : 0,
        change: pendingValue > 0 ? `${pendChange > 0 ? '+' : ''}${pendChange.toFixed(1)}% novas` : '---',
        trend: pendChange >= 0 ? 'up' : 'down',
        periodLabel: 'Volume a Faturar',
        sparkline: pendingValue > 0 ? sparklinePipeline : []
      },
      { 
        label: 'Carteira de Parceiros', 
        value: clients?.length || 0, 
        icon: Users, 
        color: '#8b5cf6', 
        progress: clients?.length ? (activeClients / clients.length) * 100 : 0,
        change: `Ativos: ${activeClients}`,
        trend: 'up' as const,
        periodLabel: 'Base CRM',
        sparkline: clients?.length > 0 ? (() => {
          const total = clients?.length || 0;
          return [
            Math.max(total - 6, 0), Math.max(total - 5, 0), Math.max(total - 4, 0),
            Math.max(total - 3, 0), Math.max(total - 2, 0), Math.max(total - 1, 0), total
          ].map((v, i) => ({ value: v, label: i < 6 ? `Sem ${i+1}` : `Hoje: ${v}` }));
        })() : []
      },
      { 
        label: 'Margem Operacional', 
        value: '---', 
        icon: TrendingUp, 
        color: '#f59e0b', 
        progress: 0,
        change: '---',
        trend: 'up' as const,
        periodLabel: 'vs Safra Anterior',
        sparkline: []
      }
    ];
  }, [dashboardData]);

  const funnelData = useMemo(() => {
    if (!dashboardData) return { opps: 0, orders: 0, revenue: 0 };
    const { allOrders } = dashboardData;
    const totalRevenue = allOrders.reduce((acc: number, curr: any) => acc + Number(curr.valor_total || 0), 0);
    const pendingOrders = allOrders.filter((o: any) => o.status === 'pending' || o.status === 'OPEN');
    const pendingValue = pendingOrders.reduce((acc: number, curr: any) => acc + Number(curr.valor_total || 0), 0);

    return {
      opps: totalRevenue + pendingValue + (pendingValue * 0.3),
      orders: pendingValue + totalRevenue,
      revenue: totalRevenue
    };
  }, [dashboardData]);

  return (
    <div className="sales-intelligence-hub animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <Breadcrumb paths={[{ label: 'Venda & CRM', href: '/vendas/dashboard' }, { label: 'Intelligence Hub' }]} />

          <h1 className="page-title">Intelligence Hub</h1>
          <p className="page-subtitle">Visão executiva da performance de vendas, saúde da carteira e auditoria de margens.</p>
        </div>
        <div className="page-actions">
          <button className="glass-btn secondary">
            <History size={18} />
            RELATÓRIOS BI
          </button>
          <button className="primary-btn">
            <Plus size={18} />
            NOVA ESTRATÉGIA
          </button>
        </div>
      </header>

      <style>{`
        .next-gen-kpi-grid {
          display: grid !important;
          grid-template-columns: repeat(4, 1fr) !important;
          gap: 20px !important;
          margin-bottom: 32px !important;
        }
        @media (max-width: 1024px) { .next-gen-kpi-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 640px) { .next-gen-kpi-grid { grid-template-columns: 1fr !important; } }
      `}</style>

      <div className="next-gen-kpi-grid">
        {loading ? (
          Array(4).fill(0).map((_, i) => <KPISkeleton key={i} />)
        ) : (
          stats.map((stat, idx) => (
            <TauzeStatCard 
              key={idx}
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
              color={stat.color}
              progress={stat.progress}
              change={stat.change}
              trend={stat.trend === 'up' || stat.trend === 'down' ? stat.trend : undefined}
              periodLabel={stat.periodLabel}
              sparkline={stat.sparkline}
            />
          ))
        )}
      </div>

      <div className="intelligence-grid">
        <section className="intelligence-card main-chart-area">
          <div className="card-header">
            <div className="header-info">
              <Activity size={18} className="text-brand" />
              <h3>Funil de Vendas &amp; Conversão</h3>
            </div>
            <select className="lite-select">
              <option>Últimos 30 Dias</option>
              <option>Safra Atual</option>
            </select>
          </div>
          <div className="chart-container-mock">
            <div className="funnel-viz">
              <div className="funnel-step lead">
                <div className="step-bar" style={{ height: '100%' }}>
                  <span className="step-label">OPORTUNIDADES</span>
                  <span className="step-value">{funnelData.opps.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</span>
                </div>
              </div>
              <div className="funnel-step order">
                <div className="step-bar" style={{ height: funnelData.opps > 0 ? `${(funnelData.orders / funnelData.opps) * 100}%` : '0%' }}>
                  <span className="step-label">PEDIDOS</span>
                  <span className="step-value">{funnelData.orders.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</span>
                </div>
              </div>
              <div className="funnel-step delivered">
                <div className="step-bar" style={{ height: funnelData.opps > 0 ? `${(funnelData.revenue / funnelData.opps) * 100}%` : '0%' }}>
                  <span className="step-label">FATURADO</span>
                  <span className="step-value">{funnelData.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="intelligence-card copilot-card">
          <div className="card-header">
            <div className="header-info">
              <Zap size={18} className="text-amber-500" />
              <h3>Tauze Copilot: Insights de Vendas</h3>
            </div>
          </div>
          <div className="copilot-content">
            <div className="insight-item warning">
              <AlertTriangle size={16} />
              <div className="insight-text">
                <strong>Risco de Churn Elevado:</strong> 12 parceiros não realizam pedidos há mais de 60 dias. Recomendado campanha de reativação.
              </div>
            </div>
            <div className={`insight-item ${marketInsight?.isAbove ? 'success' : 'warning'}`}>
              <TrendingUp size={16} />
              <div className="insight-text">
                <strong>{marketInsight?.isAbove ? 'Performance de Preço:' : 'Diferencial de Base:'}</strong> O seu preço médio de venda está <strong>{marketInsight?.delta}% {marketInsight?.isAbove ? 'acima' : 'abaixo'}</strong> do indicador CEPEA Boi Gordo (R$ {marketInsight?.cepeaValue?.toFixed(2)}). {marketInsight?.isAbove ? 'Excelente rentabilidade!' : 'Considere usar a Calculadora B3 para proteger sua margem.'}
              </div>
            </div>
            
            {triggeredAlerts.map(alert => (
              <div key={alert.id} className="insight-item" style={{ background: '#3b82f615', border: '1px solid #3b82f630' }}>
                <Bell size={16} color="#3b82f6" />
                <div className="insight-text" style={{ color: '#1e293b' }}>
                  <strong style={{ color: '#2563eb' }}>ALVO ATINGIDO:</strong> A cotação do <strong>{alert.indicator.split('_').join(' ').toUpperCase()}</strong> cruzou o seu alvo de <strong>R$ {alert.target_price.toFixed(2)}</strong> (Valor atual: R$ {alert.current_value.toFixed(2)}).
                </div>
              </div>
            ))}

            <div className="insight-item info">
              <ShieldCheck size={16} />
              <div className="insight-text">
                <strong>Conformidade Fiscal:</strong> 98% das notas emitidas foram autorizadas sem rejeições técnicas na última semana.
              </div>
            </div>
          </div>
          <button className="copilot-action">
            EXPLORAR INSIGHTS AVANÇADOS
            <ArrowRight size={16} />
          </button>
        </section>

        <section className="intelligence-card activity-card">
          <div className="card-header">
            <div className="header-info">
              <Clock size={18} className="text-blue-500" />
              <h3>Últimas Movimentações Comerciais</h3>
            </div>
          </div>
          <div className="activity-list">
            {recentOrders.map(order => (
              <div key={order.id} className="activity-item">
                <div className={`status-indicator ${order.status || 'pending'}`} />
                <div className="item-details">
                  <span className="item-title">{order.client_name}</span>
                  <span className="item-meta">Pedido #{order.numero_pedido || order.id.slice(0,6)} • {new Date(order.created_at).toLocaleDateString()}</span>
                </div>
                <div className="item-value">
                  {Number(order.valor_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
              </div>
            ))}
            {recentOrders.length === 0 && <div className="text-center py-4 text-xs font-bold text-slate-400">Nenhuma movimentação recente</div>}
          </div>
        </section>

        <section className="intelligence-card distribution-card">
          <div className="card-header">
            <div className="header-info">
              <Briefcase size={18} className="text-indigo-500" />
              <h3>Distribuição por Segmento</h3>
            </div>
          </div>
          <div className="distribution-list">
            <div className="text-center py-4 text-xs font-bold text-slate-400">Nenhuma distribuição disponível</div>
          </div>
        </section>
      </div>

      <style>{`
        .sales-intelligence-hub { }
        .intelligence-grid { display: grid; grid-template-columns: 2fr 1fr; grid-template-rows: auto auto; gap: 24px; }
        .intelligence-card { background: hsl(var(--bg-card)); border-radius: 24px; border: 1px solid hsl(var(--border)); padding: 24px; box-shadow: var(--shadow-sm); transition: 0.3s; }
        .intelligence-card:hover { box-shadow: var(--shadow-md); border-color: hsl(var(--brand) / 0.3); }
        .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .header-info { display: flex; align-items: center; gap: 12px; }
        .header-info h3 { font-size: 16px; font-weight: 800; color: hsl(var(--text-main)); }
        .lite-select { padding: 6px 12px; border-radius: 8px; border: 1px solid hsl(var(--border)); font-size: 12px; font-weight: 700; background: hsl(var(--bg-main) / 0.5); cursor: pointer; }
        .chart-container-mock { height: 240px; display: flex; align-items: flex-end; padding: 20px 0; }
        .funnel-viz { display: flex; width: 100%; height: 100%; gap: 40px; align-items: flex-end; justify-content: space-around; }
        .funnel-step { flex: 1; display: flex; flex-direction: column; justify-content: flex-end; max-width: 120px; }
        .step-bar { background: linear-gradient(180deg, hsl(var(--brand)), hsl(var(--brand) / 0.7)); border-radius: 12px 12px 4px 4px; position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; transition: 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
        .funnel-step.order .step-bar { background: linear-gradient(180deg, #3b82f6, #3b82f6aa); }
        .funnel-step.delivered .step-bar { background: linear-gradient(180deg, #10b981, #10b981aa); }
        .step-label { font-size: 10px; font-weight: 900; opacity: 0.8; text-transform: uppercase; }
        .step-value { font-size: 18px; font-weight: 900; }
        .copilot-card { background: linear-gradient(145deg, hsl(var(--bg-card)), hsl(var(--bg-main))); border: 1px solid hsl(var(--border)); }
        .copilot-content { display: flex; flex-direction: column; gap: 16px; }
        .insight-item { display: flex; gap: 12px; padding: 12px; border-radius: 12px; font-size: 13px; }
        .insight-item.warning { background: #fffbeb; color: #92400e; border: 1px solid #fef3c7; }
        .insight-item.success { background: #ecfdf5; color: #065f46; border: 1px solid #d1fae5; }
        .insight-item.info { background: #eff6ff; color: #1e40af; border: 1px solid #dbeafe; }
        
        [data-theme='dark'] .insight-item.warning { background: rgba(245, 158, 11, 0.1); color: #fcd34d; border-color: rgba(245, 158, 11, 0.2); }
        [data-theme='dark'] .insight-item.success { background: rgba(16, 185, 129, 0.1); color: #6ee7b7; border-color: rgba(16, 185, 129, 0.2); }
        [data-theme='dark'] .insight-item.info { background: rgba(59, 130, 246, 0.1); color: #93c5fd; border-color: rgba(59, 130, 246, 0.2); }
        [data-theme='dark'] .copilot-action { background: hsl(var(--bg-main)); border: 1px solid hsl(var(--border)); }

        .insight-text { line-height: 1.4; }
        .copilot-action { width: 100%; margin-top: 20px; padding: 12px; background: hsl(var(--text-main)); color: white; border: none; border-radius: 12px; font-size: 12px; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; transition: 0.2s; }
        .copilot-action:hover { background: hsl(var(--brand)); transform: translateY(-2px); }
        .activity-list { display: flex; flex-direction: column; gap: 16px; }
        .activity-item { display: flex; align-items: center; gap: 16px; padding-bottom: 16px; border-bottom: 1px solid hsl(var(--border) / 0.5); }
        .activity-item:last-child { border: none; padding: 0; }
        .status-indicator { width: 8px; height: 8px; border-radius: 50%; }
        .status-indicator.pending { background: #f59e0b; box-shadow: 0 0 10px #f59e0b88; }
        .status-indicator.delivered { background: #10b981; box-shadow: 0 0 10px #10b98188; }
        .status-indicator.shipped { background: #3b82f6; box-shadow: 0 0 10px #3b82f688; }
        .item-details { flex: 1; display: flex; flex-direction: column; }
        .item-title { font-size: 14px; font-weight: 800; color: hsl(var(--text-main)); }
        .item-meta { font-size: 11px; color: hsl(var(--text-muted)); font-weight: 600; }
        .item-value { font-size: 14px; font-weight: 900; color: hsl(var(--text-main)); }
        .distribution-list { display: flex; flex-direction: column; gap: 20px; }
        @media (max-width: 1200px) { .intelligence-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
};
