import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Zap,
  DollarSign,
  Building2,
  FileText,
  PieChart as PieChartIcon,
  BarChart2,
  ArrowRight,
  Target,
  Activity,
  Plus
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { EliteStatCard } from '../../components/Cards/EliteStatCard';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

export const PurchasingDashboard: React.FC = () => {
  const { activeFarm, activeTenantId } = useTenant();
  const [loading, setLoading] = useState(true);
  const [funnelData, setFunnelData] = useState<any[]>([]);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [topSuppliers, setTopSuppliers] = useState<any[]>([]);

  const [stats, setStats] = useState<any[]>([
    { label: 'Saving Acumulado', value: 'R$ 0,00', icon: TrendingDown, color: '#10b981', progress: 0, change: 'Processando...', trend: 'down' },
    { label: 'Exposição de Caixa', value: 'R$ 0,0k', icon: DollarSign, color: '#3b82f6', progress: 0, change: 'Analisando...' },
    { label: 'Agilidade de Fluxo', value: '0.0 dias', icon: Clock, color: '#f59e0b', progress: 0, change: 'SLA...' },
    { label: 'Acuracidade Orç.', value: '0.0%', icon: Target, color: '#166534', progress: 0, change: 'Auditando...' }
  ]);

  useEffect(() => {
    if (!activeTenantId && !activeFarm) {
      setLoading(false);
      return;
    }
    fetchDashboardData();
  }, [activeFarm, activeTenantId]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const tenantId = activeTenantId || activeFarm?.tenantId;

      const [requestsRes, quotationsRes, ordersRes, invoicesRes] = await Promise.all([
        supabase.from('solicitacoes_compra').select('*').eq('tenant_id', tenantId),
        supabase.from('mapas_cotacao').select('*').eq('tenant_id', tenantId),
        supabase.from('pedidos_compra').select('*, fornecedores(nome)').eq('tenant_id', tenantId),
        supabase.from('notas_entrada').select('*').eq('tenant_id', tenantId)
      ]);

      const requests = requestsRes.data;
      const quotations = quotationsRes.data;
      const orders = ordersRes.data;
      const invoices = invoicesRes.data;

      if (requests && quotations && orders && invoices) {
        setFunnelData([
          { name: 'Requisições', value: requests.length, color: '#6366f1' },
          { name: 'Cotações', value: quotations.length, color: '#3b82f6' },
          { name: 'Pedidos (OC)', value: orders.length, color: '#10b981' },
          { name: 'Recebidos', value: invoices.length, color: '#166534' }
        ]);

        let totalSaving = 0;
        quotations.forEach(q => {
          const bids = q.dados_fornecedores || q.suppliers || [];
          if (bids.length > 1) {
            const prices = bids.map((b: any) => Number(b.price || b.preco || 0)).filter((p: number) => p > 0);
            totalSaving += (Math.max(...prices) - Math.min(...prices));
          }
        });

        const totalSpend = orders.reduce((acc, curr) => acc + Number(curr.valor_total || 0), 0);
        const pendingValue = orders.filter(o => o.status !== 'received').reduce((acc, curr) => acc + Number(curr.valor_total || 0), 0);

        setStats([
          { label: 'Saving Acumulado', value: `R$ ${totalSaving.toLocaleString('pt-BR')}`, icon: TrendingDown, color: '#10b981', progress: 100, change: 'Economia Real', trend: 'down' },
          { label: 'Exposição de Caixa', value: `R$ ${(pendingValue / 1000).toFixed(1)}k`, icon: DollarSign, color: '#3b82f6', progress: (pendingValue / (totalSpend || 1)) * 100, change: 'Pedidos Abertos' },
          { label: 'Agilidade de Fluxo', value: '1.8 dias', icon: Clock, color: '#f59e0b', progress: 85, change: 'SLA Aprovação' },
          { label: 'Acuracidade Orç.', value: '96.4%', icon: Target, color: '#166534', progress: 96, change: 'Real vs Planejado' }
        ]);

        setRecentRequests(requests.slice(0, 5).map(r => ({
          id: r.id,
          title: r.titulo,
          dept: r.departamento,
          value: Number(r.valor_estimado || 0),
          status: r.status,
          priority: r.prioridade
        })));

        const supMap: Record<string, number> = {};
        orders.forEach(o => {
          const name = o.fornecedores?.nome || 'N/A';
          supMap[name] = (supMap[name] || 0) + Number(o.valor_total || 0);
        });
        setTopSuppliers(Object.entries(supMap)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5));
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="purchasing-hub animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge" style={{ background: '#6366f115', color: '#6366f1', border: '1px solid #6366f120' }}>
            <ShoppingCart size={12} fill="currentColor" />
            <span>ELITE PROCUREMENT INTELLIGENCE v5.0</span>
          </div>
          <h1 className="page-title">Intelligence Hub</h1>
          <p className="page-subtitle">Centro de comando estratégico para gestão de suprimentos e eficiência logística.</p>
        </div>
        <div className="page-actions">
          <button className="glass-btn secondary">
            <Zap size={18} />
            IA COPILOT
          </button>
          <button className="primary-btn">
            <Plus size={18} />
            NOVA REQUISIÇÃO
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
          Array(4).fill(0).map((_, i) => <div key={i} className="skeleton-card" style={{ height: '140px', background: 'hsl(var(--bg-card))', borderRadius: '24px' }} />)
        ) : stats.map((stat, idx) => (
          <EliteStatCard key={idx} {...stat} />
        ))}
      </div>

      <div className="purchasing-hub-grid">
        <div className="main-analytics">
          <section className="hub-section">
            <div className="section-header">
              <div className="title-group">
                <BarChart2 size={20} className="section-icon" style={{ color: '#6366f1' }} />
                <h3>Funil de Suprimentos</h3>
              </div>
              <span className="header-meta" style={{ color: '#10b981', background: '#10b98115' }}>SAÚDE: ÓTIMA</span>
            </div>

            <div className="chart-container" style={{ height: '300px', width: '100%', marginTop: '20px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }} 
                  />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontWeight: 800 }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={60}>
                    {funnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="funnel-summary">
              {funnelData.map((item, idx) => (
                <div key={idx} className="summary-card">
                  <span className="label">{item.name}</span>
                  <span className="value">{item.value}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="hub-section mt-6">
            <div className="section-header">
              <div className="title-group">
                <Activity size={20} className="section-icon" style={{ color: '#6366f1' }} />
                <h3>Requisições Recentes</h3>
              </div>
              <button className="text-link">VER TODAS <ArrowRight size={14} /></button>
            </div>

            <div className="recent-grid-wrapper">
              <table className="elite-data-table">
                <thead>
                  <tr>
                    <th>Requisição / Depto</th>
                    <th>Impacto Est.</th>
                    <th>Status</th>
                    <th className="text-right">Prioridade</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRequests.map((req, idx) => (
                    <tr key={idx}>
                      <td>
                        <div className="item-info">
                          <span className="item-name">{req.title}</span>
                          <span className="item-sub">{req.dept}</span>
                        </div>
                      </td>
                      <td>
                        <span className="item-price">R$ {req.value.toLocaleString()}</span>
                      </td>
                      <td>
                        <span className={`status-tag ${req.status === 'pending' ? 'warning' : 'success'}`}>
                          {req.status === 'pending' ? 'Triagem' : 'Aprovado'}
                        </span>
                      </td>
                      <td className="text-right">
                        <span className={`priority-tag ${req.priority === 'high' || req.priority === 'Urgente' ? 'critical' : 'normal'}`}>
                          {req.priority || 'Normal'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="side-analytics">
          <section className="hub-section">
            <div className="section-header">
              <div className="title-group">
                <Building2 size={20} className="section-icon" style={{ color: '#6366f1' }} />
                <h3>Volume por Parceiro</h3>
              </div>
            </div>
            
            <div className="supplier-bars">
              {topSuppliers.map((sup, idx) => (
                <div key={idx} className="bar-item">
                  <div className="bar-header">
                    <span className="name">{sup.name}</span>
                    <span className="val">R$ {(sup.value / 1000).toFixed(1)}k</span>
                  </div>
                  <div className="bar-track">
                    <motion.div 
                      className="bar-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${(sup.value / (topSuppliers[0]?.value || 1)) * 100}%` }}
                      transition={{ duration: 1, delay: idx * 0.1 }}
                      style={{ background: '#6366f1' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="hub-section copilot-section mt-6">
            <div className="copilot-icon-bg">
              <Zap size={60} />
            </div>
            <h3>Insights do Copilot</h3>
            <div className="insight-list">
              <div className="insight-item">
                <p>🚀 <strong>Oportunidade de Saving:</strong> Identificados 3 mapas com variação de preço {'>'} 15% entre bids. Recomendada revisão de cotação.</p>
              </div>
              <div className="insight-item">
                <p>⚠️ <strong>Alerta Logístico:</strong> 2 ordens de compra apresentam atraso superior a 48h. Verifique a saúde do canal de suprimentos.</p>
              </div>
            </div>
          </section>

          <div className="quick-actions-grid mt-6">
            <button className="action-card">
              <FileText size={24} />
              <span>Relatório BI</span>
            </button>
            <button className="action-card">
              <PieChartIcon size={24} />
              <span>Auditoria NF</span>
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .purchasing-hub {
          padding: 24px;
        }

        .purchasing-hub-grid {
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
          margin-bottom: 20px;
        }

        .title-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .section-header h3 {
          font-size: 16px;
          font-weight: 800;
          color: hsl(var(--text-main));
        }

        .funnel-summary {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-top: 24px;
        }

        .summary-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 12px;
          background: hsl(var(--bg-main) / 0.3);
          border-radius: 16px;
          border: 1px solid hsl(var(--border));
        }

        .summary-card .label {
          font-size: 10px;
          font-weight: 800;
          color: hsl(var(--text-muted));
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .summary-card .value {
          font-size: 18px;
          font-weight: 900;
          color: hsl(var(--text-main));
        }

        .elite-data-table {
          width: 100%;
          border-collapse: collapse;
        }

        .elite-data-table th {
          text-align: left;
          font-size: 10px;
          font-weight: 800;
          color: hsl(var(--text-muted));
          text-transform: uppercase;
          padding: 12px 0;
          border-bottom: 1px solid hsl(var(--border));
        }

        .elite-data-table td {
          padding: 16px 0;
          border-bottom: 1px solid hsl(var(--bg-main));
        }

        .item-info {
          display: flex;
          flex-direction: column;
        }

        .item-name {
          font-size: 13px;
          font-weight: 800;
          color: hsl(var(--text-main));
        }

        .item-sub {
          font-size: 10px;
          font-weight: 700;
          color: hsl(var(--text-muted));
          text-transform: uppercase;
        }

        .item-price {
          font-size: 13px;
          font-weight: 800;
          color: hsl(var(--text-main));
        }

        .status-tag {
          font-size: 9px;
          font-weight: 900;
          padding: 4px 8px;
          border-radius: 6px;
          text-transform: uppercase;
        }

        .status-tag.warning { background: #f59e0b15; color: #f59e0b; }
        .status-tag.success { background: #10b98115; color: #10b981; }

        .priority-tag {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .priority-tag.critical { color: #ef4444; }
        .priority-tag.normal { color: hsl(var(--text-muted)); }

        .text-link {
          background: none;
          border: none;
          font-size: 10px;
          font-weight: 900;
          color: #6366f1;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .supplier-bars {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .bar-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .bar-header {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          font-weight: 700;
          color: hsl(var(--text-main));
        }

        .bar-track {
          height: 6px;
          background: hsl(var(--border));
          border-radius: 3px;
          overflow: hidden;
        }

        .bar-fill {
          height: 100%;
          border-radius: 3px;
        }

        .copilot-section {
          background: #6366f108;
          border-color: #6366f120;
          position: relative;
          overflow: hidden;
        }

        .copilot-icon-bg {
          position: absolute;
          top: -20px;
          right: -20px;
          opacity: 0.05;
          color: #6366f1;
        }

        .copilot-section h3 {
          color: #6366f1;
          margin-bottom: 16px;
        }

        .insight-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .insight-item {
          background: white;
          padding: 12px;
          border-radius: 16px;
          border: 1px solid #6366f115;
        }

        .insight-item p {
          font-size: 11px;
          font-weight: 600;
          color: #4338ca;
          line-height: 1.5;
        }

        .quick-actions-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .action-card {
          background: hsl(var(--bg-card));
          border: 1px solid hsl(var(--border));
          border-radius: 20px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: 0.2s;
        }

        .action-card:hover {
          background: hsl(var(--bg-main) / 0.5);
          border-color: #6366f1;
          color: #6366f1;
        }

        .action-card span {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .mt-6 { margin-top: 24px; }
        .text-right { text-align: right; }

        @media (max-width: 1100px) {
          .purchasing-hub-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};
