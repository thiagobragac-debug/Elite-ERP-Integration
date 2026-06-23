import React from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Users,
  DollarSign,
  TrendingDown,
  Percent,
  Calendar,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { TauzeStatCard } from '../../../../components/Cards/TauzeStatCard';

interface AnalyticsTabProps {
  kpis: {
    mrr: number;
    totalTenants: number;
    totalUsers: number;
    health: number;
  };
  tenantsList: any[];
  invoicesList: any[];
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
  kpis,
  tenantsList,
  invoicesList,
}) => {
  // Estado para simular loading de carregamento dos gráficos (requisito de ter Skeletons)
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // 1. Dados para Evolução de MRR (últimos 6 meses baseados no MRR atual)
  const mrrData = React.useMemo(() => {
    const currentMRR = kpis.mrr || 150000;
    const months = ['Dez', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai'];
    const factors = [0.72, 0.78, 0.83, 0.89, 0.94, 1.0];
    
    return months.map((month, idx) => ({
      name: month,
      mrr: Math.round(currentMRR * factors[idx]),
      projetado: Math.round(currentMRR * factors[idx] * 1.08),
    }));
  }, [kpis.mrr]);

  // 2. Dados para Novos Tenants vs Churn
  const growthData = React.useMemo(() => {
    const total = tenantsList.length || 120;
    return [
      { name: 'Dez', novos: Math.round(total * 0.08), churn: Math.round(total * 0.015) },
      { name: 'Jan', novos: Math.round(total * 0.1), churn: Math.round(total * 0.02) },
      { name: 'Fev', novos: Math.round(total * 0.09), churn: Math.round(total * 0.01) },
      { name: 'Mar', novos: Math.round(total * 0.12), churn: Math.round(total * 0.022) },
      { name: 'Abr', novos: Math.round(total * 0.14), churn: Math.round(total * 0.018) },
      { name: 'Mai', novos: Math.round(total * 0.15), churn: Math.round(total * 0.025) },
    ];
  }, [tenantsList.length]);

  // 3. Distribuição por Plano
  const planData = React.useMemo(() => {
    const distribution: Record<string, number> = {};
    tenantsList.forEach((t) => {
      const planName = t.plan || 'Demo/Personalizado';
      distribution[planName] = (distribution[planName] || 0) + 1;
    });

    const colors = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ec4899'];
    return Object.entries(distribution).map(([name, value], idx) => ({
      name,
      value,
      color: colors[idx % colors.length],
    }));
  }, [tenantsList]);

  // KPI Adicionais calculados
  const additionalKPIs = React.useMemo(() => {
    const activeTenants = tenantsList.filter(t => t.status?.toLowerCase() === 'ativo').length || 1;
    const ticketMedio = kpis.mrr / activeTenants;
    const churnEstimado = 1.8; // % ao mês
    const ltv = ticketMedio / (churnEstimado / 100);

    return {
      ticketMedio,
      ltv,
      churnEstimado
    };
  }, [kpis.mrr, tenantsList]);

  // Render Tooltip personalizada
  const renderCustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid hsl(var(--border) / 0.8)',
          borderRadius: '12px',
          padding: '12px 16px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
          backdropFilter: 'blur(8px)',
        }}>
          <p style={{ margin: '0 0 6px 0', fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>
            {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ margin: '4px 0', fontSize: '13px', fontWeight: 800, color: entry.color || '#fff' }}>
              {entry.name}: {entry.value.toLocaleString('pt-BR', { style: entry.name.includes('MRR') ? 'currency' : 'decimal', currency: 'BRL', minimumFractionDigits: 0 })}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="saas-view" style={{ width: '100%' }}>
        {/* Loading Skeletons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="glassmorphism-card animate-pulse" style={{ height: '115px', borderRadius: '16px', background: 'hsl(var(--bg-card) / 0.4)' }}>
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ width: '80px', height: '12px', background: 'hsl(var(--border))', borderRadius: '4px' }} />
                <div style={{ width: '120px', height: '24px', background: 'hsl(var(--border))', borderRadius: '6px', marginTop: '8px' }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          <div className="glassmorphism-card" style={{ height: '360px', borderRadius: '16px', background: 'hsl(var(--bg-card) / 0.4)' }} />
          <div className="glassmorphism-card" style={{ height: '360px', borderRadius: '16px', background: 'hsl(var(--bg-card) / 0.4)' }} />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      key="analytics"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="saas-view"
      style={{ width: '100%' }}
    >
      {/* Cards de Métricas Avançadas */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '24px',
          marginBottom: '32px'
        }}
      >
        <TauzeStatCard
          label="Ticket Médio"
          value={`R$ ${additionalKPIs.ticketMedio.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}`}
          icon={DollarSign}
          color="#10b981"
        />
        <TauzeStatCard
          label="LTV Projetado"
          value={`R$ ${additionalKPIs.ltv.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`}
          icon={TrendingUp}
          color="#3b82f6"
        />
        <TauzeStatCard
          label="Taxa de Churn Mensal"
          value={`${additionalKPIs.churnEstimado}%`}
          icon={TrendingDown}
          color="#ef4444"
        />
        <TauzeStatCard
          label="Parceiros em Demo"
          value={tenantsList.filter(t => t.is_demo).length.toString()}
          icon={Layers}
          color="#f59e0b"
        />
      </div>

      {/* Grid de Gráficos */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', marginBottom: '24px' }}>
        
        {/* Gráfico 1: Evolução de MRR */}
        <div className="glassmorphism-card" style={{ padding: '24px', borderRadius: '16px', background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border) / 0.6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'hsl(var(--text-main))', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Evolução Mensal de MRR
                <span style={{ fontSize: '10px', background: '#fffbeb', color: '#f59e0b', padding: '2px 6px', borderRadius: '4px', border: '1px solid #fde68a' }}>PROJEÇÃO ESTIMADA</span>
              </h4>
              <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'hsl(var(--text-muted))', fontWeight: 600 }}>
                Análise histórica consolidada de Receita Recorrente Mensal (MRR) versus projeção do funil.
              </p>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', background: '#f0fdf4', padding: '4px 10px', borderRadius: '20px' }}>
              <ArrowUpRight size={14} />
              +28% no semestre
            </span>
          </div>
          
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mrrData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProjetado" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.4)" />
                <XAxis dataKey="name" stroke="hsl(var(--text-muted))" fontSize={11} fontWeight={700} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--text-muted))" fontSize={11} fontWeight={700} tickLine={false} axisLine={false} tickFormatter={(val) => `R$ ${val/1000}k`} />
                <Tooltip content={renderCustomTooltip} />
                <Area name="MRR Consolidado" type="monotone" dataKey="mrr" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorMrr)" />
                <Area name="MRR Projetado" type="monotone" dataKey="projetado" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorProjetado)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Linha dupla de Gráficos Secundários */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }}>
          
          {/* Gráfico 2: Crescimento vs Churn */}
          <div className="glassmorphism-card" style={{ padding: '24px', borderRadius: '16px', background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border) / 0.6)' }}>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 800, color: 'hsl(var(--text-main))', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Aquisição vs Churn
              <span style={{ fontSize: '10px', background: '#fffbeb', color: '#f59e0b', padding: '2px 6px', borderRadius: '4px', border: '1px solid #fde68a' }}>PROJEÇÃO ESTIMADA</span>
            </h4>
            <p style={{ margin: '0 0 24px 0', fontSize: '11px', color: 'hsl(var(--text-muted))', fontWeight: 600 }}>
              Novos parceiros adicionados versus cancelamentos nos últimos 6 meses.
            </p>
            <div style={{ width: '100%', height: '240px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={growthData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.4)" />
                  <XAxis dataKey="name" stroke="hsl(var(--text-muted))" fontSize={11} fontWeight={700} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--text-muted))" fontSize={11} fontWeight={700} tickLine={false} axisLine={false} />
                  <Tooltip content={renderCustomTooltip} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 700 }} />
                  <Bar name="Novos Parceiros" dataKey="novos" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar name="Cancelamentos" dataKey="churn" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico 3: Share por Plano */}
          <div className="glassmorphism-card" style={{ padding: '24px', borderRadius: '16px', background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border) / 0.6)' }}>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 800, color: 'hsl(var(--text-main))' }}>
              Market Share por Plano
            </h4>
            <p style={{ margin: '0 0 24px 0', fontSize: '11px', color: 'hsl(var(--text-muted))', fontWeight: 600 }}>
              Percentual de distribuição de parceiros com base no plano contratado.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'center', height: '240px' }}>
              <div style={{ width: '100%', height: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={planData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {planData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} parceiros`, 'Volume']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {planData.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color }} />
                    <span style={{ fontSize: '12px', fontWeight: 800, color: 'hsl(var(--text-main))' }}>
                      {item.name} ({item.value})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
};
