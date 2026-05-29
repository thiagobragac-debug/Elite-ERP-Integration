import React, { useState, useEffect } from 'react';

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
  ArrowUpRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { TauzeStatCard } from '../../components/Cards/TauzeStatCard';
import { KPISkeleton } from '../../components/Feedback/Skeleton';
import { useFarmFilter } from '../../hooks/useFarmFilter';

export const InventoryDashboard: React.FC = () => {
  const { activeFarm, isGlobalMode, activeFarmId, applyFarmFilter, applyTenantFilter, activeTenantId } = useFarmFilter();
  const [loading, setLoading] = useState(true);
  const [criticalItems, setCriticalItems] = useState<any[]>([]);
  const [recentMovements, setRecentMovements] = useState<any[]>([]);

  const [stats, setStats] = useState<any[]>([
    { label: 'Patrimônio em Insumos', value: '---', icon: DollarSign, color: '#10b981', progress: 0, change: 'Calculando...', sparkline: [] },
    { label: 'Ruptura de Estoque', value: '---', icon: AlertTriangle, color: '#ef4444', progress: 0, trend: 'stable' as const, change: 'Verificando...', sparkline: [] },
    { label: 'Maturidade (30d)', value: '---', icon: FlaskConical, color: '#f59e0b', progress: 0, trend: 'stable' as const, change: 'Auditando...', sparkline: [] },
    { label: 'Giro de Estoque', value: '---', icon: Zap, color: '#3b82f6', progress: 0, trend: 'stable' as const, change: 'Sincronizando...', sparkline: [] }
  ]);

  useEffect(() => {
    const isReady = isGlobalMode ? !!activeTenantId : !!activeFarmId;
    if (isReady) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [activeFarmId, activeTenantId, isGlobalMode]);

  const fetchDashboardData = async () => {
    if (!activeFarmId && !isGlobalMode) { if (typeof setLoading !== 'undefined') setLoading(false); return; }
    setLoading(true);
    try {
      const fetchPromise = (async () => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const queries = [
          applyFarmFilter(supabase.from('produtos').select('id, nome, estoque_atual, estoque_minimo, custo_medio, unidade, categoria')),
          applyFarmFilter(supabase.from('movimentacoes_estoque').select('id, tipo, data_movimentacao, quantidade, responsavel, produtos(nome, unidade)').order('created_at', { ascending: false }).limit(6)),
          applyFarmFilter(supabase.from('movimentacoes_estoque').select('quantidade, valor_unitario, tipo, data_movimentacao').eq('tipo', 'out').gte('data_movimentacao', thirtyDaysAgo.toISOString()))
        ];

        const [prodRes, moveRes, outMovRes] = await Promise.all(queries);
        
        if (prodRes.error) throw prodRes.error;
        if (moveRes.error) throw moveRes.error;
        if (outMovRes.error) throw outMovRes.error;
        
        return { 
          products: prodRes.data || [], 
          movements: moveRes.data || [],
          outMovements: outMovRes.data || [] 
        };
      })();

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 3000)
      );

      const result = await Promise.race([fetchPromise, timeoutPromise]) as any;
      const products = result?.products || [];
      const movements = result?.movements || [];
      const outMovements = result?.outMovements || [];

      if (products.length >= 0) {
        const totalValue = products.reduce((acc: number, p: any) => acc + (Number(p?.estoque_atual || 0) * Number(p?.custo_medio || 0)), 0);
        const criticalCount = products.filter((p: any) => Number(p?.estoque_atual || 0) < Number(p?.estoque_minimo || 0)).length;
        
        const maturityCount = products.filter((p: any) => Number(p?.estoque_atual || 0) < (Number(p?.estoque_minimo || 0) * 0.5)).length;

        const totalOutgoingValue = outMovements.reduce((acc: number, m: any) => acc + (Number(m?.quantidade || 0) * Number(m?.valor_unitario || 0)), 0);
        const calculatedTurnover = totalValue > 0 ? (totalOutgoingValue / totalValue) : 0;
        const turnover = calculatedTurnover > 0 ? calculatedTurnover : 0;

        const sparklineGiro = Array.from({ length: 30 }).map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - 30 + i + 1);
          const dayStr = d.toISOString().split('T')[0];
          const dayTotal = outMovements
            .filter((m: any) => m.data_movimentacao?.startsWith(dayStr))
            .reduce((acc: number, m: any) => acc + (Number(m?.quantidade || 0) * Number(m?.valor_unitario || 0)), 0);
          return { value: dayTotal || 0, label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) };
        });

        setStats([
          { 
            label: 'Patrimônio em Insumos', 
            value: totalValue > 0 ? `R$ ${totalValue.toLocaleString('pt-BR')}` : '---', 
            icon: DollarSign, 
            color: '#10b981', 
            progress: totalValue > 0 ? 85 : 0,
            change: 'Capital Imobilizado',
            sparkline: buildSparkline(products, 'created_at', 'estoque_atual')
          },
          { 
            label: 'Ruptura de Estoque', 
            value: String(criticalCount), 
            icon: AlertTriangle, 
            color: '#ef4444', 
            progress: products.length > 0 ? (criticalCount / products.length) * 100 : 0,
            trend: criticalCount > 0 ? 'up' : 'stable',
            change: 'Itens p/ Reposição',
            sparkline: buildSparkline(products, 'created_at', 'estoque_atual')
          },
          { 
            label: 'Maturidade (30d)', 
            value: `${maturityCount} itens`, 
            icon: FlaskConical, 
            color: '#f59e0b', 
            progress: products.length > 0 ? (maturityCount / products.length) * 100 : 0,
            trend: maturityCount > 0 ? 'up' : 'stable',
            change: 'Risco de Perda',
            sparkline: buildSparkline(products, 'created_at', 'estoque_atual')
          },
          { 
            label: 'Giro de Estoque', 
            value: turnover > 0 ? `${turnover.toFixed(1)}x` : '---', 
            icon: Zap, 
            color: '#3b82f6', 
            progress: Math.min(Number((turnover * 30).toFixed(0)), 100),
            trend: turnover > 1.0 ? 'up' : 'stable',
            change: 'Eficiência Logística',
            sparkline: turnover > 0 ? sparklineGiro : []
          },
        ]);

        setCriticalItems(products
          .filter((p: any) => Number(p?.estoque_atual || 0) < Number(p?.estoque_minimo || 0))
          .slice(0, 4)
        );
      }

      if (movements.length >= 0) {
        setRecentMovements(movements.map((m: any) => ({
          type: m?.tipo || 'in',
          date: m?.data_movimentacao || new Date().toISOString(),
          title: m?.produtos?.nome || 'Item',
          subtitle: `${m?.quantidade || 0} ${m?.produtos?.unidade || ''} • ${m?.responsavel || 'N/A'}`,
          value: m?.tipo === 'in' ? 'Entrada' : 'Saída'
        })));
      }

    } catch (err) {
      console.warn("InventoryDashboard: Fetch error:", err);
      setStats([
        { label: 'Patrimônio em Insumos', value: '---', icon: DollarSign, color: '#ef4444', progress: 0, change: 'Erro de Conexão', sparkline: [] },
        { label: 'Ruptura de Estoque', value: '---', icon: AlertTriangle, color: '#ef4444', progress: 0, change: 'Erro de Conexão', sparkline: [] },
        { label: 'Maturidade (30d)', value: '---', icon: FlaskConical, color: '#ef4444', progress: 0, change: 'Erro de Conexão', sparkline: [] },
        { label: 'Giro de Estoque', value: '---', icon: Zap, color: '#ef4444', progress: 0, change: 'Erro de Conexão', sparkline: [] }
      ]);
      setCriticalItems([]);
      setRecentMovements([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inventory-hub animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge">
            <Package size={14} fill="currentColor" />
            <span>INVENTORY INTELLIGENCE HUB</span>
          </div>
          <h1 className="page-title">Gestão Estratégica de Estoque</h1>
          <p className="page-subtitle">Visão executiva de patrimônio, ruptura de estoque e rastreabilidade de insumos.</p>
        </div>
        <div className="page-actions">
          <button className="glass-btn primary">
            <BarChart3 size={18} />
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
        {loading ? (
          Array(4).fill(0).map((_, i) => <KPISkeleton key={i} />)
        ) : stats.map((stat, idx) => (
          <TauzeStatCard 
            key={idx}
            {...stat}
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
            <span className="header-meta">Ruptura Detectada</span>
          </div>

          <div className="critical-assets-grid">
            {criticalItems && criticalItems.length > 0 ? criticalItems.map(item => (
              <div key={item?.id} className="asset-health-card">
                <div className="asset-header">
                  <div className="asset-icon" style={{ background: '#ef444415', color: '#ef4444' }}>
                    <Package size={24} />
                  </div>
                  <div className="asset-name-group">
                    <h4>{item?.nome || 'Sem nome'}</h4>
                    <span>{item?.categoria || 'Geral'}</span>
                  </div>
                </div>
                
                <div className="health-status-bar">
                  <div className="bar-label">
                    <span>Estoque Mínimo: {item?.estoque_minimo || 0} {item?.unidade || ''}</span>
                    <span className="urgent">Crítico</span>
                  </div>
                  <div className="bar-progress-bg">
                    {(() => {
                      const current = Number(item?.estoque_atual || 0);
                      const min = Number(item?.estoque_minimo || 1);
                      const progress = Math.min((current / min) * 100, 100);
                      const healthScore = progress;
                      return (
                        <motion.div 
                          className="bar-progress-fill" 
                          initial={{ width: 0 }}
                          animate={{ strokeDashoffset: 283 - (283 * (healthScore || 0) / 100) }}
                          style={{ backgroundColor: '#ef4444', width: `${progress}%` }}
                        />
                      );
                    })()}
                  </div>
                  <div className="bar-footer">
                    <span>{item.estoque_atual} {item.unidade} atuais</span>
                    <span className="remaining-text">Abaixo do Limite</span>
                  </div>
                </div>

                <div className="asset-card-actions">
                  <button className="asset-btn">GERAR COTAÇÃO</button>
                </div>
              </div>
            )) : (
              <div className="empty-health">
                <Boxes size={32} />
                <p>Nenhum item abaixo do estoque mínimo de segurança.</p>
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
              <div className="text-center py-4 text-xs font-bold text-slate-400">Nenhuma movimentação recente</div>
            )}
            {recentMovements.map((act, i) => (
              <div key={i} className="activity-item-tauze">
                <div className={`act-icon-wrapper ${act.type === 'in' ? 'fuel' : 'maint'}`}>
                  {act.type === 'in' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                </div>
                <div className="act-content">
                  <div className="act-main-row">
                    <span className="act-title">{act.title}</span>
                    <span className="act-value" style={{ color: act.type === 'in' ? '#10b981' : '#ef4444' }}>
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

      <style>{`
        .inventory-hub { padding: 24px; }
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
