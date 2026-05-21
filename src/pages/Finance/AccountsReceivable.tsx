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
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/export';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { TransactionForm } from '../../components/Forms/TransactionForm';
import { HistoryModal } from '../../components/Modals/HistoryModal';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { TauzeStatCard } from '../../components/Cards/TauzeStatCard';
import { BatchLiquidationModal } from '../../components/Modals/BatchLiquidationModal';
import { KPISkeleton } from '../../components/Feedback/Skeleton';
import { EmptyState } from '../../components/Feedback/EmptyState';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { FinancialCalendarModal } from '../../components/Modals/FinancialCalendarModal';
import { ReceivableFilterModal } from './components/ReceivableFilterModal';
import './AccountsReceivable.css';

import { useReportData } from '../../hooks/useReportData';
import { useDebounce } from '../../hooks/useDebounce';

export const AccountsReceivable: React.FC = () => {
  const { isGlobalMode, activeFarmId, activeTenantId, canCreate, insertPayload } = useFarmFilter();
  const [activeTab, setActiveTab] = useState<'TODAS' | 'PENDENTE' | 'RECEBIDO'>('TODAS');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [page, setPage] = useState(1);
  const pageSize = 25;

  const debouncedSearch = useDebounce(searchTerm, 500);

  const { data: rawInvoices, stats, totalCount, loading, error, refresh } = useReportData('contas-receber', {
    page,
    pageSize,
    filters: {
      ...filterValues,
      status: activeTab,
      search: debouncedSearch
    }
  });

  const invoices = rawInvoices || [];

  if (error) {
    console.error("[AccountsReceivable] Error:", error);
  }

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

    setIsSubmitting(true);
    try {
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
        
        if (error) throw error;
        
        setIsModalOpen(false);
        refresh();
      } else {
        const { error } = await supabase
          .from('contas_receber')
          .insert([{ ...payload, ...insertPayload }]);

        if (error) throw error;
        
        setIsModalOpen(false);
        refresh();
      }
    } catch (err: any) {
      console.error('[AccountsReceivable] Erro ao salvar:', err);
      alert('❌ Erro ao salvar receita: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const filteredData = invoices.filter(i => {
      const matchesSearch = (i.descricao || '').toLowerCase().includes(searchTerm.toLowerCase()) || (i.clientes?.nome || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTab = activeTab === 'TODAS' || i.status === activeTab;
      const matchesStatus = filterValues.status === 'all' || i.status === filterValues.status;
      const amount = Number(i.valor_total);
      const matchesAmount = amount >= (filterValues.minAmount || 0) && amount <= (filterValues.maxAmount || 1000000);
      const matchesDate = (!filterValues.dateStart || new Date(i.data_vencimento) >= new Date(filterValues.dateStart)) &&
                         (!filterValues.dateEnd || new Date(i.data_vencimento) <= new Date(filterValues.dateEnd));
      return matchesSearch && matchesTab && matchesStatus && matchesAmount && matchesDate;
    });

    const exportData = filteredData.map(item => ({
      Vencimento: item.data_vencimento,
      Descricao: item.descricao,
      Cliente: item.clientes?.nome || item.cliente || 'Geral',
      Valor: item.valor_total,
      Status: item.status,
      Categoria: item.categoria,
      Metodo_Recebimento: item.metodo_recebimento
    }));

    if (format === 'csv') exportToCSV(exportData, 'log_contas_receber');
    else if (format === 'excel') exportToExcel(exportData, 'log_contas_receber');
    else if (format === 'pdf') exportToPDF(exportData, 'log_contas_receber', 'Relatório de Contas a Receber');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta receita?')) return;
    try {
      const { error } = await supabase.from('contas_receber').delete().eq('id', id);
      if (error) throw error;
      refresh();
    } catch (err: any) {
      alert('❌ Erro ao excluir receita: ' + err.message);
    }
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
      header: 'Vencimento',
      accessor: (item: any) => {
        const dueDate = new Date(item.data_vencimento);
        const today = new Date();
        today.setHours(0,0,0,0);
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const isOverdue = diffDays < 0 && item.status === 'PENDENTE';

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
            <span style={{ color: isOverdue ? '#e11d48' : '#1e293b', fontWeight: 800, fontSize: '12px' }}>
              {dueDate.toLocaleDateString()}
            </span>
            {item.status === 'PENDENTE' && (
              <span className={`status-pill ${diffDays <= 0 ? 'danger' : 'info'}`} style={{ fontSize: '9px', padding: '2px 4px', width: 'fit-content' }}>
                {diffDays === 0 ? 'HOJE' : diffDays < 0 ? `${Math.abs(diffDays)}d ATRASO` : `${diffDays}d REST`}
              </span>
            )}
          </div>
        );
      },
      align: 'left' as const
    },
    {
      header: 'Identificação Título',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
          <span className="main-text" style={{ fontWeight: 700, color: '#1e293b' }}>
            {item.descricao || 'Sem descrição'}
          </span>
          <span className="sub-meta" style={{ color: '#94a3b8', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase' }}>
            DOC: {item.id?.slice(0, 8).toUpperCase() || 'N/A'}
          </span>
        </div>
      ),
      align: 'left' as const
    },
    {
      header: 'Cliente / Pagador',
      accessor: (item: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#334155', fontWeight: 600, fontSize: '12px' }}>
          <Users size={14} color="#94a3b8" />
          <span>{item.clientes?.nome || item.cliente || 'Geral'}</span>
        </div>
      ),
      align: 'left' as const
    },
    {
      header: 'Categoria & Método',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155', textTransform: 'uppercase' }}>
            {item.categoria || 'Geral'}
          </span>
          <span className="sub-meta" style={{ color: '#94a3b8', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase' }}>
            {item.metodo_recebimento || 'Pix'}
          </span>
        </div>
      ),
      align: 'center' as const
    },
    {
      header: 'Valor Bruto BRL',
      accessor: (item: any) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 900, color: '#0f172a' }}>
            {Number(item.valor_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        </div>
      ),
      align: 'center' as const
    },
    {
      header: 'Situação',
      accessor: (item: any) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span className={`status-pill ${item.status === 'RECEBIDO' ? 'active' : item.status === 'ATRASADO' ? 'danger' : 'warning'}`}>
            {item.status}
          </span>
        </div>
      ),
      align: 'center' as const
    }
  ];

  const getIcon = (label: string) => {
    switch (label) {
      case 'Ativo Circulante': return HandCoins;
      case 'Total Recebido': return CheckCircle2;
      case 'Volume de Títulos': return FileText;
      default: return ZapIcon;
    }
  };

  return (
    <div className="receivable-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge">
            <HandCoins size={14} fill="currentColor" />
            <span>TAUZE RECEIVABLES v5.0</span>
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
        ) : (stats || []).map((stat, idx) => (
          <TauzeStatCard 
            key={idx}
            label={stat.label}
            value={stat.value}
            icon={stat.icon || getIcon(stat.label)}
            color={stat.color || 'brand'}
            progress={stat.progress}
            change="+4.8%"
            trend={stat.trend === 'neutral' ? undefined : stat.trend}
          />
        ))}
      </div>

      <div className="tauze-controls-row">
        <div className="tauze-tab-group">
          <button 
            className={`tauze-tab-item ${activeTab === 'TODAS' ? 'active' : ''}`}
            onClick={() => { setActiveTab('TODAS'); setPage(1); }}
          >
            Todas Receitas
          </button>
          <button 
            className={`tauze-tab-item ${activeTab === 'PENDENTE' ? 'active' : ''}`}
            onClick={() => { setActiveTab('PENDENTE'); setPage(1); }}
          >
            Pendentes
          </button>
          <button 
            className={`tauze-tab-item ${activeTab === 'RECEBIDO' ? 'active' : ''}`}
            onClick={() => { setActiveTab('RECEBIDO'); setPage(1); }}
          >
            Recebidas
          </button>
        </div>

        <div className="tauze-search-wrapper">
          <Search size={18} className="s-icon" />
          <input 
            type="text" 
            className="tauze-search-input"
            placeholder="Filtrar por descrição ou cliente..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

         <div className="tauze-filter-group">
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
                const menu = document.getElementById('export-menu-receivable');
                if (menu) menu.classList.toggle('active');
              }}
            >
              <FileText size={20} />
            </button>
            <div id="export-menu-receivable" className="export-menu">
              <button onClick={() => { handleExport('csv'); document.getElementById('export-menu-receivable')?.classList.remove('active'); }}>Excel (.CSV)</button>
              <button onClick={() => { handleExport('excel'); document.getElementById('export-menu-receivable')?.classList.remove('active'); }}>Excel (.xlsx)</button>
              <button onClick={() => { handleExport('pdf'); document.getElementById('export-menu-receivable')?.classList.remove('active'); }}>PDF</button>
            </div>
          </div>
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
            data={invoices}
            columns={columns}
            loading={loading}
            hideHeader={true}
            totalCount={totalCount}
            currentPage={page}
            onPageChange={setPage}
            itemsPerPage={pageSize}
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
            className="tauze-batch-actions-bar"
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
          refresh();
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
