import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/export';
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
import { SalesFilterModal } from './components/SalesFilterModal';

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
        // Enriching with intelligence (In real scenario, cost would come from inventory/production)
        const enrichedOrders = data.map(order => {
          const estimatedCost = order.valor_total * 0.72; // Mocking 72% production cost
          const margin = ((order.valor_total - estimatedCost) / (order.valor_total || 1)) * 100;
          const isHighRisk = order.valor_total > (order.clientes?.limite_credito || 0);
          
          return {
            ...order,
            margin,
            isHighRisk,
            clientRating: 'B' // Defaulting to 'B' as rating columns are missing in DB
          };
        });

        setOrders(enrichedOrders);
        const valorTotal = data.reduce((acc, curr) => acc + Number(curr.valor_total || 0), 0);
        const abertos = data.filter(o => o.status === 'pending').length;
        const avgMargin = enrichedOrders.reduce((acc, curr) => acc + curr.margin, 0) / (data.length || 1);
        
        setStats([
          { 
            label: 'Pipeline Comercial', 
            value: valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 
            icon: DollarSign, 
            color: '#10b981', 
            progress: 100,
            change: `${data.length} ordens`,
            periodLabel: 'Faturamento Bruto',
            sparkline: [{ value: 40 }, { value: 60 }, { value: 85 }]
          },
          { 
            label: 'Saúde da Margem', 
            value: `${avgMargin.toFixed(1)}%`, 
            icon: TrendingUp, 
            color: avgMargin > 20 ? '#10b981' : '#f59e0b', 
            progress: avgMargin * 2,
            change: 'Margem Operacional',
            periodLabel: 'Lucratividade Est.'
          },
          { 
            label: 'Exposição de Risco', 
            value: enrichedOrders.filter(o => o.isHighRisk).length, 
            icon: AlertTriangle, 
            color: '#ef4444', 
            progress: (enrichedOrders.filter(o => o.isHighRisk).length / (data.length || 1)) * 100,
            change: 'Acima do Limite',
            periodLabel: 'Auditoria de Crédito'
          },
          { 
            label: 'Taxa de Conversão', 
            value: '84%', 
            icon: Zap, 
            color: '#3b82f6', 
            progress: 84, 
            trend: 'up',
            change: 'Meta: 90%',
            periodLabel: 'Eficiência de Vendas'
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

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const filteredData = orders.filter(o => {
      const matchesSearch = (o.numero_pedido || '').toLowerCase().includes(searchTerm.toLowerCase()) || (o.clientes?.nome || '').toLowerCase().includes(searchTerm.toLowerCase());
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
      Cliente: item.clientes?.nome || '-',
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
      header: 'Pedido / Cliente',
      accessor: (item: any) => {
        const missingLogistics = !item.transportadora || !item.placa_veiculo || !item.numero_gta;
        return (
          <div className="table-cell-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="flex flex-col">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="main-text">#{item.id?.slice(0, 8).toUpperCase()}</span>
                {item.isHighRisk && (
                  <span className="text-red-600 bg-red-50 px-1 rounded border border-red-100 text-[8px] font-black">RISCO CRÉDITO</span>
                )}
                {missingLogistics && item.status !== 'delivered' && (
                  <span className="text-amber-600 bg-amber-50 px-1 rounded border border-amber-100 text-[8px] font-black">DOCS PENDENTES</span>
                )}
              </div>
              <div className="sub-meta uppercase font-bold text-[10px] tracking-wider">
                {item.clientes?.nome || 'N/A'} • {item.clientRating}
              </div>
            </div>
          </div>
        );
      }
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
      header: 'Valor / Lucratividade',
      accessor: (item: any) => (
        <div className="flex flex-col items-end">
          <span className="main-text font-bold text-slate-900">
            {Number(item.valor_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
          <span className={`text-[10px] font-black flex items-center gap-1 ${item.margin > 20 ? 'text-emerald-600' : 'text-amber-600'}`}>
            <TrendingUp size={10} /> {item.margin.toFixed(1)}% MARGEM
          </span>
        </div>
      ),
      align: 'right' as const
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
              <button onClick={() => { handleExport('csv'); document.getElementById('export-menu-sales')?.classList.remove('active'); }}>CSV</button>
              <button onClick={() => { handleExport('excel'); document.getElementById('export-menu-sales')?.classList.remove('active'); }}>Excel (.xlsx)</button>
              <button onClick={() => { handleExport('pdf'); document.getElementById('export-menu-sales')?.classList.remove('active'); }}>PDF Profissional</button>
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
              
              const matchesClientTypes = filterValues.clientTypes.length === 0 || 
                                        filterValues.clientTypes.some(type => o.clientRating === type.split(' ')[0] || (type === 'Risco' && o.isHighRisk));
              
              const matchesMargin = o.margin >= filterValues.minMargin;
              const matchesRisk = !filterValues.onlyHighRisk || o.isHighRisk;
              
              const missingLogistics = !o.transportadora || !o.placa_veiculo || !o.numero_gta;
              const matchesMissingGta = !filterValues.missingGta || missingLogistics;

              const matchesDate = (!filterValues.dateStart || new Date(o.created_at) >= new Date(filterValues.dateStart)) &&
                                 (!filterValues.dateEnd || new Date(o.created_at) <= new Date(filterValues.dateEnd));
              
              const matchesLogisticsAudit = !isLogisticsAuditActive || missingLogistics;

              return matchesSearch && matchesTab && matchesStatus && matchesClientTypes && matchesMargin && matchesRisk && matchesMissingGta && matchesDate && matchesLogisticsAudit;
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
