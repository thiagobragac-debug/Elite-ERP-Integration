import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  FileText,
  DollarSign,
  ShoppingCart,
  Plus,
  Settings,
  Shield,
  Layers,
  Search,
  Filter,
  CheckCircle2,
  List as ListIcon,
  LayoutGrid,
  Eye,
  Edit3,
  Trash2,
  Activity,
  TrendingUp,
  RefreshCw,
  Calendar,
  Archive
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { RuleFormModal } from './components/RuleFormModal';
import { ApprovalFilterModal } from './components/ApprovalFilterModal';
import { TauzeStatCard } from '../../components/Cards/TauzeStatCard';
import { KPISkeleton } from '../../components/Feedback/Skeleton';
import { useViewMode } from '../../hooks/useViewMode';
import { EmptyState } from '../../components/Feedback/EmptyState';
import toast from 'react-hot-toast';
import { Breadcrumb } from '../../components/Navigation/Breadcrumb';

type TabType = 'pendencies' | 'rules';

interface ApprovalRule {
  id: string;
  module: string;
  condition: string;
  stages: number;
  active: boolean;
}

interface PendingItem {
  id: string;
  type: string;
  requester: string;
  date: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  stage: number;
  totalStages: number;
  db_id?: string;
  reference_id?: string;
}

export const ApprovalCenter: React.FC = () => {
  const { activeTenantId } = useTenant();
  const [activeTab, setActiveTab] = useState<TabType>('pendencies');
  const [viewMode, setViewMode] = useViewMode('admin-approval-center', 'grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    dateStart: '',
    dateEnd: '',
    minAmount: '',
    maxAmount: ''
  });

  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<ApprovalRule | null>(null);
  
  const [rules, setRules] = useState<ApprovalRule[]>([]);
  const [pendencies, setPendencies] = useState<PendingItem[]>([]);

  useEffect(() => {
    if (activeTenantId) {
      fetchData();
    }
  }, [activeTenantId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rulesRes, queueRes] = await Promise.all([
        supabase.from('approval_rules').select('*').eq('tenant_id', activeTenantId).order('created_at', { ascending: false }),
        supabase.from('approval_queue').select('*').eq('tenant_id', activeTenantId).order('created_at', { ascending: false })
      ]);

      if (rulesRes.data) {
        setRules(rulesRes.data.map((r: any) => ({
          id: r.id,
          module: r.module,
          condition: r.condition_label,
          stages: r.stages,
          active: r.active
        })));
      }

      if (queueRes.data) {
        setPendencies(queueRes.data.map((q: any) => ({
          db_id: q.id,
          id: q.id.slice(0, 8).toUpperCase(),
          type: q.type,
          requester: q.requester,
          date: new Date(q.created_at).toLocaleDateString('pt-BR'),
          amount: parseFloat(q.amount) || 0,
          status: q.status,
          stage: q.current_stage,
          totalStages: q.total_stages,
          reference_id: q.reference_id
        })));
      }
    } catch (err) {
      console.error('Error fetching approval data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const handleToggleRule = async (id: string) => {
    const rule = rules.find(r => r.id === id);
    if (!rule) return;
    setRules(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));
    await supabase.from('approval_rules').update({ active: !rule.active }).eq('id', id);
  };

  const handleDeleteRule = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta regra?')) {
      setRules(prev => prev.filter(r => r.id !== id));
      await supabase.from('approval_rules').delete().eq('id', id);
    }
  };

  const handleSaveRule = async (data: any) => {
    try {
      const payload = {
        tenant_id: activeTenantId,
        module: data.module,
        condition_label: data.condition,
        min_amount: data.min_amount || 0,
        stages: data.stages || 1,
        active: data.active ?? true
      };

      if (selectedRule) {
        await supabase.from('approval_rules').update(payload).eq('id', selectedRule.id);
      } else {
        await supabase.from('approval_rules').insert([payload]);
      }
      fetchData();
      setIsRuleModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar regra.');
    }
  };

  const handleApprove = async (item: PendingItem) => {
    if (!item.db_id) return;
    try {
      let nextStage = item.stage;
      let newStatus = item.status;

      if (item.stage < item.totalStages) {
        nextStage = item.stage + 1;
      } else {
        newStatus = 'approved';
      }

      setPendencies(prev => prev.map(p => p.db_id === item.db_id ? { ...p, stage: nextStage, status: newStatus } : p));
      
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('approval_queue').update({
        current_stage: nextStage,
        status: newStatus,
        approved_by: user?.id,
        approved_at: newStatus === 'approved' ? new Date().toISOString() : null
      }).eq('id', item.db_id);

    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (item: PendingItem) => {
    if (!item.db_id) return;
    try {
      setPendencies(prev => prev.map(p => p.db_id === item.db_id ? { ...p, status: 'rejected' } : p));
      await supabase.from('approval_queue').update({ status: 'rejected' }).eq('id', item.db_id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRevert = async (item: PendingItem) => {
    if (!item.db_id) return;
    if (!confirm('Tem certeza que deseja reverter esta decisão? O status voltará para pendente.')) return;
    try {
      setPendencies(prev => prev.map(p => p.db_id === item.db_id ? { ...p, status: 'pending', stage: 1 } : p));
      await supabase.from('approval_queue').update({ 
        status: 'pending', 
        current_stage: 1, 
        approved_by: null, 
        approved_at: null 
      }).eq('id', item.db_id);
    } catch (err) {
      console.error(err);
    }
  };

  const pendingCount = pendencies.filter(p => p.status === 'pending').length;
  const approvedCount = pendencies.filter(p => p.status === 'approved').length;
  const rejectedCount = pendencies.filter(p => p.status === 'rejected').length;

  const pendingAmount = pendencies.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);

  const stats = [
    { 
      label: 'Aguardando', value: pendingCount, icon: Clock, color: '#eab308', 
      progress: pendingCount > 0 ? 100 : 0, change: 'Revisão', periodLabel: 'Requisições pendentes',
      sparkline: pendingCount > 0 ? [{ value: 5 }, { value: 3 }, { value: 4 }, { value: 2 }, { value: pendingCount }] : []
    },
    { 
      label: 'Volume Pendente', value: formatCurrency(pendingAmount), icon: DollarSign, color: '#3b82f6', 
      progress: pendingAmount > 0 ? 100 : 0, change: 'Capital', periodLabel: 'Impacto financeiro retido',
      sparkline: pendingAmount > 0 ? [{ value: 10000 }, { value: 15000 }, { value: 12000 }, { value: 17000 }, { value: pendingAmount }] : []
    },
    { 
      label: 'Aprovados', value: approvedCount, icon: CheckCircle, color: '#22c55e', 
      progress: approvedCount > 0 ? 100 : 0, change: 'Concluído', periodLabel: 'Nos últimos 7 dias',
      sparkline: approvedCount > 0 ? [{ value: 10 }, { value: 12 }, { value: 9 }, { value: 11 }, { value: approvedCount }] : []
    },
    { 
      label: 'Recusados', value: rejectedCount, icon: XCircle, color: '#ef4444', 
      progress: rejectedCount > 0 ? 100 : 0, change: 'Bloqueado', periodLabel: 'Nos últimos 7 dias',
      sparkline: rejectedCount > 0 ? [{ value: 0 }, { value: 1 }, { value: 0 }, { value: 2 }, { value: rejectedCount }] : []
    }
  ];

  const pendencyColumns = [
    {
      header: 'ID / Tipo',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
          <span className="main-text" style={{ fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {item.type.includes('Compra') ? <ShoppingCart size={14} /> : item.type.includes('Pagar') ? <DollarSign size={14} /> : <FileText size={14} />}
            {item.type}
          </span>
          <span className="sub-meta" style={{ color: '#64748b', fontSize: '10px', fontWeight: 600 }}>
            ID: {item.id}
          </span>
        </div>
      ),
      align: 'left' as const
    },
    { 
      header: 'Solicitante & Data', 
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
            {item.requester}
          </span>
          <span className="sub-meta" style={{ display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase', fontWeight: 700, fontSize: '9px', letterSpacing: '0.05em', color: '#94a3b8' }}>
            <Calendar size={10} /> {item.date}
          </span>
        </div>
      ),
      align: 'left' as const
    },
    {
      header: 'Valor',
      accessor: (item: any) => (
        <div style={{ color: '#3b82f6', backgroundColor: '#eff6ff', padding: '4px 10px', borderRadius: '6px', border: '1px solid #dbeafe', fontSize: '11px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          {formatCurrency(item.amount)}
        </div>
      ),
      align: 'left' as const
    },
    {
      header: 'Status / Etapa',
      accessor: (item: any) => {
        const percent = Math.min((item.stage / item.totalStages) * 100, 100);
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '130px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', fontWeight: 900, fontStyle: 'italic', color: '#64748b' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Layers size={10} /> ETAPA ATUAL</span>
              <span style={{ color: item.status === 'pending' ? '#eab308' : item.status === 'approved' ? '#22c55e' : '#ef4444' }}>
                {item.stage} / {item.totalStages}
              </span>
            </div>
            <div style={{ height: '6px', backgroundColor: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  height: '100%', 
                  borderRadius: '99px', 
                  backgroundColor: item.status === 'pending' ? '#eab308' : item.status === 'approved' ? '#22c55e' : '#ef4444', 
                  width: `${percent}%` 
                }} 
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '2px' }}>
              <span className={`status-pill mini ${item.status === 'pending' ? 'warning-badge' : item.status === 'approved' ? 'active' : 'danger-badge'}`} style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px' }}>
                {item.status === 'pending' ? 'AGUARDANDO' : item.status === 'approved' ? 'APROVADO' : 'RECUSADO'}
              </span>
            </div>
          </div>
        );
      },
      align: 'left' as const
    }
  ];

  const rulesColumns = [
    { 
      header: 'Módulo / Gatilho', 
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
          <span className="main-text" style={{ fontWeight: 800, color: '#1e293b' }}>{item.module}</span>
          <span className="sub-meta" style={{ display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase', fontWeight: 700, fontSize: '9px', letterSpacing: '0.05em', color: '#94a3b8' }}>
            <Activity size={10} /> Regra Operacional
          </span>
        </div>
      ),
      align: 'left' as const
    },
    { 
      header: 'Condição', 
      accessor: (item: any) => (
        <div style={{ color: '#059669', backgroundColor: '#ecfdf5', padding: '4px 10px', borderRadius: '6px', border: '1px solid #d1fae5', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <Filter size={12} /> {item.condition}
        </div>
      ),
      align: 'left' as const
    },
    {
      header: 'Hierarquia (Etapas)',
      accessor: (item: any) => {
        const percent = Math.min((item.stages / 3) * 100, 100);
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '120px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', fontWeight: 900, fontStyle: 'italic', color: '#64748b' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Layers size={10} /> NÍVEIS</span>
              <span style={{ color: '#6366f1' }}>{item.stages}</span>
            </div>
            <div style={{ height: '6px', backgroundColor: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' }}>
              <div 
                style={{ height: '100%', borderRadius: '99px', backgroundColor: '#6366f1', width: `${percent}%` }} 
              />
            </div>
          </div>
        );
      },
      align: 'left' as const
    },
    {
      header: 'Status',
      accessor: (item: any) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span className={`status-pill ${item.active ? 'active' : 'stopped'}`}>
            {item.active ? 'ATIVA' : 'INATIVA'}
          </span>
        </div>
      ),
      align: 'center' as const
    }
  ];

  const filteredPendencies = pendencies.filter(p => {
    const matchesSearch = p.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.requester.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filters.status === 'all' || p.status === filters.status;
    
    // Simplistic mapping since mock rules use different strings sometimes
    const matchesType = filters.type === 'all' || p.type === filters.type || (filters.type.includes('Compra') && p.type.includes('Compra'));
    
    const parseDate = (dStr: string) => {
      const [d, m, y] = dStr.split('/');
      return new Date(Number(y), Number(m)-1, Number(d)).getTime();
    };

    let matchesDate = true;
    if (filters.dateStart || filters.dateEnd) {
      const pd = parseDate(p.date);
      if (filters.dateStart && pd < new Date(filters.dateStart).getTime()) matchesDate = false;
      if (filters.dateEnd && pd > new Date(filters.dateEnd).getTime()) matchesDate = false;
    }

    let matchesAmount = true;
    if (filters.minAmount && p.amount < Number(filters.minAmount)) matchesAmount = false;
    if (filters.maxAmount && p.amount > Number(filters.maxAmount)) matchesAmount = false;

    return matchesSearch && matchesStatus && matchesType && matchesDate && matchesAmount;
  });

  const filteredRules = rules.filter(r => {
    const matchesSearch = r.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.condition.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStatus = true;
    if (filters.status === 'active') matchesStatus = r.active === true;
    if (filters.status === 'inactive') matchesStatus = r.active === false;

    const matchesType = filters.type === 'all' || r.module === filters.type || (filters.type.includes('Compra') && r.module.includes('Compra'));

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="admin-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <Breadcrumb paths={[{ label: 'Administração', href: '/admin/intelligence' }, { label: 'Central de Aprovações' }]} />
          <h1 className="page-title">Central de Aprovações</h1>
          <p className="page-subtitle">Gestão de regras operacionais e painel de pendências de autorização.</p>
        </div>
        <div className="page-actions">
          {activeTab === 'rules' && (
            <button className="primary-btn" onClick={() => { setSelectedRule(null); setIsRuleModalOpen(true); }}>
              <Plus size={18} />
              <span>NOVA REGRA</span>
            </button>
          )}
        </div>
      </header>

      <div className="next-gen-kpi-grid">
        {loading ? (
          Array(4).fill(0).map((_, i) => <KPISkeleton key={i} />)
        ) : stats.map((stat, idx) => (
          <TauzeStatCard
            key={idx}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            progress={stat.progress}
            change={stat.change}
            periodLabel={stat.periodLabel}
            sparkline={stat.sparkline}
          />
        ))}
      </div>

      <div className="tauze-controls-row">
        <div className="tauze-tab-group">
          <button 
            className={`tauze-tab-item ${activeTab === 'pendencies' ? 'active' : ''}`}
            onClick={() => setActiveTab('pendencies')}
          >
            Fila de Pendências
          </button>
          <button 
            className={`tauze-tab-item ${activeTab === 'rules' ? 'active' : ''}`}
            onClick={() => setActiveTab('rules')}
          >
            Regras de Aprovação
          </button>
        </div>

        <div className="tauze-search-wrapper">
          <Search size={18} className="s-icon" />
          <input 
            type="text" 
            className="tauze-search-input"
            placeholder="Buscar aprovações..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {activeTab === 'rules' && (
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
        )}

        <div className="tauze-filter-group">
          <button className="icon-btn-secondary" title="Filtros" onClick={() => setIsFilterModalOpen(true)}>
            <Filter size={20} />
          </button>
        </div>
      </div>

      <div className="management-content">
        <AnimatePresence mode="wait">
          {activeTab === 'pendencies' ? (
            <motion.div 
              key="pendencies-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ModernTable 
                data={filteredPendencies}
                columns={pendencyColumns}
                loading={loading}
                hideHeader={true}
                searchPlaceholder="Buscar pendências..."
                emptyState={
                  pendencies.length === 0 ? (
                    <EmptyState
                      title="Nenhuma pendência na fila"
                      description="Não há solicitações aguardando aprovação no momento."
                      icon={CheckCircle}
                    />
                  ) : (
                    <EmptyState
                      title="Nenhum registro encontrado"
                      description="Sua busca não retornou resultados."
                      icon={Search}
                    />
                  )
                }
                actions={(item) => (
                  <div className="modern-actions" style={{ justifyContent: 'flex-end', width: '100%' }}>
                    {item.status === 'pending' ? (
                      <>
                        <button 
                          className="action-dot" 
                          style={{ background: '#22c55e20', color: '#22c55e', width: 'auto', padding: '0 12px', borderRadius: '6px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }} 
                          title="Aprovar"
                          onClick={() => handleApprove(item)}
                        >
                          Aprovar
                        </button>
                        <button 
                          className="action-dot" 
                          style={{ background: '#ef444420', color: '#ef4444', width: 'auto', padding: '0 12px', borderRadius: '6px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }} 
                          title="Rejeitar"
                          onClick={() => handleReject(item)}
                        >
                          Rejeitar
                        </button>
                      </>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ 
                          color: item.status === 'approved' ? '#10b981' : '#ef4444', 
                          fontWeight: 800, 
                          fontSize: '11px', 
                          textTransform: 'uppercase',
                          background: item.status === 'approved' ? '#10b98120' : '#ef444420',
                          padding: '4px 8px',
                          borderRadius: '6px'
                        }}>
                          {item.status === 'approved' ? 'Aprovado' : 'Recusado'}
                        </span>
                        <button 
                          className="action-dot" 
                          style={{ background: '#f59e0b20', color: '#f59e0b', width: '28px', height: '28px', padding: 0, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                          title="Reverter Decisão"
                          onClick={() => handleRevert(item)}
                        >
                          <RefreshCw size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              />
            </motion.div>
          ) : (
            <motion.div 
              key="rules-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {viewMode === 'list' ? (
                <ModernTable 
                  data={filteredRules}
                  columns={rulesColumns}
                  loading={loading}
                  hideHeader={true}
                  searchPlaceholder="Buscar regras..."
                  emptyState={
                    rules.length === 0 ? (
                      <EmptyState
                        title="Nenhuma regra cadastrada"
                        description="Você ainda não possui regras de aprovação cadastradas. Crie a primeira para gerenciar alçadas."
                        actionLabel="Nova Regra"
                        onAction={() => { setSelectedRule(null); setIsRuleModalOpen(true); }}
                        icon={Shield}
                      />
                    ) : (
                      <EmptyState
                        title="Nenhum registro encontrado"
                        description="Sua busca não retornou resultados."
                        icon={Search}
                      />
                    )
                  }
                  actions={(item) => (
                    <div className="modern-actions">
                      <button className="action-dot info" title="Visualizar"><Eye size={18} /></button>
                      <button className="action-dot edit" onClick={() => { setSelectedRule(item); setIsRuleModalOpen(true); }} title="Editar"><Edit3 size={18} /></button>
                      <button 
                        className={`action-dot ${item.active ? 'warning' : 'success'}`} 
                        onClick={() => handleToggleRule(item.id)} 
                        title={item.active ? 'Desativar Regra' : 'Ativar Regra'}
                      >
                        {item.active ? <Archive size={18} /> : <RefreshCw size={18} />}
                      </button>
                      <button className="action-dot delete" onClick={() => handleDeleteRule(item.id)} title="Excluir"><Trash2 size={18} /></button>
                    </div>
                  )}
                />
              ) : (
                <div className="rule-cards-grid">
                  {filteredRules.length === 0 ? (
                    <div 
                      className="rule-card-premium"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        padding: '20px',
                        background: 'hsl(var(--bg-card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '24px',
                        gap: '6px',
                        minHeight: '180px',
                        height: '100%',
                        boxShadow: 'none'
                      }}
                    >
                      <div 
                        style={{ 
                          width: '40px', 
                          height: '40px', 
                          background: 'rgba(16, 185, 129, 0.1)', 
                          color: '#10b981', 
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {rules.length === 0 ? <Shield size={22} style={{ color: 'hsl(var(--brand))' }} /> : <Search size={22} />}
                      </div>
                      <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'hsl(var(--text-main))', margin: 0 }}>
                        {rules.length === 0 ? 'Nenhuma regra cadastrada' : 'Nenhum registro encontrado'}
                      </h3>
                      <p style={{ fontSize: '10.5px', color: '#64748b', margin: 0, lineHeight: '1.3', maxWidth: '260px' }}>
                        {rules.length === 0 ? 'Você ainda não possui regras de aprovação cadastradas.' : 'Sua busca não retornou resultados.'}
                      </p>
                      {rules.length === 0 && (
                        <button 
                          className="primary-btn" 
                          onClick={() => { setSelectedRule(null); setIsRuleModalOpen(true); }}
                          style={{ fontSize: '10.5px', padding: '6px 12px', height: '30px', marginTop: '4px', minHeight: 'auto' }}
                        >
                          <Plus size={12} />
                          <span>NOVA REGRA</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    filteredRules.map(rule => {
                      const badgeClass = rule.active ? 'active' : 'stopped';
                      const badgeText = rule.active ? 'ATIVA' : 'INATIVA';
                      const borderClass = rule.active ? 'active' : 'danger-badge';

                      return (
                        <motion.div 
                          key={rule.id} 
                          layout
                          className={`rule-card-premium ${borderClass}`}
                        >
                          <div className="card-left-section">
                            <div className="card-avatar">
                              <Shield size={28} />
                            </div>
                            <div className="card-bottom-actions">
                              <button className="action-icon-btn info" title="Visualizar"><Eye size={14} /></button>
                              <button className="action-icon-btn edit" onClick={() => { setSelectedRule(rule); setIsRuleModalOpen(true); }} title="Editar"><Edit3 size={14} /></button>
                              <button 
                                className={`action-icon-btn ${rule.active ? 'warning' : 'success'}`} 
                                onClick={() => handleToggleRule(rule.id)} 
                                title={rule.active ? 'Desativar Regra' : 'Ativar Regra'}
                              >
                                {rule.active ? <Archive size={14} /> : <RefreshCw size={14} />}
                              </button>
                              <button className="action-icon-btn delete" onClick={() => handleDeleteRule(rule.id)} title="Excluir"><Trash2 size={14} /></button>
                            </div>
                          </div>

                          <div className="card-main-content">
                            <div className="card-header-info" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '6px' }}>
                              <div className="title-row" style={{ width: '100%' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'hsl(var(--text-main))', width: '100%' }}>{rule.module}</h3>
                              </div>
                              <div className="meta-row" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span className={`status-pill mini ${badgeClass}`}>
                                  {badgeText}
                                </span>
                                <div className="card-type-meta">REGRA DE APROVAÇÃO</div>
                              </div>
                            </div>

                            <div className="card-occupation-section">
                              <div className="occ-header">
                                <span>HIERARQUIA</span>
                                <span>
                                  {rule.stages} {rule.stages === 1 ? 'NÍVEL' : 'NÍVEIS'}
                                </span>
                              </div>
                              <div className="occ-bar-container">
                                <div 
                                  className={`occ-bar-fill`}
                                  style={{ width: `${Math.min((rule.stages / 3) * 100, 100)}%` }}
                                />
                              </div>
                              <div className="occ-footer" style={{ marginTop: '4px' }}>
                                Condição: {rule.condition}
                              </div>
                            </div>

                            <div className="card-footer-meta">
                              <div className="meta-item">
                                <TrendingUp size={12} />
                                <span>Gatilho Automático</span>
                              </div>
                              <div className="meta-item">
                                <Activity size={12} />
                                <span className="card-farm-meta">Módulo Base</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                  <button className="add-rule-card-premium" onClick={() => { setSelectedRule(null); setIsRuleModalOpen(true); }}>
                    <Plus size={32} />
                    <span>NOVA REGRA</span>
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <RuleFormModal 
        isOpen={isRuleModalOpen}
        onClose={() => setIsRuleModalOpen(false)}
        onSubmit={handleSaveRule}
        initialData={selectedRule}
      />

      <ApprovalFilterModal 
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filters={filters}
        setFilters={setFilters}
        activeTab={activeTab}
      />

      <style>{`
        .rule-cards-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          padding: 8px;
        }

        @media (max-width: 1400px) {
          .rule-cards-grid { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 900px) {
          .rule-cards-grid { grid-template-columns: 1fr; }
        }

        .rule-card-premium {
          background: hsl(var(--bg-card));
          border-radius: 24px;
          border: 1px solid hsl(var(--border));
          display: flex;
          overflow: hidden;
          padding: 0;
          min-height: 180px;
          height: auto;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 15px rgba(0,0,0,0.03);
          position: relative;
          text-align: left;
        }

        .rule-card-premium::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 6px;
          background: #94a3b8;
          transition: 0.3s;
        }

        .rule-card-premium.active::before {
          background: #10b981;
          box-shadow: 4px 0 15px rgba(16, 185, 129, 0.3);
        }

        .rule-card-premium.danger-badge::before {
          background: #ef4444;
          box-shadow: 4px 0 15px rgba(239, 68, 68, 0.3);
        }

        .rule-card-premium:hover {
          transform: translateY(-6px);
          box-shadow: var(--shadow-lg);
          border-color: hsl(var(--brand) / 0.35);
        }

        .card-left-section {
          width: 130px;
          flex-shrink: 0;
          background: hsl(var(--bg-main) / 0.5);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-right: 1px solid hsl(var(--border));
        }

        .card-avatar {
          width: 56px;
          height: 56px;
          background: hsl(var(--bg-card));
          color: hsl(var(--brand));
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 20px rgba(0,0,0,0.1);
          border: 1px solid hsl(var(--border));
          margin-bottom: 8px;
        }

        .card-main-content {
          flex: 1;
          padding: 12px 18px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .rule-card-premium .card-header-info .title-row {
          display: flex;
          justify-content: flex-start;
          align-items: center;
          margin-bottom: 4px;
          gap: 8px;
          min-width: 0;
        }

        .rule-card-premium .card-header-info h3 {
          font-size: 16px;
          font-weight: 900;
          letter-spacing: -0.02em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          min-width: 0;
          flex: 0 1 auto;
        }

        .rule-card-premium .status-pill.mini {
          font-size: 9px;
          padding: 3px 8px;
          border-radius: 6px;
          flex-shrink: 0;
          white-space: nowrap;
        }

        .card-type-meta {
          font-size: 10px;
          font-weight: 800;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .card-occupation-section {
          margin: 4px 0;
        }

        .occ-header {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          font-weight: 800;
          margin-bottom: 2px;
          color: #64748b;
        }

        .occ-bar-container {
          height: 6px;
          background: hsl(var(--bg-main));
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 2px;
        }

        .occ-bar-fill {
          height: 100%;
          background: #3b82f6;
          border-radius: 3px;
          transition: 0.5s;
        }

        .occ-footer {
          font-size: 10px;
          font-weight: 600;
          color: #94a3b8;
        }

        .card-footer-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: auto;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
        }

        .card-farm-meta {
          color: #10b981;
          font-weight: 800;
        }

        .card-bottom-actions {
          display: flex;
          flex-wrap: nowrap;
          justify-content: center;
          gap: 6px;
          width: 100%;
          margin-top: 8px;
        }

        .action-icon-btn {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--bg-card));
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: 0.2s;
        }

        .action-icon-btn:hover {
          background: hsl(var(--brand));
          color: white;
          border-color: hsl(var(--brand));
        }

        .action-icon-btn.info:hover { background: #3b82f6; border-color: #3b82f6; }
        .action-icon-btn.success:hover { background: #10b981; border-color: #10b981; }
        .action-icon-btn.warning:hover { background: #f59e0b; border-color: #f59e0b; }
        .action-icon-btn.delete:hover { background: #ef4444; border-color: #ef4444; }

        .add-rule-card-premium {
          border: 2px dashed #e2e8f0;
          border-radius: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          background: transparent;
          cursor: pointer;
          color: #94a3b8;
          transition: 0.2s;
          min-height: 180px;
          height: 100%;
        }

        .add-rule-card-premium:hover {
          border-color: #10b981;
          color: #10b981;
          background: rgba(16, 185, 129, 0.02);
        }

        .add-rule-card-premium span { font-size: 11px; font-weight: 900; letter-spacing: 0.05em; }

        [data-theme='dark'] .rule-card-premium,
        [data-theme='dark'] .add-rule-card-premium {
          background: hsl(var(--bg-main)) !important;
          border-color: hsl(var(--border)) !important;
          color: hsl(var(--text-main)) !important;
        }

        [data-theme='dark'] .card-left-section {
          background: hsl(var(--bg-card) / 0.3) !important;
          border-color: hsl(var(--border)) !important;
        }

        [data-theme='dark'] .card-avatar,
        [data-theme='dark'] .action-icon-btn {
          background: hsl(var(--bg-card)) !important;
          border-color: hsl(var(--border)) !important;
          color: hsl(var(--text-main)) !important;
        }

        [data-theme='dark'] .action-icon-btn:hover {
          background: hsl(var(--brand)) !important;
          color: white !important;
        }

        [data-theme='dark'] .action-icon-btn.delete:hover {
          background: #ef4444 !important;
        }
      `}</style>
    </div>
  );
};

export default ApprovalCenter;
