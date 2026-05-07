import React, { useState, useEffect } from 'react';
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
  History
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { PurchaseOrderForm } from '../../components/Forms/PurchaseOrderForm';
import { HistoryModal } from '../../components/Modals/HistoryModal';
import { EliteStatCard } from '../../components/Cards/EliteStatCard';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { formatNumber } from '../../utils/format';

export const PurchaseOrder: React.FC = () => {
  const { activeFarm } = useTenant();
  const [searchTerm, setSearchTerm] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'OPEN' | 'HISTORY'>('OPEN');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [stats, setStats] = useState<any[]>([]);

  useEffect(() => {
    if (!activeFarm) return;
    fetchOrders();
  }, [activeFarm]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('pedidos_compra')
        .select('*, fornecedores(nome)')
        .eq('fazenda_id', activeFarm.id)
        .order('created_at', { ascending: false });
      
      if (data) {
        setOrders(data);
        const totalPurchased = data.reduce((acc, curr) => acc + Number(curr.valor_total || 0), 0);
        const pendingDeliveries = data.filter(o => o.status === 'PENDENTE').length;
        
        setStats([
          { label: 'Investimento Insumos', value: totalPurchased.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), icon: ShoppingCart, color: '#10b981', progress: 100 },
          { label: 'Entregas em Trânsito', value: pendingDeliveries, icon: Truck, color: '#3b82f6', progress: (pendingDeliveries / (data.length || 1)) * 100 },
          { label: 'Ordens Pendentes', value: '3', icon: Clock, color: '#f59e0b', progress: 15 },
          { label: 'Saving Médio (Mês)', value: 'R$ 12.4k', icon: TrendingDown, color: '#166534', progress: 88, trend: 'down' },
        ]);
      }
    } catch (err) {
      console.error(err);
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
    if (!activeFarm) return;
    const payload = {
      numero_pedido: data.order_number,
      fornecedor_id: data.supplier_id,
      data_pedido: data.date,
      previsao_entrega: data.delivery_date,
      forma_pagamento: data.payment_method,
      valor_total: parseFloat(data.total_value),
      status: selectedOrder?.status || 'ordered',
      observacoes: data.description
    };

    if (selectedOrder) {
      const { error } = await supabase.from('pedidos_compra').update(payload).eq('id', selectedOrder.id);
      if (!error) { setIsModalOpen(false); fetchOrders(); }
    } else {
      const { error } = await supabase.from('pedidos_compra').insert([{ ...payload, fazenda_id: activeFarm.id, tenant_id: activeFarm.tenantId }]);
      if (!error) { setIsModalOpen(false); fetchOrders(); }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir esta ordem de compra?')) return;
    const { error } = await supabase.from('pedidos_compra').delete().eq('id', id);
    if (!error) fetchOrders();
  };

  const handleViewHistory = async (order: any) => {
    setIsHistoryModalOpen(true);
    setHistoryLoading(true);
    setTimeout(() => {
      setHistoryItems([
        { id: '1', date: order.created_at, title: 'Ordem Emitida', subtitle: `Emissão #${order.numero_pedido}`, value: 'OK', status: 'success' },
        { id: '2', date: new Date().toISOString(), title: 'Aprovação Direção', subtitle: 'Assinatura digital confirmada', value: 'CONCLUÍDO', status: 'success' },
        { id: '3', date: order.previsao_entrega, title: 'Previsão de Entrega', subtitle: 'Logística integrada', value: 'AGUARDANDO', status: 'info' },
      ]);
      setHistoryLoading(false);
    }, 800);
  };

  const columns = [
    {
      header: 'OC / Fornecedor',
      accessor: (item: any) => (
        <div className="table-cell-title">
          <span className="main-text">#{item.id?.slice(0, 8)?.toUpperCase() || 'N/A'}</span>
          <div className="sub-meta uppercase font-bold text-[10px] tracking-wider">
            {item.fornecedores?.nome || 'N/A'}
          </div>
        </div>
      )
    },
    {
      header: 'Previsão Entrega',
      accessor: (item: any) => (
        <div className="table-cell-meta">
          <Truck size={14} />
          <span>{item.previsao_entrega ? new Date(item.previsao_entrega).toLocaleDateString() : 'N/A'}</span>
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
        <span className={`status-pill ${item.status === 'received' ? 'active' : 'warning'}`}>
          {item.status === 'received' ? 'Recebido' : 'Aguardando'}
        </span>
      ),
      align: 'center' as const
    }
  ];

  return (
    <div className="orders-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge">
            <ShoppingCart size={14} fill="currentColor" />
            <span>ELITE PROCUREMENT v5.0</span>
          </div>
          <h1 className="page-title">Ordens de Compra (OC)</h1>
          <p className="page-subtitle">Gestão de suprimentos, negociações com fornecedores e controle de recebimento físico.</p>
        </div>
        <div className="page-actions">
          <button className="glass-btn secondary">
            <TrendingUp size={18} />
            BI ANALYTICS
          </button>
          <button className="primary-btn" onClick={handleOpenCreate}>
            <Plus size={18} />
            NOVA ORDEM
          </button>
        </div>
      </header>

      <div className="next-gen-kpi-grid">
        {loading ? (
          Array(4).fill(0).map((_, i) => <EliteStatCard key={i} loading={true} label="" value="" icon={ShoppingCart} color="" />)
        ) : stats.map((stat, idx) => (
          <EliteStatCard 
            key={idx}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            progress={stat.progress}
            change="+3.1%"
            trend={stat.trend}
          />
        ))}
      </div>

      <div className="elite-controls-row">
        <div className="elite-tab-group">
          <button 
            className={`elite-tab-item ${activeTab === 'OPEN' ? 'active' : ''}`}
            onClick={() => setActiveTab('OPEN')}
          >
            Ordens em Aberto
          </button>
          <button 
            className={`elite-tab-item ${activeTab === 'HISTORY' ? 'active' : ''}`}
            onClick={() => setActiveTab('HISTORY')}
          >
            Histórico de Compras
          </button>
        </div>

        <div className="elite-search-wrapper">
          <Search size={18} className="s-icon" />
          <input 
            type="text" 
            className="elite-search-input"
            placeholder="Pesquisar por número da OC ou fornecedor..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="elite-filter-group">
          <button className="icon-btn-secondary" title="Filtros Avançados">
            <Filter size={20} />
          </button>
          <button className="icon-btn-secondary" title="Exportar Ordens">
            <FileText size={20} />
          </button>
        </div>
      </div>

      <div className="management-content">
        <ModernTable 
          data={orders.filter(o => {
            const matchesSearch = (o.numero_pedido || '').toLowerCase().includes(searchTerm.toLowerCase()) || (o.fornecedores?.nome || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesTab = activeTab === 'OPEN' ? o.status !== 'received' : o.status === 'received';
            return matchesSearch && matchesTab;
          })}
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
      </div>

      <PurchaseOrderForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleSubmit}
        initialData={selectedOrder}
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
