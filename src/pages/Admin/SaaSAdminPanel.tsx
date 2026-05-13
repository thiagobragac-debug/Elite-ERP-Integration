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
  Zap,
  Filter,
  MoreVertical,
  CheckCircle,
  XCircle,
  ShieldCheck,
  RefreshCw,
  Plus,
  CreditCard,
  FileText,
  Lock,
  Eye,
  ChevronDown,
  Edit2,
  LogIn,
  History,
  LayoutGrid,
  List as ListIcon,
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { EliteStatCard } from '../../components/Cards/EliteStatCard';
import { TenantForm } from '../../components/Forms/TenantForm';
import { PlanForm } from '../../components/Forms/PlanForm';
import { useAuth } from '../../contexts/AuthContext';
import { logAudit } from '../../utils/audit';
import { supabase } from '../../lib/supabase';
import { SaaSFilterModal } from './components/SaaSFilterModal';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/export';

type SaaSAdminTab = 'overview' | 'tenants' | 'plans' | 'billing' | 'health' | 'settings';

export const SaaSAdminPanel: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<SaaSAdminTab>('overview');
  const [isAuditDrawerOpen, setIsAuditDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterValues, setFilterValues] = useState({
    status: 'all',
    plan: 'all',
    minUsers: 0,
    maxUsers: 1000,
    dateStart: '',
    dateEnd: ''
  });

  useEffect(() => {
    const path = location.pathname;
    if (path === '/saas' || path === '/saas/') setActiveTab('overview');
    else if (path.includes('tenants')) setActiveTab('tenants');
    else if (path.includes('plans')) setActiveTab('plans');
    else if (path.includes('billing')) setActiveTab('billing');
    else if (path.includes('health')) setActiveTab('health');
    else if (path.includes('settings')) setActiveTab('settings');
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
    billing: {
      title: 'Financeiro & Revenue Intelligence',
      subtitle: 'Monitoramento de MRR, fluxos de caixa, assinaturas e saúde financeira global.',
      icon: Edit2
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
    settings: {
      title: 'Configurações de Infraestrutura',
      subtitle: 'Gerenciamento de chaves de API, webhooks e parâmetros globais do ecossistema.',
      icon: Shield
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

  const [billingSubTab, setBillingSubTab] = useState('monitor');
  const [isBillingHistoryModalOpen, setIsBillingHistoryModalOpen] = useState(false);
  const [selectedHistoryTenant, setSelectedHistoryTenant] = useState<any>(null);

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

  const [gatewaySettings, setGatewaySettings] = useState<any>({
    stripe: { is_active: false, environment: 'test', api_key: '', secret_key: '' },
    asaas: { is_active: false, environment: 'test', api_key: '' },
    pagarme: { is_active: false, environment: 'test', api_key: '', encryption_key: '' }
  });

  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [isRetentionModalOpen, setIsRetentionModalOpen] = useState(false);
  const [retentionSettings, setRetentionSettings] = useState({
    alertDays: 5,
    readOnlyDays: 10,
    pecuariaOnlyDays: 15,
    forcedPaymentDays: 20
  });

  const handleReprocessFailures = async () => {
    setIsLoadingSettings(true);
    // Simulating backend reprocess
    setTimeout(async () => {
      await logAudit({
        admin_id: user?.id,
        action: 'BILLING_REPROCESS',
        metadata: { status: 'success', items_processed: 12 }
      });
      setIsLoadingSettings(false);
      alert('Reprocessamento concluído: 12 faturas re-encaminhadas para o gateway.');
    }, 1500);
  };

  const handleFiscalReport = () => {
    handleExport('pdf');
    logAudit({
      admin_id: user?.id,
      action: 'EXPORT_FISCAL_REPORT',
      metadata: { format: 'pdf' }
    });
  };

  // Fetch Gateway Settings
  useEffect(() => {
    if (activeTab === 'settings') {
      fetchSettings();
    }
  }, [activeTab]);

  const fetchSettings = async () => {
    setIsLoadingSettings(true);
    try {
      const { data, error } = await supabase
        .from('saas_gateway_settings')
        .select('*');

      if (error) throw error;

      if (data) {
        const settingsMap: any = {};
        data.forEach((item: any) => {
          settingsMap[item.gateway_name] = item;
        });
        setGatewaySettings((prev: any) => ({ ...prev, ...settingsMap }));
      }
    } catch (err) {
      console.error('Erro ao buscar configurações:', err);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const updateGatewayField = (gateway: string, field: string, value: any) => {
    setGatewaySettings((prev: any) => ({
      ...prev,
      [gateway]: { ...prev[gateway], [field]: value }
    }));
  };

  const handleSaveSettings = async () => {
    setIsLoadingSettings(true);
    try {
      for (const gateway of ['stripe', 'asaas', 'pagarme']) {
        const { error } = await supabase
          .from('saas_gateway_settings')
          .update({
            is_active: gatewaySettings[gateway].is_active,
            environment: gatewaySettings[gateway].environment,
            api_key: gatewaySettings[gateway].api_key,
            secret_key: gatewaySettings[gateway].secret_key,
            encryption_key: gatewaySettings[gateway].encryption_key,
            updated_at: new Date().toISOString(),
            updated_by: user?.id
          })
          .eq('gateway_name', gateway);

        if (error) throw error;
      }
      alert('Configurações salvas com sucesso!');
    } catch (err) {
      console.error('Erro ao salvar:', err);
      alert('Erro ao salvar as configurações.');
    } finally {
      setIsLoadingSettings(false);
    }
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

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    let dataToExport = [];
    let fileName = '';

    if (activeTab === 'tenants') {
      dataToExport = tenantsList.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterValues.status === 'all' || t.status === filterValues.status;
        const matchesPlan = filterValues.plan === 'all' || t.plan === filterValues.plan;
        const matchesUsers = t.users >= filterValues.minUsers && t.users <= filterValues.maxUsers;
        return matchesSearch && matchesStatus && matchesPlan && matchesUsers;
      });
      fileName = 'gestao_inquilinos_saas';
    } else if (activeTab === 'plans') {
      dataToExport = plansList.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
      fileName = 'catalogo_planos_saas';
    } else if (activeTab === 'billing') {
      dataToExport = [
        { id: 1, name: 'Fazenda Santa Maria', plan: 'Enterprise Elite', price: 'R$ 1.200', gateway: 'Stripe', status: 'pago', due: '15/10/2023' },
        { id: 2, name: 'Agropecuária Vale Verde', plan: 'Professional Plus', price: 'R$ 450', gateway: 'Asaas', status: 'pendente', due: '12/10/2023' },
        { id: 3, name: 'Haras Serra Azul', plan: 'Starter Core', price: 'R$ 190', gateway: 'Stripe', status: 'atrasado', due: '05/10/2023' },
      ];
      fileName = 'monitor_faturamento_saas';
    }

    if (format === 'csv') exportToCSV(dataToExport, fileName);
    else if (format === 'excel') exportToExcel(dataToExport, fileName);
    else if (format === 'pdf') exportToPDF(dataToExport, fileName, `Relatório SaaS - ${activeTab.toUpperCase()}`);
  };

  const billingColumns = [
    {
      header: 'Fazenda / ID',
      accessor: (item: any) => (
        <div className="flex items-center gap-3 py-1">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <Globe size={18} />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[13px] font-black text-slate-900 uppercase tracking-tighter block">
              {item.name}
            </span>
            <span className="text-[10px] font-black text-slate-400 block mt-0.5">
              ID: {item.id}
            </span>
          </div>
        </div>
      )
    },
    {
      header: 'Plano / Valor',
      accessor: (item: any) => (
        <div className="flex flex-col gap-1 py-1">
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-emerald-500 shrink-0" />
            <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{item.plan}</span>
          </div>
          <div className="pl-5">
            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md italic">
              {item.price} / mês
            </span>
          </div>
        </div>
      )
    },
    {
      header: 'Gateway',
      accessor: (item: any) => (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-slate-300" />
          <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{item.gateway}</span>
        </div>
      )
    },
    {
      header: 'Vencimento',
      accessor: (item: any) => (
        <div className="flex items-center gap-2 text-slate-500">
          <Calendar size={14} className="shrink-0" />
          <span className="text-[11px] font-black uppercase tracking-tighter">{item.due}</span>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: (item: any) => (
        <div className="flex justify-center">
          <span className={`status-badge-elite ${item.status}`}>
            {item.status}
          </span>
        </div>
      ),
      align: 'center' as const
    },
    {
      header: 'Ações',
      accessor: (item: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {[
            { icon: History, color: '#3b82f6', bg: '#eff6ff', label: 'Log' },
            { icon: Edit2, color: '#10b981', bg: '#f0fdf4', label: 'Editar' },
            { icon: Shield, color: '#ef4444', bg: '#fef2f2', label: 'Bloquear' }
          ].map((btn, i) => (
            <button 
              key={i}
              onClick={() => {
                if (btn.label === 'Editar') openEditTenant(item);
                else if (btn.label === 'Bloquear') setIsRetentionModalOpen(true);
                else { setSelectedHistoryTenant(item); setIsBillingHistoryModalOpen(true); }
              }}
              style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '10px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                background: btn.bg, 
                color: btn.color, 
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              title={btn.label}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <btn.icon size={14} />
            </button>
          ))}
        </div>
      )
    }
  ];

  const tenantColumns = [
    {
      header: 'Tenant',
      accessor: (item: any) => (
        <div className="table-cell-title flex items-center gap-2">
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
            onClick={
              activeTab === 'plans' ? openNewPlan : 
              activeTab === 'billing' ? () => alert('Nova Cobrança Iniciada') : 
              openNewTenant
            }
            style={{ display: (activeTab === 'overview' || activeTab === 'health') ? 'none' : 'flex' }}
          >
            <Plus size={18} />
            {
              activeTab === 'plans' ? 'CRIAR PLANO' : 
              activeTab === 'billing' ? 'NOVA COBRANÇA' : 
              'NOVO TENANT'
            }
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

      <div className="next-gen-kpi-grid" style={{ padding: '0 8px' }}>
        <EliteStatCard 
          label="Receita Mensal (MRR)" 
          value="R$ 2.45M" 
          icon={Edit2} 
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
                  <div className="elite-tab-group">
                    <button 
                      className={`elite-tab-item ${viewMode === 'list' ? 'active' : ''}`}
                      onClick={() => setViewMode('list')}
                    >
                      <ListIcon size={18} />
                    </button>
                    <button 
                      className={`elite-tab-item ${viewMode === 'grid' ? 'active' : ''}`}
                      onClick={() => setViewMode('grid')}
                    >
                      <LayoutGrid size={18} />
                    </button>
                  </div>
                  <button 
                    className={`icon-btn-secondary ${showAdvancedFilters ? 'active' : ''}`}
                    title="Filtros Avançados"
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  >
                    <Filter size={20} />
                  </button>
                  <div className="export-dropdown-container">
                    <button 
                      className="icon-btn-secondary" 
                      title="Exportar"
                      onClick={() => {
                        const menu = document.getElementById('export-menu-saas');
                        if (menu) menu.classList.toggle('active');
                      }}
                    >
                      <FileText size={20} />
                    </button>
                    <div id="export-menu-saas" className="export-menu">
                      <button onClick={() => { handleExport('csv'); document.getElementById('export-menu-saas')?.classList.remove('active'); }}>CSV</button>
                      <button onClick={() => { handleExport('excel'); document.getElementById('export-menu-saas')?.classList.remove('active'); }}>Excel (.xlsx)</button>
                      <button onClick={() => { handleExport('pdf'); document.getElementById('export-menu-saas')?.classList.remove('active'); }}>PDF Profissional</button>
                    </div>
                  </div>
                </div>
              </div>

              <SaaSFilterModal 
                isOpen={showAdvancedFilters}
                onClose={() => setShowAdvancedFilters(false)}
                filters={filterValues}
                setFilters={setFilterValues}
                activeTab={activeTab}
              />

              {viewMode === 'list' ? (
                <ModernTable 
                  data={tenantsList.filter(t => {
                    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.id.toLowerCase().includes(searchQuery.toLowerCase());
                    const matchesStatus = filterValues.status === 'all' || t.status === filterValues.status;
                    const matchesPlan = filterValues.plan === 'all' || t.plan === filterValues.plan;
                    const matchesUsers = t.users >= filterValues.minUsers && t.users <= filterValues.maxUsers;
                    return matchesSearch && matchesStatus && matchesPlan && matchesUsers;
                  })}
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
                    .filter(t => {
                      const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.id.toLowerCase().includes(searchQuery.toLowerCase());
                      const matchesStatus = filterValues.status === 'all' || t.status === filterValues.status;
                      const matchesPlan = filterValues.plan === 'all' || t.plan === filterValues.plan;
                      const matchesUsers = t.users >= filterValues.minUsers && t.users <= filterValues.maxUsers;
                      return matchesSearch && matchesStatus && matchesPlan && matchesUsers;
                    })
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

                <div className="elite-filter-group">
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
                  <button 
                    className={`icon-btn-secondary ${showAdvancedFilters ? 'active' : ''}`}
                    title="Filtros Avançados"
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  >
                    <Filter size={20} />
                  </button>
                  <div className="export-dropdown-container">
                    <button 
                      className="icon-btn-secondary" 
                      title="Exportar"
                      onClick={() => {
                        const menu = document.getElementById('export-menu-plans-saas');
                        if (menu) menu.classList.toggle('active');
                      }}
                    >
                      <FileText size={20} />
                    </button>
                    <div id="export-menu-plans-saas" className="export-menu">
                      <button onClick={() => { handleExport('csv'); document.getElementById('export-menu-plans-saas')?.classList.remove('active'); }}>CSV</button>
                      <button onClick={() => { handleExport('excel'); document.getElementById('export-menu-plans-saas')?.classList.remove('active'); }}>Excel (.xlsx)</button>
                      <button onClick={() => { handleExport('pdf'); document.getElementById('export-menu-plans-saas')?.classList.remove('active'); }}>PDF Profissional</button>
                    </div>
                  </div>
                </div>
              </div>

              {viewMode === 'list' ? (
                <ModernTable 
                  data={plansList.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))}
                  columns={[
                    { header: 'Plano', accessor: (p: any) => <div className="table-cell-title flex items-center gap-2"><span className="main-text">{p.name}</span></div> },
                    { header: 'Preço', accessor: (p: any) => <div className="table-cell-meta"><Edit2 size={14} />{p.price}</div> },
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
                                <Edit2 size={14} className="meta-icon" style={{ color: '#f59e0b' }} />
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

          {activeTab === 'billing' && (
              <motion.div 
                key="billing"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="saas-view"
              >
                {/* Advanced Metrics & Strategic Actions - Diamond Parity 5.0 */}
                <div className="health-grid" style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr 1fr 1fr', 
                  gap: '20px', 
                  marginBottom: '48px',
                  marginTop: '10px'
                }}>
                  <EliteStatCard 
                    label="Métricas de Faturamento"
                    value="R$ 142.8k"
                    change="+4.2%"
                    trend="up"
                    icon={DollarSign}
                    color="#10b981"
                    periodLabel="Taxa de recuperação: 94.2%"
                    sparkline={[{value: 30, label: '1'}, {value: 50, label: '2'}, {value: 45, label: '3'}, {value: 80, label: '4'}]}
                  />

                  <EliteStatCard 
                    label="Inadimplência (30d)"
                    value="R$ 14.2k"
                    change="-12%"
                    trend="down"
                    icon={AlertCircle}
                    color="#ef4444"
                    periodLabel="Redução vs mês anterior"
                    sparkline={[{value: 60, label: '1'}, {value: 40, label: '2'}, {value: 55, label: '3'}, {value: 30, label: '4'}]}
                  />

                  <EliteStatCard 
                    label="Previsão de Receita"
                    value="R$ 158.4k"
                    change="+11.5%"
                    trend="up"
                    icon={Activity}
                    color="#f59e0b"
                    periodLabel="Projeção para os próximos 30d"
                    sparkline={[{value: 40, label: '1'}, {value: 60, label: '2'}, {value: 75, label: '3'}, {value: 90, label: '4'}]}
                  />

                  <EliteStatCard 
                    label="Taxa de Churn"
                    value="1.2%"
                    change="-0.4%"
                    trend="down"
                    icon={Shield}
                    color="#6366f1"
                    periodLabel="Cancelamentos vs mês anterior"
                    progress={15}
                    sparkline={[{value: 70, label: '1'}, {value: 50, label: '2'}, {value: 45, label: '3'}, {value: 30, label: '4'}]}
                  />
                </div>


                <div className="elite-controls-row" style={{ marginTop: '20px' }}>
                 <div className="elite-tab-group">
                   <button 
                     className={`elite-tab-item ${billingSubTab === 'monitor' ? 'active' : ''}`}
                     onClick={() => setBillingSubTab('monitor')}
                   >
                     Monitor Global
                   </button>
                   
                 </div>

                 <div className="elite-filter-group">
                   <div className="elite-search-wrapper" style={{ width: '300px' }}>
                     <Search size={18} className="s-icon" />
                     <input 
                       className="elite-search-input"
                       type="text" 
                       placeholder="Buscar por tenant ou ID..." 
                       value={searchQuery}
                       onChange={(e) => setSearchQuery(e.target.value)}
                     />
                   </div>
                   
                   <button className="icon-btn-secondary" title="Filtros Avançados">
                     <Filter size={20} />
                   </button>

                   <div className="export-dropdown-container">
                     <button 
                       className="icon-btn-secondary" 
                       title="Exportar"
                       onClick={() => {
                         const menu = document.getElementById('export-menu-billing');
                         if (menu) menu.classList.toggle('active');
                       }}
                     >
                       <FileText size={20} />
                     </button>
                     <div id="export-menu-billing" className="export-menu">
                       <button onClick={() => handleExport('csv')}>CSV</button>
                       <button onClick={() => handleExport('excel')}>Excel (.xlsx)</button>
                       <button onClick={() => handleExport('pdf')}>PDF Profissional</button>
                     </div>
                   </div>
                    </div>
                  </div>


                {billingSubTab === 'monitor' && (
                  <>
                    <ModernTable 
                      data={[
                        { id: 1, name: 'Fazenda Santa Maria', id_str: 'TN-001', plan: 'Enterprise Elite', price: 'R$ 1.200', gateway: 'Stripe', status: 'pago', due: '15/10/2023' },
                        { id: 2, name: 'Agropecuária Vale Verde', id_str: 'TN-002', plan: 'Professional Plus', price: 'R$ 450', gateway: 'Asaas', status: 'pendente', due: '12/10/2023' },
                        { id: 3, name: 'Haras Serra Azul', id_str: 'TN-003', plan: 'Starter Core', price: 'R$ 190', gateway: 'Stripe', status: 'atrasado', due: '05/10/2023' },
                        { id: 4, name: 'Granja Novo Horizonte', id_str: 'TN-004', plan: 'Enterprise Elite', price: 'R$ 1.200', gateway: 'Pagar.me', status: 'pago', due: '18/10/2023' },
                        { id: 5, name: 'Fazenda Bela Vista', id_str: 'TN-005', plan: 'Professional Plus', price: 'R$ 450', gateway: 'Asaas', status: 'processando', due: '14/10/2023' },
                      ].filter(item => 
                        item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        item.id_str.toLowerCase().includes(searchQuery.toLowerCase())
                      ).map(i => ({ ...i, id: i.id_str }))}
                      columns={billingColumns}
                      loading={false}
                      hideHeader={true}
                    />


                    <div style={{ marginTop: '24px', background: '#f8fafc', borderRadius: '24px', padding: '24px', border: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Consumo de Recursos & Cotas</h4>
                          <p style={{ margin: 0, fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Monitoramento de Infraestrutura por Tenant</p>
                        </div>
                        <div style={{ padding: '6px 12px', background: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '10px', fontWeight: '800', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></div>
                          SISTEMA NOMINAL
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                        {[
                          { label: 'Database Storage', used: '4.2GB', total: '10GB', color: '#6366f1', icon: Database },
                          { label: 'Cloud Attachments', used: '12.8GB', total: '50GB', color: '#10b981', icon: HardDrive },
                          { label: 'API Throughput', used: '84k', total: '200k', color: '#f59e0b', icon: Activity }
                        ].map((resource, idx) => (
                          <div key={idx} style={{ background: 'white', padding: '16px', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ color: resource.color }}><resource.icon size={16} /></div>
                                <span style={{ fontSize: '11px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>{resource.label}</span>
                              </div>
                              <span style={{ fontSize: '10px', fontWeight: '900', color: resource.color }}>{Math.round((parseInt(resource.used) / parseInt(resource.total)) * 100)}%</span>
                            </div>
                            <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
                              <div style={{ height: '100%', background: resource.color, width: `${(parseInt(resource.used) / parseInt(resource.total)) * 100}%`, borderRadius: '3px' }}></div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: '700', color: '#64748b' }}>
                              <span>{resource.used} usados</span>
                              <span>limite: {resource.total}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Strategic Actions Bar - Diamond Parity 5.0 (Relocated to Footer) */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: '24px', 
                  marginTop: '40px', 
                  padding: '20px', 
                  borderRadius: '16px', 
                  border: '1px solid hsl(var(--border) / 0.6)', 
                  background: 'linear-gradient(to right, hsl(var(--muted) / 0.3), hsl(var(--background)))',
                  width: '100%'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingRight: '24px', borderRight: '1px solid hsl(var(--border))' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
                      <div style={{ margin: 'auto' }}><Zap size={22} fill="#6366f1" /></div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <h4 style={{ margin: 0, fontSize: '12px', fontWeight: '900', color: 'hsl(var(--text-main))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ações de Governança</h4>
                      <p style={{ margin: 0, fontSize: '10px', fontWeight: '700', color: '#6366f1', textTransform: 'uppercase', opacity: 0.8 }}>Hub Estratégico</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flex: 1, gap: '12px', alignItems: 'center' }}>
                    {[
{ label: 'Reprocessar Falhas', icon: RefreshCw, color: '#10b981', action: handleReprocessFailures },
                      { label: 'Relatório Fiscal Consolidado', icon: FileText, color: '#6366f1', action: handleFiscalReport },
                      { label: 'Políticas de Retenção', icon: Shield, color: '#64748b', action: () => setIsRetentionModalOpen(true) }
                    ].map((btn, idx) => (
                      <button 
                        key={idx}
                        onClick={btn.action}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '10px', 
                          padding: '10px 18px', 
                          borderRadius: '12px', 
                          background: 'white', 
                          border: '1px solid hsl(var(--border))',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.borderColor = btn.color;
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.borderColor = 'hsl(var(--border))';
                          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
                        }}
                      >
                        <btn.icon size={16} style={{ color: btn.color }} />
                        <span style={{ fontSize: '11px', fontWeight: '800', color: 'hsl(var(--text-main))', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{btn.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

             </motion.div>
           )}

           {activeTab === 'settings' && (
            <motion.div 
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="saas-view"
            >
              <div className="billing-settings-container">
                {/* Global Status Banner */}
                <div className="premium-status-banner">
                  <div className="status-info">
                    <div className="status-icon-wrapper">
                      <Shield size={22} />
                    </div>
                    <div className="status-text">
                      <h4>Governança de Pagamentos</h4>
                      <p>Configurações de integração protegidas por camada AES-256 GCM.</p>
                    </div>
                  </div>
                  <div className="server-badge">
                    <div className="pulse-dot"></div>
                    <span>Gateway Engine: Online</span>
                  </div>
                </div>

                <div className="gateway-grid">
                  {/* Stripe Card */}
                  <div className="premium-card">
                    <div className="card-header">
                      <div className="brand-group">
                        <div className="brand-icon stripe">
                          <CreditCard size={20} />
                        </div>
                        <div className="brand-details">
                          <h3>Stripe</h3>
                          <span className={`status-tag ${gatewaySettings.stripe.is_active ? 'active' : 'inactive'}`}>
                            {gatewaySettings.stripe.is_active ? 'ATIVO' : 'INATIVO'}
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => updateGatewayField('stripe', 'is_active', !gatewaySettings.stripe.is_active)}
                        className={`elite-tab-item ${gatewaySettings.stripe.is_active ? 'active' : ''}`}
                      >
                        {gatewaySettings.stripe.is_active ? 'DESATIVAR' : 'ATIVAR'}
                      </button>
                    </div>

                    <div className="card-body">
                      <div className="field-group">
                        <label>Ambiente de Execução</label>
                        <select 
                          value={gatewaySettings.stripe.environment}
                          onChange={(e) => updateGatewayField('stripe', 'environment', e.target.value)}
                          className="premium-select"
                        >
                          <option value="test">Sandbox (Homologação)</option>
                          <option value="production">Produção (Live)</option>
                        </select>
                      </div>

                      <div className="field-group">
                        <label>Publishable Key (Pública)</label>
                        <input 
                          type="text" 
                          value={gatewaySettings.stripe.api_key}
                          onChange={(e) => updateGatewayField('stripe', 'api_key', e.target.value)}
                          placeholder="pk_live_..." 
                          className="premium-input font-mono"
                        />
                      </div>

                      <div className="field-group">
                        <label>Secret Key (Privada)</label>
                        <div className="input-with-icon">
                          <input 
                            type="password" 
                            value={gatewaySettings.stripe.secret_key}
                            onChange={(e) => updateGatewayField('stripe', 'secret_key', e.target.value)}
                            placeholder="sk_live_..." 
                            className="premium-input font-mono"
                          />
                          <Eye size={16} className="input-icon" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Asaas Card */}
                  <div className="premium-card">
                    <div className="card-header">
                      <div className="brand-group">
                        <div className="brand-icon asaas">
                          <Edit2 size={20} />
                        </div>
                        <div className="brand-details">
                          <h3>Asaas</h3>
                          <span className={`status-tag ${gatewaySettings.asaas.is_active ? 'active' : 'inactive'}`}>
                            {gatewaySettings.asaas.is_active ? 'ATIVO' : 'INATIVO'}
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => updateGatewayField('asaas', 'is_active', !gatewaySettings.asaas.is_active)}
                        className={`elite-tab-item ${gatewaySettings.asaas.is_active ? 'active' : ''}`}
                      >
                        {gatewaySettings.asaas.is_active ? 'DESATIVAR' : 'ATIVAR'}
                      </button>
                    </div>

                    <div className="card-body">
                      <div className="field-group">
                        <label>Ambiente de Execução</label>
                        <select 
                          value={gatewaySettings.asaas.environment}
                          onChange={(e) => updateGatewayField('asaas', 'environment', e.target.value)}
                          className="premium-select"
                        >
                          <option value="test">Sandbox (Homologação)</option>
                          <option value="production">Produção (Live)</option>
                        </select>
                      </div>

                      <div className="field-group">
                        <label>API Access Token</label>
                        <div className="input-with-icon">
                          <input 
                            type="password" 
                            value={gatewaySettings.asaas.api_key}
                            onChange={(e) => updateGatewayField('asaas', 'api_key', e.target.value)}
                            placeholder="$asaas_..." 
                            className="premium-input font-mono"
                          />
                          <Eye size={16} className="input-icon" />
                        </div>
                      </div>

                      <div className="info-box">
                        <p>Gateway especializado em PIX e Boletos com gestão de cobranças.</p>
                      </div>
                    </div>
                  </div>

                  {/* Pagar.me Card */}
                  <div className="premium-card">
                    <div className="card-header">
                      <div className="brand-group">
                        <div className="brand-icon pagarme">
                          <ShieldCheck size={20} />
                        </div>
                        <div className="brand-details">
                          <h3>Pagar.me</h3>
                          <span className={`status-tag ${gatewaySettings.pagarme.is_active ? 'active' : 'inactive'}`}>
                            {gatewaySettings.pagarme.is_active ? 'ATIVO' : 'INATIVO'}
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => updateGatewayField('pagarme', 'is_active', !gatewaySettings.pagarme.is_active)}
                        className={`elite-tab-item ${gatewaySettings.pagarme.is_active ? 'active' : ''}`}
                      >
                        {gatewaySettings.pagarme.is_active ? 'DESATIVAR' : 'ATIVAR'}
                      </button>
                    </div>

                    <div className="card-body">
                      <div className="field-group">
                        <label>Ambiente de Execução</label>
                        <select 
                          value={gatewaySettings.pagarme.environment}
                          onChange={(e) => updateGatewayField('pagarme', 'environment', e.target.value)}
                          className="premium-select"
                        >
                          <option value="test">Sandbox (Development)</option>
                          <option value="production">Produção (Live)</option>
                        </select>
                      </div>

                      <div className="field-group">
                        <label>Encryption Key</label>
                        <div className="input-with-icon">
                          <input 
                            type="password" 
                            value={gatewaySettings.pagarme.encryption_key}
                            onChange={(e) => updateGatewayField('pagarme', 'encryption_key', e.target.value)}
                            placeholder="ek_live_..." 
                            className="premium-input font-mono"
                          />
                          <Eye size={16} className="input-icon" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Final Actions Footer */}
                <div className="billing-footer">
                  <div className="sync-status">
                    <RefreshCw size={18} className={isLoadingSettings ? 'animate-spin' : ''} />
                    <span>{isLoadingSettings ? 'Persistindo dados...' : `Última sincronização: ${new Date().toLocaleTimeString()}`}</span>
                  </div>
                  <button 
                    onClick={handleSaveSettings}
                    disabled={isLoadingSettings}
                    className="save-configurations-btn"
                  >
                    {isLoadingSettings ? 'SALVANDO...' : 'SALVAR TODAS AS CONFIGURAÇÕES'}
                  </button>
                </div>
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
        {createPortal(
          <AnimatePresence>
            {isRetentionModalOpen && (
              <div style={{ 
                position: 'fixed', 
                top: 0, 
                left: 0, 
                right: 0, 
                bottom: 0, 
                zIndex: 99999, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                padding: '24px',
                width: '100vw',
                height: '100vh',
                pointerEvents: 'auto'
              }}>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsRetentionModalOpen(false)}
                  style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(12px)' }}
                />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  style={{ 
                    position: 'relative', 
                    width: '100%', 
                    maxWidth: '500px', 
                    background: 'white', 
                    borderRadius: '24px', 
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)', 
                    overflow: 'hidden',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <div style={{ padding: '32px', background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                        <Shield size={24} />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Políticas de Retenção</h3>
                        <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Governança de Inadimplência & Suspensão</p>
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    {/* Visual Timeline Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', marginBottom: '10px' }}>
                      <div style={{ position: 'absolute', top: '24px', left: '10%', right: '10%', height: '2px', background: '#f1f5f9', zIndex: 0 }} />
                      {[
                        { label: 'Alertas', icon: Activity },
                        { label: 'Leitura', icon: Eye },
                        { label: 'Pecuária', icon: Database },
                        { label: 'Bloqueio', icon: Lock }
                      ].map((step, i) => (
                        <div key={i} style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'white', border: '2px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                            <step.icon size={18} />
                          </div>
                          <span style={{ fontSize: '9px', fontWeight: '900', color: '#94a3b8', uppercase: 'true', textTransform: 'uppercase' }}>{step.label}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Início de Alertas (D+)</label>
                        <input 
                          type="number" 
                          value={retentionSettings.alertDays}
                          onChange={(e) => setRetentionSettings({...retentionSettings, alertDays: parseInt(e.target.value)})}
                          style={{ padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', fontWeight: '700' }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Modo Leitura Global (D+)</label>
                        <input 
                          type="number" 
                          value={retentionSettings.readOnlyDays}
                          onChange={(e) => setRetentionSettings({...retentionSettings, readOnlyDays: parseInt(e.target.value)})}
                          style={{ padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', fontWeight: '700' }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Restrição Pecuária (D+)</label>
                        <input 
                          type="number" 
                          value={retentionSettings.pecuariaOnlyDays}
                          onChange={(e) => setRetentionSettings({...retentionSettings, pecuariaOnlyDays: parseInt(e.target.value)})}
                          style={{ padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', fontWeight: '700' }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Portal de Pagamento (D+)</label>
                        <input 
                          type="number" 
                          value={retentionSettings.forcedPaymentDays}
                          onChange={(e) => setRetentionSettings({...retentionSettings, forcedPaymentDays: parseInt(e.target.value)})}
                          style={{ padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', fontWeight: '700' }}
                        />
                      </div>
                    </div>

                    <div style={{ padding: '16px', background: '#fffbeb', borderRadius: '16px', border: '1px solid #fef3c7' }}>
                      <p style={{ margin: 0, fontSize: '11px', color: '#92400e', fontWeight: '600', lineHeight: '1.5' }}>
                        * Na Fase 3, o usuário terá acesso apenas ao módulo Pecuária em modo leitura. 
                        Na Fase 4, qualquer acesso será redirecionado para o gateway de pagamento.
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                      <button 
                        onClick={() => setIsRetentionModalOpen(false)}
                        style={{ flex: 1, padding: '14px', borderRadius: '14px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', cursor: 'pointer' }}
                      >
                        Cancelar
                      </button>
                      <button 
                        onClick={async () => {
                          await logAudit({
                            admin_id: user?.id,
                            action: 'UPDATE_RETENTION_POLICY',
                            metadata: retentionSettings
                          });
                          setIsRetentionModalOpen(false);
                          alert('Políticas de retenção atualizadas com sucesso!');
                        }}
                        style={{ flex: 1, padding: '14px', borderRadius: '14px', border: 'none', background: '#0f172a', color: 'white', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', cursor: 'pointer' }}
                      >
                        Salvar Alterações
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )
      }

        {createPortal(
          <AnimatePresence>
            {isBillingHistoryModalOpen && (
              <div style={{ position: 'fixed', inset: 0, zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsBillingHistoryModalOpen(false)}
                  style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(12px)' }}
                />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  style={{ position: 'relative', width: '100%', maxWidth: '800px', background: 'white', borderRadius: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)', overflow: 'hidden', border: '1px solid #e2e8f0' }}
                >
                  <div style={{ padding: '32px', background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                        <History size={28} />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Histórico de Auditoria: {selectedHistoryTenant?.name}</h3>
                        <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Trilha Completa de Transações & Eventos SaaS</p>
                      </div>
                    </div>
                    <button onClick={() => setIsBillingHistoryModalOpen(false)} style={{ background: '#f1f5f9', width: '40px', height: '40px', borderRadius: '12px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Plus size={24} style={{ transform: 'rotate(45deg)', color: '#64748b' }} />
                    </button>
                  </div>
                  <div style={{ padding: '32px', maxHeight: '60vh', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {[
                        { type: 'payment', title: 'Pagamento Confirmado', desc: 'Gateway Stripe confirmou recebimento via PIX.', time: 'Há 2 dias', amount: 'R$ 1.200,00', status: 'success' },
                        { type: 'plan', title: 'Upgrade de Plano', desc: 'Migração do Professional para Enterprise Elite.', time: 'Há 15 dias', amount: '-', status: 'info' },
                        { type: 'alert', title: 'Aviso de Vencimento', desc: 'Notificação automática enviada ao e-mail do tenant.', time: 'Há 18 dias', amount: '-', status: 'warning' },
                        { type: 'payment', title: 'Fatura Gerada', desc: 'Ciclo mensal de faturamento iniciado.', time: 'Há 20 dias', amount: 'R$ 1.200,00', status: 'neutral' },
                      ].map((log, i) => (
                        <div key={i} style={{ padding: '20px', borderRadius: '20px', background: '#f8fafc', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                             <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: log.status === 'success' ? '#10b981' : log.status === 'warning' ? '#f59e0b' : log.status === 'info' ? '#3b82f6' : '#94a3b8' }} />
                             <div>
                               <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>{log.title}</h4>
                               <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b', fontWeight: '500' }}>{log.desc}</p>
                             </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ display: 'block', fontSize: '13px', fontWeight: '900', color: '#0f172a' }}>{log.amount}</span>
                            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>{log.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ padding: '32px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
                    <button 
                      onClick={() => setIsBillingHistoryModalOpen(false)}
                      style={{ padding: '14px 28px', borderRadius: '14px', border: 'none', background: '#0f172a', color: 'white', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.3)' }}
                    >
                      Fechar Auditoria
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}

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
        .billing-settings-container {
          padding: 20px;
          width: 100%;
        }

        .premium-status-banner {
          background: #0f172a;
          border-radius: 24px;
          padding: 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 40px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        }

        .status-info {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .status-icon-wrapper {
          width: 56px;
          height: 56px;
          background: linear-gradient(135deg, #06b6d4, #10b981);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 8px 16px rgba(6, 182, 212, 0.2);
        }

        .status-text h4 {
          color: white;
          font-size: 16px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin: 0 0 4px 0;
        }

        .status-text p {
          color: #94a3b8;
          font-size: 11px;
          font-weight: 700;
          margin: 0;
        }

        .server-badge {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 12px 20px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .pulse-dot {
          width: 10px;
          height: 10px;
          background: #10b981;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        .server-badge span {
          color: #10b981;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .gateway-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
          width: 100%;
        }

        .premium-card {
          background: white;
          border: 1px solid #f1f5f9;
          border-radius: 32px;
          padding: 32px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
          display: flex;
          flex-direction: column;
          gap: 32px;
          transition: all 0.3s ease;
        }

        .premium-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          border-color: #e2e8f0;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .brand-group {
          display: flex;
          gap: 20px;
          align-items: center;
        }

        .brand-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .brand-icon.stripe { background: #635bff; }
        .brand-icon.asaas { background: #0060ff; }
        .brand-icon.pagarme { background: #36b37e; }

        .brand-details h3 {
          font-size: 18px;
          font-weight: 900;
          color: #0f172a;
          margin: 0 0 4px 0;
          letter-spacing: -0.02em;
        }

        .status-tag {
          font-size: 9px;
          font-weight: 900;
          padding: 2px 8px;
          border-radius: 6px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .status-tag.active {
          background: #ecfdf5;
          color: #10b981;
        }

        .status-tag.inactive {
          background: #f8fafc;
          color: #94a3b8;
        }

        .elite-tab-item {
          font-size: 10px;
          font-weight: 900;
          padding: 8px 16px;
          border-radius: 10px;
          border: 1px solid #f1f5f9;
          background: #f8fafc;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s;
        }

        .elite-tab-item.active {
          background: #ecfdf5;
          border-color: #10b981;
          color: #059669;
        }

        .elite-tab-item:hover {
          background: #f1f5f9;
        }

        .card-body {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .field-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .field-group label {
          font-size: 10px;
          font-weight: 900;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-left: 4px;
        }

        .premium-select, .premium-input {
          width: 100%;
          background: #f8fafc;
          border: 1px solid #f1f5f9;
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 13px;
          font-weight: 600;
          color: #334155;
          outline: none;
          transition: all 0.2s;
        }

        .premium-select:focus, .premium-input:focus {
          background: white;
          border-color: #cbd5e1;
          box-shadow: 0 0 0 4px rgba(241, 245, 249, 1);
        }

        .input-with-icon {
          position: relative;
        }

        .input-icon {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #cbd5e1;
          cursor: pointer;
        }

        .info-box {
          background: #f1f5f9;
          border-radius: 16px;
          padding: 16px;
          border: 1px dashed #e2e8f0;
        }

        .info-box p {
          font-size: 10px;
          font-weight: 700;
          color: #64748b;
          text-align: center;
          margin: 0;
          line-height: 1.6;
        }

        .billing-footer {
          margin-top: 48px;
          background: white;
          border: 1px solid #f1f5f9;
          border-radius: 24px;
          padding: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }

        .sync-status {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #94a3b8;
        }

        .sync-status span {
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .save-configurations-btn {
          background: #10b981;
          color: white;
          font-size: 12px;
          font-weight: 900;
          padding: 16px 32px;
          border-radius: 16px;
          border: none;
          cursor: pointer;
          letter-spacing: 0.1em;
          box-shadow: 0 10px 20px rgba(16, 185, 129, 0.2);
          transition: all 0.2s;
        }

        .save-configurations-btn:hover {
          background: #059669;
          transform: translateY(-2px);
          box-shadow: 0 15px 30px rgba(16, 185, 129, 0.3);
        }

        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }

        .billing-kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
          margin-bottom: 40px;
        }

        .premium-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
        }

        .premium-table th {
          padding: 20px 32px;
          background: #f8fafc;
          border-bottom: 2px solid hsl(var(--brand) / 0.1);
          color: hsl(var(--brand));
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.15em;
        }

        .premium-table td {
          padding: 24px 32px;
          border-bottom: 1px solid #f8fafc;
          vertical-align: middle;
        }

        .tenant-cell {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .tenant-name {
          font-size: 14px;
          font-weight: 900;
          color: #0f172a;
        }

        .tenant-id {
          font-size: 10px;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
        }

        .plan-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .plan-price {
          font-size: 12px;
          font-weight: 800;
          color: #10b981;
        }

        .gateway-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 700;
          color: #64748b;
        }

        .modern-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }

        .action-btn-square {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid transparent;
        }

        .action-btn-square.info { background: #eff6ff; color: #3b82f6; border-color: #dbeafe; }
        .action-btn-square.success { background: #ecfdf5; color: #10b981; border-color: #d1fae5; }
        .action-btn-square.danger { background: #fff1f2; color: #f43f5e; border-color: #ffe4e6; }

        .action-btn-square:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          filter: brightness(0.95);
        }

        .status-badge-elite {
          padding: 6px 14px;
          border-radius: 99px;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border: 1px solid transparent;
        }

        .status-badge-elite.pago { background: #ecfdf5; color: #059669; border-color: #d1fae5; }
        .status-badge-elite.pendente { background: #fffbeb; color: #d97706; border-color: #fef3c7; }
        .status-badge-elite.atrasado { background: #fff1f2; color: #e11d48; border-color: #ffe4e6; }
        .status-badge-elite.processando { background: #eff6ff; color: #2563eb; border-color: #dbeafe; }

        @media (max-width: 1200px) {
          .billing-kpi-grid { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 768px) {
          .billing-kpi-grid { grid-template-columns: 1fr; }
        }

        .next-gen-kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }

        .health-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr !important;
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

      `}</style>
    </div>
  );
};
