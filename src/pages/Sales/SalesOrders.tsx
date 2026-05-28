import React, { useState, useEffect } from 'react';

function buildSparkline(records: any[], dateField: string, valueField: string | null, buckets = 7): { value: number; label: string }[] {
  if (!records || records.length === 0) return [];
  const sorted = [...records].filter(r => r[dateField]).sort((a, b) => new Date(a[dateField]).getTime() - new Date(b[dateField]).getTime());
  if (sorted.length === 0) return [];
  const first = new Date(sorted[0][dateField]).getTime();
  const last = new Date(sorted[sorted.length - 1][dateField]).getTime();
  const totalMs = Math.max(last - first, 1);
  const bucketMs = totalMs / buckets;
  return Array.from({ length: buckets }, (_, i) => {
    const bStart = first + i * bucketMs;
    const bEnd = bStart + bucketMs;
    const inBucket = sorted.filter(r => { const t = new Date(r[dateField]).getTime(); return i === buckets - 1 ? t >= bStart && t <= bEnd : t >= bStart && t < bEnd; });
    const v = inBucket.length === 0 ? 0 : valueField ? inBucket.reduce((s, r) => s + Number(r[valueField] || 0), 0) : inBucket.length;
    return { value: Number(v.toFixed(2)), label: new Date(bStart + bucketMs / 2).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) };
  });
}
import { 
  FileText, 
  Plus, 
  Search, 
  Filter,
  Calendar,
  DollarSign,
  History,
  AlertTriangle,
  Trash2,
  Edit3,
  TrendingUp,
  Zap,
  Tag,
  Clock,
  LayoutGrid,
  List as ListIcon,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/export';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { SalesOrderForm } from '../../components/Forms/SalesOrderForm';
import { TauzeStatCard } from '../../components/Cards/TauzeStatCard';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { KPISkeleton } from '../../components/Feedback/Skeleton';
import { EmptyState } from '../../components/Feedback/EmptyState';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { useDebounce } from '../../hooks/useDebounce';
import { SalesFilterModal } from './components/SalesFilterModal';
import { ClientFilterModal } from './components/ClientFilterModal';
import { HistoryModal } from '../../components/Modals/HistoryModal';

export const SalesOrders: React.FC = () => {
  const { isGlobalMode, activeFarmId, activeTenantId, applyFarmFilter, canCreate, insertPayload } = useFarmFilter();
  const [searchTerm, setSearchTerm] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'OPEN' | 'CLOSED'>('OPEN');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterValues, setFilterValues] = useState({
    status: 'all',
    clientTypes: [],
    minMargin: 0,
    maxMargin: 100,
    dateStart: '',
    dateEnd: '',
    onlyHighRisk: false,
    missingGta: false
  });
  const [isLogisticsAuditActive, setIsLogisticsAuditActive] = useState(false);
  const [stats, setStats] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const debouncedSearch = useDebounce(searchTerm, 500);

  useEffect(() => {
    const isReady = isGlobalMode ? !!activeTenantId : !!activeFarmId;
    if (isReady) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [activeFarmId, activeTenantId, isGlobalMode, debouncedSearch, filterValues, activeTab]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('pedidos_venda')
        .select('*')
        .order('created_at', { ascending: false });
      
      query = applyFarmFilter(query);

      if (debouncedSearch) {
        query = query.ilike('numero_pedido', `%${debouncedSearch}%`);
      }

      if (activeTab === 'OPEN') {
        query = query.neq('status', 'delivered');
      } else {
        query = query.eq('status', 'delivered');
      }

      if (filterValues.status !== 'all') {
        query = query.eq('status', filterValues.status);
      }

      if (filterValues.dateStart) {
        query = query.gte('created_at', filterValues.dateStart);
      }
      if (filterValues.dateEnd) {
        query = query.lte('created_at', filterValues.dateEnd);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (data && data.length > 0) {
        // Buscar parceiros separadamente
        const clienteIds = [...new Set(data.map((d: any) => d.cliente_id).filter(Boolean))];
        let parceirosMap: Record<string, string> = {};
        if (clienteIds.length > 0) {
          const { data: parceiros } = await supabase.from('parceiros').select('id, nome').in('id', clienteIds);
          if (parceiros) parceiros.forEach((p: any) => { parceirosMap[p.id] = p.nome; });
        }

        const enrichedOrders = data.map((order: any) => {
          const estimatedCost = order.valor_total * 0.72;
          const margin = ((order.valor_total - estimatedCost) / (order.valor_total || 1)) * 100;
          const isHighRisk = order.valor_total > 500000;
          
          return {
            ...order,
            parceiros: { nome: parceirosMap[order.cliente_id] || 'N/A' },
            margin,
            isHighRisk,
            clientRating: 'B'
          };
        });

        // Filtro de search no cliente após o enriquecimento
        const finalOrders = debouncedSearch
          ? enrichedOrders.filter((o: any) =>
              (o.numero_pedido || '').toLowerCase().includes(debouncedSearch.toLowerCase()) ||
              (o.parceiros?.nome || '').toLowerCase().includes(debouncedSearch.toLowerCase())
            )
          : enrichedOrders;

        setOrders(finalOrders);
        const valorTotal = finalOrders.reduce((acc: number, curr: any) => acc + Number(curr.valor_total || 0), 0);
        const avgMargin = enrichedOrders.reduce((acc: number, curr: any) => acc + curr.margin, 0) / (enrichedOrders.length || 1);
        
        setStats([
          { 
            label: 'Pipeline Comercial', 
            value: valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 
            icon: DollarSign, color: '#10b981', progress: 100, change: `${finalOrders.length} ordens`, periodLabel: 'Faturamento Bruto',
            sparkline: buildSparkline(data || [], 'created_at', 'valor_total')
          },
          { 
            label: 'Saúde da Margem', 
            value: `${avgMargin.toFixed(1)}%`, 
            icon: TrendingUp, color: avgMargin > 20 ? '#10b981' : '#f59e0b', 
            progress: Math.min(avgMargin * 2, 100), change: 'Margem Operacional', periodLabel: 'Lucratividade Est.',
            sparkline: buildSparkline(data || [], 'created_at', 'valor_total')
          },
          { 
            label: 'Exposição de Risco', 
            value: enrichedOrders.filter((o: any) => o.isHighRisk).length, 
            icon: AlertTriangle, color: '#ef4444', 
            progress: (enrichedOrders.filter((o: any) => o.isHighRisk).length / (data.length || 1)) * 100, 
            change: 'Acima do Limite', periodLabel: 'Auditoria',
            sparkline: buildSparkline(data || [], 'created_at', 'valor_total')
          },
          { 
            label: 'Taxa de Conclusão', 
            value: (() => {
              const entregues = data.filter((o: any) => o.status === 'delivered').length;
              return data.length > 0 ? `${((entregues / data.length) * 100).toFixed(0)}%` : '---';
            })(),
            icon: Zap, color: '#3b82f6', 
            progress: (() => {
              const entregues = data.filter((o: any) => o.status === 'delivered').length;
              return data.length > 0 ? (entregues / data.length) * 100 : 0;
            })(),
            trend: 'up' as const, 
            change: `${data.filter((o: any) => o.status === 'delivered').length} pedidos entregues`, 
            periodLabel: 'Concluído',
            sparkline: buildSparkline(data || [], 'created_at', 'valor_total')
          },
        ]);
      } else {
        setOrders([]);
        setStats([
          { label: 'Pipeline Comercial', value: '---', icon: DollarSign, color: '#10b981', progress: 0, change: 'Sem pedidos', periodLabel: 'Faturamento Bruto', sparkline: buildSparkline(data || [], 'created_at', 'valor_total') },
          { label: 'Saúde da Margem', value: '---', icon: TrendingUp, color: '#f59e0b', progress: 0, change: '---', periodLabel: 'Lucratividade Est.', sparkline: buildSparkline(data || [], 'created_at', 'valor_total') },
          { label: 'Exposição de Risco', value: 0, icon: AlertTriangle, color: '#ef4444', progress: 0, change: '---', periodLabel: 'Auditoria', sparkline: buildSparkline(data || [], 'created_at', 'valor_total') },
          { label: 'Taxa de Conclusão', value: '---', icon: Zap, color: '#3b82f6', progress: 0, change: 'Sem dados', periodLabel: 'Concluído', sparkline: buildSparkline(data || [], 'created_at', 'valor_total') },
        ]);
      }
    } catch (err) {
      console.error('[SalesOrders] Erro ao buscar pedidos:', err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setSelectedOrder(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (order: any) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleSubmit = async (data: any) => {
    if (!canCreate && !selectedOrder) {
      alert('âš ï¸ Selecione uma unidade específica para registrar um pedido. No modo Visão Global, defina a fazenda emitente antes de prosseguir.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const payload = {
        numero_pedido: data.orderNumber,
        cliente_id: data.clientId,
        produto_id: data.productId,
        quantidade: parseFloat(data.quantity),
        unidade: data.unit,
        valor_total: parseFloat(data.totalValue),
        data_pedido: data.date,
        status: data.status,
        transportadora: data.transportadora,
        placa_veiculo: data.placa_veiculo,
        numero_gta: data.numero_gta,
        forma_pagamento: data.forma_pagamento,
        comissao: parseFloat(data.comissao) || 0,
        observacoes: data.observacoes
      };

      if (selectedOrder) {
        const { error } = await supabase.from('pedidos_venda').update(payload).eq('id', selectedOrder.id);
        if (error) throw error;
        setIsModalOpen(false); 
        fetchOrders();
      } else {
        const { error } = await supabase.from('pedidos_venda').insert([{ ...payload, ...insertPayload }]);
        if (error) throw error;
        setIsModalOpen(false); 
        fetchOrders();
      }
    } catch (err: any) {
      console.error('[SalesOrders] Erro ao salvar pedido:', err);
      alert('âŒ Erro ao salvar pedido de venda: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este pedido?')) return;
    try {
      const { error } = await supabase.from('pedidos_venda').delete().eq('id', id);
      if (error) throw error;
      fetchOrders();
    } catch (err: any) {
      alert('âŒ Erro ao excluir pedido: ' + err.message);
    }
  };

  const handleUpdateOrderStatus = async (id: string, newStatus: 'pending' | 'delivered' | 'canceled') => {
    setUpdatingStatus(id);
    const prevOrders = [...orders];
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));

    try {
      const { error } = await supabase
        .from('pedidos_venda')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      fetchOrders();
    } catch (err: any) {
      setOrders(prevOrders);
      alert('âŒ Erro ao atualizar status do pedido: ' + err.message);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const renderKanbanCard = (order: any, index: number) => {
    const isUpdating = updatingStatus === order.id;
    return (
      <motion.div
        key={order.id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="premium-card"
        style={{
          padding: '16px',
          background: 'hsl(var(--bg-card))',
          borderRadius: '16px',
          border: order.isHighRisk ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid hsl(var(--border))',
          boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          position: 'relative'
        }}
      >
        {isUpdating && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(255,255,255,0.7)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10
          }}>
            <div style={{ width: '20px', height: '20px', border: '2px solid rgba(0,0,0,0.1)', borderTopColor: 'hsl(var(--brand))', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '12px', fontWeight: 900, color: 'hsl(var(--text-main))' }}>
              #{order.id?.slice(0, 8).toUpperCase()}
            </span>
            <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700 }}>
              OS: {order.numero_pedido || 'N/A'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {order.isHighRisk && (
              <span className="status-pill danger" style={{ fontSize: '8px', padding: '1px 4px', borderRadius: '4px', fontWeight: 950 }}>
                RISCO CRÉDITO
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'hsl(var(--text-main))', margin: 0 }}>
            {order.parceiros?.nome || 'Parceiro Não Informado'}
          </h4>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'hsl(var(--text-muted))', fontSize: '11px', fontWeight: 600 }}>
            <Calendar size={12} />
            <span>{new Date(order.data_pedido).toLocaleDateString()}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
            <span style={{ fontSize: '14px', fontWeight: 900, color: 'hsl(var(--text-main))' }}>
              {Number(order.valor_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
            <span style={{ fontSize: '10px', fontWeight: 950, color: order.margin > 20 ? '#10b981' : '#d97706', display: 'flex', alignItems: 'center', gap: '2px' }}>
              <TrendingUp size={10} /> {order.margin.toFixed(0)}% MARGEM
            </span>
          </div>
        </div>

        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          borderTop: '1px solid hsl(var(--border))', 
          paddingTop: '10px', 
          marginTop: '4px',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button 
              className="action-dot info" 
              onClick={() => handleViewHistory(order)} 
              title="Dossiê"
              style={{ width: '28px', height: '28px' }}
            >
              <History size={14} />
            </button>
            <button 
              className="action-dot edit" 
              onClick={() => handleOpenEdit(order)} 
              title="Editar"
              style={{ width: '28px', height: '28px' }}
            >
              <Edit3 size={14} />
            </button>
            <button 
              className="action-dot delete" 
              onClick={() => handleDelete(order.id)} 
              title="Excluir"
              style={{ width: '28px', height: '28px' }}
            >
              <Trash2 size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', gap: '4px' }}>
            {order.status === 'pending' && (
              <>
                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}
                  title="Faturar e Entregar"
                  style={{ padding: '4px 8px', fontSize: '10px', borderRadius: '8px', background: '#10b981', border: 'none', height: '28px', display: 'flex', alignItems: 'center', gap: '2px' }}
                >
                  <CheckCircle2 size={12} />
                  Entregar
                </button>
                <button
                  type="button"
                  className="glass-btn secondary"
                  onClick={() => handleUpdateOrderStatus(order.id, 'canceled')}
                  title="Cancelar Pedido"
                  style={{ padding: '4px 8px', fontSize: '10px', borderRadius: '8px', borderColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', height: '28px' }}
                >
                  Cancelar
                </button>
              </>
            )}

            {order.status === 'delivered' && (
              <span className="status-pill active" style={{ fontSize: '8px', padding: '4px 8px', borderRadius: '6px', fontWeight: 900 }}>
                ✓ ENTREGUE
              </span>
            )}

            {order.status === 'canceled' && (
              <button
                type="button"
                className="glass-btn secondary"
                onClick={() => handleUpdateOrderStatus(order.id, 'pending')}
                title="Reabrir Pedido"
                style={{ padding: '4px 8px', fontSize: '10px', borderRadius: '8px', height: '28px' }}
              >
                Reabrir
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const filteredData = orders.filter(o => {
      const matchesSearch = (o.numero_pedido || '').toLowerCase().includes(searchTerm.toLowerCase()) || (o.parceiros?.nome || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTab = activeTab === 'OPEN' ? o.status !== 'delivered' : o.status === 'delivered';
      const matchesStatus = filterValues.status === 'all' || o.status === filterValues.status;
      const matchesMargin = o.margin >= filterValues.minMargin;
      const matchesRisk = !filterValues.onlyHighRisk || o.isHighRisk;
      const matchesDate = (!filterValues.dateStart || new Date(o.created_at) >= new Date(filterValues.dateStart)) &&
                         (!filterValues.dateEnd || new Date(o.created_at) <= new Date(filterValues.dateEnd));
      return matchesSearch && matchesTab && matchesStatus && matchesMargin && matchesRisk && matchesDate;
    });

    const exportData = filteredData.map(item => ({
      ID: item.id?.slice(0, 8).toUpperCase(),
      Pedido: item.numero_pedido || '-',
      Parceiro: item.parceiros?.nome || '-',
      Data: new Date(item.data_pedido).toLocaleDateString(),
      Valor_Total: item.valor_total || 0,
      Margem_Est: item.margin.toFixed(1) + '%',
      Status: item.status
    }));

    if (format === 'csv') exportToCSV(exportData, 'pedidos_venda');
    else if (format === 'excel') exportToExcel(exportData, 'pedidos_venda');
    else if (format === 'pdf') exportToPDF(exportData, 'pedidos_venda', 'Relatório de Pedidos de Venda');
  };

  const handleViewHistory = async (order: any) => {
    setIsHistoryModalOpen(true);
    setHistoryLoading(true);
    setTimeout(() => {
      setHistoryItems([
        { id: '1', date: order.created_at, title: 'Pedido Criado', subtitle: `Emissão #${order.numero_pedido}`, value: 'OK', status: 'success' },
        { id: '2', date: new Date().toISOString(), title: 'Aprovação Financeira', subtitle: 'Limite de crédito validado', value: 'CONCLUÍDO', status: 'success' },
        { id: '3', date: new Date().toISOString(), title: 'Status de Entrega', subtitle: order.status === 'shipped' ? 'Carga em trânsito' : 'Aguardando carregamento', value: 'LOGÍSTICA', status: 'info' },
      ]);
      setHistoryLoading(false);
    }, 800);
  };

  const columns = [
    {
      header: 'Pedido / Código',
      accessor: (item: any) => {
        const missingLogistics = !item.transportadora || !item.placa_veiculo || !item.numero_gta;
        return (
          <div className="table-cell-title text-left" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span className="main-text" style={{ fontWeight: 800, color: '#1e293b' }}>
              #{item.id?.slice(0, 8).toUpperCase()}
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', marginTop: '2px' }}>
              {item.isHighRisk && (
                <span className="status-pill danger" style={{ fontSize: '8px', padding: '1px 4px', borderRadius: '4px', fontWeight: 900 }}>RISCO CRÉDITO</span>
              )}
              {missingLogistics && item.status !== 'delivered' && (
                <span className="status-pill warning" style={{ fontSize: '8px', padding: '1px 4px', borderRadius: '4px', fontWeight: 900 }}>DOCS PENDENTES</span>
              )}
            </div>
          </div>
        );
      },
      align: 'left' as const
    },
    {
      header: 'Parceiro / Comprador',
      accessor: (item: any) => (
        <div className="table-cell-title text-left" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span className="main-text" style={{ fontWeight: 700, color: '#334155' }}>
            {item.parceiros?.nome || 'Não Informado'}
          </span>
          <span className="sub-meta uppercase font-bold text-[9px] tracking-wider text-slate-400">
            Classificação: {item.clientRating || 'B'}
          </span>
        </div>
      ),
      align: 'left' as const
    },
    {
      header: 'Data da Ordem',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', color: '#475569', fontWeight: 600 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
            <Calendar size={13} color="#94a3b8" />
            <span>{new Date(item.data_pedido).toLocaleDateString()}</span>
          </div>
          <span className="sub-meta" style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 700 }}>
            Nº OS: {item.numero_pedido || 'N/A'}
          </span>
        </div>
      ),
      align: 'center' as const
    },
    {
      header: 'Transporte / GTA',
      accessor: (item: any) => (
        <div className="table-cell-title" style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {item.transportadora || item.numero_gta ? (
            <>
              <span className="main-text" style={{ fontWeight: 600, color: '#334155', fontSize: '12px' }}>
                {item.transportadora || 'Remessa Própria'}
              </span>
              <span className="sub-meta" style={{ textTransform: 'uppercase', fontWeight: 700, fontSize: '9px', letterSpacing: '0.05em', color: '#64748b' }}>
                Placa: {item.placa_veiculo || 'N/A'} â€¢ GTA: {item.numero_gta || 'N/A'}
              </span>
            </>
          ) : (
            <span style={{ color: '#94a3b8', fontWeight: 500, fontSize: '11px' }}>Não Informado</span>
          )}
        </div>
      ),
      align: 'left' as const
    },
    {
      header: 'Financeiro / Margem',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
          <span className="main-text" style={{ fontWeight: 800, color: '#0f172a', fontSize: '13px' }}>
            {Number(item.valor_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
          <span style={{ fontSize: '9px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '2px', color: item.margin > 20 ? '#059669' : '#d97706' }}>
            <TrendingUp size={10} /> {item.margin.toFixed(1)}% MARGEM
          </span>
        </div>
      ),
      align: 'right' as const
    },
    {
      header: 'Status Operacional',
      accessor: (item: any) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span className={`status-pill ${item.status === 'delivered' ? 'active' : item.status === 'pending' ? 'warning' : 'info'}`}>
            {item.status === 'delivered' ? 'Entregue' : item.status === 'pending' ? 'Pendente' : 'Processando'}
          </span>
        </div>
      ),
      align: 'center' as const
    }
  ];

  return (
    <div className="orders-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge">
            <Tag size={14} fill="currentColor" />
            <span>TAUZE COMMERCE v5.0</span>
          </div>
          <h1 className="page-title">Pedidos de Venda</h1>
          <p className="page-subtitle">Monitoramento do fluxo comercial, desde a emissão da ordem até a entrega final ao parceiro.</p>
        </div>

        <div className="page-actions">
          <button 
            className={`glass-btn secondary ${isLogisticsAuditActive ? 'active' : ''}`} 
            onClick={() => setIsLogisticsAuditActive(!isLogisticsAuditActive)}
            style={isLogisticsAuditActive ? { 
              background: 'hsl(var(--brand) / 0.1)', 
              borderColor: 'hsl(var(--brand))',
              color: 'hsl(var(--brand))' 
            } : {}}
          >
            <Zap size={18} fill={isLogisticsAuditActive ? "currentColor" : "none"} />
            {isLogisticsAuditActive ? 'AUDITORIA ATIVA' : 'CHECKLIST LOGÍSTICO'}
          </button>
          <button className="primary-btn" onClick={handleOpenCreate}>
            <Plus size={18} />
            NOVO PEDIDO
          </button>
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
            trend={stat.trend}
          />
        ))}
      </div>

      <div className="tauze-controls-row">
        <div className="tauze-tab-group">
          <button 
            className={`tauze-tab-item ${activeTab === 'OPEN' ? 'active' : ''}`}
            onClick={() => setActiveTab('OPEN')}
          >
            Mapas Ativos
          </button>
          <button 
            className={`tauze-tab-item ${activeTab === 'CLOSED' ? 'active' : ''}`}
            onClick={() => setActiveTab('CLOSED')}
          >
            Encerrados
          </button>
        </div>

        <div className="tauze-search-wrapper">
          <Search size={18} className="s-icon" />
          <input 
            type="text" 
            className="tauze-search-input"
            placeholder="Pesquisar por número do pedido ou parceiro..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="view-mode-toggle" style={{ display: 'flex', background: 'hsl(var(--bg-main))', padding: '4px', borderRadius: '12px', gap: '4px', margin: '0 16px' }}>
          <button 
            type="button"
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="Visualização em Lista"
            style={{
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              border: 'none',
              background: viewMode === 'list' ? 'hsl(var(--bg-card))' : 'transparent',
              color: viewMode === 'list' ? 'hsl(var(--brand))' : 'hsl(var(--text-muted))',
              cursor: 'pointer',
              boxShadow: viewMode === 'list' ? '0 4px 10px rgba(0,0,0,0.1)' : 'none',
              transition: '0.2s'
            }}
          >
            <ListIcon size={18} />
          </button>
          <button 
            type="button"
            className={`view-btn ${viewMode === 'kanban' ? 'active' : ''}`}
            onClick={() => setViewMode('kanban')}
            title="Quadro Kanban"
            style={{
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              border: 'none',
              background: viewMode === 'kanban' ? 'hsl(var(--bg-card))' : 'transparent',
              color: viewMode === 'kanban' ? 'hsl(var(--brand))' : 'hsl(var(--text-muted))',
              cursor: 'pointer',
              boxShadow: viewMode === 'kanban' ? '0 4px 10px rgba(0,0,0,0.1)' : 'none',
              transition: '0.2s'
            }}
          >
            <LayoutGrid size={18} />
          </button>
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
                const menu = document.getElementById('export-menu-sales');
                if (menu) menu.classList.toggle('active');
              }}
            >
              <FileText size={20} />
            </button>
            <div id="export-menu-sales" className="export-menu">
              <button onClick={() => { handleExport('csv'); document.getElementById('export-menu-sales')?.classList.remove('active'); }}>Excel (.CSV)</button>
              <button onClick={() => { handleExport('excel'); document.getElementById('export-menu-sales')?.classList.remove('active'); }}>Excel (.xlsx)</button>
              <button onClick={() => { handleExport('pdf'); document.getElementById('export-menu-sales')?.classList.remove('active'); }}>PDF</button>
            </div>
          </div>
        </div>
      </div>

      <SalesFilterModal 
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filters={filterValues}
        setFilters={setFilterValues}
      />

      <div className="management-content">
        {viewMode === 'list' ? (
          <ModernTable 
            emptyState={<EmptyState
              title="Nenhum pedido de venda"
              description="Nenhuma ordem comercial registrada para esta unidade. Inicie criando um novo pedido de venda."
              actionLabel="Novo Pedido"
              onAction={handleOpenCreate}
              icon={FileText}
            />}
            data={orders}
            columns={columns}
            loading={loading}
            hideHeader={true}
            actions={(item) => (
              <div className="modern-actions">
                <button className="action-dot info" onClick={() => handleViewHistory(item)} title="Dossiê">
                  <History size={18} />
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
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', minHeight: '500px', width: '100%' }}>
            {/* Coluna 1: Pendentes */}
            <div style={{ background: 'hsl(var(--bg-main)/0.2)', borderRadius: '24px', border: '1px solid hsl(var(--border))', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '10px' }}>
                <span style={{ fontSize: '14px', fontWeight: 800, color: 'hsl(var(--warning))', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  📌 Pendentes
                </span>
                <span className="status-pill warning" style={{ fontSize: '10px', padding: '2px 8px', fontWeight: 900 }}>
                  {orders.filter(o => o.status === 'pending').length}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', flex: 1, maxHeight: '600px' }}>
                {orders.filter(o => o.status === 'pending').length === 0 ? (
                  <div style={{ padding: '20px 0' }}>
                    <EmptyState title="Nenhum pedido pendente" description="Não há pedidos aguardando." icon={Clock} />
                  </div>
                ) : (
                  <AnimatePresence>
                    {orders.filter(o => o.status === 'pending').map((order, idx) => renderKanbanCard(order, idx))}
                  </AnimatePresence>
                )}
              </div>
            </div>

            {/* Coluna 2: Entregues */}
            <div style={{ background: 'hsl(var(--bg-main)/0.2)', borderRadius: '24px', border: '1px solid hsl(var(--border))', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '10px' }}>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  🚚 Entregues
                </span>
                <span className="status-pill active" style={{ fontSize: '10px', padding: '2px 8px', fontWeight: 900 }}>
                  {orders.filter(o => o.status === 'delivered').length}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', flex: 1, maxHeight: '600px' }}>
                {orders.filter(o => o.status === 'delivered').length === 0 ? (
                  <div style={{ padding: '20px 0' }}>
                    <EmptyState title="Nenhum pedido entregue" description="Pedidos faturados aparecerão aqui." icon={CheckCircle2} />
                  </div>
                ) : (
                  <AnimatePresence>
                    {orders.filter(o => o.status === 'delivered').map((order, idx) => renderKanbanCard(order, idx))}
                  </AnimatePresence>
                )}
              </div>
            </div>

            {/* Coluna 3: Cancelados */}
            <div style={{ background: 'hsl(var(--bg-main)/0.2)', borderRadius: '24px', border: '1px solid hsl(var(--border))', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '10px' }}>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  ❌ Cancelados
                </span>
                <span className="status-pill danger" style={{ fontSize: '10px', padding: '2px 8px', fontWeight: 900 }}>
                  {orders.filter(o => o.status === 'canceled').length}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', flex: 1, maxHeight: '600px' }}>
                {orders.filter(o => o.status === 'canceled').length === 0 ? (
                  <div style={{ padding: '20px 0' }}>
                    <EmptyState title="Nenhum cancelamento" description="Histórico de cancelamentos vazio." icon={AlertTriangle} />
                  </div>
                ) : (
                  <AnimatePresence>
                    {orders.filter(o => o.status === 'canceled').map((order, idx) => renderKanbanCard(order, idx))}
                  </AnimatePresence>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <SalesOrderForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
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
