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
  ExternalLink,
  AlertTriangle,
  Zap as ZapIcon
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { TransactionForm } from '../../components/Forms/TransactionForm';
import { HistoryModal } from '../../components/Modals/HistoryModal';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { EliteStatCard } from '../../components/Cards/EliteStatCard';
import { BatchLiquidationModal } from '../../components/Modals/BatchLiquidationModal';
import { KPISkeleton } from '../../components/Feedback/Skeleton';
import { EmptyState } from '../../components/Feedback/EmptyState';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { GlobalModeBanner } from '../../components/GlobalMode/GlobalModeBanner';
import { FinancialCalendarModal } from '../../components/Modals/FinancialCalendarModal';
import { PayableFilterModal } from './components/PayableFilterModal';
import './AccountsPayable.css';

export const AccountsPayable: React.FC = () => {
  const { activeFarm, isGlobalMode, activeFarmId, applyFarmFilter, canCreate, insertPayload } = useFarmFilter();
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
  const [filterValues, setFilterValues] = useState({ 
    status: 'all', 
    minAmount: 0,
    maxAmount: 1000000,
    dateStart: '', 
    dateEnd: '' 
  });
  const [selectedItems, setSelectedItems] = useState<(string | number)[]>([]);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  useEffect(() => {
    if (!activeFarmId && !isGlobalMode) return;
    fetchBills();
  }, [activeFarmId, isGlobalMode]);

  const [searchParams] = useSearchParams();

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
      let query = supabase.from('contas_pagar').select('*, fornecedores(nome)').order('data_vencimento', { ascending: true });
      query = applyFarmFilter(query);
      const { data } = await query;
      
      if (data) {
        setBills(data);
        const now = new Date();
        const totalAPagar = data.filter(b => b.status === 'PENDENTE').reduce((acc, curr) => acc + Number(curr.valor_total), 0);
        const atrasado = data.filter(b => b.status === 'PENDENTE' && new Date(b.data_vencimento) < now).reduce((acc, curr) => acc + Number(curr.valor_total), 0);
        
        const next7DaysDate = new Date();
        next7DaysDate.setDate(now.getDate() + 7);
        const fluxo7Dias = data.filter(b => b.status === 'PENDENTE' && new Date(b.data_vencimento) <= next7DaysDate && new Date(b.data_vencimento) >= now).reduce((acc, curr) => acc + Number(curr.valor_total), 0);
        
        setStats([
          { 
            label: 'Passivo Circulante', 
            value: totalAPagar.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 
            icon: CreditCard, 
            color: '#6366f1', 
            progress: 100,
            change: 'Aberto Total',
            periodLabel: 'Exigível'
          },
          { 
            label: 'Risco de Liquidez', 
            value: atrasado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 
            icon: AlertTriangle, 
            color: '#ef4444', 
            progress: totalAPagar > 0 ? (atrasado / totalAPagar) * 100 : 0, 
            trend: atrasado > 0 ? 'up' : 'down',
            change: `${((atrasado / (totalAPagar || 1)) * 100).toFixed(1)}% do total`,
            periodLabel: 'Contas Atrasadas'
          },
          { 
            label: 'Fluxo (7 Dias)', 
            value: fluxo7Dias.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 
            icon: Clock, 
            color: '#f59e0b', 
            progress: 60,
            change: 'Próxima Semana',
            periodLabel: 'Saída Prevista'
          },
          { 
            label: 'DPO (Médio)', 
            value: '28 dias', 
            icon: RefreshCw, 
            color: '#10b981', 
            progress: 85,
            change: 'Prazo Pagto',
            periodLabel: 'Eficiência Financeira'
          },
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
    if (!canCreate && !selectedBill) {
      alert('⚠️ Selecione uma unidade específica para registrar uma nova conta. No modo Visão Global, a fazenda devedora deve ser definida.');
      return;
    }

    const payload = {
      descricao: formData.description,
      valor_total: parseFloat(formData.value),
      data_vencimento: formData.dueDate,
      categoria: formData.category,
      fornecedor_id: formData.entityId,
      metodo_pagamento: formData.paymentMethod,
      status: formData.status
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
        .insert([{ ...payload, ...insertPayload }]);

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
    setSelectedBill(bills.find(b => b.id === id));
    setIsBatchModalOpen(true);
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
      accessor: (item: any) => {
        const dueDate = new Date(item.data_vencimento);
        const today = new Date();
        today.setHours(0,0,0,0);
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const isOverdue = diffDays < 0 && item.status === 'PENDENTE';

        return (
          <div className="table-cell-title">
            <span className={`main-text ${isOverdue ? 'text-red-600 font-black' : ''}`}>
              {dueDate.toLocaleDateString()}
              {isOverdue && <AlertTriangle size={12} className="inline ml-1 text-red-600 animate-pulse" />}
            </span>
            <div className="sub-meta flex items-center gap-1">
              <FileText size={12} />
              <span className="truncate max-w-[150px]">{item.descricao}</span>
              {item.status === 'PENDENTE' && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black uppercase ${diffDays <= 0 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                  {diffDays === 0 ? 'HOJE' : diffDays < 0 ? `${Math.abs(diffDays)}d ATRASO` : `${diffDays}d REST`}
                </span>
              )}
            </div>
          </div>
        );
      }
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
      header: 'Prioridade',
      accessor: (item: any) => {
        const dueDate = new Date(item.data_vencimento);
        const today = new Date();
        const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const amount = Number(item.valor_total);
        
        let priority = 'BAIXA';
        let color = 'bg-slate-100 text-slate-600';
        
        if (diffDays < 0 || (diffDays <= 3 && amount > 5000)) {
          priority = 'CRÍTICA';
          color = 'bg-rose-100 text-rose-700 font-black';
        } else if (diffDays <= 7) {
          priority = 'MÉDIA';
          color = 'bg-amber-100 text-amber-700';
        }

        return (
          <span className={`text-[9px] px-2 py-0.5 rounded-md tracking-tighter ${color}`}>
            {priority}
          </span>
        );
      },
      align: 'center' as const
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
      <GlobalModeBanner />
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
          <button className="glass-btn secondary" onClick={() => setIsCalendarOpen(true)}>
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

       <PayableFilterModal 
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filters={filterValues}
        setFilters={setFilterValues}
      />

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
              const matchesStatus = filterValues.status === 'all' || b.status === filterValues.status;
              const amount = Number(b.valor_total);
              const matchesAmount = amount >= (filterValues.minAmount || 0) && amount <= (filterValues.maxAmount || 1000000);
              const matchesDate = (!filterValues.dateStart || new Date(b.data_vencimento) >= new Date(filterValues.dateStart)) &&
                                 (!filterValues.dateEnd || new Date(b.data_vencimento) <= new Date(filterValues.dateEnd));
              return matchesSearch && matchesTab && matchesStatus && matchesAmount && matchesDate;
            })}
            columns={columns}
            loading={loading}
            hideHeader={true}
            selectable={true}
            isSelectable={(item) => item.status !== 'PAGO'}
            selectedItems={selectedItems}
            onSelectionChange={(ids) => {
              const selectableIds = bills.filter(b => b.status !== 'PAGO').map(b => b.id);
              const onlySelectableSelected = ids.filter(id => selectableIds.includes(id as string));
              setSelectedItems(onlySelectableSelected);
            }}
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

      <AnimatePresence>
        {selectedItems.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="elite-batch-actions-bar"
          >
            <div className="batch-info">
              <div className="batch-count">{selectedItems.length}</div>
              <div className="batch-text">Títulos Selecionados</div>
            </div>
            <div className="batch-actions">
              <button className="batch-btn secondary" onClick={() => setSelectedItems([])}>
                CANCELAR
              </button>
              <button className="batch-btn success" onClick={() => setIsBatchModalOpen(true)}>
                <Check size={18} />
                LIQUIDAR EM LOTE
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

      <BatchLiquidationModal 
        isOpen={isBatchModalOpen}
        onClose={() => {
          setIsBatchModalOpen(false);
          setSelectedBill(null);
        }}
        onSuccess={() => {
          fetchBills();
          setSelectedItems([]);
        }}
        selectedIds={selectedBill ? [selectedBill.id] : selectedItems}
        type="payable"
        title={selectedBill ? "Baixa Individual" : "Baixa em Lote"}
        subtitle={selectedBill 
          ? `Liquidando título: ${selectedBill.descricao}` 
          : `Liquidando ${selectedItems.length} títulos selecionados.`
        }
      />

      <FinancialCalendarModal 
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        data={bills}
        type="payable"
      />
    </div>
  );
};
