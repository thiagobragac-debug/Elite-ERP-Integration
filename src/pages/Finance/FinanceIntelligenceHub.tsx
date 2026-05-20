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


export const FinanceIntelligenceHub: React.FC = () => {
  const { data: insights, stats, healthScore, loading, error, refresh } = useReportData('finance-overview');

  const fetchIntelligenceData = () => {
    window.location.reload(); 
  };

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
              <div className="composition-chart-placeholder">
                <div className="comp-item">
                  <div className="comp-meta">
                    <span className="label">Saldo em Contas</span>
                    <span className="value">R$ 1.2M</span>
                  </div>
                  <div className="comp-bar"><div className="fill" style={{ width: '65%', background: '#10b981' }} /></div>
                </div>
                <div className="comp-item">
                  <div className="comp-meta">
                    <span className="label">A Receber (30d)</span>
                    <span className="value">R$ 450k</span>
                  </div>
                  <div className="comp-bar"><div className="fill" style={{ width: '45%', background: '#3b82f6' }} /></div>
                </div>
                <div className="comp-item">
                  <div className="comp-meta">
                    <span className="label">A Pagar (30d)</span>
                    <span className="value">R$ 380k</span>
                  </div>
                  <div className="comp-bar"><div className="fill" style={{ width: '38%', background: '#ef4444' }} /></div>
                </div>
              </div>
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
              <div className="status-badge">SAUDÁVEL</div>
              <p>Sua unidade apresenta alta eficiência de capital e baixo risco de liquidez imediata.</p>
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
        }
        
        .card-header-hub { margin-bottom: 24px; display: flex; flex-direction: column; gap: 4px; }
        .h-left { display: flex; align-items: center; gap: 12px; }
        .h-left h3 { font-size: 1rem; font-weight: 800; color: var(--text-main); margin: 0; letter-spacing: -0.01em; }
        .card-header-hub .subtitle { font-size: 0.75rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }

        .composition-chart-placeholder { display: flex; flex-direction: column; gap: 24px; margin-top: 12px; }
        .comp-item { display: flex; flex-direction: column; gap: 10px; }
        .comp-meta { display: flex; justify-content: space-between; font-size: 0.8125rem; font-weight: 700; color: var(--text-main); }
        .comp-bar { height: 8px; background: var(--bg-main); border-radius: 100px; overflow: hidden; }
        .comp-bar .fill { height: 100%; border-radius: 100px; }

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
        .status-badge { font-size: 0.75rem; font-weight: 800; background: #10b981; color: white; padding: 4px 12px; border-radius: 100px; }
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
      `}</style>
    </div>
  );
};
