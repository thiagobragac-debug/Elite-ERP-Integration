import React, { useState, useEffect } from 'react';
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
import { EliteStatCard } from '../../components/Cards/EliteStatCard';
import { KPISkeleton } from '../../components/Feedback/Skeleton';

export const InventoryDashboard: React.FC = () => {
  const { activeFarm } = useTenant();
  const [loading, setLoading] = useState(true);
  const [criticalItems, setCriticalItems] = useState<any[]>([]);
  const [recentMovements, setRecentMovements] = useState<any[]>([]);

  const [stats, setStats] = useState<any[]>([
    { label: 'Patrimônio em Insumos', value: 'R$ 0,00', icon: DollarSign, color: '#10b981', progress: 0, change: 'Calculando...' },
    { label: 'Ruptura de Estoque', value: '0', icon: AlertTriangle, color: '#ef4444', progress: 0, trend: 'stable', change: 'Verificando...' },
    { label: 'Maturidade (30d)', value: '0 itens', icon: FlaskConical, color: '#f59e0b', progress: 0, trend: 'stable', change: 'Auditando...' },
    { label: 'Giro de Estoque', value: '0.0x', icon: Zap, color: '#3b82f6', progress: 0, trend: 'stable', change: 'Sincronizando...' }
  ]);

  useEffect(() => {
    if (!activeFarm) return;
    fetchDashboardData();
  }, [activeFarm]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Products for Stock Analysis
      const { data: products } = await supabase
        .from('produtos')
        .select('*')
        .eq('fazenda_id', activeFarm.id);

      // 2. Fetch Warehouses for Saturation
      const { data: warehouses } = await supabase
        .from('depositos')
        .select('*, movimentacoes_estoque(quantidade, tipo)')
        .eq('fazenda_id', activeFarm.id);

      // 3. Fetch Recent Movements
      const { data: movements } = await supabase
        .from('movimentacoes_estoque')
        .select('*, produtos(nome, unidade)')
        .eq('fazenda_id', activeFarm.id)
        .order('created_at', { ascending: false })
        .limit(6);

      if (products) {
        const totalValue = products.reduce((acc, p) => acc + (Number(p.estoque_atual || 0) * Number(p.custo_medio || 0)), 0);
        const criticalCount = products.filter(p => Number(p.estoque_atual || 0) < Number(p.estoque_minimo)).length;
        
        // Mocking rotation based on volume
        const turnover = 1.4; 

        setStats([
          { 
            label: 'Patrimônio em Insumos', 
            value: `R$ ${totalValue.toLocaleString('pt-BR')}`, 
            icon: DollarSign, 
            color: '#10b981', 
            progress: 85,
            change: 'Capital Imobilizado',
            sparkline: [{ value: 1.2 }, { value: 1.5 }, { value: 1.3 }, { value: 1.6 }]
          },
          { 
            label: 'Ruptura de Estoque', 
            value: criticalCount, 
            icon: AlertTriangle, 
            color: '#ef4444', 
            progress: products.length > 0 ? (criticalCount / products.length) * 100 : 0,
            trend: 'down',
            change: 'Itens p/ Reposição',
            sparkline: [{ value: 10 }, { value: 5 }, { value: 8 }, { value: criticalCount }]
          },
          { 
            label: 'Maturidade (30d)', 
            value: '4 itens', 
            icon: FlaskConical, 
            color: '#f59e0b', 
            progress: 32,
            trend: 'stable',
            change: 'Risco de Perda',
            sparkline: [{ value: 2 }, { value: 5 }, { value: 4 }]
          },
          { 
            label: 'Giro de Estoque', 
            value: `${turnover}x`, 
            icon: Zap, 
            color: '#3b82f6', 
            progress: 45,
            trend: 'up',
            change: 'Eficiência Logística',
            sparkline: [{ value: 1.1 }, { value: 1.2 }, { value: 1.4 }]
          },
        ]);

        setCriticalItems(products
          .filter(p => Number(p.estoque_atual || 0) < Number(p.estoque_minimo))
          .slice(0, 4)
        );
      }

      if (movements) {
        setRecentMovements(movements.map(m => ({
          type: m.tipo,
          date: m.data_movimentacao,
          title: m.produtos?.nome || 'Item',
          subtitle: `${m.quantidade} ${m.produtos?.unidade || ''} • ${m.responsavel}`,
          value: m.tipo === 'in' ? 'Entrada' : 'Saída'
        })));
      }

    } catch (err) {
      console.error(err);
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

        @media (max-width: 1400px) {
          .next-gen-kpi-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }

        @media (max-width: 768px) {
          .next-gen-kpi-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div className="next-gen-kpi-grid">
        {loading ? (
          Array(4).fill(0).map((_, i) => <KPISkeleton key={i} />)
        ) : stats.map((stat, idx) => (
          <EliteStatCard 
            key={idx}
            {...stat}
          />
        ))}
      </div>

      <div className="inventory-hub-grid">
        {/* Left: Critical Replenishment */}
        <section className="hub-section main-panel">
          <div className="section-header">
            <div className="title-group">
              <AlertTriangle size={20} className="section-icon" />
              <h3>Itens para Reposição Urgente</h3>
            </div>
            <span className="header-meta">Ruptura Detectada</span>
          </div>

          <div className="critical-assets-grid">
            {criticalItems.length > 0 ? criticalItems.map(item => (
              <div key={item.id} className="asset-health-card">
                <div className="asset-header">
                  <div className="asset-icon" style={{ background: '#ef444415', color: '#ef4444' }}>
                    <Package size={24} />
                  </div>
                  <div className="asset-name-group">
                    <h4>{item.nome}</h4>
                    <span>{item.categoria}</span>
                  </div>
                </div>
                
                <div className="health-status-bar">
                  <div className="bar-label">
                    <span>Estoque Mínimo: {item.estoque_minimo} {item.unidade}</span>
                    <span className="urgent">Crítico</span>
                  </div>
                  <div className="bar-progress-bg">
                    {(() => {
                      const current = Number(item.estoque_atual || 0);
                      const min = Number(item.estoque_minimo || 1);
                      const progress = Math.min((current / min) * 100, 100);
                      return (
                        <motion.div 
                          className="bar-progress-fill" 
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          style={{ backgroundColor: '#ef4444' }}
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
            {recentMovements.map((act, i) => (
              <div key={i} className="activity-item-elite">
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
        .inventory-hub {
          padding: 24px;
        }

        .inventory-hub-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
          margin-top: 24px;
        }

        .hub-section {
          background: hsl(var(--bg-card));
          border-radius: 24px;
          border: 1px solid hsl(var(--border));
          padding: 24px;
          box-shadow: var(--shadow-sm);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .title-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .section-icon {
          color: hsl(var(--brand));
        }

        .section-header h3 {
          font-size: 18px;
          font-weight: 800;
          color: hsl(var(--text-main));
          letter-spacing: -0.02em;
        }

        .header-meta {
          font-size: 10px;
          font-weight: 800;
          color: #ef4444;
          background: #ef444415;
          padding: 4px 10px;
          border-radius: 8px;
          text-transform: uppercase;
        }

        .critical-assets-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
        }

        .asset-health-card {
          background: hsl(var(--bg-main) / 0.3);
          border-radius: 20px;
          border: 1px solid hsl(var(--border));
          padding: 20px;
          transition: 0.2s;
        }

        .asset-health-card:hover {
          border-color: #ef444444;
          transform: translateY(-4px);
        }

        .asset-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 20px;
        }

        .asset-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .asset-name-group h4 {
          font-size: 15px;
          font-weight: 800;
          color: hsl(var(--text-main));
          margin: 0;
        }

        .asset-name-group span {
          font-size: 11px;
          color: hsl(var(--text-muted));
          font-weight: 600;
          text-transform: uppercase;
        }

        .health-status-bar {
          margin-bottom: 16px;
        }

        .bar-label {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          font-weight: 800;
          margin-bottom: 8px;
          text-transform: uppercase;
        }

        .urgent {
          color: #ef4444;
        }

        .bar-progress-bg {
          height: 8px;
          background: hsl(var(--border));
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .bar-progress-fill {
          height: 100%;
          border-radius: 4px;
        }

        .bar-footer {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          font-weight: 700;
          color: hsl(var(--text-muted));
        }

        .remaining-text {
          color: #ef4444;
        }

        .asset-card-actions {
          display: flex;
          gap: 12px;
        }

        .asset-btn {
          flex: 1;
          padding: 10px;
          border-radius: 10px;
          border: none;
          background: hsl(var(--brand) / 0.1);
          color: hsl(var(--brand));
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
          transition: 0.2s;
        }

        .asset-btn:hover {
          background: hsl(var(--brand));
          color: white;
        }

        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .activity-item-elite {
          display: flex;
          gap: 16px;
          padding-bottom: 16px;
          border-bottom: 1px solid hsl(var(--border));
        }

        .activity-item-elite:last-child {
          border-bottom: none;
        }

        .act-icon-wrapper {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .act-icon-wrapper.fuel {
          background: #10b98115;
          color: #10b981;
        }

        .act-icon-wrapper.maint {
          background: #ef444415;
          color: #ef4444;
        }

        .act-content {
          flex: 1;
        }

        .act-main-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 2px;
        }

        .act-title {
          font-size: 13px;
          font-weight: 800;
          color: hsl(var(--text-main));
        }

        .act-value {
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
        }

        .act-meta-row {
          display: flex;
          gap: 8px;
          font-size: 11px;
          color: hsl(var(--text-muted));
          font-weight: 600;
        }

        .view-all-btn {
          width: 100%;
          margin-top: 24px;
          padding: 14px;
          border-radius: 16px;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--bg-main) / 0.5);
          color: hsl(var(--text-main));
          font-size: 12px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: 0.2s;
        }

        .view-all-btn:hover {
          background: hsl(var(--bg-card));
          border-color: hsl(var(--brand));
          color: hsl(var(--brand));
        }

        .empty-health {
          grid-column: span 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px;
          color: hsl(var(--text-muted));
          gap: 16px;
          text-align: center;
        }

        @media (max-width: 1200px) {
          .inventory-hub-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
