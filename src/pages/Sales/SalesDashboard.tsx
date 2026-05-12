import React, { useState, useEffect } from 'react';
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
  Plus
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { EliteStatCard } from '../../components/Cards/EliteStatCard';
import { KPISkeleton } from '../../components/Feedback/Skeleton';

export const SalesDashboard: React.FC = () => {
  const { activeFarm } = useTenant();
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  const [stats, setStats] = useState<any[]>([
    { label: 'Faturamento Bruto', value: 'R$ 0,00', icon: DollarSign, color: '#10b981', progress: 0, change: 'Processando...', trend: 'up', periodLabel: '...' },
    { label: 'Pipeline Ativo', value: 'R$ 0,00', icon: Target, color: '#3b82f6', progress: 0, change: 'Analisando...', periodLabel: '...' },
    { label: 'Carteira de Clientes', value: '0', icon: Users, color: '#8b5cf6', progress: 0, change: 'Ativos: 0', periodLabel: '...' },
    { label: 'Margem Operacional', value: '0.0%', icon: TrendingUp, color: '#f59e0b', progress: 0, change: '...', trend: 'up', periodLabel: '...' }
  ]);

  useEffect(() => {
    if (!activeFarm) return;
    fetchDashboardData();
  }, [activeFarm]);

  const fetchDashboardData = async () => {
    if (!activeFarm?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // Simplified queries to avoid 400 Bad Request on missing columns
      const [ordersRes, clientsRes] = await Promise.all([
        supabase.from('pedidos_venda').select('*').eq('fazenda_id', activeFarm?.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('clientes').select('*').eq('tenant_id', activeFarm?.tenantId)
      ]);

      const allOrdersRes = await supabase.from('pedidos_venda').select('*').eq('fazenda_id', activeFarm?.id);
      
      if (allOrdersRes.data) {
        const totalRevenue = allOrdersRes.data.reduce((acc, curr) => acc + Number(curr.valor_total || 0), 0);
        const pendingValue = allOrdersRes.data.filter(o => o.status === 'pending' || o.status === 'OPEN').reduce((acc, curr) => acc + Number(curr.valor_total || 0), 0);
        
        setStats([
          { 
            label: 'Faturamento Bruto', 
            value: totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 
            icon: DollarSign, 
            color: '#10b981', 
            progress: 100,
            change: '+12.4%',
            trend: 'up',
            periodLabel: 'Acumulado Safra'
          },
          { 
            label: 'Pipeline Ativo', 
            value: pendingValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 
            icon: Target, 
            color: '#3b82f6', 
            progress: (pendingValue / (totalRevenue || 1)) * 100,
            change: 'Ordens em Aberto',
            periodLabel: 'Volume a Faturar'
          },
          { 
            label: 'Carteira de Clientes', 
            value: clientsRes.data?.length || 0, 
            icon: Users, 
            color: '#8b5cf6', 
            progress: 85,
            change: 'Ativos: ' + (clientsRes.data?.filter(c => String(c.status || '').toUpperCase() === 'ATIVO').length || 0),
            periodLabel: 'Base CRM'
          },
          { 
            label: 'Margem Operacional', 
            value: '28.4%', 
            icon: TrendingUp, 
            color: '#f59e0b', 
            progress: 56.8,
            change: '+2.1%',
            trend: 'up',
            periodLabel: 'vs Safra Anterior'
          }
        ]);
      }

      if (ordersRes.data) {
        // Enforce client names since we removed the join for stability
        const enrichedOrders = ordersRes.data.map(order => {
          const client = clientsRes.data?.find(c => c.id === order.cliente_id);
          return {
            ...order,
            client_name: client?.nome || 'Cliente N/A'
          };
        });
        setRecentOrders(enrichedOrders);
      }
    } catch (error) {
      console.error('Error fetching sales dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sales-intelligence-hub animate-slide-up">
      <header className="hub-header">
        <div className="hub-brand">
          <div className="hub-badge">
            <Zap size={14} fill="currentColor" />
            <span>SALES INTELLIGENCE v5.0</span>
          </div>
          <h1 className="hub-title">Hub de Inteligência Comercial</h1>
          <p className="hub-subtitle">Visão executiva da performance de vendas, saúde da carteira e auditoria de margens.</p>
        </div>
        <div className="hub-actions">
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
        ) : (
          stats.map((stat, idx) => (
            <EliteStatCard 
              key={idx}
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
              color={stat.color}
              progress={stat.progress}
              change={stat.change}
              trend={stat.trend}
              periodLabel={stat.periodLabel}
            />
          ))
        )}
      </div>

      <div className="intelligence-grid">
        <section className="intelligence-card main-chart-area">
          <div className="card-header">
            <div className="header-info">
              <Activity size={18} className="text-brand" />
              <h3>Funil de Vendas & Conversão</h3>
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
                  <span className="step-value">R$ 1.2M</span>
                </div>
              </div>
              <div className="funnel-step order">
                <div className="step-bar" style={{ height: '75%' }}>
                  <span className="step-label">PEDIDOS</span>
                  <span className="step-value">R$ 850K</span>
                </div>
              </div>
              <div className="funnel-step delivered">
                <div className="step-bar" style={{ height: '52%' }}>
                  <span className="step-label">FATURADO</span>
                  <span className="step-value">R$ 620K</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="intelligence-card copilot-card">
          <div className="card-header">
            <div className="header-info">
              <Zap size={18} className="text-amber-500" />
              <h3>Elite Copilot: Insights de Vendas</h3>
            </div>
          </div>
          <div className="copilot-content">
            <div className="insight-item warning">
              <AlertTriangle size={16} />
              <div className="insight-text">
                <strong>Risco de Churn Elevado:</strong> 12 clientes não realizam pedidos há mais de 60 dias. Recomendado campanha de reativação.
              </div>
            </div>
            <div className="insight-item success">
              <TrendingUp size={16} />
              <div className="insight-text">
                <strong>Oportunidade de Margem:</strong> Preço do boi gordo em alta (+4%). Ótimo momento para fixação de contratos futuros.
              </div>
            </div>
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
            <div className="dist-item">
              <div className="dist-info">
                <span>VIP / Ouro</span>
                <span>45%</span>
              </div>
              <div className="dist-bar-bg">
                <div className="dist-bar-fill" style={{ width: '45%', background: '#8b5cf6' }} />
              </div>
            </div>
            <div className="dist-item">
              <div className="dist-info">
                <span>Recorrente / Prata</span>
                <span>38%</span>
              </div>
              <div className="dist-bar-bg">
                <div className="dist-bar-fill" style={{ width: '38%', background: '#3b82f6' }} />
              </div>
            </div>
            <div className="dist-item">
              <div className="dist-info">
                <span>Leads / Novos</span>
                <span>17%</span>
              </div>
              <div className="dist-bar-bg">
                <div className="dist-bar-fill" style={{ width: '17%', background: '#10b981' }} />
              </div>
            </div>
          </div>
        </section>
      </div>

      <style>{`
        .sales-intelligence-hub { padding: 24px; display: flex; flex-direction: column; gap: 24px; }
        .hub-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
        .hub-brand .hub-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; background: hsl(var(--brand) / 0.1); color: hsl(var(--brand)); border-radius: 100px; font-size: 10px; font-weight: 800; letter-spacing: 0.05em; margin-bottom: 12px; border: 1px solid hsl(var(--brand) / 0.2); }
        .hub-title { font-size: 28px; font-weight: 900; color: hsl(var(--text-main)); letter-spacing: -0.02em; }
        .hub-subtitle { color: hsl(var(--text-muted)); font-size: 14px; font-weight: 500; }
        .hub-actions { display: flex; gap: 12px; }
        .intelligence-grid { display: grid; grid-template-columns: 2fr 1fr; grid-template-rows: auto auto; gap: 24px; }
        .intelligence-card { background: white; border-radius: 24px; border: 1px solid hsl(var(--border)); padding: 24px; box-shadow: var(--shadow-sm); transition: 0.3s; }
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
        .copilot-card { background: linear-gradient(145deg, #ffffff, #f8fafc); border: 1px solid #e2e8f0; }
        .copilot-content { display: flex; flex-direction: column; gap: 16px; }
        .insight-item { display: flex; gap: 12px; padding: 12px; border-radius: 12px; font-size: 13px; }
        .insight-item.warning { background: #fffbeb; color: #92400e; border: 1px solid #fef3c7; }
        .insight-item.success { background: #ecfdf5; color: #065f46; border: 1px solid #d1fae5; }
        .insight-item.info { background: #eff6ff; color: #1e40af; border: 1px solid #dbeafe; }
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
        .dist-info { display: flex; justify-content: space-between; font-size: 13px; font-weight: 800; margin-bottom: 8px; }
        .dist-bar-bg { height: 8px; background: hsl(var(--bg-main)); border-radius: 100px; overflow: hidden; }
        .dist-bar-fill { height: 100%; border-radius: 100px; transition: 1s cubic-bezier(0.4, 0, 0.2, 1); }
        @media (max-width: 1200px) { .intelligence-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
};
