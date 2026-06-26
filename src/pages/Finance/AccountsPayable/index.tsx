/**
 * AccountsPayable - Main Module
 * Orchestrates all components for accounts payable management
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { CreditCard, Plus, Calendar, CheckCircle2, FileText, Zap as ZapIcon } from 'lucide-react';
import { usePersistentState } from '../../../hooks/usePersistentState';
import { useFarmFilter } from '../../../hooks/useFarmFilter';
import { exportToCSV, exportToExcel, exportToPDF } from '../../../utils/export';
import { TauzeStatCard } from '../../../components/Cards/TauzeStatCard';
import { KPISkeleton } from '../../../components/Feedback/Skeleton';
import { Breadcrumb } from '../../../components/Navigation/Breadcrumb';
import { FinancialCalendarModal } from '../../../components/Modals/FinancialCalendarModal';
import { useConfirm } from '../../../contexts/ConfirmContext';

// Local components and hooks
import { AccountsTable } from './AccountsTable';
import { FilterPanel } from './FilterPanel';
import { PaymentModal } from './PaymentModal';
import { AccountForm } from './AccountForm';
import { useAccountsData } from './useAccountsData';
import { usePaymentMutation } from './usePaymentMutation';
import { useFilters } from './useFilters';
import type { Account, HistoryItem } from './types';
import { hasDraftForKey } from '../../../hooks/useFormDraft';

// Import styles from parent directory
import '../AccountsPayable.css';

export const AccountsPayable: React.FC = () => {
  const { isGlobalMode, activeFarmId, activeTenantId } = useFarmFilter();
  const { confirm } = useConfirm();
  const queryClient = useQueryClient();

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formActionId, setFormActionId] = useState<number>(0);
  const [selectedBill, setSelectedBill] = useState<Account | null>(null);

  const [isHistoryModalOpen, setIsHistoryModalOpen] = usePersistentState(
    'AccountsPayable_isHistoryModalOpen',
    false
  );
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [selectedItems, setSelectedItems] = useState<(string | number)[]>([]);
  const [isBatchModalOpen, setIsBatchModalOpen] = usePersistentState(
    'AccountsPayable_isBatchModalOpen',
    false
  );
  const [isCalendarOpen, setIsCalendarOpen] = usePersistentState(
    'AccountsPayable_isCalendarOpen',
    false
  );

  // Auto-reabrir: restaura formulário se existe rascunho (usuário navegou sem cancelar)
  useEffect(() => {
    if (!activeTenantId || isModalOpen) return;
    if (hasDraftForKey(`transaction_form_${activeTenantId}`)) setIsModalOpen(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTenantId]);

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

  const { bills, stats, totalCount, loading, error, refresh, page, setPage, pageSize } =
    useAccountsData({
      activeTab,
      searchTerm,
      filterValues,
    });

  const { handleSubmit, deleteMutation, isSubmitting } = usePaymentMutation(selectedBill, () => {
    setIsModalOpen(false);
    setSelectedBill(null);
  });

  // URL deep linking
  useEffect(() => {
    const id = searchParams.get('id');
    if (id && bills.length > 0) {
      const bill = bills.find((b) => b.id === id);
      if (bill) {
        handleOpenEdit(bill);
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [searchParams, bills]);

  // Handlers
  const handleOpenCreate = () => {
    setSelectedBill(null);
    setFormActionId(Date.now());
    setIsModalOpen(true);
  };

  const handleOpenEdit = (bill: Account) => {
    setSelectedBill(bill);
    setFormActionId(Date.now());
    setIsModalOpen(true);
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const filteredData = bills.filter((b) => {
      const matchesSearch =
        (b.descricao || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.parceiros?.nome || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTab = activeTab === 'TODAS' || b.status === activeTab;
      const matchesStatus = filterValues.status === 'all' || b.status === filterValues.status;
      const amount = Number(b.valor_total);
      const matchesAmount =
        filterValues.maxAmount >= 1000000 ||
        (amount >= (filterValues.minAmount || 0) && amount <= (filterValues.maxAmount || 1000000));
      const matchesDate =
        (!filterValues.dateStart ||
          new Date(b.data_vencimento) >= new Date(filterValues.dateStart)) &&
        (!filterValues.dateEnd || new Date(b.data_vencimento) <= new Date(filterValues.dateEnd));
      return matchesSearch && matchesTab && matchesStatus && matchesAmount && matchesDate;
    });

    const exportData = filteredData.map((item) => ({
      Vencimento: item.data_vencimento,
      Descricao: item.descricao,
      Parceiro: item.parceiros?.nome || item.parceiro || 'Geral',
      Valor: item.valor_total,
      Status: item.status,
      Categoria: item.categoria,
      Metodo_Pagamento: item.metodo_pagamento,
    }));

    if (format === 'csv') exportToCSV(exportData, 'log_contas_pagar');
    else if (format === 'excel') exportToExcel(exportData, 'log_contas_pagar');
    else if (format === 'pdf')
      exportToPDF(exportData, 'log_contas_pagar', 'Relatório de Contas a Pagar');
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Atenção',
      description: 'Tem certeza que deseja excluir esta conta?',
      confirmText: 'Confirmar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!isConfirmed) return;
    deleteMutation.mutate(id);
  };

  const handleMarkAsPaid = (id: string) => {
    setSelectedBill(bills.find((b) => b.id === id) || null);
    setIsBatchModalOpen(true);
  };

  const handleViewDetails = (bill: Account) => {
    setIsHistoryModalOpen(true);
    setHistoryItems([
      {
        id: '1',
        date: bill.data_vencimento,
        title: `Título: ${bill.descricao}`,
        subtitle: `Parceiro: ${bill.parceiros?.nome || bill.parceiro || 'Geral'}`,
        value: Number(bill.valor_total).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }),
        status: bill.status === 'PAGO' ? 'success' : 'info',
      },
      {
        id: '2',
        date: bill.data_vencimento,
        title: 'Categoria',
        subtitle: bill.categoria || 'Geral',
        value: bill.metodo_pagamento || 'N/A',
        status: 'info',
      },
      {
        id: '3',
        date: bill.data_vencimento,
        title: 'Centro de Custo',
        subtitle: 'Geral Fazenda',
        value: '100%',
        status: 'success',
      },
    ]);
  };

  const getIcon = (label: string) => {
    switch (label) {
      case 'Passivo Circulante':
        return CreditCard;
      case 'Total Liquidado':
        return CheckCircle2;
      case 'Volume de Títulos':
        return FileText;
      default:
        return ZapIcon;
    }
  };

  return (
    <div className="payable-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <Breadcrumb
            paths={[
              { label: 'Financeiro', href: '/financeiro/intelligence' },
              { label: 'Contas a Pagar' },
            ]}
          />
          <h1 className="page-title">Contas a Pagar</h1>
          <p className="page-subtitle">
            Gestão de obrigações, fluxo de saída e controle rigoroso de parceiros.
          </p>
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
        <AccountsTable
          bills={bills}
          loading={loading}
          totalCount={totalCount}
          currentPage={page}
          onPageChange={setPage}
          itemsPerPage={pageSize}
          selectedItems={selectedItems}
          onSelectionChange={setSelectedItems}
          onMarkAsPaid={handleMarkAsPaid}
          onViewDetails={handleViewDetails}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
          onCreateNew={handleOpenCreate}
        />
      </div>

      <PaymentModal
        isBatchModalOpen={isBatchModalOpen}
        onCloseBatchModal={() => {
          setIsBatchModalOpen(false);
          setSelectedBill(null);
        }}
        selectedBill={selectedBill}
        selectedItems={selectedItems}
        onBatchSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['report', 'contas-pagar'] });
          setSelectedItems([]);
        }}
        isHistoryModalOpen={isHistoryModalOpen}
        onCloseHistoryModal={() => setIsHistoryModalOpen(false)}
        historyItems={historyItems}
        historyLoading={historyLoading}
        onClearSelection={() => setSelectedItems([])}
        onOpenBatchModal={() => setIsBatchModalOpen(true)}
      />

      <AccountForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        actionId={formActionId}
        selectedBill={selectedBill}
        onSubmit={handleSubmit}
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
