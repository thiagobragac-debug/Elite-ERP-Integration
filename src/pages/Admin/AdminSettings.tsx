import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  PieChart, 
  Layout, 
  Shield, 
  Save, 
  RefreshCw,
  Globe,
  Zap,
  Activity,
  DollarSign,
  Monitor,
  Lock,
  Plus,
  Check,
  X,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { supabase } from '../../lib/supabase';
import { logAudit } from '../../utils/audit';
import { useAuth } from '../../contexts/AuthContext';

type SettingTab = 'system' | 'bi' | 'canvas';

interface Metric {
  id: string;
  name: string;
  cat: string;
  icon: React.ElementType;
  value: string;
  trend: string;
  isPositive: boolean;
  color: string;
}

const AVAILABLE_METRICS: Metric[] = [
  { id: 'gmd', name: 'Evolução de GMD', cat: 'Pecuária', icon: Activity, value: '0.842 kg', trend: '+4.2%', isPositive: true, color: '#10b981' },
  { id: 'lotacao', name: 'Taxa de Lotação', cat: 'Pastos', icon: PieChart, value: '1.42 UA/ha', trend: '-0.5%', isPositive: false, color: '#3b82f6' },
  { id: 'caixa', name: 'Fluxo de Caixa', cat: 'Finanças', icon: DollarSign, value: 'R$ 142k', trend: '+12.8%', isPositive: true, color: '#f59e0b' },
  { id: 'estoque', name: 'Giro de Estoque', cat: 'Estoque', icon: Settings, value: '4.2x', trend: '+1.2%', isPositive: true, color: '#6366f1' },
  { id: 'ebitda', name: 'EBITDA Projetado', cat: 'Estratégico', icon: Zap, value: '24.2%', trend: '+0.8%', isPositive: true, color: '#8b5cf6' },
  { id: 'diesel', name: 'Eficiência Diesel', cat: 'Frota', icon: Activity, value: '12.4 L/h', trend: '-2.1%', isPositive: true, color: '#ef4444' },
  { id: 'mortalidade', name: 'Taxa Mortalidade', cat: 'Sanidade', icon: Activity, value: '0.8%', trend: '-0.1%', isPositive: true, color: '#ef4444' },
  { id: 'arroba_custo', name: 'Custo p/ @ Produzida', cat: 'Financeiro', icon: DollarSign, value: 'R$ 184,20', trend: '-1.5%', isPositive: true, color: '#16a34a' },
  { id: 'prenhez', name: 'Taxa de Prenhez', cat: 'Reprodução', icon: Activity, value: '82.4%', trend: '+3.1%', isPositive: true, color: '#db2777' },
  { id: 'ims', name: 'Ingestão de Matéria Seca', cat: 'Nutrição', icon: Activity, value: '2.4% PV', trend: '+0.2%', isPositive: true, color: '#ea580c' },
  { id: 'cocho', name: 'Disponibilidade de Cocho', cat: 'Nutrição', icon: Layout, value: '94.2%', trend: '+1.0%', isPositive: true, color: '#0891b2' },
  { id: 'conversao_alim', name: 'Conversão Alimentar', cat: 'Nutrição', icon: Activity, value: '6.2:1', trend: '-2.1%', isPositive: true, color: '#10b981' },
  { id: 'produtividade_ha', name: 'Produtividade (@/ha/ano)', cat: 'Performance', icon: TrendingUp, value: '18.4 @', trend: '+5.2%', isPositive: true, color: '#16a34a' },
  { id: 'ciclo_engorda', name: 'Ciclo de Engorda', cat: 'Pecuária', icon: Clock, value: '94 dias', trend: '-4d', isPositive: true, color: '#3b82f6' },
  { id: 'saving_compras', name: 'Saving de Compras', cat: 'Suprimentos', icon: DollarSign, value: '12.4%', trend: '+1.5%', isPositive: true, color: '#10b981' },
  { id: 'lead_time', name: 'Lead Time Médio', cat: 'Suprimentos', icon: Clock, value: '4.2 dias', trend: '-0.5d', isPositive: true, color: '#f59e0b' },
  { id: 'acuracidade_est', name: 'Acuracidade Estoque', cat: 'Estoque', icon: Settings, value: '98.8%', trend: '+0.5%', isPositive: true, color: '#10b981' },
  { id: 'ruptura_est', name: 'Índice de Ruptura', cat: 'Estoque', icon: AlertCircle, value: '1.2%', trend: '-0.8%', isPositive: true, color: '#ef4444' },
  { id: 'manutencao_hora', name: 'Custo Manutenção/h', cat: 'Frota', icon: Settings, value: 'R$ 42,10', trend: '-2.5%', isPositive: true, color: '#3b82f6' },
  { id: 'disponibilidade_frota', name: 'Disp. de Frota', cat: 'Frota', icon: Monitor, value: '92.4%', trend: '+2.1%', isPositive: true, color: '#10b981' },
  { id: 'margem_contribuicao', name: 'Margem de Contrib.', cat: 'Financeiro', icon: TrendingUp, value: 'R$ 1.2k/animal', trend: '+8.4%', isPositive: true, color: '#8b5cf6' },
  { id: 'break_even', name: 'Break-even (@)', cat: 'Financeiro', icon: Target, value: 'R$ 172,40', trend: '-1.2%', isPositive: true, color: '#16a34a' },
  { id: 'ticket_venda', name: 'Ticket Médio Venda', cat: 'Vendas', icon: DollarSign, value: 'R$ 4.2k', trend: '+2.5%', isPositive: true, color: '#f59e0b' },
  { id: 'roi_pastagem', name: 'ROI Pastagens', cat: 'Financeiro', icon: Zap, value: '2.4x', trend: '+0.4', isPositive: true, color: '#db2777' },
  { id: 'score_corporal', name: 'Score Cond. Corporal', cat: 'Pecuária', icon: Activity, value: '3.4', trend: '+0.1', isPositive: true, color: '#10b981' },
  { id: 'ociosidade_maq', name: 'Ociosidade Maquinário', cat: 'Frota', icon: AlertCircle, value: '14.2%', trend: '-2.1%', isPositive: true, color: '#ef4444' },
];

export const AdminSettings: React.FC = () => {
  const location = useLocation();
  const { tenant, refreshData } = useTenant();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingTab>('system');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['gmd', 'lotacao', 'caixa']);
  const [metricTargets, setMetricTargets] = useState<any>({
    gmd: { mode: 'auto', manualValue: 1.2, autoFormula: 'Média + 15%' },
    lotacao: { mode: 'manual', manualValue: 1.5, autoFormula: 'Capacidade Nominal' },
    caixa: { mode: 'auto', manualValue: 100000, autoFormula: 'Projeção Mensal' }
  });

  useEffect(() => {
    if (location.pathname === '/admin/bi') setActiveTab('bi');
    if (location.pathname === '/admin/canvas') setActiveTab('canvas');
    
    // Load from tenant settings (Supabase)
    if (tenant?.settings?.selected_metrics) {
      setSelectedMetrics(tenant.settings.selected_metrics);
    } else {
      // Fallback to localStorage
      const saved = localStorage.getItem('elite_selected_metrics');
      if (saved) {
        try {
          setSelectedMetrics(JSON.parse(saved));
        } catch (e) {
          console.error("Erro ao carregar métricas salvas", e);
        }
      }
    }
    if (tenant?.settings?.metric_targets) {
      setMetricTargets(tenant.settings.metric_targets);
    }
  }, [location.pathname, tenant]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    
    // 1. Persist to localStorage (compatibility)
    localStorage.setItem('elite_selected_metrics', JSON.stringify(selectedMetrics));

    // 2. Persist to Supabase
    if (tenant?.id) {
      const updatedSettings = {
        ...tenant.settings,
        selected_metrics: selectedMetrics,
        metric_targets: metricTargets,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('tenants')
        .update({ settings: updatedSettings })
        .eq('id', tenant.id);

      if (!error) {
        // 3. Log Audit
        await logAudit({
          tenant_id: tenant.id,
          user_id: user?.id,
          action: 'UPDATE_SETTINGS',
          entity: 'tenant_settings',
          entity_id: tenant.id,
          old_data: { selected_metrics: tenant.settings?.selected_metrics },
          new_data: { selected_metrics: selectedMetrics }
        });
        
        await refreshData();
      } else {
        console.error("Erro ao salvar no banco:", error);
      }
    }
    
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 1000);
  };

  const toggleMetric = (id: string) => {
    setSelectedMetrics(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const tabs = [
    { id: 'system', label: 'Sistema', icon: Settings },
    { id: 'bi', label: 'Inteligência (BI)', icon: PieChart },
    { id: 'canvas', label: 'Personalização (Canvas)', icon: Layout },
  ];

  return (
    <div className="admin-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge">
            <Settings size={14} fill="currentColor" />
            <span>CENTRAL DE GOVERNANÇA v5.0</span>
          </div>
          <h1 className="page-title">Configurações do Ecossistema</h1>
          <p className="page-subtitle">Gestão estratégica de parâmetros, métricas e interface do ecossistema Elite.</p>
        </div>
        <div className="action-group-premium">
          <AnimatePresence>
            {saveSuccess && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="save-toast-elite"
              >
                <Check size={16} />
                <span>Alterações aplicadas com sucesso!</span>
              </motion.div>
            )}
          </AnimatePresence>
          <button className={`primary-btn ${saveSuccess ? 'success' : ''}`} onClick={handleSave} disabled={isSaving}>
            {isSaving ? <RefreshCw size={18} className="animate-spin" /> : saveSuccess ? <Check size={18} /> : <Save size={18} />}
            <span>{isSaving ? 'SALVANDO...' : saveSuccess ? 'CONFIGURAÇÕES SALVAS' : 'SALVAR ALTERAÇÕES'}</span>
          </button>
        </div>
      </header>

      <div className="elite-controls-row" style={{ marginTop: '24px' }}>
        <div className="elite-tab-group">
          {tabs.map(tab => (
            <button 
              key={tab.id}
              className={`elite-tab-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id as SettingTab)}
            >
              <tab.icon size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
      
      <div className="elite-separator" style={{ margin: '24px 0' }}></div>

      <main className="hub-content">
        <AnimatePresence mode="wait">
          {activeTab === 'system' && (
            <motion.div 
              key="system"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="settings-view"
            >
              <div className="settings-grid-layout">
                <section className="settings-panel">
                  <div className="panel-header">
                    <Globe size={18} />
                    <h3>Identidade & Regional</h3>
                  </div>
                  <div className="field-group">
                    <div className="elite-field">
                      <label>Nome da Organização</label>
                      <input type="text" defaultValue="Elite Agropecuária Ltda" />
                    </div>
                    <div className="elite-field">
                      <label>Fuso Horário Padrão</label>
                      <select defaultValue="BR"><option>Brasília (GMT-3)</option></select>
                    </div>
                  </div>
                </section>

                <section className="settings-panel">
                  <div className="panel-header">
                    <Lock size={18} />
                    <h3>Segurança & Acesso</h3>
                  </div>
                  <div className="switch-list">
                    <div className="premium-switch">
                      <div className="info">
                        <span className="t">Autenticação em 2 Etapas</span>
                        <span className="d">Proteger contas administrativas.</span>
                      </div>
                      <div className="toggle-box active"></div>
                    </div>
                    <div className="premium-switch">
                      <div className="info">
                        <span className="t">Logs de Auditoria</span>
                        <span className="d">Rastrear todas as ações do sistema.</span>
                      </div>
                      <div className="toggle-box active"></div>
                    </div>
                  </div>
                </section>

                <section className="settings-panel">
                  <div className="panel-header">
                    <Monitor size={18} />
                    <h3>Visual da Interface</h3>
                  </div>
                  <div className="appearance-grid">
                    <div className="theme-card active">Modo Claro (Elite)</div>
                    <div className="theme-card">Modo Escuro (Diamond)</div>
                  </div>
                </section>
              </div>
            </motion.div>
          )}

          {activeTab === 'bi' && (
            <motion.div 
              key="bi"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="settings-view"
            >
              <div className="settings-grid-layout">
                <section className="settings-panel full-width">
                  <div className="panel-header">
                    <Target size={18} />
                    <h3>Motor de Metas de Performance (Híbrido)</h3>
                  </div>
                  <div className="targets-config-list">
                    {['gmd', 'lotacao', 'caixa'].map((mId) => {
                      const metric = AVAILABLE_METRICS.find(m => m.id === mId);
                      const target = metricTargets[mId] || { mode: 'auto', manualValue: 0 };
                      
                      return (
                        <div key={mId} className="target-config-row">
                          <div className="m-info">
                            <div className="m-icon-box" style={{ color: metric?.color }}>
                              {metric && <metric.icon size={16} />}
                            </div>
                            <div className="m-text">
                              <span className="n">{metric?.name}</span>
                              <span className="c">{metric?.cat}</span>
                            </div>
                          </div>

                          <div className="mode-selector">
                            <button 
                              className={`mode-btn ${target.mode === 'auto' ? 'active' : ''}`}
                              onClick={() => setMetricTargets({
                                ...metricTargets,
                                [mId]: { ...target, mode: 'auto' }
                              })}
                            >
                              <Zap size={12} />
                              <span>IA AUTOMÁTICA</span>
                            </button>
                            <button 
                              className={`mode-btn ${target.mode === 'manual' ? 'active' : ''}`}
                              onClick={() => setMetricTargets({
                                ...metricTargets,
                                [mId]: { ...target, mode: 'manual' }
                              })}
                            >
                              <Monitor size={12} />
                              <span>MANUAL</span>
                            </button>
                          </div>

                          <div className="value-input-area">
                            {target.mode === 'manual' ? (
                              <div className="manual-input">
                                <label>Valor da Meta</label>
                                <input 
                                  type="number" 
                                  value={target.manualValue}
                                  onChange={(e) => setMetricTargets({
                                    ...metricTargets,
                                    [mId]: { ...target, manualValue: parseFloat(e.target.value) }
                                  })}
                                />
                              </div>
                            ) : (
                              <div className="auto-info">
                                <span className="label">Cálculo Baseado em:</span>
                                <span className="formula">{target.autoFormula || 'Histórico de 6 Meses'}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section className="settings-panel">
                  <div className="panel-header">
                    <DollarSign size={18} />
                    <h3>Economia & Custos</h3>
                  </div>
                  <div className="field-group">
                    <div className="elite-field">
                      <label>Custo Oportunidade (% a.a.)</label>
                      <input type="number" defaultValue="11.50" />
                    </div>
                  </div>
                </section>

                <section className="settings-panel">
                  <div className="panel-header">
                    <Zap size={18} />
                    <h3>Notificações de Inteligência</h3>
                  </div>
                  <div className="switch-list">
                    <div className="premium-switch">
                      <div className="info">
                        <span className="t">Alerta de Desempenho</span>
                        <span className="d">Notificar quando abaixo da meta.</span>
                      </div>
                      <div className="toggle-box active"></div>
                    </div>
                  </div>
                </section>
              </div>
            </motion.div>
          )}

          {activeTab === 'canvas' && (
            <motion.div 
              key="canvas"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="settings-view"
            >
              <div className="canvas-studio-layout">
                <div className="studio-sidebar">
                  <div className="panel-header">
                    <PieChart size={18} />
                    <h3>Seletor de Métricas</h3>
                  </div>
                  <div className="metrics-list-clean">
                    {AVAILABLE_METRICS.map(m => (
                      <button 
                        key={m.id} 
                        className={`metric-option-item ${selectedMetrics.includes(m.id) ? 'active' : ''}`}
                        onClick={() => toggleMetric(m.id)}
                      >
                        <div className={`check ${selectedMetrics.includes(m.id) ? 'active' : ''}`}>
                          {selectedMetrics.includes(m.id) ? <Check size={14} /> : <Plus size={14} />}
                        </div>
                        <div className="txt">
                          <span className="name">{m.name}</span>
                          <span className="cat">{m.cat}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="studio-preview">
                  <div className="panel-header">
                    <Monitor size={18} />
                    <h3>Preview do Centro de Comando</h3>
                  </div>
                  <div className="visual-canvas-preview">
                    <div className="modern-section-header" style={{ marginBottom: '12px' }}>
                      <div className="title-group">
                        <Layout size={16} className="text-brand" />
                        <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Layout do Dashboard</h4>
                      </div>
                      <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>Arraste para reordenar</span>
                    </div>
                    <Reorder.Group 
                      as="div"
                      axis="y"
                      values={selectedMetrics} 
                      onReorder={setSelectedMetrics}
                      className="reorder-wrapper"
                    >
                      {selectedMetrics.map(id => {
                        const m = AVAILABLE_METRICS.find(metric => metric.id === id);
                        if (!m) return null;
                        return (
                        <Reorder.Item 
                          as="div"
                          value={m.id}
                          key={m.id} 
                          className="v-widget active"
                          whileDrag={{ scale: 1.02, boxShadow: "0 20px 40px rgba(0,0,0,0.1)", zIndex: 50 }}
                        >
                          <div className="v-widget-header" style={{ cursor: 'grab' }}>
                            <div className="icon-c" style={{ color: m.color }}>
                              <m.icon size={14} />
                            </div>
                            <span>{m.name}</span>
                            <button className="remove-w" onPointerDown={(e) => e.stopPropagation()} onClick={() => toggleMetric(m.id)}><X size={12} /></button>
                          </div>
                          <div className="v-widget-body">
                            <div className="v-value-row">
                              <span className="val">{m.value}</span>
                              <div className={`trend-tag ${m.isPositive ? 'up' : 'down'}`}>
                                {m.isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                <span>{m.trend}</span>
                              </div>
                            </div>
                            <div className="mini-bar-chart">
                              {[40, 70, 45, 90, 65, 80, 95].map((h, i) => (
                                <div key={i} className="bar" style={{ height: `${h}%`, backgroundColor: m.color, opacity: 0.3 + (i * 0.1) }} />
                              ))}
                            </div>
                          </div>
                        </Reorder.Item>
                        );
                      })}
                    </Reorder.Group>
                    {selectedMetrics.length < 4 && (
                      <div 
                        className="v-widget dash-border clickable-add" 
                        onClick={() => {
                          const list = document.querySelector('.metrics-list-clean');
                          list?.scrollIntoView({ behavior: 'smooth' });
                          // Add a brief pulse animation to the list to show where to click
                          list?.classList.add('pulse-highlight');
                          setTimeout(() => list?.classList.remove('pulse-highlight'), 1000);
                        }}
                      >
                        <Plus size={20} />
                        <span>Adicionar Widget</span>
                      </div>
                    )}
                  </div>
                  <div className="preview-footer">
                    <span>{selectedMetrics.length} de 4 métricas ativas no layout principal.</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <style>{`


        .action-group-premium {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .save-toast-elite {
          display: flex;
          align-items: center;
          gap: 8px;
          background: hsl(161 64% 95%);
          color: #16a34a;
          padding: 10px 20px;
          border-radius: 14px;
          border: 1px solid hsl(161 64% 90%);
          font-size: 13px;
          font-weight: 800;
        }

        .save-btn-premium {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 28px;
          background: #0f172a;
          color: white;
          border: none;
          border-radius: 16px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .save-btn-premium:hover { background: #1e293b; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); }

        .primary-btn.success {
          background: #16a34a;
          box-shadow: 0 8px 20px rgba(22, 163, 74, 0.2);
        }



        .settings-grid-layout {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
          gap: 16px;
        }

        .settings-panel {
          background: white;
          padding: 32px;
          border-radius: 28px;
          border: 1px solid hsl(var(--border));
          box-shadow: var(--shadow-sm);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .settings-panel:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
          border-color: hsl(var(--brand) / 0.3);
        }

        .panel-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
          color: hsl(var(--brand));
          border-bottom: 1px solid hsl(var(--border) / 0.4);
          padding-bottom: 12px;
        }

        .panel-header h3 { 
          font-size: 14px; 
          font-weight: 800; 
          color: hsl(var(--text-main)); 
          margin: 0; 
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .field-group { display: flex; flex-direction: column; gap: 20px; }
        .elite-field { display: flex; flex-direction: column; gap: 8px; max-width: 480px; }
        .elite-field label { font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
        .elite-field input, .elite-field select {
          padding: 14px 18px;
          border-radius: 14px;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--bg-main));
          font-size: 14px;
          font-weight: 600;
          color: hsl(var(--text-main));
          transition: all 0.2s;
        }
        .elite-field input:focus, .elite-field select:focus {
          border-color: hsl(var(--brand));
          box-shadow: 0 0 0 4px hsl(var(--brand) / 0.1);
          outline: none;
          background: white;
        }

        .switch-list { display: flex; flex-direction: column; gap: 12px; }
        .premium-switch {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          background: hsl(var(--bg-main));
          border-radius: 20px;
          border: 1px solid hsl(var(--border));
          transition: all 0.2s;
        }
        .premium-switch:hover {
          border-color: hsl(var(--brand) / 0.4);
          background: white;
          transform: translateX(4px);
        }

        .premium-switch .t { display: block; font-size: 14px; font-weight: 700; color: hsl(var(--text-main)); margin-bottom: 2px; }
        .premium-switch .d { font-size: 12px; color: hsl(var(--text-muted)); font-weight: 500; }
        
        .toggle-box { 
          width: 50px; 
          height: 28px; 
          background: hsl(var(--border)); 
          border-radius: 100px; 
          position: relative; 
          cursor: pointer; 
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
        }
        .toggle-box::after { 
          content: ''; 
          position: absolute; 
          width: 22px; 
          height: 22px; 
          background: white; 
          border-radius: 50%; 
          top: 3px; 
          left: 3px; 
          transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .toggle-box.active { background: hsl(var(--brand)); }
        .toggle-box.active::after { left: 25px; }

        .appearance-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 12px; }
        .theme-card {
          padding: 24px;
          border-radius: 20px;
          border: 2px solid hsl(var(--border));
          background: hsl(var(--bg-main));
          font-size: 13px;
          font-weight: 800;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          color: hsl(var(--text-muted));
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .theme-card.active {
          border-color: hsl(var(--brand));
          background: hsl(var(--brand) / 0.05);
          color: hsl(var(--brand));
        }
        .theme-card:hover:not(.active) {
          border-color: hsl(var(--brand) / 0.3);
          color: hsl(var(--text-main));
        }

        .canvas-studio-layout {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 24px;
          background: white;
          padding: 24px;
          border-radius: 32px;
          border: 1px solid hsl(var(--border));
          box-shadow: var(--shadow-sm);
        }

        .metrics-list-clean { display: flex; flex-direction: column; gap: 10px; }
        .metric-option-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: hsl(var(--bg-main));
          border-radius: 18px;
          border: 1px solid hsl(var(--border));
          cursor: pointer;
          width: 100%;
          text-align: left;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .metric-option-item:hover { transform: translateX(4px); border-color: hsl(var(--brand) / 0.5); background: white; }
        .metric-option-item.active { border-color: hsl(var(--brand)); background: hsl(var(--brand) / 0.05); }
        .check { width: 22px; height: 22px; border: 2px solid hsl(var(--border)); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: transparent; transition: all 0.2s; }
        .check.active { background: hsl(var(--brand)); border-color: hsl(var(--brand)); color: white; }
        .txt .name { display: block; font-size: 14px; font-weight: 700; color: hsl(var(--text-main)); }
        .txt .cat { font-size: 11px; font-weight: 800; color: hsl(var(--text-muted)); text-transform: uppercase; letter-spacing: 0.02em; }

        .visual-canvas-preview {
          background: hsl(var(--bg-main));
          border-radius: 32px;
          padding: 24px;
          min-height: 480px;
          border: 1px dashed hsl(var(--border));
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .reorder-wrapper {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 16px;
          width: 100%;
        }

        .v-widget { 
          background: white; 
          border-radius: 20px; 
          box-shadow: 0 4px 12px rgba(0,0,0,0.03); 
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          cursor: grab;
          user-select: none;
          border: 1px solid #f1f5f9;
        }
        .v-widget:active { cursor: grabbing; }

        .v-widget.dash-border {
          background: transparent;
          border: 2px dashed #cbd5e1;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
          cursor: pointer;
          min-height: 120px;
        }
        .v-widget.dash-border:hover { background: white; border-color: #27a376; color: #27a376; }

        .mini-bar-chart {
          display: flex;
          align-items: flex-end;
          gap: 4px;
          height: 40px;
          margin-top: 8px;
        }

        .mini-bar-chart .bar {
          flex: 1;
          border-radius: 3px 3px 0 0;
          min-width: 4px;
        }

        .v-widget-header {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #27a376;
          margin-bottom: 4px;
        }

        .v-widget-header span { flex: 1; color: #475569; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
        .remove-w { background: #fee2e2; color: #ef4444; border: none; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; }
        .remove-w:hover { background: #fecaca; transform: scale(1.1); }

        .v-value-row { display: flex; justify-content: space-between; align-items: baseline; }
        .v-value-row .val { font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; }
        .trend-tag { display: flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 100px; font-size: 10px; font-weight: 800; }
        .trend-tag.up { background: #f0fdf4; color: #16a34a; }
        .trend-tag.down { background: #fef2f2; color: #ef4444; }

        .v-widget.dash-border.clickable-add { 
          background: transparent; 
          border: 2px dashed #cbd5e1; 
          display: flex; 
          flex-direction: column;
          align-items: center; 
          justify-content: center; 
          color: #94a3b8; 
          gap: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .v-widget.dash-border.clickable-add:hover {
          border-color: #27a376;
          color: #27a376;
          background: #f0fdf4;
        }

        .pulse-highlight {
          animation: pulse-green 1s ease-in-out;
        }

        @keyframes pulse-green {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(39, 163, 118, 0.4); }
          50% { transform: scale(1.02); box-shadow: 0 0 0 10px rgba(39, 163, 118, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(39, 163, 118, 0); }
        }

        .preview-footer { margin-top: 16px; font-size: 12px; color: #64748b; font-weight: 500; text-align: center; }

        .settings-panel.full-width { grid-column: 1 / -1; }
        .targets-config-list { display: flex; flex-direction: column; gap: 12px; }
        .target-config-row { 
          display: grid; 
          grid-template-columns: 240px 280px 1fr; 
          gap: 24px; 
          align-items: center; 
          padding: 20px; 
          background: #f8fafc; 
          border-radius: 20px; 
          border: 1px solid #f1f5f9; 
          transition: 0.2s;
        }
        .target-config-row:hover { border-color: #cbd5e1; background: white; }
        
        .m-info { display: flex; align-items: center; gap: 12px; }
        .m-icon-box { width: 36px; height: 36px; border-radius: 10px; background: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
        .m-text .n { display: block; font-size: 13px; font-weight: 800; color: #1e293b; }
        .m-text .c { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; }

        .mode-selector { display: flex; background: #e2e8f0; padding: 4px; border-radius: 12px; gap: 4px; }
        .mode-btn { 
          flex: 1; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          gap: 8px; 
          padding: 8px 12px; 
          border-radius: 8px; 
          border: none; 
          font-size: 10px; 
          font-weight: 900; 
          cursor: pointer; 
          transition: all 0.2s;
          background: transparent;
          color: #64748b;
        }
        .mode-btn.active { background: white; color: #0f172a; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }

        .value-input-area { padding-left: 24px; border-left: 2px solid #e2e8f0; }
        .manual-input label { display: block; font-size: 10px; font-weight: 900; color: #94a3b8; margin-bottom: 4px; }
        .manual-input input { background: white; border: 1px solid #cbd5e1; border-radius: 8px; padding: 6px 12px; font-weight: 800; font-size: 14px; width: 120px; outline: none; }
        .manual-input input:focus { border-color: #16a34a; box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1); }

        .auto-info { display: flex; flex-direction: column; }
        .auto-info .label { font-size: 10px; font-weight: 900; color: #94a3b8; }
        .auto-info .formula { font-size: 13px; font-weight: 800; color: #16a34a; }
      `}</style>
    </div>
  );
};
