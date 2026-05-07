import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Activity, 
  DollarSign, 
  Shield, 
  Users, 
  Server, 
  HardDrive, 
  AlertCircle,
  Database,
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  XCircle,
  RefreshCw,
  Plus,
  CreditCard,
  FileText,
  Lock,
  Eye,
  Edit2,
  LogIn,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { EliteStatCard } from '../../components/Cards/EliteStatCard';
import { TenantForm } from '../../components/Forms/TenantForm';
import { PlanForm } from '../../components/Forms/PlanForm';
import { useAuth } from '../../contexts/AuthContext';
import { logAudit } from '../../utils/audit';
import { supabase } from '../../lib/supabase';

type SaaSAdminTab = 'overview' | 'tenants' | 'plans' | 'health';

export const SaaSAdminPanel: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<SaaSAdminTab>('overview');
  const [isAuditDrawerOpen, setIsAuditDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const path = location.pathname;
    if (path === '/saas' || path === '/saas/') setActiveTab('overview');
    else if (path.includes('tenants')) setActiveTab('tenants');
    else if (path.includes('plans')) setActiveTab('plans');
    else if (path.includes('health')) setActiveTab('health');
  }, [location.pathname]);

  const handleTabChange = (tabId: SaaSAdminTab) => {
    setActiveTab(tabId);
    if (tabId === 'overview') navigate('/saas');
    else navigate(`/saas/${tabId}`);
  };

  const [tenantsList, setTenantsList] = useState([
    { id: 'T-001', name: 'Agropecuária Alvorada', plan: 'Enterprise', users: 45, storage: '450 GB', status: 'Ativo' },
    { id: 'T-002', name: 'Fazenda Rio Grande', plan: 'Pro', users: 12, storage: '120 GB', status: 'Ativo' },
    { id: 'T-003', name: 'Pecuária Boa Vista', plan: 'Starter', users: 3, storage: '15 GB', status: 'Bloqueado' },
    { id: 'T-004', name: 'Grupo Santa Cruz', plan: 'Enterprise', users: 120, storage: '1.2 TB', status: 'Ativo' },
  ]);

  const [plansList, setPlansList] = useState([
    { name: 'Starter', price: 'R$ 499', features: ['Até 5 usuários', '10GB Storage', 'Suporte Email', 'Dashboard Básico'], users: 450, rev: 'R$ 224.550' },
    { name: 'Pro', price: 'R$ 999', features: ['Até 20 usuários', '100GB Storage', 'Suporte WhatsApp', 'BI Avançado', 'API Access'], users: 680, rev: 'R$ 679.320' },
    { name: 'Enterprise', price: 'Personalizado', features: ['Usuários Ilimitados', 'Storage Ilimitado', 'Suporte 24/7 Dedicado', 'On-Premise Option', 'SLA 99.9%'], users: 154, rev: 'R$ 1.54M+' }
  ]);

  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  const handleSaveTenant = (data: any) => {
    if (selectedTenant) {
      setTenantsList(prev => prev.map(t => t.id === selectedTenant.id ? { ...t, ...data } : t));
    } else {
      const newId = `T-00${tenantsList.length + 1}`;
      setTenantsList(prev => [{ id: newId, users: 1, storage: '0 GB', ...data }, ...prev]);
    }
    setIsTenantModalOpen(false);
  };

  const handleSavePlan = (data: any) => {
    if (selectedPlan) {
      setPlansList(prev => prev.map(p => p.name === selectedPlan.name ? { ...p, ...data } : p));
    } else {
      setPlansList(prev => [...prev, { users: 0, rev: 'R$ 0', ...data }]);
    }
    setIsPlanModalOpen(false);
  };

  const openNewTenant = () => { setSelectedTenant(null); setIsTenantModalOpen(true); };
  const openEditTenant = (tenant: any) => { setSelectedTenant(tenant); setIsTenantModalOpen(true); };
  
  const openNewPlan = () => { setSelectedPlan(null); setIsPlanModalOpen(true); };
  const openEditPlan = (plan: any) => { setSelectedPlan(plan); setIsPlanModalOpen(true); };

  const handleImpersonate = async (tenantId: string) => {
    localStorage.setItem('saas_impersonate_tenant_id', tenantId);
    
    await supabase.from('saas_audit_logs').insert({
      admin_id: user?.id,
      target_tenant_id: tenantId,
      action: 'IMPERSONATE',
      metadata: { source: 'SaaSAdminPanel' }
    });

    window.location.href = '/dashboard'; // Force a full reload to reset context states
  };

  const tenantColumns = [
    {
      header: 'Tenant',
      accessor: (item: any) => (
        <div className="table-cell-title">
          <span className="main-text">{item.name}</span>
          <div className="sub-meta uppercase font-bold text-[10px] tracking-wider">
            {item.id}
          </div>
        </div>
      )
    },
    {
      header: 'Plano',
      accessor: (item: any) => (
        <span className={`plan-badge ${item.plan.toLowerCase()}`}>{item.plan}</span>
      )
    },
    {
      header: 'Uso',
      accessor: (item: any) => (
        <div className="flex flex-col gap-1 text-[12px] font-bold text-slate-500">
          <span>{item.users} usuários ativos</span>
          <span>{item.storage} de storage</span>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: (item: any) => (
        <span className={`status-pill ${item.status === 'Ativo' ? 'active' : 'stopped'}`}>
          {item.status}
        </span>
      ),
      align: 'center' as const
    }
  ];

  return (
    <div className="admin-page">
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge" style={{ background: 'hsl(var(--bg-sidebar))', color: '#38bdf8' }}>
            <Server size={14} fill="currentColor" />
            <span>SAAS SUPER ADMIN v5.0</span>
          </div>
          <h1 className="page-title">
            {activeTab === 'overview' && 'Visão Global'}
            {activeTab === 'tenants' && 'Gestão de Tenants'}
            {activeTab === 'plans' && 'Planos & Faturamento'}
            {activeTab === 'health' && 'Saúde do Sistema'}
          </h1>
          <p className="page-subtitle">Gestão executiva, monitoramento de instâncias e controle de inquilinos da plataforma.</p>
        </div>
        <div className="page-actions">
          <button className="glass-btn secondary" onClick={() => setIsAuditDrawerOpen(true)}>
            <History size={18} />
            LOGS DE AUDITORIA
          </button>
          <button 
            className="primary-btn" 
            onClick={activeTab === 'plans' ? openNewPlan : openNewTenant}
            style={{ display: (activeTab === 'overview' || activeTab === 'health') ? 'none' : 'flex' }}
          >
            <Plus size={18} />
            {activeTab === 'plans' ? 'NOVO PLANO' : 'NOVO TENANT'}
          </button>
        </div>
      </header>

      <main className="management-content">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="saas-view"
            >
              <div className="next-gen-kpi-grid">
                <EliteStatCard 
                  label="Receita Mensal (MRR)" 
                  value="R$ 2.45M" 
                  icon={DollarSign} 
                  color="#10b981" 
                  trend="up" 
                  change="+12.4%" 
                  sparkline={[{value: 30}, {value: 45}, {value: 60}, {value: 85}]}
                />
                <EliteStatCard 
                  label="Total de Inquilinos" 
                  value="1.284" 
                  icon={Globe} 
                  color="#3b82f6" 
                  trend="up" 
                  change="+82 este mês" 
                  sparkline={[{value: 20}, {value: 30}, {value: 50}, {value: 70}]}
                />
                <EliteStatCard 
                  label="Usuários Ativos" 
                  value="18.5k" 
                  icon={Users} 
                  color="#6366f1" 
                  trend="up" 
                  change="+5.2%" 
                  sparkline={[{value: 40}, {value: 55}, {value: 65}, {value: 80}]}
                />
                <EliteStatCard 
                  label="Saúde da Rede" 
                  value="99.98%" 
                  icon={Activity} 
                  color="#f59e0b" 
                  trend="neutral" 
                  change="SLA Nominal" 
                  sparkline={[{value: 99}, {value: 98}, {value: 99}, {value: 99}]}
                />
              </div>

              <div className="health-grid">
                <div className="health-panel">
                  <div className="panel-header">
                    <Database size={18} />
                    <h3>Banco de Dados & Clusters</h3>
                  </div>
                  <div className="h-metrics">
                    <div className="h-metric">
                      <span>Carga do Banco (BR-East-01)</span>
                      <div className="progress-bar"><div className="fill warning" style={{ width: '75%' }}></div></div>
                      <span className="h-val">75% - Atenção Monitorada</span>
                    </div>
                  </div>
                </div>
                <div className="health-panel">
                  <div className="panel-header">
                    <Shield size={18} />
                    <h3>Segurança & Acessos</h3>
                  </div>
                  <div className="h-metrics">
                    <div className="h-metric">
                      <span>Tentativas de Brute Force (24h)</span>
                      <div className="progress-bar"><div className="fill good" style={{ width: '12%' }}></div></div>
                      <span className="h-val">Baixo Risco (120 detectadas)</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'tenants' && (
            <motion.div 
              key="tenants"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="saas-view"
            >
              <div className="elite-controls-row">
                <div className="elite-search-wrapper">
                  <Search size={18} className="s-icon" />
                  <input 
                    className="elite-search-input"
                    type="text" 
                    placeholder="Buscar inquilinos, CNPJ ou ID..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <ModernTable 
                data={tenantsList.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.id.toLowerCase().includes(searchQuery.toLowerCase()))}
                columns={tenantColumns}
                loading={false}
                hideHeader={true}
                searchPlaceholder="Buscar inquilinos, CNPJ ou ID..."
                actions={(item) => (
                  <div className="modern-actions">
                    <button className="action-dot success" onClick={() => handleImpersonate(item.id)} title="Acessar como Inquilino">
                      <LogIn size={18} />
                    </button>
                    <button className="action-dot edit" onClick={() => openEditTenant(item)} title="Editar Tenant">
                      <Edit2 size={18} />
                    </button>
                    <button className="action-dot info" title="Ver Detalhes">
                      <Eye size={18} />
                    </button>
                  </div>
                )}
              />
            </motion.div>
          )}

          {activeTab === 'plans' && (
            <motion.div 
              key="plans"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="saas-view"
            >
              <div className="plans-grid">
                {plansList.map(plan => (
                  <div key={plan.name} className="plan-card">
                    <div className="plan-header">
                      <h3>{plan.name}</h3>
                      <div className="plan-price">{plan.price}<span>/mês</span></div>
                    </div>
                    <div className="plan-stats">
                      <div className="p-stat"><span>Tenants</span><strong>{plan.users}</strong></div>
                      <div className="p-stat"><span>MRR</span><strong>{plan.rev}</strong></div>
                    </div>
                    <ul className="plan-features">
                      {plan.features.map((f, i) => (
                        <li key={i}><CheckCircle size={16} />{f}</li>
                      ))}
                    </ul>
                    <button className="edit-plan-btn" onClick={() => openEditPlan(plan)}>Editar Plano</button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'health' && (
            <motion.div 
              key="health"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="saas-view"
            >
              <div className="health-grid">
                <section className="health-panel">
                  <div className="panel-header">
                    <Database size={18} />
                    <h3>Banco de Dados & Storage</h3>
                  </div>
                  <div className="h-metrics">
                    <div className="h-metric">
                      <span>Carga do Banco (Supabase)</span>
                      <div className="progress-bar"><div className="fill warning" style={{ width: '75%' }}></div></div>
                      <span className="h-val">75% (Atenção)</span>
                    </div>
                    <div className="h-metric">
                      <span>Uso de Storage S3</span>
                      <div className="progress-bar"><div className="fill good" style={{ width: '42%' }}></div></div>
                      <span className="h-val">42% (Normal)</span>
                    </div>
                  </div>
                </section>

                <section className="health-panel">
                  <div className="panel-header">
                    <Server size={18} />
                    <h3>Instâncias de Aplicação</h3>
                  </div>
                  <div className="node-list">
                    {[
                      { name: 'App Node 01 (BR-East)', status: 'online', cpu: '22%', mem: '1.4GB' },
                      { name: 'App Node 02 (BR-East)', status: 'online', cpu: '28%', mem: '1.6GB' },
                      { name: 'Worker Node 01 (Jobs)', status: 'online', cpu: '85%', mem: '3.2GB' },
                      { name: 'App Node 03 (US-East)', status: 'offline', cpu: '-', mem: '-' }
                    ].map(node => (
                      <div key={node.name} className="node-item">
                        <div className={`node-status ${node.status}`}></div>
                        <div className="n-info">
                          <span className="n-name">{node.name}</span>
                          <span className="n-res">CPU: {node.cpu} | RAM: {node.mem}</span>
                        </div>
                        <button className="n-action"><RefreshCw size={14} /></button>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <TenantForm 
          isOpen={isTenantModalOpen} 
          onClose={() => setIsTenantModalOpen(false)}
          onSubmit={handleSaveTenant}
          initialData={selectedTenant}
        />

        <PlanForm 
          isOpen={isPlanModalOpen} 
          onClose={() => setIsPlanModalOpen(false)}
          onSubmit={handleSavePlan}
          initialData={selectedPlan}
        />

        {/* Quick Audit Drawer */}
        <AnimatePresence>
          {isAuditDrawerOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="drawer-overlay"
                onClick={() => setIsAuditDrawerOpen(false)}
              />
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="audit-drawer"
              >
                <div className="drawer-header">
                  <div className="title-group">
                    <History className="text-brand" />
                    <div>
                      <h3>Auditoria em Tempo Real</h3>
                      <p>Logs críticos de segurança e infraestrutura</p>
                    </div>
                  </div>
                  <button className="icon-btn" onClick={() => setIsAuditDrawerOpen(false)}>
                    <Plus size={20} style={{ transform: 'rotate(45deg)' }} />
                  </button>
                </div>
                <div className="drawer-content">
                  {[
                    { id: 1, action: 'IMPERSONATE', tenant: 'AgroFazenda v3', admin: 'Thiago Costa', time: 'Há 2 min', status: 'warning' },
                    { id: 2, action: 'BACKUP_CREATED', tenant: 'System', admin: 'Automático', time: 'Há 15 min', status: 'success' },
                    { id: 3, action: 'PLAN_UPGRADE', tenant: 'Pecuária Elite', admin: 'Vendas Bot', time: 'Há 1h', status: 'success' },
                    { id: 4, action: 'AUTH_FAILURE', tenant: 'Unidade Matriz', admin: 'Desconhecido', time: 'Há 2h', status: 'danger' },
                  ].map(log => (
                    <div key={log.id} className="audit-log-item">
                      <div className={`status-dot ${log.status}`} />
                      <div className="log-info">
                        <div className="log-top">
                          <span className="log-action">{log.action}</span>
                          <span className="log-time">{log.time}</span>
                        </div>
                        <p className="log-desc">
                          <strong>{log.admin}</strong> agindo em <span>{log.tenant}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="drawer-footer">
                  <button className="glass-btn full-width">VER RELATÓRIO COMPLETO</button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </main>

      <style>{`
        .saas-view {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .saas-view {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* KPI Grid specifically for SaaS */
        .next-gen-kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 16px;
        }

        /* Plans & Health Cards */
        .plans-grid, .health-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 20px;
        }

        .plan-card, .health-panel {
          background: hsl(var(--bg-card));
          padding: 28px;
          border-radius: 28px;
          border: 1px solid hsl(var(--border));
          box-shadow: var(--shadow-sm);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          gap: 20px;
          position: relative;
          overflow: hidden;
        }

        .plan-card:hover, .health-panel:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-md);
          border-color: hsl(var(--brand) / 0.3);
        }

        .plan-header h3 { 
          font-size: 18px; 
          font-weight: 800; 
          color: hsl(var(--text-main)); 
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .plan-price { 
          font-size: 32px; 
          font-weight: 900; 
          color: hsl(var(--text-main)); 
          letter-spacing: -0.04em;
        }

        .plan-price span { 
          font-size: 14px; 
          color: hsl(var(--text-muted)); 
          font-weight: 600;
          margin-left: 4px;
        }

        .plan-stats { 
          display: flex; 
          gap: 16px; 
          padding: 16px; 
          background: hsl(var(--bg-main)); 
          border-radius: 16px; 
          border: 1px solid hsl(var(--border) / 0.5);
        }

        .p-stat { flex: 1; display: flex; flex-direction: column; gap: 4px; }
        .p-stat span { font-size: 10px; font-weight: 800; color: hsl(var(--text-muted)); text-transform: uppercase; letter-spacing: 0.05em; }
        .p-stat strong { font-size: 15px; font-weight: 800; color: hsl(var(--text-main)); }

        .plan-features { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px; }
        .plan-features li { 
          display: flex; 
          align-items: center; 
          gap: 10px; 
          font-size: 13px; 
          font-weight: 600; 
          color: hsl(var(--text-main)); 
        }
        .plan-features li svg { color: hsl(var(--brand)); }

        .edit-plan-btn {
          margin-top: auto;
          width: 100%;
          padding: 14px;
          background: hsl(var(--bg-main));
          border: 1px solid hsl(var(--border));
          border-radius: 14px;
          font-weight: 800;
          font-size: 12px;
          color: hsl(var(--text-main));
          text-transform: uppercase;
          letter-spacing: 0.05em;
          transition: all 0.2s;
        }

        .edit-plan-btn:hover { 
          background: white; 
          border-color: hsl(var(--brand)); 
          color: hsl(var(--brand));
          box-shadow: 0 4px 12px hsl(var(--brand) / 0.1);
        }

        /* Health Panel Specifics */
        .health-panel .panel-header {
          display: flex;
          align-items: center;
          gap: 12px;
          color: hsl(var(--brand));
          border-bottom: 1px solid hsl(var(--border) / 0.5);
          padding-bottom: 16px;
          margin-bottom: 0;
        }

        .health-panel .panel-header h3 {
          font-size: 14px;
          font-weight: 800;
          color: hsl(var(--text-main));
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .h-metrics { display: flex; flex-direction: column; gap: 16px; }
        .h-metric span { font-size: 12px; font-weight: 700; color: hsl(var(--text-muted)); display: block; margin-bottom: 8px; }
        
        .progress-bar { height: 6px; background: hsl(var(--border)); border-radius: 100px; overflow: hidden; margin-bottom: 6px; }
        .progress-bar .fill { height: 100%; border-radius: 100px; transition: width 1s ease-in-out; }
        .progress-bar .fill.good { background: #10b981; }
        .progress-bar .fill.warning { background: #f59e0b; }
        .progress-bar .fill.danger { background: #ef4444; }
        
        .h-val { font-size: 11px; font-weight: 800; color: hsl(var(--text-main)); }

        .node-list { display: flex; flex-direction: column; gap: 10px; }
        .node-item { 
          display: flex; 
          align-items: center; 
          gap: 14px; 
          padding: 14px; 
          background: hsl(var(--bg-main)); 
          border-radius: 16px; 
          border: 1px solid hsl(var(--border) / 0.5);
          transition: all 0.2s;
        }
        .node-item:hover { border-color: hsl(var(--brand) / 0.3); background: white; transform: translateX(4px); }
        
        .node-status { width: 8px; height: 8px; border-radius: 50%; position: relative; }
        .node-status.online { background: #10b981; }
        .node-status.online::after {
          content: ''; position: absolute; inset: -4px; border-radius: 50%; background: #10b981; opacity: 0.2;
          animation: pulse 2s infinite;
        }
        .node-status.offline { background: #ef4444; }

        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(2.5); opacity: 0; }
        }

        .n-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
        .n-name { font-size: 13px; font-weight: 700; color: hsl(var(--text-main)); }
        .n-res { font-size: 11px; color: hsl(var(--text-muted)); font-weight: 600; }
        
        .n-action { 
          background: white; 
          border: 1px solid hsl(var(--border)); 
          border-radius: 10px; 
          width: 32px; 
          height: 32px; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          color: hsl(var(--text-muted));
          transition: all 0.2s;
        }
        .n-action:hover { color: hsl(var(--brand)); border-color: hsl(var(--brand)); transform: rotate(180deg); }

        /* Drawer Styles */
        .drawer-overlay {
          position: fixed;
          inset: 0;
          background: hsl(var(--bg-sidebar) / 0.4);
          backdrop-filter: blur(8px);
          z-index: 1000;
        }

        .audit-drawer {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          width: 420px;
          background: white;
          box-shadow: -20px 0 60px rgba(0,0,0,0.15);
          z-index: 1001;
          display: flex;
          flex-direction: column;
        }

        .drawer-header {
          padding: 32px;
          border-bottom: 1px solid hsl(var(--border));
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .drawer-header h3 { font-size: 16px; font-weight: 800; color: hsl(var(--text-main)); margin: 0; text-transform: uppercase; letter-spacing: 0.05em; }
        .drawer-header p { font-size: 12px; color: hsl(var(--text-muted)); margin: 4px 0 0; font-weight: 500; }

        .drawer-content { flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 12px; }

        .audit-log-item {
          display: flex;
          gap: 16px;
          padding: 18px;
          background: hsl(var(--bg-main));
          border-radius: 20px;
          border: 1px solid hsl(var(--border) / 0.5);
          transition: all 0.2s;
        }
        .audit-log-item:hover { border-color: hsl(var(--brand) / 0.3); transform: translateX(-4px); }

        .status-dot { width: 8px; height: 8px; border-radius: 50%; margin-top: 6px; flex-shrink: 0; }
        .status-dot.success { background: #10b981; }
        .status-dot.warning { background: #f59e0b; }
        .status-dot.danger { background: #ef4444; }

        .log-info { flex: 1; }
        .log-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
        .log-action { font-size: 10px; font-weight: 800; color: hsl(var(--brand)); text-transform: uppercase; letter-spacing: 0.05em; }
        .log-time { font-size: 10px; color: hsl(var(--text-muted)); font-weight: 700; }
        .log-desc { font-size: 13px; color: hsl(var(--text-main)); margin: 0; line-height: 1.4; }
        .log-desc strong { font-weight: 800; color: hsl(var(--text-main)); }
        .log-desc span { color: hsl(var(--brand)); font-weight: 700; }

        .drawer-footer { padding: 32px; border-top: 1px solid hsl(var(--border)); }
      `}</style>
    </div>
  );
};
