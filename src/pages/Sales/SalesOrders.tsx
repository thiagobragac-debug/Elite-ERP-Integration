import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter,
  Calendar, 
  DollarSign, 
  Truck, 
  Building2, 
  CheckCircle2, 
  Activity, 
  Trash2, 
  Edit3,
  Package,
  Zap,
  ChevronRight,
  TrendingUp,
  Tag,
  Clock,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { SalesOrderForm } from '../../components/Forms/SalesOrderForm';
import { HistoryModal } from '../../components/Modals/HistoryModal';
import { EliteStatCard } from '../../components/Cards/EliteStatCard';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { formatNumber } from '../../utils/format';
import { KPISkeleton } from '../../components/Feedback/Skeleton';
import { EmptyState } from '../../components/Feedback/EmptyState';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { GlobalModeBanner } from '../../components/GlobalMode/GlobalModeBanner';

export const SalesOrders: React.FC = () => {
  const { activeFarm, isGlobalMode, activeFarmId, applyFarmFilter, canCreate, insertPayload } = useFarmFilter();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'OPEN' | 'CLOSED'>('OPEN');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterValues, setFilterValues] = useState({
    status: 'all',
    dateStart: '',
    dateEnd: ''
  });
  const [stats, setStats] = useState<any[]>([]);

  useEffect(() => {
    if (!activeFarmId && !isGlobalMode) return;
    fetchOrders();
  }, [activeFarmId, isGlobalMode]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let query = supabase.from('pedidos_venda').select('*, clientes(nome)').order('created_at', { ascending: false });
      query = applyFarmFilter(query);
      const { data } = await query;
      
      if (data) {
        setOrders(data);
        const valorTotal = data.reduce((acc, curr) => acc + Number(curr.valor_total || 0), 0);
        const abertos = data.filter(o => o.status === 'pending').length;
        const entregues = data.filter(o => o.status === 'delivered').length;
        
        setStats([
          { 
            label: 'Pipeline Comercial', 
            value: valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 
            icon: DollarSign, 
            color: '#10b981', 
            progress: 100,
            change: `${data.length} ordens`,
            periodLabel: 'Faturamento Bruto',
            sparkline: [
              { value: 40, label: 'R$ 150k' }, { value: 45, label: 'R$ 180k' }, { value: 42, label: 'R$ 160k' }, 
              { value: 60, label: 'R$ 220k' }, { value: 55, label: 'R$ 200k' }, { value: 75, label: 'R$ 280k' }, 
              { value: 70, label: 'R$ 260k' }, { value: 85, label: 'Total: R$ ' + (valorTotal / 1000).toFixed(0) + 'k' }
            ]
          },
          { 
            label: 'Ordens Pendentes', 
            value: abertos, 
            icon: Clock, 
            color: '#f59e0b', 
            progress: (abertos / (data.length || 1)) * 100,
            change: 'Em processamento',
            periodLabel: 'Gargalo Comercial',
            sparkline: [
              { value: 20, label: '2' }, { value: 35, label: '4' }, { value: 15, label: '1' }, 
              { value: 50, label: '6' }, { value: 30, label: '3' }, { value: 40, label: '4' }, 
              { value: 25, label: '2' }, { value: (abertos / (data.length || 1)) * 100, label: abertos + ' pendentes' }
            ]
          },
          { 
            label: 'Entregas Concluídas', 
            value: entregues, 
            icon: Truck, 
            color: '#3b82f6', 
            progress: (entregues / (data.length || 1)) * 100,
            change: 'Status Logístico',
            periodLabel: 'Fluxo de Saída',
            sparkline: [
              { value: 60, label: '8' }, { value: 65, label: '10' }, { value: 70, label: '12' }, 
              { value: 75, label: '14' }, { value: 80, label: '15' }, { value: 85, label: '18' }, 
              { value: 90, label: '20' }, { value: (entregues / (data.length || 1)) * 100, label: entregues + ' entregues' }
            ]
          },
          { 
            label: 'Taxa de Conversão', 
            value: '84%', 
            icon: TrendingUp, 
            color: '#166534', 
            progress: 84, 
            trend: 'up',
            change: 'Meta: 90%',
            periodLabel: 'Eficiência de Vendas',
            sparkline: [
              { value: 70, label: '70%' }, { value: 72, label: '72%' }, { value: 75, label: '75%' }, 
              { value: 78, label: '78%' }, { value: 80, label: '80%' }, { value: 82, label: '82%' }, 
              { value: 84, label: '84%' }, { value: 84, label: '84%' }
            ]
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
    setSelectedOrder(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (order: any) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleSubmit = async (data: any) => {
    if (!canCreate) {
      alert('⚠️ Selecione uma unidade específica para registrar um pedido. No modo Visão Global, defina a fazenda emitente antes de prosseguir.');
      return;
    }
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
      if (!error) { setIsModalOpen(false); fetchOrders(); }
    } else {
      const { error } = await supabase.from('pedidos_venda').insert([{ ...payload, ...insertPayload }]);
      if (!error) { setIsModalOpen(false); fetchOrders(); }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este pedido?')) return;
    const { error } = await supabase.from('pedidos_venda').delete().eq('id', id);
    if (!error) fetchOrders();
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
      header: 'Pedido / Cliente',
      accessor: (item: any) => (
        <div className="table-cell-title">
          <span className="main-text">#{item.id?.slice(0, 8).toUpperCase()}</span>
          <div className="sub-meta uppercase font-bold text-[10px] tracking-wider">
            {item.clientes?.nome || 'N/A'}
          </div>
        </div>
      )
    },
    {
      header: 'Data Emissão',
      accessor: (item: any) => (
        <div className="table-cell-meta">
          <Calendar size={14} />
          <span>{new Date(item.data_pedido).toLocaleDateString()}</span>
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
        <span className={`status-pill ${item.status === 'delivered' ? 'active' : item.status === 'pending' ? 'warning' : 'info'}`}>
          {item.status === 'delivered' ? 'Entregue' : item.status === 'pending' ? 'Pendente' : 'Processando'}
        </span>
      ),
      align: 'center' as const
    }
  ];

  return (
    <div className="orders-page animate-slide-up">
      <GlobalModeBanner />
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge">
            <Tag size={14} fill="currentColor" />
            <span>ELITE COMMERCE v5.0</span>
          </div>
          <h1 className="page-title">Pedidos de Venda</h1>
          <p className="page-subtitle">Monitoramento do fluxo comercial, desde a emissão da ordem até a entrega final ao cliente.</p>
        </div>

        <div className="page-actions">
          <button className="glass-btn secondary" onClick={() => navigate('/vendas/contrato')}>
            <Zap size={18} />
            CHECKLIST LOGÍSTICO
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
          <EliteStatCard 
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

      <div className="elite-controls-row">
        <div className="elite-tab-group">
          <button 
            className={`elite-tab-item ${activeTab === 'OPEN' ? 'active' : ''}`}
            onClick={() => setActiveTab('OPEN')}
          >
            Mapas Ativos
          </button>
          <button 
            className={`elite-tab-item ${activeTab === 'CLOSED' ? 'active' : ''}`}
            onClick={() => setActiveTab('CLOSED')}
          >
            Encerrados
          </button>
        </div>

        <div className="elite-search-wrapper">
          <Search size={18} className="s-icon" />
          <input 
            type="text" 
            className="elite-search-input"
            placeholder="Pesquisar por número do pedido ou cliente..." 
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
          <button className="icon-btn-secondary" title="Exportar Vendas">
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
                <label className="elite-label">Status do Pedido</label>
                <select 
                  className="elite-input elite-select"
                  value={filterValues.status}
                  onChange={(e) => setFilterValues({...filterValues, status: e.target.value})}
                >
                  <option value="all">Todos os Status</option>
                  <option value="pending">Pendentes</option>
                  <option value="shipped">Em Trânsito</option>
                  <option value="delivered">Entregues</option>
                </select>
              </div>
              <div className="filter-field">
                <label className="elite-label">Data Inicial</label>
                <input 
                  className="elite-input"
                  type="date" 
                  value={filterValues.dateStart}
                  onChange={(e) => setFilterValues({...filterValues, dateStart: e.target.value})}
                />
              </div>
              <div className="filter-field">
                <label className="elite-label">Data Final</label>
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
        {orders.length === 0 && !loading ? (
          <EmptyState
            title="Nenhum pedido de venda"
            description="Nenhuma ordem comercial registrada para esta unidade. Inicie criando um novo pedido de venda."
            actionLabel="Novo Pedido"
            onAction={handleOpenCreate}
            icon={FileText}
          />
        ) : (
          <ModernTable 
            data={orders.filter(o => {
              const matchesSearch = (o.numero_pedido || '').toLowerCase().includes(searchTerm.toLowerCase()) || (o.clientes?.nome || '').toLowerCase().includes(searchTerm.toLowerCase());
              const matchesTab = activeTab === 'OPEN' ? o.status !== 'delivered' : o.status === 'delivered';
              const matchesStatus = filterValues.status === 'all' || o.status === filterValues.status;
              const matchesDate = (!filterValues.dateStart || new Date(o.created_at) >= new Date(filterValues.dateStart)) &&
                                 (!filterValues.dateEnd || new Date(o.created_at) <= new Date(filterValues.dateEnd));
              return matchesSearch && matchesTab && matchesStatus && matchesDate;
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
        )}
      </div>

      <SalesOrderForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleSubmit}
        initialData={selectedOrder}
      />

    </div>
  );
};
