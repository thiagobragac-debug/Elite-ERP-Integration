import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Target, 
  ShieldCheck, 
  Brain,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  PieChart,
  BarChart3,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { EliteStatCard } from '../../components/Cards/EliteStatCard';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { useReportData } from '../../hooks/useReportData';
import { 
  ResponsiveContainer, 
  PieChart as RePieChart, 
  Pie, 
  Cell, 
  Tooltip as ReChartsTooltip, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  Legend 
} from 'recharts';

export const FinanceIntelligenceHub: React.FC = () => {
  const { data: insights, stats, healthScore, loading, error, refresh } = useReportData('finance-overview');
  const { activeTenantId, activeFarmId } = useFarmFilter();

  const [dbData, setDbData] = useState({
    balance: 0,
    payable: 0,
    receivable: 0,
    loading: true
  });

  useEffect(() => {
    if (!activeTenantId) return;

    let isMounted = true;
    const fetchData = async () => {
      setDbData(prev => ({ ...prev, loading: true }));
      try {
        const [bankRes, payRes, recRes] = await Promise.all([
          supabase.rpc('get_banking_consolidated_balance', {
            p_tenant_id: activeTenantId,
            p_fazenda_id: activeFarmId || null
          }),
          supabase.from('contas_pagar')
            .select('valor_total')
            .match(activeFarmId ? { fazenda_id: activeFarmId, status: 'PENDENTE' } : { tenant_id: activeTenantId, status: 'PENDENTE' }),
          supabase.from('contas_receber')
            .select('valor_total')
            .match(activeFarmId ? { fazenda_id: activeFarmId, status: 'PENDENTE' } : { tenant_id: activeTenantId, status: 'PENDENTE' })
        ]);

        if (!isMounted) return;

        const totalBalance = bankRes.data?.saldo_total || 0;
        const totalPayable = (payRes.data || []).reduce((acc: number, curr: any) => acc + Number(curr.valor_total), 0) || 0;
        const totalReceivable = (recRes.data || []).reduce((acc: number, curr: any) => acc + Number(curr.valor_total), 0) || 0;

        setDbData({
          balance: totalBalance,
          payable: totalPayable,
          receivable: totalReceivable,
          loading: false
        });
      } catch (err) {
        console.error("[FinanceIntelligence] Error fetching chart metrics:", err);
        if (isMounted) {
          setDbData(prev => ({ ...prev, loading: false }));
        }
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [activeTenantId, activeFarmId]);

  if (error) {
    console.error("[FinanceIntelligence] Hub Error:", error);
  }

  // Mapeamento de ícones para KPIs
  const getStatIcon = (label: string) => {
    if (label.includes('Patrimônio')) return Activity;
    if (label.includes('EBITDA')) return TrendingUp;
    if (label.includes('Runway')) return Zap;
    return ShieldCheck;
  };

  // Mapeamento de ícones para Insights
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return Sparkles;
      case 'warning': return AlertTriangle;
      default: return Brain;
    }
  };

  // Cálculos reativos para o Donut
  const totalAssets = dbData.balance + dbData.receivable;
  const netCapital = Math.max(0, totalAssets - dbData.payable);

  const chartData = [
    { name: 'Saldo em Contas', value: dbData.balance, color: '#10b981' },
    { name: 'A Receber (30d)', value: dbData.receivable, color: '#3b82f6' },
    { name: 'A Pagar (30d)', value: dbData.payable, color: '#ef4444' }
  ];

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  };

  // Cálculos reativos para o Radar de Riscos
  const currentRatio = dbData.payable > 0 ? (dbData.balance + dbData.receivable) / dbData.payable : 9.9;
  const runway = dbData.payable > 0 ? (dbData.balance / (dbData.payable / 3)) : 24;

  const scoreLiquidez = Math.min(100, Math.max(0, Math.round(currentRatio * 30)));
  const scoreAutonomia = Math.min(100, Math.max(0, Math.round(runway * 8)));
  const scoreRentabilidade = Math.min(100, Math.max(0, Math.round(22 * 4))); // target rentabilidade/margem ebitda score, e.g. 88
  const scoreGiro = Math.min(100, Math.max(0, Math.round(dbData.payable > 0 ? (dbData.receivable / dbData.payable) * 50 : 100)));
  const scoreSaude = healthScore || 0;

  const radarData = [
    { subject: 'Liquidez Imediata', A: scoreLiquidez, fullMark: 100 },
    { subject: 'Autonomia (Runway)', A: scoreAutonomia, fullMark: 100 },
    { subject: 'Rentabilidade', A: scoreRentabilidade, fullMark: 100 },
    { subject: 'Giro de Caixa', A: scoreGiro, fullMark: 100 },
    { subject: 'Saúde Operacional', A: scoreSaude, fullMark: 100 },
  ];

  return (
    <div className="intelligence-hub-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge premium">
            <Brain size={14} fill="currentColor" />
            <span>ELITE INTELLIGENCE v5.0</span>
          </div>
          <h1 className="page-title">Intelligence Hub</h1>
          <p className="page-subtitle">Central de comando estratégico com visão preditiva e indicadores de alta fidelidade.</p>
        </div>
        <div className="page-actions">
          <button className="glass-btn secondary" onClick={refresh}>
            <RefreshCw size={18} />
            RECALCULAR
          </button>
          <button className="primary-btn">
            <PieChart size={18} />
            EXPORTAR BOARD
          </button>
        </div>
      </header>

      <div className="next-gen-kpi-grid">
        {loading ? (
          Array(4).fill(0).map((_, i) => <EliteStatCard key={i} loading={true} label="" value="" icon={Activity} color="" />)
        ) : stats?.map((stat: any, idx: number) => (
          <EliteStatCard 
            key={idx}
            {...stat}
            icon={getStatIcon(stat.label)}
          />
        ))}
      </div>

      <div className="intelligence-grid">
        {/* Lado Esquerdo: Insights e Composição */}
        <div className="intelligence-main">

          <div className="hub-sections-row">
            <div className="hub-card glass-card">
              <div className="card-header-hub">
                <div className="h-left">
                  <Activity size={20} className="text-brand" />
                  <h3>Composição de Capital</h3>
                </div>
                <span className="subtitle">Visão 360º de ativos e passivos</span>
              </div>
              
              {dbData.loading ? (
                <div className="flex-center-all" style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 700 }}>
                  <RefreshCw size={24} className="animate-spin text-brand" style={{ marginRight: '8px' }} />
                  Carregando dados financeiros...
                </div>
              ) : (
                <div className="chart-composition-wrapper">
                  <div style={{ width: '100%', height: '240px', position: 'relative' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <ReChartsTooltip
                          formatter={(value: any) => [formatCurrency(Number(value)), 'Valor']}
                          contentStyle={{
                            borderRadius: '16px',
                            border: '1px solid var(--border)',
                            background: 'rgba(255, 255, 255, 0.9)',
                            backdropFilter: 'blur(8px)',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                            fontWeight: 800,
                            fontFamily: 'Outfit, sans-serif',
                            fontSize: '12px'
                          }}
                        />
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius="62%"
                          outerRadius="82%"
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} style={{ outline: 'none' }} />
                          ))}
                        </Pie>
                      </RePieChart>
                    </ResponsiveContainer>
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      textAlign: 'center',
                      pointerEvents: 'none'
                    }}>
                      <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ativo Líquido</span>
                      <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--text-main)', marginTop: '2px', letterSpacing: '-0.02em' }}>
                        {formatCurrency(netCapital)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="comp-legend-list">
                    {chartData.map((item, idx) => {
                      const totalVal = dbData.balance + dbData.receivable + dbData.payable;
                      const percentage = totalVal > 0 ? Math.round((item.value / totalVal) * 100) : 0;
                      return (
                        <div key={idx} className="legend-item">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color }} />
                            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>{item.name}</span>
                            <span style={{ fontSize: '10px', fontWeight: 800, color: item.color, background: `${item.color}15`, padding: '2px 6px', borderRadius: '4px', marginLeft: 'auto' }}>
                              {percentage}%
                            </span>
                          </div>
                          <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)', paddingLeft: '16px' }}>
                            {formatCurrency(item.value)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="hub-card glass-card insights-container">
              <div className="card-header-hub">
                <div className="h-left">
                  <Sparkles size={20} className="text-amber-500" />
                  <h3>Elite Copilot Insights</h3>
                </div>
                <span className="subtitle">Análise preditiva baseada em IA</span>
              </div>
              <div className="insights-list">
                {insights?.map((insight: any) => {
                  const Icon = getInsightIcon(insight.type);
                  return (
                    <motion.div 
                      key={insight.id}
                      className="insight-item"
                      whileHover={{ x: 5 }}
                    >
                      <div className="insight-icon-box" style={{ background: insight.color + '22', color: insight.color }}>
                        <Icon size={18} />
                      </div>
                      <div className="insight-content">
                        <div className="insight-header">
                          <h4>{insight.title}</h4>
                          <span className="impact-badge">{insight.impact}</span>
                        </div>
                        <p>{insight.desc}</p>
                      </div>
                      <ArrowRight size={14} className="text-muted" />
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Lado Direito: Health Score e Radar */}
        <aside className="intelligence-aside">
          <div className="health-score-card glass-card premium">
            <div className="score-viz">
              <svg viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" className="track" />
                <motion.circle 
                  cx="50" cy="50" r="45" 
                  className="fill"
                  strokeDasharray="283"
                  initial={{ strokeDashoffset: 283 }}
                  animate={{ strokeDashoffset: 283 - (283 * (healthScore || 0) / 100) }}
                  transition={{ duration: 2, ease: "easeOut" }}
                />
              </svg>
              <div className="score-value">
                <span className="num">{healthScore}</span>
                <span className="label">HEALTH SCORE</span>
              </div>
            </div>
            <div className="score-footer">
              <div className="status-badge" style={{ background: (healthScore || 0) >= 70 ? '#10b981' : '#f59e0b' }}>
                {(healthScore || 0) >= 70 ? 'SAUDÁVEL' : 'ATENÇÃO'}
              </div>
              <p>Sua unidade apresenta {(healthScore || 0) >= 70 ? 'alta eficiência de capital e baixo risco de liquidez imediata.' : 'alguns pontos de atenção em passivos ou caixa.'}</p>
            </div>
          </div>

          <div className="hub-card glass-card radar-card" style={{ minHeight: 'auto', padding: '24px' }}>
            <div className="card-header-hub" style={{ marginBottom: '16px' }}>
              <div className="h-left">
                <Target size={20} style={{ color: '#8b5cf6' }} />
                <h3>Radar de Saúde & Riscos</h3>
              </div>
              <span className="subtitle">Métricas multidimensionais</span>
            </div>

            {dbData.loading ? (
              <div className="flex-center-all" style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 700 }}>
                <RefreshCw size={24} className="animate-spin text-brand" style={{ marginRight: '8px' }} />
                Analisando dimensões de risco...
              </div>
            ) : (
              <div style={{ width: '100%', height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                    <PolarGrid stroke="rgba(148, 163, 184, 0.15)" />
                    <PolarAngleAxis 
                      dataKey="subject" 
                      tick={{ fill: 'var(--text-muted)', fontSize: 9, fontWeight: 700, fontFamily: 'Outfit, sans-serif' }}
                    />
                    <PolarRadiusAxis 
                      angle={30} 
                      domain={[0, 100]} 
                      tick={false}
                      axisLine={false}
                    />
                    <Radar
                      name="Score"
                      dataKey="A"
                      stroke="#8b5cf6"
                      fill="#8b5cf6"
                      fillOpacity={0.25}
                    />
                    <ReChartsTooltip
                      formatter={(value: any) => [`${value} / 100`, 'Pontuação']}
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid var(--border)',
                        background: 'rgba(255, 255, 255, 0.95)',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                        fontSize: '11px',
                        fontFamily: 'Outfit, sans-serif',
                        fontWeight: 800
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '8px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700 }}>Liquidez</div>
                <div style={{ fontSize: '12px', color: '#10b981', fontWeight: 800, marginTop: '2px' }}>{scoreLiquidez}%</div>
              </div>
              <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border)', paddingLeft: '12px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700 }}>Fôlego</div>
                <div style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 800, marginTop: '2px' }}>{scoreAutonomia}%</div>
              </div>
              <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border)', paddingLeft: '12px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700 }}>Saúde</div>
                <div style={{ fontSize: '12px', color: '#8b5cf6', fontWeight: 800, marginTop: '2px' }}>{scoreSaude}%</div>
              </div>
            </div>
          </div>

          <div className="quick-actions-hub glass-card">
            <h3>Ações Estratégicas</h3>
            <div className="action-btns">
              <button className="hub-action-btn">
                <Layers size={18} />
                <span>Conciliar Bancos</span>
              </button>
              <button className="hub-action-btn">
                <Calendar size={18} />
                <span>Simular Cenários</span>
              </button>
              <button className="hub-action-btn">
                <BarChart3 size={18} />
                <span>Relatório Gerencial</span>
              </button>
            </div>
          </div>
        </aside>
      </div>

      <style>{`
        .intelligence-hub-page { display: flex; flex-direction: column; gap: 24px; padding-bottom: 2rem; }
        .intelligence-grid { display: grid; grid-template-columns: 1fr 380px; gap: 24px; align-items: start; margin-top: 1.5rem; }
        .intelligence-main { display: flex; flex-direction: column; gap: 24px; }
        
        .hub-sections-row { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .hub-card { 
          padding: 24px; 
          min-height: 380px; 
          background: white; 
          border-radius: 1.25rem; 
          border: 1px solid var(--border); 
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
          display: flex;
          flex-direction: column;
        }
        
        .card-header-hub { margin-bottom: 24px; display: flex; flex-direction: column; gap: 4px; }
        .h-left { display: flex; align-items: center; gap: 12px; }
        .h-left h3 { font-size: 1rem; font-weight: 800; color: var(--text-main); margin: 0; letter-spacing: -0.01em; }
        .card-header-hub .subtitle { font-size: 0.75rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }

        .chart-composition-wrapper {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 16px;
          align-items: center;
          flex: 1;
        }

        .comp-legend-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .legend-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .insights-list { display: flex; flex-direction: column; gap: 12px; }
        .insight-item { 
          display: flex; align-items: center; gap: 16px; padding: 14px; 
          background: var(--bg-main); border-radius: 1rem; 
          border: 1px solid transparent; cursor: pointer; transition: 0.2s;
        }
        .insight-item:hover { border-color: var(--border); background: white; transform: translateX(4px); box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .insight-icon-box { width: 36px; height: 36px; border-radius: 0.75rem; background: white; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .insight-content { flex: 1; display: flex; flex-direction: column; gap: 2px; }
        .insight-header { display: flex; align-items: center; gap: 8px; }
        .insight-header h4 { font-size: 0.875rem; font-weight: 800; margin: 0; color: var(--text-main); }
        .impact-badge { font-size: 0.625rem; font-weight: 800; padding: 2px 6px; border-radius: 4px; background: white; color: var(--text-muted); border: 1px solid var(--border); }
        .insight-content p { font-size: 0.75rem; color: var(--text-muted); margin: 0; line-height: 1.5; font-weight: 500; }

        .intelligence-aside { display: flex; flex-direction: column; gap: 24px; }
        .health-score-card { 
          padding: 32px; 
          display: flex; 
          flex-direction: column; 
          align-items: center; 
          gap: 24px; 
          text-align: center;
          background: white; 
          border-radius: 1.25rem; 
          border: 1px solid var(--border); 
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
        }
        .score-viz { position: relative; width: 160px; height: 160px; }
        .score-viz svg { transform: rotate(-90deg); width: 100%; height: 100%; }
        .score-viz .track { fill: none; stroke: var(--bg-main); stroke-width: 10; }
        .score-viz .fill { fill: none; stroke: var(--brand); stroke-width: 10; stroke-linecap: round; }
        .score-value { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .score-value .num { font-size: 40px; font-weight: 900; color: var(--text-main); letter-spacing: -0.05em; line-height: 1; }
        .score-value .label { font-size: 0.625rem; font-weight: 800; color: var(--text-muted); letter-spacing: 0.1em; }
        
        .score-footer { display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .status-badge { font-size: 0.75rem; font-weight: 800; color: white; padding: 4px 12px; border-radius: 100px; }
        .score-footer p { font-size: 0.8125rem; color: var(--text-muted); line-height: 1.6; font-weight: 500; }

        .quick-actions-hub {
          background: white;
          border-radius: 1.25rem;
          border: 1px solid var(--border);
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
          padding: 24px;
        }
        .quick-actions-hub h3 { font-size: 0.875rem; font-weight: 800; color: var(--text-main); margin-bottom: 20px; letter-spacing: -0.01em; }
        .action-btns { display: flex; flex-direction: column; gap: 8px; }
        .hub-action-btn { 
          display: flex; align-items: center; gap: 12px; padding: 12px 16px; 
          background: var(--bg-main); border: 1px solid transparent; 
          border-radius: 0.75rem; font-size: 0.8125rem; font-weight: 700; 
          color: var(--text-main); cursor: pointer; transition: 0.2s;
        }
        .hub-action-btn:hover { background: white; border-color: var(--border); color: var(--brand); transform: translateX(4px); box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .hub-action-btn svg { color: var(--brand); }

        @media (max-width: 1024px) {
          .intelligence-grid {
            grid-template-columns: 1fr;
          }
          .hub-sections-row {
            grid-template-columns: 1fr;
          }
          .chart-composition-wrapper {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
