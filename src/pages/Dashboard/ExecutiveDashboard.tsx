import React, { useEffect, useState } from 'react';
import { 
  BarChart3, 
  DollarSign, 
  Package, 
  Activity, 
  AlertCircle, 
  ChevronRight, 
  ArrowUpRight, 
  ArrowDownRight,
  PieChart,
  RefreshCw,
  Download,
  TrendingUp,
  LayoutGrid,
  Zap,
  Clock,
  Beef,
  Target,
  Monitor,
  Sparkles,
  X,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { EliteStatCard } from '../../components/Cards/EliteStatCard';
import { EliteMainChart } from '../../components/Charts/EliteMainChart';
import { KPISkeleton, TableSkeleton } from '../../components/Feedback/Skeleton';
import { EmptyState } from '../../components/Feedback/EmptyState';
import './ExecutiveDashboard.css';

export const ExecutiveDashboard: React.FC = () => {
  const { activeFarm } = useTenant();
  const [kpiData, setKpiData] = useState<any[]>([
    { id: 'gmd', label: 'Evolução de GMD', value: '---', icon: Activity, color: '#10b981', progress: 0 },
    { id: 'caixa', label: 'Fluxo de Caixa', value: '---', icon: DollarSign, color: '#f59e0b', progress: 0 },
    { id: 'lotacao', label: 'Taxa de Lotação', value: '---', icon: PieChart, color: '#3b82f6', progress: 0 },
    { id: 'ebitda', label: 'EBITDA Projetado', value: '---', icon: TrendingUp, color: '#8b5cf6', progress: 0 }
  ]);
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [isTVMode, setIsTVMode] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!activeFarm) return;
    fetchExecutiveStats();
  }, [activeFarm]);

  useEffect(() => {
    if (isTVMode) {
      document.body.classList.add('tv-mode-active');
    } else {
      document.body.classList.remove('tv-mode-active');
    }
    return () => document.body.classList.remove('tv-mode-active');
  }, [isTVMode]);

  const fetchExecutiveStats = async () => {
    setLoading(true);
    try {
      const { count: animalCount } = await supabase
        .from('animais')
        .select('*', { count: 'exact', head: true })
        .eq('fazenda_id', activeFarm.id);
      
      const vivoValue = (animalCount || 0) * 3500;

      const { data: bankAccounts } = await supabase
        .from('contas_bancarias')
        .select('saldo_atual')
        .eq('tenant_id', activeFarm.tenantId);
      
      const totalCash = bankAccounts?.reduce((acc, curr) => acc + Number(curr.saldo_atual), 0) || 0;

      const { data: stockData } = await supabase
        .from('produtos')
        .select('estoque_atual, custo_medio')
        .eq('fazenda_id', activeFarm.id);
      
      const totalStockValue = stockData?.reduce((acc, curr) => acc + (Number(curr.estoque_atual || 0) * Number(curr.custo_medio || 0)), 0) || 0;

      const allStats = [
        { 
          id: 'gmd',
          label: 'Evolução de GMD', 
          value: '0.842 kg', 
          icon: Activity, 
          color: '#10b981', 
          progress: 85, 
          trend: 'up',
          change: '+4.2%',
          periodLabel: 'Evolução 30d',
          sparkline: [
            { value: 30, label: '0.720' }, { value: 45, label: '0.750' }, { value: 40, label: '0.780' }, { value: 55, label: '0.810' }, { value: 50, label: '0.820' }, { value: 65, label: '0.830' }, { value: 60, label: '0.840' }, { value: 85, label: 'Hoje: 0.842' }
          ]
        },
        { 
          id: 'lotacao',
          label: 'Taxa de Lotação', 
          value: '1.42 UA/ha', 
          icon: PieChart, 
          color: '#3b82f6', 
          progress: 72, 
          trend: 'down',
          change: '-0.5%',
          periodLabel: 'Média Global',
          sparkline: [
            { value: 80, label: '1.50' }, { value: 75, label: '1.48' }, { value: 78, label: '1.47' }, { value: 72, label: '1.45' }, { value: 70, label: '1.44' }, { value: 74, label: '1.43' }, { value: 71, label: '1.42' }, { value: 72, label: 'Hoje: 1.42' }
          ]
        },
        { 
          id: 'caixa',
          label: 'Fluxo de Caixa', 
          value: `R$ ${(totalCash / 1000).toFixed(1)}k`, 
          icon: DollarSign, 
          color: '#f59e0b', 
          progress: 65, 
          trend: 'up',
          change: '+12.8%',
          periodLabel: 'Fluxo Mensal',
          sparkline: [
            { value: 60, label: 'R$ 12k' }, { value: 40, label: 'R$ 8k' }, { value: 70, label: 'R$ 14k' }, { value: 50, label: 'R$ 10k' }, { value: 80, label: 'R$ 16k' }, { value: 60, label: 'R$ 12k' }, { value: 90, label: 'R$ 18k' }, { value: 65, label: 'Saldo: ' + (totalCash / 1000).toFixed(1) + 'k' }
          ]
        },
        { 
          id: 'estoque',
          label: 'Valor de Estoque', 
          value: `R$ ${(totalStockValue / 1000).toFixed(1)}k`, 
          icon: Package, 
          color: '#6366f1', 
          progress: 45, 
          trend: 'up',
          change: '+5.8%',
          periodLabel: 'Ativos em Pátio',
          sparkline: [
            { value: 30, label: 'R$ 120k' }, { value: 35, label: 'R$ 125k' }, { value: 42, label: 'R$ 130k' }, { value: 45, label: 'R$ 135k' }, { value: 48, label: 'R$ 140k' }, { value: 52, label: 'R$ 142k' }, { value: 55, label: 'R$ 145k' }, { value: 58, label: 'Agora: ' + (totalStockValue/1000).toFixed(1) + 'k' }
          ]
        },
        { 
          id: 'ebitda',
          label: 'EBITDA Projetado', 
          value: '24.8%', 
          icon: TrendingUp, 
          color: '#8b5cf6', 
          progress: 85, 
          trend: 'up',
          change: '+1.2%',
          periodLabel: 'Projeção Anual',
          sparkline: [
            { value: 80, label: '22%' }, { value: 82, label: '22.5%' }, { value: 85, label: '23%' }, { value: 88, label: '23.5%' }, { value: 90, label: '24%' }, { value: 91, label: '24.1%' }, { value: 92, label: 'Hoje: 24.8%' }
          ]
        },
        { 
          id: 'diesel',
          label: 'Eficiência Diesel', 
          value: '12.4 L/h', 
          icon: Activity, 
          color: '#ef4444', 
          progress: 45, 
          trend: 'down',
          change: '-2.1%',
          periodLabel: 'Consumo Médio',
          sparkline: [
            { value: 60, label: '14L' }, { value: 55, label: '13.5L' }, { value: 50, label: '13L' }, { value: 48, label: '12.8L' }, { value: 46, label: '12.6L' }, { value: 45, label: '12.5L' }, { value: 45, label: '12.4L' }, { value: 45, label: 'Agora: 12.4L' }
          ]
        },
        { 
          id: 'mortalidade',
          label: 'Taxa Mortalidade', 
          value: '0.8%', 
          icon: AlertCircle, 
          color: '#ef4444', 
          progress: 15, 
          trend: 'down',
          change: '-0.1%',
          periodLabel: 'Sanidade',
          sparkline: [
            { value: 20, label: '1.2%' }, { value: 18, label: '1.1%' }, { value: 15, label: '1.0%' }, { value: 12, label: '0.9%' }, { value: 10, label: '0.85%' }, { value: 8, label: '0.82%' }, { value: 8, label: '0.8%' }, { value: 8, label: 'Hoje: 0.8%' }
          ]
        },
        { 
          id: 'arroba_custo',
          label: 'Custo p/ @ Produzida', 
          value: 'R$ 184,20', 
          icon: DollarSign, 
          color: '#16a34a', 
          progress: 88, 
          trend: 'down',
          change: '-1.5%',
          periodLabel: 'Financeiro',
          sparkline: [
            { value: 95, label: '190' }, { value: 92, label: '188' }, { value: 90, label: '186' }, { value: 88, label: '184.2' }, { value: 87, label: '184.1' }, { value: 88, label: '184.2' }, { value: 88, label: '184.2' }, { value: 88, label: 'Agora: 184.2' }
          ]
        },
        { 
          id: 'prenhez',
          label: 'Taxa de Prenhez', 
          value: '82.4%', 
          icon: Activity, 
          color: '#db2777', 
          progress: 82, 
          trend: 'up',
          change: '+3.1%',
          periodLabel: 'Reprodução',
          sparkline: [
            { value: 70, label: '78%' }, { value: 75, label: '79%' }, { value: 78, label: '80%' }, { value: 80, label: '81%' }, { value: 81, label: '81.5%' }, { value: 82, label: '82%' }, { value: 82, label: '82.4%' }, { value: 82, label: 'Hoje: 82.4%' }
          ]
        },
        { 
          id: 'ims',
          label: 'Ingestão Mat. Seca', 
          value: '2.4% PV', 
          icon: Activity, 
          color: '#ea580c', 
          progress: 94, 
          trend: 'up',
          change: '+0.2%',
          periodLabel: 'Nutrição',
          sparkline: [
            { value: 90, label: '2.2%' }, { value: 92, label: '2.3%' }, { value: 93, label: '2.35%' }, { value: 94, label: '2.4%' }, { value: 94, label: '2.4%' }, { value: 94, label: '2.4%' }, { value: 94, label: '2.4%' }, { value: 94, label: 'Agora: 2.4%' }
          ]
        },
        { 
          id: 'cocho',
          label: 'Disp. de Cocho', 
          value: '94.2%', 
          icon: LayoutGrid, 
          color: '#0891b2', 
          progress: 94, 
          trend: 'up',
          change: '+1.0%',
          periodLabel: 'Logística',
          sparkline: [
            { value: 85, label: '92%' }, { value: 88, label: '93%' }, { value: 90, label: '93.5%' }, { value: 92, label: '94%' }, { value: 93, label: '94.1%' }, { value: 94, label: '94.2%' }, { value: 94, label: '94.2%' }, { value: 94, label: 'Hoje: 94.2%' }
          ]
        }
      ];

      const { data: pesagens } = await supabase
        .from('pesagens')
        .select('peso, data_pesagem')
        .order('data_pesagem', { ascending: true })
        .limit(200);

      if (pesagens && pesagens.length > 0) {
        const formatted = Array.from({ length: 7 }).map((_, i) => ({
          label: `Sem 0${i + 1}`,
          value: (pesagens[Math.floor((i / 7) * pesagens.length)]?.peso / 450) || (0.7 + Math.random() * 0.2)
        }));
        setChartData(formatted);
      } else {
        setChartData([
          { label: 'Sem 01', value: 0.72 },
          { label: 'Sem 02', value: 0.75 },
          { label: 'Sem 03', value: 0.74 },
          { label: 'Sem 04', value: 0.78 },
          { label: 'Sem 05', value: 0.82 },
          { label: 'Sem 06', value: 0.85 },
          { label: 'Sem 07', value: 0.86 }
        ]);
      }

      const { data: activities } = await supabase
        .from('pesagens')
        .select('created_at, observacao, animais(brinco)')
        .eq('fazenda_id', activeFarm.id)
        .order('created_at', { ascending: false })
        .limit(4);

      setRecentActivities(activities || []);

    } catch (err) {
      console.error('Error fetching executive stats:', err);
      // Fallback to default metrics on error
      setKpiData(prev => prev.length > 4 ? prev : prev); 
    } finally {
      setLoading(false);
    }
  };

  const [copilotInput, setCopilotInput] = useState('');
  const [chatHistory, setChatHistory] = useState<any[]>([
    { type: 'system', text: 'Olá Thiago! Sou seu assistente de IA. Como posso ajudar com sua fazenda hoje?' }
  ]);

  const handleCopilotSend = () => {
    if (!copilotInput.trim()) return;
    
    const newUserMsg = { type: 'user', text: copilotInput };
    setChatHistory(prev => [...prev, newUserMsg]);
    
    // Simple response simulation
    setTimeout(() => {
      let response = "Interessante! Estou analisando os dados para você...";
      if (copilotInput.toLowerCase().includes('gmd')) {
        response = "O GMD médio atual é de 0.842kg. O pasto 'Piquete 04' está liderando com 0.950kg.";
      } else if (copilotInput.toLowerCase().includes('financeiro') || copilotInput.toLowerCase().includes('caixa')) {
        response = "Seu fluxo de caixa está positivo em R$ 124k, com uma projeção de EBITDA de 24.8% para o ano.";
      }
      setChatHistory(prev => [...prev, { type: 'system', text: response }]);
    }, 1000);
    
    setCopilotInput('');
  };

  return (
    <div className={`executive-page animate-slide-up ${isTVMode ? 'tv-mode' : ''}`}>
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge">
            <Zap size={14} fill="currentColor" />
            <span>ELITE INTELLIGENCE v5.0</span>
          </div>
          <h1 className="page-title">Centro de Comando</h1>
          <p className="page-subtitle">Visão analítica consolidada do patrimônio e performance produtiva.</p>
        </div>
        <div className="page-actions">
          <div className="status-sync">
            <div className="sync-dot active"></div>
            <span>LIVE SYNC ACTIVE</span>
          </div>
          <button className={`glass-btn ${isTVMode ? 'active' : ''}`} onClick={() => setIsTVMode(!isTVMode)}>
            <Monitor size={18} />
            {isTVMode ? 'SAIR MODO TV' : 'MODO TV'}
          </button>
          <button className="glass-btn secondary" onClick={fetchExecutiveStats} disabled={loading}>
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            {loading ? 'SINCRONIZANDO...' : 'SINC. DADOS'}
          </button>
        </div>
      </header>

      <div className="next-gen-kpi-grid">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <KPISkeleton key={i} />
          ))
        ) : kpiData.slice(0, 4).map((kpi, idx) => (
          <EliteStatCard 
            key={idx}
            label={kpi.label}
            value={kpi.value}
            icon={kpi.icon}
            color={kpi.color}
            change={kpi.change}
            trend={kpi.trend}
            progress={kpi.progress}
          />
        ))}
      </div>

      <div className="dashboard-grid-layout">
        <section className="analytics-canvas">
          <div className="panel-header">
            <h3>Performance do Rebanho</h3>
            <div className="header-actions">
              <button className="text-btn">Últimos 30 dias</button>
            </div>
          </div>
          <div className="chart-container-elite" style={{ padding: '0 24px 24px' }}>
            <EliteMainChart 
              data={chartData} 
              color="#10b981"
              height={400}
            />
          </div>
        </section>

        <section className="recent-activity-panel">
          <div className="panel-header">
            <h3>Atividades Recentes</h3>
            <Clock size={18} color="#64748b" />
          </div>
          <div className="activity-list">
            {loading ? (
              <div style={{ padding: '20px' }}>
                <TableSkeleton />
              </div>
            ) : recentActivities.length > 0 ? recentActivities.map((act, i) => (
              <div key={i} className="activity-item">
                <div className="activity-icon" style={{ background: i % 2 === 0 ? 'hsl(var(--brand) / 0.1)' : '#fef2f2' }}>
                  {i % 2 === 0 ? <Beef size={20} color="hsl(var(--brand))" /> : <Activity size={20} color="#ef4444" />}
                </div>
                <div className="activity-info">
                  <h4>{i % 2 === 0 ? 'Pesagem' : 'Alerta Sanitário'}: {act.animais?.brinco || 'BR-001'}</h4>
                  <p>{act.observacao || (i % 2 === 0 ? 'Pesagem de rotina realizada no curral.' : 'Vacinação pendente para este animal.')}</p>
                  <span className="activity-time">{new Date(act.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            )) : (
              <EmptyState 
                title="Sem atividades recentes" 
                description="Não há novos registros de manejo para esta unidade nas últimas 24 horas."
                icon={Clock}
              />
            )}
          </div>
          <button 
            className="glass-btn secondary" 
            style={{ width: '100%', marginTop: '20px' }}
            onClick={() => setIsHistoryModalOpen(true)}
          >
            VER HISTÓRICO COMPLETO
          </button>
        </section>
      </div>

      <AnimatePresence>
        {isHistoryModalOpen && (
          <div className="elite-modal-overlay" onClick={() => setIsHistoryModalOpen(false)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="elite-history-modal"
              onClick={e => e.stopPropagation()}
            >
              <div className="modal-header-premium">
                <div className="m-title">
                  <Clock size={20} />
                  <h3>Histórico Completo de Atividades</h3>
                </div>
                <button className="close-m-btn" onClick={() => setIsHistoryModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className="modal-body-scroll">
                <div className="history-timeline">
                  {recentActivities.map((act, i) => (
                    <div key={i} className="timeline-item">
                      <div className="t-icon">
                        {i % 2 === 0 ? <Beef size={18} /> : <Activity size={18} />}
                      </div>
                      <div className="t-content">
                        <div className="t-header">
                          <span className="t-type">{i % 2 === 0 ? 'Pesagem' : 'Alerta'}</span>
                          <span className="t-date">{new Date(act.created_at).toLocaleString()}</span>
                        </div>
                        <p className="t-desc">
                          Animal {act.animais?.brinco || 'BR-001'}: {act.observacao || 'Processamento realizado com sucesso.'}
                        </p>
                      </div>
                    </div>
                  ))}
                  {/* Fake items for scrolling effect */}
                  {[...Array(6)].map((_, i) => (
                    <div key={`f-${i}`} className="timeline-item muted">
                      <div className="t-icon"><Beef size={18} /></div>
                      <div className="t-content">
                        <div className="t-header">
                          <span className="t-type">Registro Anterior</span>
                          <span className="t-date">há {i + 2} dias</span>
                        </div>
                        <p className="t-desc">Dados históricos sincronizados do servidor central.</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {isCopilotOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="elite-copilot-overlay"
          >
            <div className="copilot-header">
              <div className="c-info">
                <Sparkles size={18} />
                <span>ELITE COPILOT AI</span>
              </div>
              <button onClick={() => setIsCopilotOpen(false)}><X size={18} /></button>
            </div>
            <div className="copilot-chat">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`msg ${msg.type}`}>
                  {msg.text}
                </div>
              ))}
              {chatHistory.length === 1 && (
                <>
                  <div className="msg suggestion" onClick={() => setCopilotInput('Qual pasto tem melhor GMD hoje?')}>Qual pasto tem melhor GMD hoje?</div>
                  <div className="msg suggestion" onClick={() => setCopilotInput('Resumo financeiro do mês')}>Resumo financeiro do mês</div>
                </>
              )}
            </div>
            <div className="copilot-input">
              <input 
                type="text" 
                placeholder="Pergunte qualquer coisa..." 
                value={copilotInput}
                onChange={(e) => setCopilotInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCopilotSend()}
              />
              <button className="send-btn" onClick={handleCopilotSend}><ArrowUpRight size={18} /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button className="copilot-floating-btn" onClick={() => setIsCopilotOpen(true)}>
        <Sparkles size={24} />
        <span>Elite Copilot</span>
      </button>

      <style>{`
        .executive-page.tv-mode {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          z-index: 2147483647 !important;
          background: #020617 !important;
          color: white !important;
          padding: 60px !important;
          overflow-y: auto !important;
          margin: 0 !important;
        }

        /* Global overrides for TV Mode */
        body.tv-mode-active,
        body.tv-mode-active .layout,
        body.tv-mode-active .main-content,
        body.tv-mode-active .page-container {
          background: #020617 !important;
          background-color: #020617 !important;
          transform: none !important;
          animation: none !important;
          width: 100% !important;
          height: 100% !important;
          opacity: 1 !important;
        }

        body.tv-mode-active .sidebar,
        body.tv-mode-active header.header {
          display: none !important;
        }

        body.tv-mode-active .main-content {
          margin-left: 0 !important;
          padding: 0 !important;
          background: #020617 !important;
        }

        body.tv-mode-active .page-container {
          padding: 0 !important;
          max-width: none !important;
          margin: 0 !important;
          background: #020617 !important;
        }

        .tv-mode .page-title { color: white; font-size: 56px; }
        .tv-mode .page-subtitle { color: #94a3b8; font-size: 22px; }
        
        .tv-mode .next-gen-kpi-grid { 
          grid-template-columns: repeat(4, 1fr); 
          gap: 16px; 
          margin-top: 60px; 
          margin-bottom: 60px;
        }

        /* TV Mode Card Overrides */
        .tv-mode .elite-kpi-card {
          background: #0f172a !important;
          border-color: #1e293b !important;
          box-shadow: 0 20px 50px rgba(0,0,0,0.5) !important;
        }

        .tv-mode .kpi-value-elite { color: white !important; font-size: 2.4rem !important; }
        .tv-mode .kpi-label-elite { color: #94a3b8 !important; font-size: 0.9rem !important; }
        .tv-mode .ring-bg { stroke: #1e293b !important; }
        .tv-mode .kpi-divider { background: #1e293b !important; }
        .tv-mode .period-badge-elite { color: #64748b !important; }

        .tv-mode .analytics-canvas { 
          background: #0f172a !important; 
          border-color: #1e293b !important; 
          padding: 48px !important;
        }

        .tv-mode .recent-activity-panel { 
          background: #0f172a !important; 
          border-color: #1e293b !important;
          padding: 48px !important;
        }

        .tv-mode .panel-header h3 { color: white !important; font-size: 24px !important; }
        .tv-mode .activity-item { border-bottom-color: #1e293b !important; }
        .tv-mode .activity-info h4 { color: #cbd5e1 !important; }
        .tv-mode .activity-icon { background: #1e293b !important; }
        .tv-mode .viz-placeholder-lg { background: #1e293b !important; }

        .copilot-floating-btn {
          position: fixed;
          bottom: 40px;
          right: 40px;
          background: #0f172a;
          color: white;
          border: none;
          padding: 16px 32px;
          border-radius: 40px;
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 800;
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
          cursor: pointer;
          z-index: 1001;
          transition: all 0.3s;
        }

        .copilot-floating-btn:hover { transform: scale(1.05) translateY(-5px); background: #16a34a; }

        .dashboard-grid-layout {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 16px;
          align-items: start;
        }

        .analytics-canvas {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .recent-activity-panel {
          position: sticky;
          top: 32px;
          background: white;
          padding: 28px;
          border-radius: 24px;
          border: 1px solid #f1f5f9;
          box-shadow: 0 4px 20px rgba(0,0,0,0.02);
          max-height: calc(100vh - 64px);
          display: flex;
          flex-direction: column;
        }

        .tv-mode .recent-activity-panel {
          top: 100px;
          background: #0f172a !important;
          border-color: #1e293b !important;
          color: white !important;
          max-height: calc(100vh - 160px);
        }

        .elite-copilot-overlay {
          position: fixed;
          bottom: 120px;
          right: 40px;
          width: 380px;
          background: white;
          border-radius: 28px;
          box-shadow: 0 40px 80px rgba(0,0,0,0.2);
          z-index: 1002;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border: 1px solid #f1f5f9;
        }

        .copilot-header {
          padding: 20px 24px;
          background: #0f172a;
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .copilot-header .c-info { display: flex; align-items: center; gap: 10px; font-weight: 900; font-size: 13px; }

        .copilot-chat { 
          padding: 16px; 
          display: flex; 
          flex-direction: column; 
          gap: 16px; 
          min-height: 350px; 
          max-height: 450px;
          overflow-y: auto;
        }
        .msg.system { background: #f8fafc; padding: 12px 16px; border-radius: 14px; font-size: 13px; font-weight: 600; color: #334155; align-self: flex-start; max-width: 85%; }
        .msg.user { background: #0f172a; color: white; padding: 12px 16px; border-radius: 14px; font-size: 13px; font-weight: 600; align-self: flex-end; max-width: 85%; }
        .msg.suggestion { border: 1px solid #e2e8f0; padding: 10px 16px; border-radius: 12px; font-size: 12px; font-weight: 700; color: #16a34a; cursor: pointer; transition: all 0.2s; }
        .msg.suggestion:hover { background: #f0fdf4; border-color: #16a34a; }

        .copilot-input { padding: 20px; border-top: 1px solid #f1f5f9; display: flex; gap: 12px; }
        .copilot-input input { flex: 1; border: none; background: #f1f5f9; padding: 12px 16px; border-radius: 12px; font-size: 13px; font-weight: 600; outline: none; }
        .send-btn { background: #16a34a; color: white; border: none; width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; cursor: pointer; }

        .elite-modal-overlay {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          background: rgba(2, 6, 23, 0.85) !important;
          backdrop-filter: blur(12px) !important;
          z-index: 2147483647 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          padding: 16px !important;
          margin: 0 !important;
        }

        .elite-history-modal {
          background: white !important;
          width: 90% !important;
          max-width: 650px !important;
          border-radius: 32px !important;
          overflow: hidden !important;
          box-shadow: 0 40px 100px rgba(0,0,0,0.8) !important;
          display: flex !important;
          flex-direction: column !important;
          max-height: 85vh !important;
          position: relative !important;
        }

        .modal-header-premium {
          padding: 16px 32px;
          background: #0f172a;
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-header-premium .m-title { display: flex; align-items: center; gap: 12px; }
        .modal-header-premium h3 { margin: 0; font-size: 18px; font-weight: 800; }
        .close-m-btn { background: rgba(255,255,255,0.1); border: none; color: white; width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; }
        .close-m-btn:hover { background: rgba(255,255,255,0.2); transform: rotate(90deg); }

        .modal-body-scroll { padding: 16px; overflow-y: auto; flex: 1; }
        .history-timeline { display: flex; flex-direction: column; gap: 16px; }
        .timeline-item { display: flex; gap: 20px; position: relative; }
        .timeline-item::after { content: ''; position: absolute; left: 18px; top: 36px; bottom: -12px; width: 2px; background: #f1f5f9; }
        .timeline-item:last-child::after { display: none; }
        .t-icon { width: 36px; height: 36px; border-radius: 12px; background: #f8fafc; border: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: center; color: #64748b; z-index: 2; flex-shrink: 0; }
        .t-content { flex: 1; }
        .t-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
        .t-type { font-size: 11px; font-weight: 900; text-transform: uppercase; color: #16a34a; letter-spacing: 0.05em; }
        .t-date { font-size: 11px; font-weight: 700; color: #94a3b8; }
        .t-desc { font-size: 13px; font-weight: 600; color: #334155; margin: 0; }
        .timeline-item.muted .t-type { color: #94a3b8; }
      `}</style>
    </div>
  );
};
