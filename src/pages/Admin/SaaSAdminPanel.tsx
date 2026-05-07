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
  History,
  LayoutGrid,
  List as ListIcon
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
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');

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

  const tabConfig = {
    overview: {
      title: 'Central de Gestão Multi-Tenant',
      subtitle: 'Monitoramento executivo de instâncias, faturamento global e governança de infraestrutura.',
      icon: Server
    },
    tenants: {
      title: 'Gestão de Clientes (Tenants)',
      subtitle: 'Controle de instâncias ativas, provisionamento e acesso administrativo direto.',
      icon: Globe
    },
    plans: {
      title: 'Catálogo de Planos & Revenue',
      subtitle: 'Configuração de ofertas comerciais, limites de uso e métricas de faturamento.',
      icon: CreditCard
    },
    health: {
      title: 'Saúde & Infraestrutura',
      subtitle: 'Monitoramento em tempo real de nodes, banco de dados e performance global.',
      icon: Activity
    }
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
    <div className="admin-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge" style={{ background: 'hsl(var(--bg-sidebar))', color: 'hsl(var(--brand))', border: '1px solid hsl(var(--brand) / 0.3)' }}>
            {React.createElement(tabConfig[activeTab].icon, { size: 14, fill: "currentColor" })}
            <span>SAAS INFRASTRUCTURE v5.0</span>
          </div>
          <h1 className="page-title">
            {tabConfig[activeTab].title}
          </h1>
          <p className="page-subtitle">{tabConfig[activeTab].subtitle}</p>
        </div>
        <div className="page-actions">
          <button className="glass-btn secondary" onClick={() => setIsAuditDrawerOpen(true)}>
            <History size={18} />
            AUDITORIA GLOBAL
          </button>
          <button 
            className="primary-btn" 
            onClick={activeTab === 'plans' ? openNewPlan : openNewTenant}
            style={{ display: (activeTab === 'overview' || activeTab === 'health') ? 'none' : 'flex' }}
          >
            <Plus size={18} />
            {activeTab === 'plans' ? 'CRIAR PLANO' : 'NOVO TENANT'}
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
                    placeholder="Filtrar por nome, CNPJ ou ID de instância..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="elite-filter-group">
                  <div className="view-toggle-elite">
                    <button 
                      className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                      onClick={() => setViewMode('list')}
                    >
                      <ListIcon size={18} />
                    </button>
                    <button 
                      className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                      onClick={() => setViewMode('grid')}
                    >
                      <LayoutGrid size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {viewMode === 'list' ? (
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
              ) : (
                <div className="user-cards-grid">
                  {tenantsList
                    .filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.id.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map(t => {
                      const getPlanColor = (plan: string) => {
                        if (plan === 'Enterprise') return 'info-badge';
                        if (plan === 'Pro') return 'active';
                        return '';
                      };

                      return (
                        <motion.div 
                          key={t.id} 
                          layout
                          className={`user-card-premium ${t.status === 'Bloqueado' ? 'stopped' : 'active'}`}
                        >
                          <div className="card-left-section">
                            <div className="card-avatar" style={{ background: 'hsl(var(--brand) / 0.1)', color: 'hsl(var(--brand))' }}>
                              <Globe size={32} />
                            </div>
                            <div className="card-bottom-actions">
                              <button className="action-icon-btn" onClick={() => handleImpersonate(t.id)} title="Acessar Instância"><LogIn size={16} /></button>
                              <button className="action-icon-btn" onClick={() => openEditTenant(t)} title="Configurar"><Edit2 size={16} /></button>
                              <button className="action-icon-btn" title="Logs"><Eye size={16} /></button>
                            </div>
                          </div>

                          <div className="card-main-content">
                            <div className="card-header-info">
                              <h3>{t.name}</h3>
                              <span className={`plan-badge ${t.plan.toLowerCase()}`}>
                                {t.plan}
                              </span>
                            </div>

                            <div className="card-meta-grid">
                              <div className="meta-item">
                                <Users size={14} className="meta-icon" />
                                <span>{t.users} Assentos Ativos</span>
                              </div>
                              <div className="meta-item">
                                <HardDrive size={14} className="meta-icon" />
                                <span>{t.storage} Alocados</span>
                              </div>
                              <div className="meta-item">
                                <Shield size={14} className="meta-icon" />
                                <span>{t.id}</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                </div>
              )}
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
              <div className="elite-controls-row">
                <div className="elite-search-wrapper">
                  <Search size={18} className="s-icon" />
                  <input 
                    className="elite-search-input"
                    type="text" 
                    placeholder="Filtrar catálogo de planos..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="view-mode-toggle">
                  <button 
                    className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                    onClick={() => setViewMode('list')}
                    title="Visualização em Lista"
                  >
                    <ListIcon size={18} />
                  </button>
                  <button 
                    className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                    onClick={() => setViewMode('grid')}
                    title="Visualização em Cards"
                  >
                    <LayoutGrid size={18} />
                  </button>
                </div>
              </div>

              {viewMode === 'list' ? (
                <ModernTable 
                  data={plansList.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))}
                  columns={[
                    { header: 'Plano', accessor: (p: any) => <div className="table-cell-title"><span className="main-text">{p.name}</span></div> },
                    { header: 'Preço', accessor: (p: any) => <div className="table-cell-meta"><DollarSign size={14} />{p.price}</div> },
                    { header: 'Tenants', accessor: (p: any) => <div className="table-cell-meta"><Users size={14} />{p.users} Clientes</div> },
                    { header: 'MRR', accessor: (p: any) => <span className="status-pill active">{p.rev}</span> }
                  ]}
                  loading={false}
                  hideHeader={true}
                  actions={(item) => (
                    <div className="modern-actions">
                      <button className="action-dot edit" onClick={() => openEditPlan(item)} title="Editar Plano">
                        <Edit2 size={18} />
                      </button>
                    </div>
                  )}
                />
              ) : (
                <div className="user-cards-grid">
                  {plansList
                    .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map(plan => {
                      const getPlanBadgeClass = (name: string) => {
                        if (name === 'Enterprise') return 'info-badge';
                        if (name === 'Pro') return 'active';
                        return '';
                      };

                      return (
                        <motion.div 
                          key={plan.name} 
                          layout
                          className={`user-card-premium ${getPlanBadgeClass(plan.name)}`}
                        >
                          <div className="card-left-section" style={{ width: '110px' }}>
                            <div className="card-avatar" style={{ background: '#f59e0b' }}>
                              <CreditCard size={32} />
                            </div>
                            <div className="card-bottom-actions">
                              <button className="action-icon-btn" onClick={() => openEditPlan(plan)} title="Editar"><Edit2 size={16} /></button>
                            </div>
                          </div>

                          <div className="card-main-content">
                            <div className="card-header-info">
                              <h3>{plan.name}</h3>
                              <span className="card-role-badge" style={{ color: '#f59e0b', background: '#fffbeb' }}>
                                {plan.price}
                              </span>
                            </div>

                            <div className="card-meta-grid">
                              <div className="meta-item">
                                <Users size={14} className="meta-icon" style={{ color: '#f59e0b' }} />
                                <span>{plan.users} Clientes Ativos</span>
                              </div>
                              <div className="meta-item">
                                <DollarSign size={14} className="meta-icon" style={{ color: '#f59e0b' }} />
                                <span>MRR: {plan.rev}</span>
                              </div>
                              <div className="meta-item">
                                <CheckCircle size={14} className="meta-icon" style={{ color: '#f59e0b' }} />
                                <span>{plan.features.length} Recursos inclusos</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                </div>
              )}
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

        .next-gen-kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }

        .health-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 20px;
        }

        .health-panel {
          background: hsl(var(--bg-card));
          padding: 32px;
          border-radius: 28px;
          border: 1px solid hsl(var(--border));
          box-shadow: var(--shadow-sm);
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .panel-header {
          display: flex;
          align-items: center;
          gap: 12px;
          color: hsl(var(--brand));
          padding-bottom: 16px;
          border-bottom: 1px solid hsl(var(--border) / 0.5);
        }

        .panel-header h3 {
          font-size: 14px;
          font-weight: 800;
          color: hsl(var(--text-main));
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .h-metrics { display: flex; flex-direction: column; gap: 20px; }
        .h-metric span { font-size: 12px; font-weight: 700; color: hsl(var(--text-muted)); display: block; margin-bottom: 10px; }
        
        .progress-bar { height: 8px; background: hsl(var(--bg-main)); border-radius: 100px; overflow: hidden; }
        .progress-bar .fill { height: 100%; border-radius: 100px; transition: width 1.5s cubic-bezier(0.4, 0, 0.2, 1); }
        .progress-bar .fill.good { background: hsl(161 64% 39%); box-shadow: 0 0 15px hsl(161 64% 39% / 0.4); }
        .progress-bar .fill.warning { background: #f59e0b; box-shadow: 0 0 15px rgba(245, 158, 11, 0.4); }
        
        .node-list { display: flex; flex-direction: column; gap: 12px; }
        .node-item { 
          display: flex; 
          align-items: center; 
          gap: 16px; 
          padding: 16px; 
          background: hsl(var(--bg-main) / 0.5); 
          border-radius: 20px; 
          border: 1px solid hsl(var(--border));
          transition: all 0.3s;
        }
        .node-item:hover { border-color: hsl(var(--brand) / 0.4); background: hsl(var(--bg-card)); transform: translateX(6px); }
        
        .node-status { width: 10px; height: 10px; border-radius: 50%; }
        .node-status.online { background: #10b981; box-shadow: 0 0 10px #10b981; }
        .node-status.offline { background: #ef4444; opacity: 0.5; }

        .n-info { flex: 1; display: flex; flex-direction: column; }
        .n-name { font-size: 13px; font-weight: 800; color: hsl(var(--text-main)); }
        .n-res { font-size: 11px; font-weight: 600; color: hsl(var(--text-muted)); }

        .n-action { 
          width: 32px; height: 32px; border-radius: 10px; border: 1px solid hsl(var(--border)); 
          display: flex; align-items: center; justify-content: center; color: hsl(var(--text-muted));
          transition: 0.2s;
        }
        .n-action:hover { color: hsl(var(--brand)); border-color: hsl(var(--brand)); background: hsl(var(--bg-card)); }

        /* Audit Drawer Premium */
        .drawer-overlay { position: fixed; inset: 0; background: rgba(2, 6, 23, 0.6); backdrop-filter: blur(8px); z-index: 10000; }
        .audit-drawer { 
          position: fixed; right: 0; top: 0; bottom: 0; width: 450px; 
          background: hsl(var(--bg-card)); border-left: 1px solid hsl(var(--border)); 
          z-index: 10001; box-shadow: -20px 0 60px rgba(0,0,0,0.3);
          display: flex; flex-direction: column;
        }

        .drawer-header { padding: 32px; border-bottom: 1px solid hsl(var(--border)); display: flex; justify-content: space-between; align-items: center; }
        .drawer-header .title-group { display: flex; align-items: center; gap: 16px; }
        .drawer-header h3 { font-size: 18px; font-weight: 800; color: hsl(var(--text-main)); margin: 0; }
        .drawer-header p { font-size: 12px; color: hsl(var(--text-muted)); margin: 2px 0 0; }

        .drawer-content { flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 12px; }
        .audit-log-item { 
          padding: 16px; border-radius: 16px; background: hsl(var(--bg-main) / 0.5); 
          border: 1px solid hsl(var(--border)); display: flex; gap: 16px; align-items: flex-start;
          transition: 0.2s;
        }
        .audit-log-item:hover { transform: translateX(-4px); border-color: hsl(var(--brand) / 0.3); background: hsl(var(--bg-card)); }

        .status-dot { width: 8px; height: 8px; border-radius: 50%; margin-top: 6px; }
        .status-dot.success { background: #10b981; }
        .status-dot.warning { background: #f59e0b; }
        .status-dot.danger { background: #ef4444; }

        .log-info { flex: 1; }
        .log-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
        .log-action { font-size: 11px; font-weight: 900; color: hsl(var(--brand)); letter-spacing: 0.05em; }
        .log-time { font-size: 11px; color: hsl(var(--text-muted)); font-weight: 600; }
        .log-desc { font-size: 13px; color: hsl(var(--text-main)); margin: 0; line-height: 1.4; }
        .log-desc span { color: hsl(var(--brand)); font-weight: 700; }

        .drawer-footer { padding: 32px; border-top: 1px solid hsl(var(--border)); }
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
          background: hsl(var(--bg-card));
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

        .view-mode-toggle {
          display: flex;
          background: hsl(var(--bg-main));
          padding: 4px;
          border-radius: 12px;
          gap: 4px;
          margin: 0 16px;
        }

        .view-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: hsl(var(--text-muted));
          cursor: pointer;
          transition: 0.2s;
        }

        .view-btn.active {
          background: hsl(var(--bg-card));
          color: hsl(var(--brand));
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }

        .user-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: 20px;
          padding: 8px;
        }

        .user-card-premium {
          background: hsl(var(--bg-card));
          border-radius: 24px;
          border: 1px solid hsl(var(--border));
          display: flex;
          overflow: hidden;
          padding: 0;
          height: 180px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 15px rgba(0,0,0,0.03);
          position: relative;
          text-align: left;
        }

        .user-card-premium::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 6px;
          background: hsl(var(--border-strong));
          transition: 0.3s;
        }

        .user-card-premium.active::before {
          background: #16a34a;
          box-shadow: 4px 0 15px rgba(22, 163, 74, 0.3);
        }

        .user-card-premium.info-badge::before {
          background: #3b82f6;
          box-shadow: 4px 0 15px rgba(59, 130, 246, 0.3);
        }

        .user-card-premium:hover {
          transform: translateY(-8px);
          box-shadow: var(--shadow-lg);
          border-color: hsl(var(--brand) / 0.3);
        }

        .card-left-section {
          width: 130px;
          background: hsl(var(--bg-main) / 0.5);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-right: 1px solid hsl(var(--border));
        }

        .card-avatar {
          width: 70px;
          height: 70px;
          background: hsl(var(--bg-main));
          color: hsl(var(--text-main));
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          font-weight: 900;
          margin-bottom: 12px;
          box-shadow: 0 10px 20px rgba(0,0,0,0.2);
          border: 1px solid hsl(var(--border));
        }

        .card-main-content {
          flex: 1;
          padding: 20px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .card-header-info {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 4px;
        }

        .card-header-info h3 {
          font-size: 17px;
          font-weight: 900;
          color: hsl(var(--text-main));
          margin: 0;
          letter-spacing: -0.02em;
          flex: 1;
        }

        .card-meta-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 8px;
          margin-top: 12px;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 8px;
          color: hsl(var(--text-muted));
          font-size: 12px;
          font-weight: 600;
        }

        .meta-icon {
          color: hsl(var(--brand));
        }

        .card-bottom-actions {
          display: flex;
          gap: 8px;
          margin-top: 15px;
        }

        .action-icon-btn {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--bg-card));
          color: hsl(var(--text-muted));
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: 0.2s;
        }

        .action-icon-btn:hover {
          background: hsl(var(--brand));
          color: white;
          transform: scale(1.1);
          border-color: hsl(var(--brand));
        }
      `}</style>
    </div>
  );
};
