import React, { useState, useEffect } from 'react';
import { usePersistentState } from '../../hooks/usePersistentState';

import { useSearchParams } from 'react-router-dom';

function buildSparkline(
  records: any[],
  dateField: string,
  valueField: string | null,
  buckets = 7
): { value: number; label: string }[] {
  if (!records || records.length === 0) {
    return [];
  }
  const sorted = [...records]
    .filter((r) => r[dateField])
    .sort((a, b) => new Date(a[dateField]).getTime() - new Date(b[dateField]).getTime());
  if (sorted.length === 0) {
    return [];
  }
  const first = new Date(sorted[0][dateField]).getTime();
  const last = new Date(sorted[sorted.length - 1][dateField]).getTime();
  const totalMs = Math.max(last - first, 1);
  const bucketMs = totalMs / buckets;
  return Array.from({ length: buckets }, (_, i) => {
    const bStart = first + i * bucketMs;
    const bEnd = bStart + bucketMs;
    const inBucket = sorted.filter((r) => {
      const t = new Date(r[dateField]).getTime();
      return i === buckets - 1 ? t >= bStart && t <= bEnd : t >= bStart && t < bEnd;
    });
    const v =
      inBucket.length === 0
        ? 0
        : valueField
          ? inBucket.reduce((s, r) => s + Number(r[valueField] || 0), 0)
          : inBucket.length;
    return {
      value: Number(v.toFixed(2)),
      label: new Date(bStart + bucketMs / 2).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
      }),
    };
  });
}
import {
  Plus,
  Search,
  ShoppingCart,
  Building2,
  Calendar,
  DollarSign,
  CheckCircle2,
  Filter,
  Clock,
  Truck,
  Trash2,
  Edit3,
  FileText,
  TrendingDown,
  TrendingUp,
  ChevronRight,
  Zap,
  Tag,
  History,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { useDebounce } from '../../hooks/useDebounce';
import { PurchaseOrderForm } from '../../components/Forms/PurchaseOrderForm';
import { HistoryModal } from '../../components/Modals/HistoryModal';
import { TauzeStatCard } from '../../components/Cards/TauzeStatCard';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { formatNumber } from '../../utils/format';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/export';
import { PurchasingFilterModal } from './components/PurchasingFilterModal';
import { EmptyState } from '../../components/Feedback/EmptyState';
import { useApprovalQueue } from '../../hooks/useApprovalQueue';
import toast from 'react-hot-toast';
import { Breadcrumb } from '../../components/Navigation/Breadcrumb';
import { useConfirm } from '../../contexts/ConfirmContext';

export const PurchaseOrder: React.FC = () => {
  const { confirm } = useConfirm();
  const {
    activeFarm,
    isGlobalMode,
    activeFarmId,
    activeTenantId,
    applyFarmFilter,
    canCreate,
    insertPayload,
  } = useFarmFilter();
  const { submitForApproval } = useApprovalQueue();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = usePersistentState('PurchaseOrder_isModalOpen', false);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as 'OPEN' | 'HISTORY') || 'OPEN';
  const setActiveTab = (tab: string) => {
    setSearchParams(
      (prev) => {
        const n = new URLSearchParams(prev);
        n.set('tab', tab);
        return n;
      },
      { replace: true }
    );
  };
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = usePersistentState(
    'PurchaseOrder_isHistoryModalOpen',
    false
  );
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = usePersistentState(
    'PurchaseOrder_showAdvancedFilters',
    false
  );
  const [filterValues, setFilterValues] = useState({
    status: 'all',
    suppliers: [],
    minAmount: 0,
    maxAmount: 100000,
    dateStart: '',
    dateEnd: '',
    onlyDelayed: false,
  });

  // Server-side pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const debouncedSearch = useDebounce(searchTerm, 500);

  const isReady = isGlobalMode ? !!activeTenantId : !!activeFarmId;

  // React Query Fetch
  const { data: queryData = { orders: [], totalCount: 0 }, isLoading: loading } = useQuery({
    queryKey: [
      'purchasing_orders',
      activeFarmId,
      activeTenantId,
      isGlobalMode,
      page,
      debouncedSearch,
      filterValues,
      activeTab,
    ],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('pedidos_compra')
        .select(
          'id, numero_pedido, data_pedido, previsao_entrega, valor_total, status, fornecedor_id, created_at, parceiros(nome)',
          { count: 'exact' }
        )
        .order('created_at', { ascending: false })
        .range(from, to);

      query = applyFarmFilter(query);

      if (debouncedSearch) {
        query = query.ilike('numero_pedido', `%${debouncedSearch}%`);
      }

      if (activeTab === 'OPEN') {
        query = query.neq('status', 'received');
      } else {
        query = query.eq('status', 'received');
      }

      if (filterValues.status !== 'all') {
        query = query.eq('status', filterValues.status);
      }
      if (filterValues.minAmount > 0) {
        query = query.gte('valor_total', filterValues.minAmount);
      }
      if (filterValues.maxAmount < 1000000) {
        query = query.lte('valor_total', filterValues.maxAmount);
      }
      if (filterValues.dateStart) {
        query = query.gte('created_at', filterValues.dateStart);
      }
      if (filterValues.dateEnd) {
        query = query.lte('created_at', filterValues.dateEnd);
      }

      const { data, count, error } = await query;
      if (error) {
        throw error;
      }

      if (!data) {
        return { orders: [], totalCount: 0 };
      }

      // Data already includes parceiros via JOIN - no need for separate query
      const enriched = data.map((d: any) => ({
        ...d,
        parceiros: d.parceiros || { nome: 'N/A' },
      }));

      return { orders: enriched, totalCount: count || 0 };
    },
    enabled: isReady,
  });

  const { orders } = queryData;
  const { totalCount } = queryData;

  // Dynamic stats calculation
  const exposure = orders
    .filter((o: any) => o.status !== 'received')
    .reduce((acc: number, curr: any) => acc + Number(curr.valor_total || 0), 0);
  const totalPurchased = orders.reduce(
    (acc: number, curr: any) => acc + Number(curr.valor_total || 0),
    0
  );

  const stats = [
    {
      label: 'Exposição de Caixa',
      value: exposure.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      icon: DollarSign,
      color: '#3b82f6',
      progress: 100,
      change: 'Ordens em Aberto',
      sparkline: buildSparkline(orders || [], 'created_at', 'valor_total'),
    },
    {
      label: 'Investimento Mensal',
      value: totalPurchased.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      icon: ShoppingCart,
      color: '#10b981',
      progress: 100,
      change: 'Gasto Consolidado',
      sparkline: buildSparkline(orders || [], 'created_at', 'valor_total'),
    },
    {
      label: 'SLA de Entrega',
      value: (() => {
        const received = orders.filter((o: any) => o.status === 'received').length;
        return orders.length > 0 ? `${((received / orders.length) * 100).toFixed(0)}%` : '---';
      })(),
      icon: Truck,
      color: '#166534',
      progress: (() => {
        const received = orders.filter((o: any) => o.status === 'received').length;
        return orders.length > 0 ? (received / orders.length) * 100 : 0;
      })(),
      change: 'Pedidos Recebidos',
      trend: 'up' as const,
      sparkline: buildSparkline(orders || [], 'created_at', 'valor_total'),
    },
    {
      label: 'Ordens em Atraso',
      value: (() => {
        const delayed = orders.filter(
          (o: any) =>
            o.status !== 'received' &&
            o.previsao_entrega &&
            new Date(o.previsao_entrega) < new Date()
        ).length;
        return delayed > 0 ? delayed : orders.length > 0 ? 0 : '---';
      })(),
      icon: Clock,
      color: '#f59e0b',
      progress: (() => {
        const delayed = orders.filter(
          (o: any) =>
            o.status !== 'received' &&
            o.previsao_entrega &&
            new Date(o.previsao_entrega) < new Date()
        ).length;
        return orders.length > 0 ? (delayed / orders.length) * 100 : 0;
      })(),
      change: 'Atraso Logístico',
      sparkline: buildSparkline(orders || [], 'created_at', 'valor_total'),
    },
  ];

  const handleOpenCreate = () => {
    setSelectedOrder(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (order: any) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const saveOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        numero_pedido: data.order_number,
        fornecedor_id: data.supplier_id,
        data_pedido: data.date,
        previsao_entrega: data.delivery_date,
        forma_pagamento: data.payment_method,
        valor_total: parseFloat(data.total_value),
        status: selectedOrder?.status || 'ordered',
        observacoes: data.description,
        ...insertPayload,
      };

      if (selectedOrder) {
        const { error } = await supabase
          .from('pedidos_compra')
          .update(payload)
          .eq('id', selectedOrder.id);
        if (error) {
          throw error;
        }
      } else {
        const { data: newRecord, error } = await supabase
          .from('pedidos_compra')
          .insert([payload])
          .select()
          .single();
        if (error) {
          throw error;
        }

        const { data: userData } = await supabase.auth.getUser();
        await submitForApproval(
          'Pedidos de Compra',
          newRecord.id,
          'pedidos_compra',
          payload.valor_total,
          `Pedido ${payload.numero_pedido}`,
          userData.user?.email || 'Usuário'
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchasing_orders'] });
      setIsModalOpen(false);
      toast.success(
        selectedOrder
          ? 'Ordem de compra atualizada!'
          : 'Ordem de compra criada e enviada para aprovação!'
      );
    },
    onError: (err: any) => {
      console.error('[PurchaseOrder] Erro ao salvar ordem:', err);
      toast.error(`❌ Erro ao salvar ordem de compra: ${err.message || 'Erro desconhecido'}`);
    },
  });

  const handleSubmit = async (data: any) => {
    if (!activeFarm) {
      return;
    }
    saveOrderMutation.mutate(data);
  };

  const isSubmitting = saveOrderMutation.isPending;

  const deleteOrderMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pedidos_compra').delete().eq('id', id);
      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchasing_orders'] });
      toast.success('Ordem de compra excluída!');
    },
    onError: (err: any) => {
      toast.error(`❌ Erro ao excluir ordem: ${err.message}`);
    },
  });

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Atenção',
      description: 'Deseja excluir esta ordem de compra?',
      confirmText: 'Confirmar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!isConfirmed) {
      return;
    }
    deleteOrderMutation.mutate(id);
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const exportData = orders.map((item) => ({
      Numero_Ordem: item.numero_ordem,
      Fornecedor: item.fornecedor || '-',
      Data_Criacao: item.created_at ? new Date(item.created_at).toLocaleDateString('pt-BR') : '-',
      Valor_Total: item.valor_total || 0,
      Status: item.status || '-',
    }));

    if (format === 'csv') {
      exportToCSV(exportData, 'pedidos_compra');
    } else if (format === 'excel') {
      exportToExcel(exportData, 'pedidos_compra');
    } else if (format === 'pdf') {
      exportToPDF(exportData, 'pedidos_compra', 'Relatório de Ordens de Compra');
    }
  };

  const handleViewHistory = async (order: any) => {
    setIsHistoryModalOpen(true);
    setHistoryLoading(true);
    setTimeout(() => {
      setHistoryItems([
        {
          id: '1',
          date: order.created_at,
          title: 'Ordem Emitida',
          subtitle: `Emissão #${order.numero_pedido}`,
          value: 'OK',
          status: 'success',
        },
        {
          id: '2',
          date: new Date().toISOString(),
          title: 'Aprovação Direção',
          subtitle: 'Assinatura digital confirmada',
          value: 'CONCLUÍDO',
          status: 'success',
        },
        {
          id: '3',
          date: order.previsao_entrega || new Date().toISOString(),
          title: 'Previsão de Entrega',
          subtitle: 'Logística integrada',
          value: 'AGUARDANDO',
          status: 'info',
        },
      ]);
      setHistoryLoading(false);
    }, 500);
  };

  const columns = [
    {
      header: 'Pedido / Código',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
          <span className="main-text" style={{ fontWeight: 800, color: '#1e293b' }}>
            #{item.numero_pedido || item.id?.slice(0, 8)?.toUpperCase()}
          </span>
          <span
            className="sub-meta"
            style={{ color: '#64748b', fontSize: '10px', fontWeight: 600 }}
          >
            ID: {item.id?.slice(0, 8).toUpperCase()}
          </span>
        </div>
      ),
      align: 'left' as const,
    },
    {
      header: 'Parceiro',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
            {item.parceiros?.nome || 'N/A'}
          </span>
          <span
            className="sub-meta"
            style={{
              color: '#94a3b8',
              fontSize: '9px',
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            Homologado
          </span>
        </div>
      ),
      align: 'left' as const,
    },
    {
      header: 'Previsão de Entrega',
      accessor: (item: any) => (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            color: '#475569',
            fontWeight: 600,
            fontSize: '12px',
          }}
        >
          <Calendar size={14} />
          <span>
            {item.previsao_entrega ? new Date(item.previsao_entrega).toLocaleDateString() : 'N/A'}
          </span>
        </div>
      ),
      align: 'center' as const,
    },
    {
      header: 'Status Logístico',
      accessor: (item: any) => {
        const isDelayed =
          item.status !== 'received' &&
          item.previsao_entrega &&
          new Date(item.previsao_entrega) < new Date();
        const diffTime = item.previsao_entrega
          ? new Date(item.previsao_entrega).getTime() - new Date().getTime()
          : 0;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
            {item.status !== 'received' && item.previsao_entrega ? (
              <span
                className={`status-pill ${isDelayed ? 'stopped' : 'info'}`}
                style={{ fontSize: '9px', padding: '2px 6px', width: 'fit-content' }}
              >
                {isDelayed ? `ATRASADO ${Math.abs(diffDays)}d` : `${diffDays}d RESTANTES`}
              </span>
            ) : (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <CheckCircle2 size={12} color="#10b981" /> Recebido
              </span>
            )}
          </div>
        );
      },
      align: 'left' as const,
    },
    {
      header: 'Condição Pagamento',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
            {item.forma_pagamento || 'A Combinar'}
          </span>
          <span
            className="sub-meta"
            style={{
              color: '#94a3b8',
              fontSize: '9px',
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            Faturado
          </span>
        </div>
      ),
      align: 'left' as const,
    },
    {
      header: 'Valor Total',
      accessor: (item: any) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 900, color: '#059669' }}>
            {Number(item.valor_total).toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
          </span>
        </div>
      ),
      align: 'center' as const,
    },
  ];

  return (
    <div className="orders-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <Breadcrumb
            paths={[
              { label: 'Compras', href: '/compras/dashboard' },
              { label: 'Pedidos de Compra (PC)' },
            ]}
          />
          <h1 className="page-title">Pedidos de Compra (PC)</h1>
          <p className="page-subtitle">
            Gestão de suprimentos, negociações com fornecedores e controle de recebimento físico.
          </p>
        </div>
        <div className="page-actions">
          <button className="primary-btn" onClick={handleOpenCreate}>
            <Plus size={18} />
            NOVA ORDEM
          </button>
        </div>
      </header>

      <div className="next-gen-kpi-grid">
        {loading
          ? Array(4)
              .fill(0)
              .map((_, i) => (
                <TauzeStatCard
                  key={i}
                  loading={true}
                  label=""
                  value=""
                  icon={ShoppingCart}
                  color=""
                  periodLabel="Mes Atual"
                />
              ))
          : stats.map((stat, idx) => (
              <TauzeStatCard
                key={idx}
                label={stat.label}
                value={stat.value}
                icon={stat.icon}
                color={stat.color}
                progress={stat.progress}
                change={stat.change}
                trend={stat.trend}
                sparkline={stat.sparkline}
                periodLabel="Mes Atual"
              />
            ))}
      </div>

      <div className="tauze-controls-row">
        <div className="tauze-tab-group">
          <button
            className={`tauze-tab-item ${activeTab === 'OPEN' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('OPEN');
              setPage(1);
            }}
          >
            Ordens em Aberto
          </button>
          <button
            className={`tauze-tab-item ${activeTab === 'HISTORY' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('HISTORY');
              setPage(1);
            }}
          >
            Histórico de Compras
          </button>
        </div>

        <div className="tauze-search-wrapper">
          <Search size={18} className="s-icon" />
          <input
            type="text"
            className="tauze-search-input"
            placeholder="Pesquisar por número da OC ou parceiro..."
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
                const menu = document.getElementById('export-menu-orders');
                if (menu) {
                  menu.classList.toggle('active');
                }
              }}
            >
              <FileText size={20} />
            </button>
            <div id="export-menu-orders" className="export-menu">
              <button
                onClick={() => {
                  handleExport('csv');
                  document.getElementById('export-menu-orders')?.classList.remove('active');
                }}
              >
                Excel (.CSV)
              </button>
              <button
                onClick={() => {
                  handleExport('excel');
                  document.getElementById('export-menu-orders')?.classList.remove('active');
                }}
              >
                Excel (.xlsx)
              </button>
              <button
                onClick={() => {
                  handleExport('pdf');
                  document.getElementById('export-menu-orders')?.classList.remove('active');
                }}
              >
                PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      <PurchasingFilterModal
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filters={filterValues}
        setFilters={setFilterValues}
      />

      <div className="management-content">
        <ModernTable
          emptyState={
            !searchTerm &&
            filterValues.status === 'all' &&
            filterValues.minAmount === 0 &&
            !filterValues.dateStart &&
            !filterValues.dateEnd &&
            !filterValues.onlyDelayed ? (
              <EmptyState
                title={
                  activeTab === 'OPEN'
                    ? 'Nenhuma ordem de compra em aberto'
                    : 'Nenhuma ordem no histórico'
                }
                description={
                  activeTab === 'OPEN'
                    ? 'Não há ordens de compra em andamento no momento.'
                    : 'Não há histórico de compras registrado nesta unidade.'
                }
                actionLabel="Nova Ordem"
                onAction={handleOpenCreate}
                icon={ShoppingCart}
              />
            ) : (
              <EmptyState
                title="Nenhum registro encontrado"
                description="Sua busca não retornou resultados."
                icon={Search}
              />
            )
          }
          data={orders}
          columns={columns}
          loading={loading}
          hideHeader={true}
          totalCount={totalCount}
          currentPage={page}
          onPageChange={setPage}
          itemsPerPage={pageSize}
          actions={(item) => (
            <div className="modern-actions">
              <button
                className="action-dot info"
                onClick={() => handleViewHistory(item)}
                title="Dossiê"
              >
                <History size={18} />
              </button>
              <button
                className="action-dot edit"
                onClick={() => handleOpenEdit(item)}
                title="Editar"
              >
                <Edit3 size={18} />
              </button>
              <button
                className="action-dot delete"
                onClick={() => handleDelete(item.id)}
                title="Excluir"
              >
                <Trash2 size={18} />
              </button>
            </div>
          )}
        />
      </div>

      <PurchaseOrderForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        initialData={selectedOrder}
        loading={isSubmitting}
      />

      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="Dossiê de Suprimentos"
        subtitle="Rastreabilidade completa da ordem de compra e logística"
        items={historyItems}
        loading={historyLoading}
      />
    </div>
  );
};
