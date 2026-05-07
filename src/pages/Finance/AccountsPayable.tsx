import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Plus, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  Trash2,
  Edit3,
  Check,
  FileText,
  Tag,
  ChevronRight,
  Search,
  Filter,
  TrendingDown,
  Eye,
  Building2,
  Calendar,
  RefreshCw,
  ArrowRight,
  History,
  X,
  ExternalLink
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { TransactionForm } from '../../components/Forms/TransactionForm';
import { HistoryModal } from '../../components/Modals/HistoryModal';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { EliteStatCard } from '../../components/Cards/EliteStatCard';
import { KPISkeleton } from '../../components/Feedback/Skeleton';
import { EmptyState } from '../../components/Feedback/EmptyState';
import './AccountsPayable.css';

export const AccountsPayable: React.FC = () => {
  const { activeFarm } = useTenant();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bills, setBills] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'TODAS' | 'PENDENTE' | 'PAGO'>('TODAS');
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [stats, setStats] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterValues, setFilterValues] = useState({ status: 'all', dateStart: '', dateEnd: '' });

  useEffect(() => {
    if (!activeFarm) return;
    fetchBills();
  }, [activeFarm]);

  const [searchParams] = useSearchParams();

  // Deep Linking: Abre o lançamento automaticamente se vier da auditoria
  useEffect(() => {
    const id = searchParams.get('id');
    if (id && bills.length > 0) {
      const bill = bills.find(b => b.id === id);
      if (bill) {
        handleOpenEdit(bill);
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [searchParams, bills]);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('contas_pagar')
        .select('*, fornecedores(nome)')
        .eq('fazenda_id', activeFarm.id)
        .order('data_vencimento', { ascending: true });
      
      if (data) {
        setBills(data);
        const totalAPagar = data.filter(b => b.status === 'PENDENTE').reduce((acc, curr) => acc + Number(curr.valor_total), 0);
        const atrasado = data.filter(b => b.status === 'PENDENTE' && new Date(b.data_vencimento) < new Date()).reduce((acc, curr) => acc + Number(curr.valor_total), 0);
        const venceHoje = data.filter(b => b.status === 'PENDENTE' && new Date(b.data_vencimento).toDateString() === new Date().toDateString()).reduce((acc, curr) => acc + Number(curr.valor_total), 0);
        const pagoMes = data.filter(b => b.status === 'PAGO').reduce((acc, curr) => acc + Number(curr.valor_total), 0);
        
        setStats([
          { label: 'Total a Pagar', value: totalAPagar.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), icon: CreditCard, color: '#6366f1', progress: 100 },
          { label: 'Passivo Atrasado', value: atrasado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), icon: AlertCircle, color: '#ef4444', progress: (atrasado / (totalAPagar || 1)) * 100, trend: 'up' },
          { label: 'Vence Hoje', value: venceHoje.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), icon: Clock, color: '#f59e0b', progress: 40 },
          { label: 'Liquidado (Mês)', value: pagoMes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), icon: CheckCircle2, color: '#10b981', progress: 85 },
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setSelectedBill(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (bill: any) => {
    setSelectedBill(bill);
    setIsModalOpen(true);
  };

  const handleSubmit = async (formData: any) => {
    if (!activeFarm) return;

    const payload = {
      descricao: formData.description,
      valor_total: parseFloat(formData.value),
      data_vencimento: formData.dueDate,
      categoria: formData.category,
      fornecedor_id: formData.entityId,
      metodo_pagamento: formData.paymentMethod,
      status: formData.status,
      fazenda_id: activeFarm.id,
      tenant_id: activeFarm.tenantId
    };

    if (selectedBill) {
      const { error } = await supabase
        .from('contas_pagar')
        .update(payload)
        .eq('id', selectedBill.id);
      
      if (!error) {
        setIsModalOpen(false);
        fetchBills();
      }
    } else {
      const { error } = await supabase
        .from('contas_pagar')
        .insert([payload]);

      if (!error) {
        setIsModalOpen(false);
        fetchBills();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta conta?')) return;
    const { error } = await supabase.from('contas_pagar').delete().eq('id', id);
    if (!error) fetchBills();
  };

  const handleMarkAsPaid = async (id: string) => {
    const { error } = await supabase
      .from('contas_pagar')
      .update({ status: 'PAGO', data_pagamento: new Date().toISOString() })
      .eq('id', id);
    if (!error) fetchBills();
  };

  const handleViewDetails = (bill: any) => {
    setIsHistoryModalOpen(true);
    setHistoryItems([
      { id: '1', date: bill.data_vencimento, title: 'Título: ' + bill.descricao, subtitle: 'Fornecedor: ' + (bill.fornecedores?.nome || bill.fornecedor || 'Geral'), value: Number(bill.valor_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), status: bill.status === 'PAGO' ? 'success' : 'pending' },
      { id: '2', date: bill.data_vencimento, title: 'Categoria', subtitle: bill.categoria || 'Geral', value: bill.metodo_pagamento || 'N/A', status: 'info' },
      { id: '3', date: bill.data_vencimento, title: 'Centro de Custo', subtitle: 'Geral Fazenda', value: '100%', status: 'success' },
    ]);
  };

  const columns = [
    {
      header: 'Vencimento / Título',
      accessor: (item: any) => (
        <div className="table-cell-title">
          <span className={`main-text ${new Date(item.data_vencimento) < new Date() && item.status === 'PENDENTE' ? 'text-red-500' : ''}`}>
            {new Date(item.data_vencimento).toLocaleDateString()}
          </span>
          <div className="sub-meta">
            <FileText size={12} />
            <span>{item.descricao}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Fornecedor',
      accessor: (item: any) => (
        <div className="table-cell-meta">
          <Building2 size={14} />
          <span>{item.fornecedores?.nome || item.fornecedor || 'Geral'}</span>
        </div>
      )
    },
    {
      header: 'Valor Total',
      accessor: (item: any) => (
        <span className="font-bold text-slate-900">
          {Number(item.valor_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: (item: any) => (
        <span className={`status-pill ${item.status === 'PAGO' ? 'active' : item.status === 'ATRASADO' ? 'danger' : 'warning'}`}>
          {item.status}
        </span>
      ),
      align: 'center' as const
    }
  ];

  return (
    <div className="accounts-payable-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge">
            <CreditCard size={14} fill="currentColor" />
            <span>ELITE PAYABLES v5.0</span>
          </div>
          <h1 className="page-title">Contas a Pagar</h1>
          <p className="page-subtitle">Gestão de obrigações, fluxo de saída e controle rigoroso de fornecedores.</p>
        </div>
        <div className="page-actions">
          <button className="glass-btn secondary" onClick={() => {}}>
            <Calendar size={18} />
            CALENDÁRIO
          </button>
          <button className="primary-btn" onClick={handleOpenCreate}>
            <Plus size={18} />
            NOVA CONTA
          </button>
        </div>
      </header>

      <div className="next-gen-kpi-grid">
        {loading ? (
          Array(4).fill(0).map((_, i) => <KPISkeleton key={i} />)
        ) : stats.map((stat, idx) => (
          <EliteStatCard 
            key={idx}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            progress={stat.progress}
            change="+2.1%"
            trend={stat.trend}
          />
        ))}
      </div>

      <div className="elite-controls-row">
        <div className="elite-tab-group">
          <button 
            className={`elite-tab-item ${activeTab === 'TODAS' ? 'active' : ''}`}
            onClick={() => setActiveTab('TODAS')}
          >
            Todas Contas
          </button>
          <button 
            className={`elite-tab-item ${activeTab === 'PENDENTE' ? 'active' : ''}`}
            onClick={() => setActiveTab('PENDENTE')}
          >
            Pendentes
          </button>
          <button 
            className={`elite-tab-item ${activeTab === 'PAGO' ? 'active' : ''}`}
            onClick={() => setActiveTab('PAGO')}
          >
            Pagas
          </button>
        </div>

        <div className="elite-search-wrapper">
          <Search size={18} className="s-icon" />
          <input 
            type="text" 
            className="elite-search-input"
            placeholder="Filtrar por descrição ou fornecedor..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="elite-filter-group">
          <button 
            className={`icon-btn-secondary ${showAdvancedFilters ? 'active' : ''}`}
            title="Filtros Avançados"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            <Filter size={20} />
          </button>
          <button className="icon-btn-secondary" title="Exportar Log">
            <FileText size={20} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showAdvancedFilters && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="advanced-filter-panel"
          >
            <div className="filter-grid">
              <div className="filter-field">
                <label className="elite-label">Status de Pagamento</label>
                <select 
                  className="elite-input elite-select"
                  value={filterValues.status}
                  onChange={(e) => setFilterValues({...filterValues, status: e.target.value})}
                >
                  <option value="all">Todos os Status</option>
                  <option value="PENDENTE">Pendentes</option>
                  <option value="PAGO">Pagos</option>
                  <option value="ATRASADO">Atrasados</option>
                </select>
              </div>
              <div className="filter-field">
                <label className="elite-label">Vencimento Inicial</label>
                <input 
                  className="elite-input"
                  type="date" 
                  value={filterValues.dateStart}
                  onChange={(e) => setFilterValues({...filterValues, dateStart: e.target.value})}
                />
              </div>
              <div className="filter-field">
                <label className="elite-label">Vencimento Final</label>
                <input 
                  className="elite-input"
                  type="date" 
                  value={filterValues.dateEnd}
                  onChange={(e) => setFilterValues({...filterValues, dateEnd: e.target.value})}
                />
              </div>
              <div className="filter-actions-inline">
                <button className="text-btn" onClick={() => setFilterValues({ status: 'all', dateStart: '', dateEnd: '' })}>
                  LIMPAR
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="management-content">
        {bills.length === 0 && !loading ? (
          <EmptyState
            title="Nenhuma conta a pagar"
            description="Não há obrigações financeiras registradas para esta unidade. Registre uma nova conta para iniciar o controle de pagamentos."
            actionLabel="Nova Conta"
            onAction={handleOpenCreate}
            icon={CreditCard}
          />
        ) : (
          <ModernTable 
            data={bills.filter(b => {
              const matchesSearch = (b.descricao || '').toLowerCase().includes(searchTerm.toLowerCase()) || (b.fornecedores?.nome || '').toLowerCase().includes(searchTerm.toLowerCase());
              const matchesTab = activeTab === 'TODAS' || b.status === activeTab;
              return matchesSearch && matchesTab;
            })}
            columns={columns}
            loading={loading}
            hideHeader={true}
            actions={(item) => (
              <div className="modern-actions">
                {item.status === 'PENDENTE' && (
                  <button className="action-dot success" onClick={() => handleMarkAsPaid(item.id)} title="Liquidar">
                    <Check size={18} />
                  </button>
                )}
                <button className="action-dot info" onClick={() => handleViewDetails(item)} title="Dossiê">
                  <FileText size={18} />
                </button>
                <button className="action-dot edit" onClick={() => handleOpenEdit(item)} title="Editar">
                  <Edit3 size={18} />
                </button>
                <button className="action-dot delete" onClick={() => handleDelete(item.id)} title="Excluir">
                  <Trash2 size={18} />
                </button>
              </div>
            )}
          />
        )}
      </div>

      <TransactionForm 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type="payable"
        initialData={selectedBill}
        onSubmit={handleSubmit}
      />

      <HistoryModal 
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="Dossiê do Título"
        subtitle="Rastreabilidade completa da obrigação financeira"
        items={historyItems}
        loading={historyLoading}
      />
    </div>
  );
};
