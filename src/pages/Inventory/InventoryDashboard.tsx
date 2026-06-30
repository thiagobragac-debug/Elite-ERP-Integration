import React, { useState, useEffect, useMemo } from 'react';

function buildSparkline(
  records: any[],
  dateField: string,
  valueField: string | null,
  buckets = 7
): { value: number; label: string }[] {
  if (!records || records.length === 0) {
    return [];
  }
  const sorted = [...records]
    .filter((r) => r[dateField])
    .sort((a, b) => new Date(a[dateField]).getTime() - new Date(b[dateField]).getTime());
  if (sorted.length === 0) {
    return [];
  }
  const first = new Date(sorted[0][dateField]).getTime();
  const last = new Date(sorted[sorted.length - 1][dateField]).getTime();
  const totalMs = Math.max(last - first, 1);
  const bucketMs = totalMs / buckets;
  return Array.from({ length: buckets }, (_, i) => {
    const bStart = first + i * bucketMs;
    const bEnd = bStart + bucketMs;
    const inBucket = sorted.filter((r) => {
      const t = new Date(r[dateField]).getTime();
      return i === buckets - 1 ? t >= bStart && t <= bEnd : t >= bStart && t < bEnd;
    });
    const v =
      inBucket.length === 0
        ? 0
        : valueField
          ? inBucket.reduce((s, r) => s + Number(r[valueField] || 0), 0)
          : inBucket.length;
    return {
      value: Number(v.toFixed(2)),
      label: new Date(bStart + bucketMs / 2).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
      }),
    };
  });
}
import {
  Package,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Boxes,
  ArrowRightLeft,
  ChevronRight,
  Activity,
  BarChart3,
  Calendar,
  FlaskConical,
  Zap,
  ArrowDownLeft,
  ArrowUpRight,
  Calculator,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { TauzeStatCard } from '../../components/Cards/TauzeStatCard';
import { KPISkeleton } from '../../components/Feedback/Skeleton';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { useQuery } from '@tanstack/react-query';
import { Breadcrumb } from '../../components/Navigation/Breadcrumb';
import toast from 'react-hot-toast';
import { EmptyState } from '../../components/Feedback/EmptyState';

export const InventoryDashboard: React.FC = () => {
  const {
    activeFarm,
    isGlobalMode,
    activeFarmId,
    applyFarmFilter,
    applyTenantFilter,
    activeTenantId,
  } = useFarmFilter();
  const isReady = isGlobalMode ? !!activeTenantId : !!activeFarmId;

  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('ALL');

  const { data: warehouses = [] } = useQuery({
    queryKey: ['depositos', activeFarmId, activeTenantId, isGlobalMode],
    queryFn: async () => {
      let query = supabase.from('depositos').select('id, nome').eq('tenant_id', activeTenantId);
      query = applyFarmFilter(query);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: isReady
  });

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
    // get_inventory_dashboard_stats returns array or object
    const data = Array.isArray(dashboardData) ? dashboardData[0] : (dashboardData || {});
    const totalValue = data.capital_imobilizado || 0;
    const criticalCount = data.itens_ruptura || 0;
    const maturityCount = data.itens_maturidade || 0;
    const turnover = 0; // Requires specific Turnover KPI in DB

    return [
      {
        label: 'Patrimônio em Insumos',
        value: totalValue > 0 ? \`R$ \${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\` : 'R$ 0,00',
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
        value: \`\${maturityCount} itens\`,
        icon: FlaskConical,
        color: '#f59e0b',
        progress: maturityCount > 0 ? 100 : 0,
        trend: maturityCount > 0 ? ('up' as const) : ('none' as const),
        change: 'Risco de Perda',
        sparkline: [],
      },
      {
        label: 'Giro de Estoque',
        value: turnover > 0 ? \`\${turnover.toFixed(1)}x\` : '0.0x',
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
      subtitle: \`\${m?.quantidade || 0} \${m?.produtos?.unidade || ''} • \${m?.responsavel || 'N/A'}\`,
      value: m?.tipo === 'ENTRADA' || m?.tipo === 'in' ? 'Entrada' : 'Saída',
    }));
  }, [movements]);

  // Import React useMemo
  return (
    <div className="inventory-hub animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <Breadcrumb
            paths={[
              { label: 'Estoque & Insumos', href: '/estoque/dashboard' },
              { label: 'Intelligence Hub' },
            ]}
          />
          <h1 className="page-title">Intelligence Hub</h1>
          <p className="page-subtitle">
            Visão executiva de patrimônio, ruptura de estoque e rastreabilidade de insumos.
          </p>
        </div>
        <div className="page-actions" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {warehouses.length > 0 && (
            <select
              className="tauze-input"
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              style={{ width: '200px', margin: 0 }}
            >
              <option value="ALL">Todos os Armazéns</option>
              {warehouses.map((w: any) => (
                <option key={w.id} value={w.id}>{w.nome}</option>
              ))}
            </select>
          )}
          <button className="primary-btn" onClick={() => toast.success("Processo de valoração iniciado em background. Você será notificado ao finalizar.")}>
            <Calculator size={18} />
            VALORAÇÃO TOTAL
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

        @media (max-width: 1024px) {
          .next-gen-kpi-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }

        @media (max-width: 640px) {
          .next-gen-kpi-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div className="next-gen-kpi-grid">
        {loading
          ? Array(4)
              .fill(0)
              .map((_, i) => <KPISkeleton key={i} />)
          : stats.map((stat, idx) => (
              <TauzeStatCard
                key={idx}
                label={stat.label}
                value={stat.value}
                icon={stat.icon}
                color={stat.color}
                progress={stat.progress}
                change={stat.change}
                trend={stat.trend === 'up' ? 'up' : undefined}
                sparkline={stat.sparkline}
              />
            ))}
      </div>

      <div className="inventory-hub-grid">
        <section className="hub-section main-panel">
          <div className="section-header">
            <div className="title-group">
              <AlertTriangle size={20} className="section-icon" />
              <h3>Itens para Reposição Urgente</h3>
            </div>
            {criticalItems && criticalItems.length > 0 && (
              <span className="header-meta">Ruptura Detectada</span>
            )}
          </div>

          <div className="critical-assets-grid">
            {criticalItems && criticalItems.length > 0 ? (
              (criticalItems as any[]).map((item: any) => (
                <div key={item?.id} className="asset-health-card">
                  <div className="asset-header">
                    <div
                      className="asset-icon"
                      style={{ background: '#ef444415', color: '#ef4444' }}
                    >
                      <Package size={24} />
                    </div>
                    <div className="asset-name-group">
                      <h4>{item?.nome || 'Sem nome'}</h4>
                      <span>{item?.categoria || 'Geral'}</span>
                    </div>
                  </div>

                  <div className="health-status-bar">
                    <div className="bar-label">
                      <span>
                        Estoque Mínimo: {item?.estoque_minimo || 0} {item?.unidade || ''}
                      </span>
                      <span className="urgent">Crítico</span>
                    </div>
                    <div className="bar-progress-bg">
                      {(() => {
                        const current = Number(item?.quantidade_total || 0);
                        const min = Number(item?.estoque_minimo || 1);
                        const progress = Math.min((current / min) * 100, 100);
                        const healthScore = progress;
                        return (
                          <motion.div
                            className="bar-progress-fill"
                            initial={{ width: 0 }}
                            animate={{ strokeDashoffset: 283 - (283 * (healthScore || 0)) / 100 }}
                            style={{ backgroundColor: '#ef4444', width: `${progress}%` }}
                          />
                        );
                      })()}
                    </div>
                    <div className="bar-footer">
                      <span>
                        {(item as any)?.quantidade_total} {(item as any)?.unidade} atuais
                      </span>
                      <span className="remaining-text">Abaixo do Limite</span>
                    </div>
                  </div>

                  <div className="asset-card-actions">
                    <button className="asset-btn">GERAR COTAÇÃO</button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ gridColumn: '1 / -1' }}>
                <EmptyState
                  title="Estoque Saudável"
                  description="Nenhum item abaixo do estoque mínimo de segurança."
                  icon={Package}
                />
              </div>
            )}
          </div>
        </section>

        {/* Right: Operational Activity */}
        <section className="hub-section side-panel">
          <div className="section-header">
            <div className="title-group">
              <ArrowRightLeft size={20} className="section-icon" />
              <h3>Fluxo de Movimentação</h3>
            </div>
          </div>

          <div className="activity-list">
            {recentMovements.length === 0 && (
              <div className="text-center py-4 text-xs font-bold text-slate-400">
                Nenhuma movimentação recente
              </div>
            )}
            {recentMovements.map((act, i) => (
              <div key={i} className="activity-item-tauze">
                <div className={`act-icon-wrapper ${act.type === 'in' ? 'fuel' : 'maint'}`}>
                  {act.type === 'in' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                </div>
                <div className="act-content">
                  <div className="act-main-row">
                    <span className="act-title">{act.title}</span>
                    <span
                      className="act-value"
                      style={{ color: act.type === 'in' ? '#10b981' : '#ef4444' }}
                    >
                      {act.value}
                    </span>
                  </div>
                  <div className="act-meta-row">
                    <span>{act.subtitle}</span>
                    <span>•</span>
                    <span>{new Date(act.date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button className="view-all-btn">
            VER LOG DE MOVIMENTOS
            <ChevronRight size={16} />
          </button>
        </section>
      </div>

      <div className="inventory-hub-grid" style={{ marginTop: '0px' }}>
        <section className="hub-section main-panel">
          <div className="section-header">
            <div className="title-group">
              <BarChart3 size={20} className="section-icon" />
              <h3>Curva ABC (Top 5 - Classe A)</h3>
            </div>
            <span className="header-meta" style={{ background: '#3b82f615', color: '#3b82f6' }}>Mais Valiosos</span>
          </div>
          
          <div className="activity-list">
            {abcCurve.length === 0 && (
              <div className="text-center py-8 text-sm font-bold text-slate-400">
                Dados insuficientes para cálculo de Curva ABC
              </div>
            )}
            {abcCurve.map((item: any, i: number) => (
              <div key={i} className="activity-item-tauze" style={{ alignItems: 'center' }}>
                <div className="act-icon-wrapper" style={{ background: '#3b82f615', color: '#3b82f6', fontSize: '16px' }}>
                  <strong>{item.classification}</strong>
                </div>
                <div className="act-content">
                  <div className="act-main-row">
                    <span className="act-title" style={{ fontSize: '14px' }}>{item.nome}</span>
                    <span className="act-value" style={{ color: '#10b981', fontSize: '13px' }}>
                      R$ {item.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="act-meta-row">
                    <span>{item.percentage.toFixed(1)}% do valor total imobilizado</span>
                    <span>•</span>
                    <span>{item.quantidade} {item.unidade} em estoque</span>
                  </div>
                  <div className="bar-progress-bg" style={{ marginTop: '8px', height: '6px' }}>
                    <div className="bar-progress-fill" style={{ width: `${item.percentage}%`, backgroundColor: '#3b82f6' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="hub-section side-panel">
          <div className="section-header">
            <div className="title-group">
              <Activity size={20} className="section-icon" />
              <h3>Cobertura de Estoque</h3>
            </div>
          </div>
          
          <div className="activity-list">
            {stockCoverage.length === 0 && (
              <div className="text-center py-8 text-sm font-bold text-slate-400">
                Nenhum item em risco imediato de ruptura
              </div>
            )}
            {stockCoverage.map((item: any, i: number) => (
              <div key={i} className="activity-item-tauze">
                <div className="act-icon-wrapper" style={{ background: item.days <= 5 ? '#ef444415' : '#f59e0b15', color: item.days <= 5 ? '#ef4444' : '#f59e0b' }}>
                  <Calendar size={16} />
                </div>
                <div className="act-content">
                  <div className="act-main-row">
                    <span className="act-title">{item.nome}</span>
                    <span className="act-value" style={{ color: item.days <= 5 ? '#ef4444' : '#f59e0b' }}>
                      {item.days} DIAS
                    </span>
                  </div>
                  <div className="act-meta-row">
                    <span>Consumo diário: {item.dailyConsumption.toFixed(1)} {item.unidade}</span>
                  </div>
                  <div className="bar-progress-bg" style={{ marginTop: '8px', height: '4px' }}>
                    <div className="bar-progress-fill" style={{ width: `${Math.max(10, 100 - (item.days * 5))}%`, backgroundColor: item.days <= 5 ? '#ef4444' : '#f59e0b' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <style>{`
        .inventory-hub { }
        .inventory-hub-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; margin-top: 24px; }
        .hub-section { background: hsl(var(--bg-card)); border-radius: 24px; border: 1px solid hsl(var(--border)); padding: 24px; box-shadow: var(--shadow-sm); }
        .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .title-group { display: flex; align-items: center; gap: 12px; }
        .section-icon { color: hsl(var(--brand)); }
        .section-header h3 { font-size: 18px; font-weight: 800; color: hsl(var(--text-main)); letter-spacing: -0.02em; }
        .header-meta { font-size: 10px; font-weight: 800; color: #ef4444; background: #ef444415; padding: 4px 10px; border-radius: 8px; text-transform: uppercase; }
        .critical-assets-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
        .asset-health-card { background: hsl(var(--bg-main) / 0.3); border-radius: 20px; border: 1px solid hsl(var(--border)); padding: 20px; transition: 0.2s; }
        .asset-health-card:hover { border-color: #ef444444; transform: translateY(-4px); }
        .asset-header { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
        .asset-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .asset-name-group h4 { font-size: 15px; font-weight: 800; color: hsl(var(--text-main)); margin: 0; }
        .asset-name-group span { font-size: 11px; color: hsl(var(--text-muted)); font-weight: 600; text-transform: uppercase; }
        .health-status-bar { margin-bottom: 16px; }
        .bar-label { display: flex; justify-content: space-between; font-size: 10px; font-weight: 800; margin-bottom: 8px; text-transform: uppercase; }
        .urgent { color: #ef4444; }
        .bar-progress-bg { height: 8px; background: hsl(var(--border)); border-radius: 4px; overflow: hidden; margin-bottom: 8px; }
        .bar-progress-fill { height: 100%; border-radius: 4px; }
        .bar-footer { display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; color: hsl(var(--text-muted)); }
        .remaining-text { color: #ef4444; }
        .asset-card-actions { display: flex; gap: 12px; }
        .asset-btn { flex: 1; padding: 10px; border-radius: 10px; border: none; background: hsl(var(--brand) / 0.1); color: hsl(var(--brand)); font-size: 11px; font-weight: 800; cursor: pointer; transition: 0.2s; }
        .asset-btn:hover { background: hsl(var(--brand)); color: white; }
        .activity-list { display: flex; flex-direction: column; gap: 16px; }
        .activity-item-tauze { display: flex; gap: 16px; padding-bottom: 16px; border-bottom: 1px solid hsl(var(--border)); }
        .activity-item-tauze:last-child { border-bottom: none; }
        .act-icon-wrapper { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .act-icon-wrapper.fuel { background: #10b98115; color: #10b981; }
        .act-icon-wrapper.maint { background: #ef444415; color: #ef4444; }
        .act-content { flex: 1; }
        .act-main-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
        .act-title { font-size: 13px; font-weight: 800; color: hsl(var(--text-main)); }
        .act-value { font-size: 11px; font-weight: 900; text-transform: uppercase; }
        .act-meta-row { display: flex; gap: 8px; font-size: 11px; color: hsl(var(--text-muted)); font-weight: 600; }
        .view-all-btn { width: 100%; margin-top: 24px; padding: 14px; border-radius: 16px; border: 1px solid hsl(var(--border)); background: hsl(var(--bg-main) / 0.5); color: hsl(var(--text-main)); font-size: 12px; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; transition: 0.2s; }
        .view-all-btn:hover { background: hsl(var(--bg-card)); border-color: hsl(var(--brand)); color: hsl(var(--brand)); }
        .empty-health { grid-column: span 2; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px; color: hsl(var(--text-muted)); gap: 16px; text-align: center; }
        @media (max-width: 1200px) { .inventory-hub-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
};
