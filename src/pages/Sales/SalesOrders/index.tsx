/**
 * SalesOrders - Main Module (Refactored)
 * Orchestrates all components for sales order management
 */

import React, { useState, useEffect } from 'react';
import { Plus, Zap } from 'lucide-react';
import { usePersistentState } from '../../../hooks/usePersistentState';
import { useFarmFilter } from '../../../hooks/useFarmFilter';
import { exportToCSV, exportToExcel, exportToPDF } from '../../../utils/export';
import { TauzeStatCard } from '../../../components/Cards/TauzeStatCard';
import { KPISkeleton } from '../../../components/Feedback/Skeleton';
import { Breadcrumb } from '../../../components/Navigation/Breadcrumb';
import { SalesOrderForm } from '../../../components/Forms/SalesOrderForm';
import { SalesFilterModal } from '../components/SalesFilterModal';
import { HistoryModal } from '../../../components/Modals/HistoryModal';
import { useConfirm } from '../../../contexts/ConfirmContext';
import toast from 'react-hot-toast';

// Local components and hooks
import { OrdersTable } from './OrdersTable';
import { OrdersKanban } from './OrdersKanban';
import { FilterControls } from './FilterControls';
import { useSalesData } from './useSalesData';
import { useSalesMutations } from './useSalesMutations';
import { useFilters } from './useFilters';
import type { SalesOrder, SalesOrderFormData, HistoryItem } from './types';
import { hasDraftForKey } from '../../../hooks/useFormDraft';

export const SalesOrders: React.FC = () => {
  const { canCreate, activeTenantId } = useFarmFilter();
  const { confirm } = useConfirm();

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formActionId, setFormActionId] = useState<number>(0);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = usePersistentState(
    'SalesOrders_isHistoryModalOpen',
    false
  );
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isLogisticsAuditActive, setIsLogisticsAuditActive] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // Auto-reabrir: restaura formulário se existe rascunho (usuário navegou sem cancelar)
  useEffect(() => {
    if (!activeTenantId || isModalOpen) return;
    if (hasDraftForKey(`sales_order_form_${activeTenantId}`)) setIsModalOpen(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTenantId]);

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

  const { orders, stats, loading } = useSalesData({
    activeTab,
    searchTerm,
    filterValues,
  });

  const { saveMutation, deleteMutation, updateStatusMutation } = useSalesMutations({
    selectedOrder,
    onSaveSuccess: () => {
      setIsModalOpen(false);
      setSelectedOrder(null);
    },
  });

  // Handlers
  const handleOpenCreate = () => {
    setSelectedOrder(null);
    setFormActionId(Date.now());
    setIsModalOpen(true);
  };

  const handleOpenEdit = (order: SalesOrder) => {
    setSelectedOrder(order);
    setFormActionId(Date.now());
    setIsModalOpen(true);
  };

  const handleSubmit = async (data: SalesOrderFormData) => {
    if (!canCreate && !selectedOrder) {
      toast.error(
        '⚠️ Selecione uma unidade específica para registrar um pedido. No modo Visão Global, defina a fazenda emitente antes de prosseguir.'
      );
      return;
    }
    saveMutation.mutate(data);
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Atenção',
      description: 'Deseja excluir este pedido?',
      confirmText: 'Confirmar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!isConfirmed) return;
    deleteMutation.mutate(id);
  };

  const handleUpdateOrderStatus = async (
    id: string,
    newStatus: 'pending' | 'delivered' | 'canceled'
  ) => {
    setUpdatingStatus(id);
    updateStatusMutation.mutate(
      { id, newStatus },
      {
        onSettled: () => setUpdatingStatus(null),
      }
    );
  };

  const handleViewHistory = async (order: SalesOrder) => {
    setIsHistoryModalOpen(true);
    setHistoryLoading(true);
    setTimeout(() => {
      setHistoryItems([
        {
          id: '1',
          date: order.created_at || new Date().toISOString(),
          title: 'Pedido criado',
          subtitle: `Pedido #${order.numero_pedido || order.id}`,
          entity_type: 'pedidos_venda',
          entity_id: order.id,
          action: 'create',
          user_id: '',
          created_at: order.created_at || new Date().toISOString(),
          status: 'success' as const,
        },
        {
          id: '2',
          date: new Date().toISOString(),
          title: 'Pedido atualizado',
          subtitle: 'Status alterado',
          entity_type: 'pedidos_venda',
          entity_id: order.id,
          action: 'update',
          user_id: '',
          created_at: new Date().toISOString(),
          status: 'info' as const,
        },
        {
          id: '3',
          date: new Date().toISOString(),
          title: 'Pedido processado',
          subtitle: 'Em andamento',
          entity_type: 'pedidos_venda',
          entity_id: order.id,
          action: 'update',
          user_id: '',
          created_at: new Date().toISOString(),
          status: 'info' as const,
        },
      ]);
      setHistoryLoading(false);
    }, 800);
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const filteredData = orders.filter((o) => {
      const matchesSearch =
        (o.numero_pedido || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.parceiros?.nome || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTab = activeTab === 'OPEN' ? o.status !== 'delivered' : o.status === 'delivered';
      const matchesStatus = filterValues.status === 'all' || o.status === filterValues.status;
      const matchesMargin = (o.margin || 0) >= filterValues.minMargin;
      const matchesRisk = !filterValues.onlyHighRisk || o.isHighRisk;
      const matchesDate =
        (!filterValues.dateStart ||
          new Date(o.created_at || '') >= new Date(filterValues.dateStart)) &&
        (!filterValues.dateEnd || new Date(o.created_at || '') <= new Date(filterValues.dateEnd));
      return (
        matchesSearch && matchesTab && matchesStatus && matchesMargin && matchesRisk && matchesDate
      );
    });

    const exportData = filteredData.map((item) => ({
      ID: item.id?.slice(0, 8).toUpperCase(),
      Pedido: item.numero_pedido || '-',
      Parceiro: item.parceiros?.nome || '-',
      Data: new Date(item.data_pedido).toLocaleDateString(),
      Valor_Total: item.valor_total || 0,
      Margem_Est: `${(item.margin || 0).toFixed(1)}%`,
      Status: item.status,
    }));

    if (format === 'csv') exportToCSV(exportData, 'pedidos_venda');
    else if (format === 'excel') exportToExcel(exportData, 'pedidos_venda');
    else if (format === 'pdf')
      exportToPDF(exportData, 'pedidos_venda', 'Relatório de Pedidos de Venda');
  };

  return (
    <div className="orders-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <Breadcrumb
            paths={[{ label: 'Vendas', href: '/vendas/dashboard' }, { label: 'Pedidos de Venda' }]}
          />
          <h1 className="page-title">Pedidos de Venda</h1>
          <p className="page-subtitle">
            Monitoramento do fluxo comercial, desde a emissão da ordem até a entrega final ao
            parceiro.
          </p>
        </div>

        <div className="page-actions">
          <button
            className={`glass-btn secondary ${isLogisticsAuditActive ? 'active' : ''}`}
            onClick={() => setIsLogisticsAuditActive(!isLogisticsAuditActive)}
            style={
              isLogisticsAuditActive
                ? {
                    background: 'hsl(var(--brand) / 0.1)',
                    borderColor: 'hsl(var(--brand))',
                    color: 'hsl(var(--brand))',
                  }
                : {}
            }
          >
            <Zap size={18} fill={isLogisticsAuditActive ? 'currentColor' : 'none'} />
            {isLogisticsAuditActive ? 'AUDITORIA ATIVA' : 'CHECKLIST LOGÍSTICO'}
          </button>
          <button className="primary-btn" onClick={handleOpenCreate}>
            <Plus size={18} />
            NOVO PEDIDO
          </button>
        </div>
      </header>

      <div className="next-gen-kpi-grid">
        {loading
          ? Array(4)
              .fill(0)
              .map((_, i) => <KPISkeleton key={i} />)
          : stats.map((stat, idx) => (
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
                trend={stat.trend === 'neutral' ? undefined : stat.trend as 'up' | 'down' | undefined}
              />
            ))}
      </div>

      <FilterControls
        activeTab={activeTab}
        onTabChange={handleTabChange}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        showAdvancedFilters={showAdvancedFilters}
        onToggleAdvancedFilters={() => setShowAdvancedFilters(!showAdvancedFilters)}
        onExport={handleExport}
      />

      <SalesFilterModal
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filters={filterValues}
        setFilters={setFilterValues}
      />

      <div className="management-content">
        {viewMode === 'list' ? (
          <OrdersTable
            orders={orders}
            loading={loading}
            onViewHistory={handleViewHistory}
            onEdit={handleOpenEdit}
            onDelete={handleDelete}
            onCreateNew={handleOpenCreate}
          />
        ) : (
          <OrdersKanban
            orders={orders}
            updatingStatus={updatingStatus}
            onViewHistory={handleViewHistory}
            onEdit={handleOpenEdit}
            onDelete={handleDelete}
            onUpdateStatus={handleUpdateOrderStatus}
          />
        )}
      </div>

      <SalesOrderForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        actionId={formActionId}
        onSubmit={handleSubmit}
        initialData={selectedOrder}
      />

      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="Dossiê do Pedido de Venda"
        subtitle="Rastreabilidade de aprovação e trânsito da carga"
        items={historyItems}
        loading={historyLoading}
      />
    </div>
  );
};
