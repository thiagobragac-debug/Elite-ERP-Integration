/**
 * AccountsReceivable - Main Module
 * Orchestrates all components for accounts receivable management
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { HandCoins, Plus, Calendar, CheckCircle2, FileText, Zap as ZapIcon } from 'lucide-react';
import { usePersistentState } from '../../../hooks/usePersistentState';
import { useFarmFilter } from '../../../hooks/useFarmFilter';
import { exportToCSV, exportToExcel, exportToPDF } from '../../../utils/export';
import { TauzeStatCard } from '../../../components/Cards/TauzeStatCard';
import { KPISkeleton } from '../../../components/Feedback/Skeleton';
import { Breadcrumb } from '../../../components/Navigation/Breadcrumb';
import { FinancialCalendarModal } from '../../../components/Modals/FinancialCalendarModal';
import { useConfirm } from '../../../contexts/ConfirmContext';

// Local components and hooks
import { ReceivablesTable } from './ReceivablesTable';
import { FilterPanel } from './FilterPanel';
import { LiquidationModal } from './LiquidationModal';
import { ReceivableForm } from './ReceivableForm';
import { useReceivablesData } from './useReceivablesData';
import { useReceivableMutation } from './useReceivableMutation';
import { useFilters } from './useFilters';
import type { Receivable, HistoryItem } from './types';

// Import styles from parent directory
import '../AccountsReceivable.css';

export const AccountsReceivable: React.FC = () => {
  const { isGlobalMode, activeFarmId, activeTenantId } = useFarmFilter();
  const { confirm } = useConfirm();
  const queryClient = useQueryClient();

  // Modal states
  const [isModalOpen, setIsModalOpen] = usePersistentState('AccountsReceivable_isModalOpen', false);
  const [formActionId, setFormActionId] = useState<number>(0);
  const [selectedInvoice, setSelectedInvoice] = useState<Receivable | null>(null);

  const [isHistoryModalOpen, setIsHistoryModalOpen] = usePersistentState(
    'AccountsReceivable_isHistoryModalOpen',
    false
  );
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [selectedItems, setSelectedItems] = useState<(string | number)[]>([]);
  const [isBatchModalOpen, setIsBatchModalOpen] = usePersistentState(
    'AccountsReceivable_isBatchModalOpen',
    false
  );
  const [isCalendarOpen, setIsCalendarOpen] = usePersistentState(
    'AccountsReceivable_isCalendarOpen',
    false
  );

  // URL params handling
  const [searchParams] = useSearchParams();

  // Custom hooks
  const {
    activeTab,
    searchTerm,
    setSearchTerm,
    showAdvancedFilters,
    setShowAdvancedFilters,
    filterValues,
    setFilterValues,
    handleTabChange,
  } = useFilters();

  const { invoices, stats, totalCount, loading, error, refresh, page, setPage, pageSize } =
    useReceivablesData({
      activeTab,
      searchTerm,
      filterValues,
    });

  const { handleSubmit, deleteMutation, isSubmitting } = useReceivableMutation(
    selectedInvoice,
    () => {
      setIsModalOpen(false);
      setSelectedInvoice(null);
    }
  );

  // URL deep linking
  useEffect(() => {
    const id = searchParams.get('id');
    if (id && invoices.length > 0) {
      const invoice = invoices.find((inv) => inv.id === id);
      if (invoice) {
        handleOpenEdit(invoice);
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [searchParams, invoices]);

  // Handlers
  const handleOpenCreate = () => {
    setSelectedInvoice(null);
    setFormActionId(Date.now());
    setIsModalOpen(true);
  };

  const handleOpenEdit = (invoice: Receivable) => {
    setSelectedInvoice(invoice);
    setFormActionId(Date.now());
    setIsModalOpen(true);
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const filteredData = invoices.filter((i) => {
      const matchesSearch =
        (i.descricao || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (i.parceiros?.nome || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTab = activeTab === 'TODAS' || i.status === activeTab;
      const matchesStatus = filterValues.status === 'all' || i.status === filterValues.status;
      const amount = Number(i.valor_total);
      const matchesAmount =
        filterValues.maxAmount >= 1000000 ||
        (amount >= (filterValues.minAmount || 0) && amount <= (filterValues.maxAmount || 1000000));
      const matchesDate =
        (!filterValues.dateStart ||
          new Date(i.data_vencimento) >= new Date(filterValues.dateStart)) &&
        (!filterValues.dateEnd || new Date(i.data_vencimento) <= new Date(filterValues.dateEnd));
      return matchesSearch && matchesTab && matchesStatus && matchesAmount && matchesDate;
    });

    const exportData = filteredData.map((item) => ({
      Vencimento: item.data_vencimento,
      Descricao: item.descricao,
      Parceiro: item.parceiros?.nome || item.parceiro || 'Geral',
      Valor: item.valor_total,
      Status: item.status,
      Categoria: item.categoria,
      Metodo_Recebimento: item.metodo_recebimento,
    }));

    if (format === 'csv') exportToCSV(exportData, 'log_contas_receber');
    else if (format === 'excel') exportToExcel(exportData, 'log_contas_receber');
    else if (format === 'pdf')
      exportToPDF(exportData, 'log_contas_receber', 'Relatório de Contas a Receber');
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Atenção',
      description: 'Tem certeza que deseja excluir esta receita?',
      confirmText: 'Confirmar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!isConfirmed) return;
    deleteMutation.mutate(id);
  };

  const handleMarkAsReceived = (id: string) => {
    setSelectedInvoice(invoices.find((i) => i.id === id) || null);
    setIsBatchModalOpen(true);
  };

  const handleViewDetails = (inv: Receivable) => {
    setIsHistoryModalOpen(true);
    setHistoryItems([
      {
        id: '1',
        date: inv.data_vencimento,
        title: `Título: ${inv.descricao}`,
        subtitle: `Parceiro: ${inv.parceiros?.nome || inv.parceiro || 'Geral'}`,
        value: Number(inv.valor_total).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }),
        status: inv.status === 'RECEBIDO' ? 'success' : 'info',
      },
      {
        id: '2',
        date: inv.data_vencimento,
        title: 'Categoria',
        subtitle: inv.categoria || 'Geral',
        value: inv.metodo_recebimento || 'N/A',
        status: 'info',
      },
      {
        id: '3',
        date: inv.data_vencimento,
        title: 'Origem',
        subtitle: 'Venda de Gado',
        value: '100%',
        status: 'success',
      },
    ]);
  };

  const getIcon = (label: string) => {
    switch (label) {
      case 'Ativo Circulante':
        return HandCoins;
      case 'Total Recebido':
        return CheckCircle2;
      case 'Volume de Títulos':
        return FileText;
      default:
        return ZapIcon;
    }
  };

  return (
    <div className="receivable-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <Breadcrumb
            paths={[
              { label: 'Financeiro', href: '/financeiro/intelligence' },
              { label: 'Contas a Receber' },
            ]}
          />
          <h1 className="page-title">Contas a Receber</h1>
          <p className="page-subtitle">
            Rastreabilidade de receitas, liquidação de faturas e saúde do crédito em tempo real.
          </p>
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
        {loading
          ? Array(4)
              .fill(0)
              .map((_, i) => <KPISkeleton key={i} />)
          : (stats || []).map((rawStat, idx) => {
              const stat = rawStat as {
                label: string; value: string | number; icon?: unknown;
                color?: string; progress?: number; change?: string;
                trend?: 'up' | 'down'; sparkline?: { value: number }[];
              };
              return (
                <TauzeStatCard
                  key={idx}
                  label={stat.label}
                  value={stat.value}
                  icon={stat.icon as never || getIcon(stat.label)}
                  color={stat.color || 'brand'}
                  progress={stat.progress}
                  change={stat.change || '---'}
                  trend={stat.trend}
                  sparkline={stat.sparkline}
                  periodLabel="Mes Atual"
                />
              );
            })}
      </div>

      <FilterPanel
        activeTab={activeTab}
        onTabChange={(tab) => handleTabChange(tab, () => setPage(1))}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        showAdvancedFilters={showAdvancedFilters}
        onToggleAdvancedFilters={() => setShowAdvancedFilters(!showAdvancedFilters)}
        filterValues={filterValues}
        onFilterValuesChange={setFilterValues}
        onExport={handleExport}
      />

      <div className="management-content">
        <ReceivablesTable
          invoices={invoices}
          loading={loading}
          totalCount={totalCount}
          currentPage={page}
          onPageChange={setPage}
          itemsPerPage={pageSize}
          selectedItems={selectedItems}
          onSelectionChange={setSelectedItems}
          onMarkAsReceived={handleMarkAsReceived}
          onViewDetails={handleViewDetails}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
          onCreateNew={handleOpenCreate}
        />
      </div>

      <LiquidationModal
        isBatchModalOpen={isBatchModalOpen}
        onCloseBatchModal={() => {
          setIsBatchModalOpen(false);
          setSelectedInvoice(null);
        }}
        selectedInvoice={selectedInvoice}
        selectedItems={selectedItems}
        onBatchSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['report', 'contas-receber'] });
          setSelectedItems([]);
        }}
        isHistoryModalOpen={isHistoryModalOpen}
        onCloseHistoryModal={() => setIsHistoryModalOpen(false)}
        historyItems={historyItems}
        historyLoading={historyLoading}
        onClearSelection={() => setSelectedItems([])}
        onOpenBatchModal={() => setIsBatchModalOpen(true)}
      />

      <ReceivableForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        actionId={formActionId}
        selectedInvoice={selectedInvoice}
        onSubmit={handleSubmit}
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
