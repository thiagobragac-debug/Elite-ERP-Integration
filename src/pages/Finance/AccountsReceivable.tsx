import React, { useState, useEffect } from 'react';
import { 
  HandCoins, 
  Plus, 
  CheckCircle2, 
  TrendingUp, 
  Calendar,
  Users,
  FileText,
  Clock,
  Trash2,
  Tag,
  ChevronRight,
  Search,
  Eye,
  Check,
  Edit3,
  Filter,
  AlertTriangle,
  TrendingDown,
  Zap as ZapIcon
} from 'lucide-react';
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
import { ReceivableFilterModal } from './components/ReceivableFilterModal';
import './AccountsReceivable.css';

export const AccountsReceivable: React.FC = () => {
  const { activeFarm, isGlobalMode, activeFarmId, applyFarmFilter, canCreate, insertPayload } = useFarmFilter();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'TODAS' | 'PENDENTE' | 'RECEBIDO'>('TODAS');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
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
    fetchInvoices();
  }, [activeFarmId, isGlobalMode]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      let query = supabase.from('contas_receber').select('*, clientes(nome)').order('data_vencimento', { ascending: true });
      query = applyFarmFilter(query);
      const { data } = await query;
      
      if (data) {
        setInvoices(data);
        const now = new Date();
        const totalAReceber = data.filter(i => i.status === 'PENDENTE').reduce((acc, curr) => acc + Number(curr.valor_total), 0);
        const emAtraso = data.filter(i => i.status === 'PENDENTE' && new Date(i.data_vencimento) < now).reduce((acc, curr) => acc + Number(curr.valor_total), 0);
        
        const next30DaysDate = new Date();
        next30DaysDate.setDate(now.getDate() + 30);
        const proj30Dias = data.filter(i => i.status === 'PENDENTE' && new Date(i.data_vencimento) <= next30DaysDate).reduce((acc, curr) => acc + Number(curr.valor_total), 0);

        setStats([
          { 
            label: 'Projeção de Receita', 
            value: totalAReceber.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 
            icon: HandCoins, 
            color: '#10b981', 
            progress: 100,
            change: 'Consolidado',
            periodLabel: 'Aberto Total'
          },
          { 
            label: 'Inadimplência (Aging)', 
            value: emAtraso.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 
            icon: AlertTriangle, 
            color: '#ef4444', 
            progress: totalAReceber > 0 ? (emAtraso / totalAReceber) * 100 : 0,
            trend: emAtraso > 0 ? 'up' : 'down',
            change: `${((emAtraso / (totalAReceber || 1)) * 100).toFixed(1)}% do total`,
            periodLabel: 'Títulos em Atraso'
          },
          { 
            label: 'Previsão (30 Dias)', 
            value: proj30Dias.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 
            icon: Calendar, 
            color: '#3b82f6', 
            progress: 65,
            change: 'Próximo Período',
            periodLabel: 'Entrada Esperada'
          },
          { 
            label: 'DSO (Médio)', 
            value: '34 dias', 
            icon: TrendingUp, 
            color: '#f59e0b', 
            progress: 80,
            change: 'Tempo de Giro',
            periodLabel: 'Ciclo de Caixa'
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
    setSelectedInvoice(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (invoice: any) => {
    setSelectedInvoice(invoice);
    setIsModalOpen(true);
  };

  const handleSubmit = async (formData: any) => {
    if (!canCreate && !selectedInvoice) {
      alert('⚠️ Selecione uma unidade específica para registrar uma nova receita. No modo Visão Global, a fazenda beneficiária deve ser definida.');
      return;
    }

    const payload = {
      descricao: formData.description,
      valor_total: parseFloat(formData.value),
      data_vencimento: formData.dueDate,
      categoria: formData.category,
      cliente_id: formData.entityId,
      metodo_recebimento: formData.paymentMethod,
      status: formData.status
    };

    if (selectedInvoice) {
      const { error } = await supabase
        .from('contas_receber')
        .update(payload)
        .eq('id', selectedInvoice.id);
      
      if (!error) {
        setIsModalOpen(false);
        fetchInvoices();
      }
    } else {
      const { error } = await supabase
        .from('contas_receber')
        .insert([{ ...payload, ...insertPayload }]);

      if (!error) {
        setIsModalOpen(false);
        fetchInvoices();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta receita?')) return;
    const { error } = await supabase.from('contas_receber').delete().eq('id', id);
    if (!error) fetchInvoices();
  };

  const handleMarkAsReceived = async (id: string) => {
    setSelectedInvoice(invoices.find(i => i.id === id));
    setIsBatchModalOpen(true);
  };

  const handleViewDetails = (inv: any) => {
    setIsHistoryModalOpen(true);
    setHistoryItems([
      { id: '1', date: inv.data_vencimento, title: 'Título: ' + inv.descricao, subtitle: 'Cliente: ' + (inv.clientes?.nome || inv.cliente || 'Geral'), value: Number(inv.valor_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), status: inv.status === 'RECEBIDO' ? 'success' : 'pending' },
      { id: '2', date: inv.data_vencimento, title: 'Categoria', subtitle: inv.categoria || 'Geral', value: inv.metodo_recebimento || 'N/A', status: 'info' },
      { id: '3', date: inv.data_vencimento, title: 'Origem', subtitle: 'Venda de Gado', value: '100%', status: 'success' },
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
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black uppercase ${diffDays <= 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {diffDays === 0 ? 'HOJE' : diffDays < 0 ? `${Math.abs(diffDays)}d ATRASO` : `${diffDays}d REST`}
                </span>
              )}
            </div>
          </div>
        );
      }
    },
    {
      header: 'Cliente',
      accessor: (item: any) => (
        <div className="table-cell-meta">
          <Users size={14} />
          <span>{item.clientes?.nome || item.cliente || 'Geral'}</span>
        </div>
      )
    },
    {
      header: 'Valor Bruto',
      accessor: (item: any) => (
        <span className="font-bold text-slate-900">
          {Number(item.valor_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: (item: any) => (
        <span className={`status-pill ${item.status === 'RECEBIDO' ? 'paid' : item.status === 'ATRASADO' ? 'overdue' : 'pending'}`}>
          {item.status}
        </span>
      ),
      align: 'center' as const
    }
  ];

  return (
    <div className="accounts-receivable-page animate-slide-up">
      <GlobalModeBanner />
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge">
            <HandCoins size={14} fill="currentColor" />
            <span>ELITE RECEIVABLES v5.0</span>
          </div>
          <h1 className="page-title">Contas a Receber</h1>
          <p className="page-subtitle">Rastreabilidade de receitas, liquidação de faturas e saúde do crédito em tempo real.</p>
        </div>
        <div className="page-actions">
          <button className="glass-btn primary" onClick={() => setIsCalendarOpen(true)}>
            <Calendar size={18} />
            PREVISÃO
          </button>
          <button className="primary-btn" onClick={handleOpenCreate}>
            <Plus size={18} />
            NOVA RECEITA
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
            change="+4.8%"
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
            Todas Receitas
          </button>
          <button 
            className={`elite-tab-item ${activeTab === 'PENDENTE' ? 'active' : ''}`}
            onClick={() => setActiveTab('PENDENTE')}
          >
            Pendentes
          </button>
          <button 
            className={`elite-tab-item ${activeTab === 'RECEBIDO' ? 'active' : ''}`}
            onClick={() => setActiveTab('RECEBIDO')}
          >
            Recebidas
          </button>
        </div>

        <div className="elite-search-wrapper">
          <Search size={18} className="s-icon" />
          <input 
            type="text" 
            className="elite-search-input"
            placeholder="Filtrar por descrição ou cliente..." 
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

        <ReceivableFilterModal 
          isOpen={showAdvancedFilters}
          onClose={() => setShowAdvancedFilters(false)}
          filters={filterValues}
          setFilters={setFilterValues}
        />
      </div>

      <div className="management-content">
        {invoices.length === 0 && !loading ? (
          <EmptyState 
            title="Nenhum recebível cadastrado" 
            description="Você ainda não registrou nenhuma conta a receber para esta unidade. Comece adicionando uma nova venda ou fatura."
            actionLabel="Adicionar Receita"
            onAction={handleOpenCreate}
            icon={HandCoins}
          />
        ) : (
          <ModernTable 
             data={invoices.filter(i => {
              const matchesSearch = (i.descricao || '').toLowerCase().includes(searchTerm.toLowerCase()) || (i.clientes?.nome || '').toLowerCase().includes(searchTerm.toLowerCase());
              const matchesTab = activeTab === 'TODAS' || i.status === activeTab;
              
              const matchesStatus = filterValues.status === 'all' || i.status === filterValues.status;
              const amount = Number(i.valor_total);
              const matchesAmount = amount >= (filterValues.minAmount || 0) && amount <= (filterValues.maxAmount || 1000000);
              const matchesDate = (!filterValues.dateStart || new Date(i.data_vencimento) >= new Date(filterValues.dateStart)) &&
                                 (!filterValues.dateEnd || new Date(i.data_vencimento) <= new Date(filterValues.dateEnd));

              return matchesSearch && matchesTab && matchesStatus && matchesAmount && matchesDate;
            })}
            columns={columns}
            loading={loading}
            hideHeader={true}
            selectable={true}
            isSelectable={(item) => item.status !== 'RECEBIDO'}
            selectedItems={selectedItems}
            onSelectionChange={(ids) => {
              const selectableIds = invoices.filter(i => i.status !== 'RECEBIDO').map(i => i.id);
              const onlySelectableSelected = ids.filter(id => selectableIds.includes(id as string));
              setSelectedItems(onlySelectableSelected);
            }}
            actions={(item) => (
              <div className="modern-actions">
                {item.status === 'PENDENTE' && (
                  <button className="action-dot success" onClick={() => handleMarkAsReceived(item.id)} title="Baixar">
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
        type="receivable"
        initialData={selectedInvoice}
        onSubmit={handleSubmit}
      />

      <HistoryModal 
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="Dossiê da Receita"
        subtitle="Rastreabilidade completa do recebível"
        items={historyItems}
        loading={historyLoading}
      />

      <BatchLiquidationModal 
        isOpen={isBatchModalOpen}
        onClose={() => {
          setIsBatchModalOpen(false);
          setSelectedInvoice(null);
        }}
        onSuccess={() => {
          fetchInvoices();
          setSelectedItems([]);
        }}
        selectedIds={selectedInvoice ? [selectedInvoice.id] : selectedItems}
        type="receivable"
        title={selectedInvoice ? "Baixa Individual" : "Baixa em Lote"}
        subtitle={selectedInvoice 
          ? `Liquidando título: ${selectedInvoice.descricao}` 
          : `Liquidando ${selectedItems.length} títulos selecionados.`
        }
      />

      <FinancialCalendarModal 
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        data={invoices}
        type="receivable"
      />
    </div>
  );
};
