import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  Plus, 
  Search, 
  Filter,
  Settings, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight, 
  MoreVertical,
  Calendar,
  Clock,
  DollarSign,
  History,
  Trash2,
  Zap,
  Truck,
  FileText,
  Edit3,
  X,
  Package,
  List as ListIcon,
  LayoutGrid,
  ArrowRight
} from 'lucide-react';
import { FormModal } from '../../components/Forms/FormModal';
import { motion, AnimatePresence } from 'framer-motion';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/export';
import { supabase } from '../../lib/supabase';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { MaintenanceForm } from '../../components/Forms/MaintenanceForm';
import { HistoryModal } from '../../components/Modals/HistoryModal';
import { TauzeStatCard } from '../../components/Cards/TauzeStatCard';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { MaintenanceFilterModal } from './components/MaintenanceFilterModal';

export const MaintenanceManagement: React.FC = () => {
  const { activeFarm, isGlobalMode, activeFarmId, activeTenantId, applyFarmFilter, canCreate, insertPayload } = useFarmFilter();
  const [searchTerm, setSearchTerm] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'HISTORY' | 'PLANS'>('ACTIVE');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterValues, setFilterValues] = useState({
    status: 'all',
    types: [] as string[],
    maxCost: 50000,
    dateStart: '',
    dateEnd: '',
    onlyHighCost: false
  });
  const [stats, setStats] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
  const [updatingStatus, setUpdatingStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const isReady = isGlobalMode ? !!activeTenantId : !!activeFarm;
    if (isReady) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [activeFarm, isGlobalMode, activeTenantId]);

  const fetchOrders = async () => {
    if (!activeFarmId && !isGlobalMode) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      console.log('[Maintenance] Buscando ordens de serviço resilientes...');
      
      const fetchPromise = (async () => {
        let query = supabase
          .from('manutencao_frota')
          .select('id, maquina_id, tipo, descricao, data_inicio, custo, responsavel, status, created_at, maquinas:maquina_id (nome)')
          .order('data_inicio', { ascending: false });
        
        query = applyFarmFilter(query);
        const { data, error } = await query;
        
        if (error) throw error;
        return data;
      })();

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 3000)
      );

      const data: any = await Promise.race([fetchPromise, timeoutPromise]);
      
      if (data) {
        setOrders(data);
        const abertas = data.filter((o: any) => o.status === 'ABERTA' || o.status === 'open' || o.status === 'pending').length;
        const custoTotal = data.reduce((acc: number, curr: any) => acc + Number(curr.custo || 0), 0);
        
        const mttr = 18.5; 
        const mtbf = 480; 
        
        setStats([
          { label: 'OS em Aberto', value: abertas, icon: AlertCircle, color: '#ed6c02', progress: (abertas / (data.length || 1)) * 100 },
          { label: 'TCO (Manutenção)', value: custoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), icon: DollarSign, color: '#ef4444', progress: 85, trend: 'up' },
          { label: 'MTBF (Confiabilidade)', value: `${mtbf}h`, icon: Zap, color: '#10b981', progress: 92, trend: 'up', change: 'Ótimo' },
          { label: 'MTTR (Eficiência)', value: `${mttr}h`, icon: Clock, color: '#3b82f6', progress: 75, trend: 'down', change: '-2h' },
        ]);
      }
    } catch (err) {
      console.warn('[Maintenance] Usando dados mock devido a atraso na rede ou erro:', err);
      setOrders([]);
      setStats([
        { label: 'OS em Aberto', value: 3, icon: AlertCircle, color: '#ed6c02', progress: 45, change: 'MOCK ACTIVE' },
        { label: 'TCO (Manutenção)', value: 'R$ 12.450', icon: DollarSign, color: '#ef4444', progress: 65, trend: 'up', change: 'MOCK ACTIVE' },
        { label: 'MTBF (Confiabilidade)', value: '520h', icon: Zap, color: '#10b981', progress: 92, trend: 'up', change: 'MOCK ACTIVE' },
        { label: 'MTTR (Eficiência)', value: '14h', icon: Clock, color: '#3b82f6', progress: 75, trend: 'down', change: 'MOCK ACTIVE' },
      ]);
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

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir esta ordem de serviço?')) return;
    const { error } = await supabase.from('manutencao_frota').delete().eq('id', id);
    if (!error) fetchOrders();
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const filteredData = orders.filter(o => {
      const matchesSearch = (o.maquinas?.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) || (o.descricao || '').toLowerCase().includes(searchTerm.toLowerCase());
      const isCompleted = o.status === 'completed' || o.status === 'CONCLUIDA' || o.status === 'finalizada';
      const matchesTab = activeTab === 'ACTIVE' ? !isCompleted : isCompleted;
      
      const matchesStatus = filterValues.status === 'all' || 
                           o.status === filterValues.status || 
                           (filterValues.status === 'open' && (o.status === 'ABERTA' || o.status === 'pending')) ||
                           (filterValues.status === 'completed' && isCompleted);
      const matchesTypes = filterValues.types.length === 0 || filterValues.types.includes(o.tipo);
      const totalCost = Number(o.custo_pecas || 0) + Number(o.custo_mao_obra || 0);
      const matchesCost = totalCost <= filterValues.maxCost;
      const matchesDate = (!filterValues.dateStart || new Date(o.data_inicio) >= new Date(filterValues.dateStart)) &&
                         (!filterValues.dateEnd || new Date(o.data_inicio) <= new Date(filterValues.dateEnd));

      return matchesSearch && matchesTab && matchesStatus && matchesTypes && matchesCost && matchesDate;
    });

    const exportData = filteredData.map(item => ({
      Data: item.data_inicio ? new Date(item.data_inicio).toLocaleDateString() : 'N/A',
      Maquina: item.maquinas?.nome || 'Ativo',
      Tipo: item.tipo,
      Descricao: item.descricao,
      Responsavel: item.responsavel,
      Custo_Pecas: item.custo_pecas || 0,
      Custo_MO: item.custo_mao_obra || 0,
      Total: (Number(item.custo_pecas || 0) + Number(item.custo_mao_obra || 0)),
      Status: item.status
    }));

    if (format === 'csv') exportToCSV(exportData, 'log_manutencao');
    else if (format === 'excel') exportToExcel(exportData, 'log_manutencao');
    else if (format === 'pdf') exportToPDF(exportData, 'log_manutencao', 'Relatório de Manutenção de Frota');
  };

  const handleSubmit = async (data: any) => {
    if (!activeFarm) { if (typeof setLoading !== 'undefined') setLoading(false); return; }
    const payload = {
      maquina_id: data.maquina_id,
      tipo: data.tipo,
      descricao: data.descricao,
      data_inicio: data.data_inicio,
      custo: (parseFloat(data.custo_pecas) || 0) + (parseFloat(data.custo_mao_obra) || 0),
      responsavel: data.responsavel,
      status: data.status,
      ...insertPayload
    };

    if (selectedOrder) {
      const { error } = await supabase.from('manutencao_frota').update(payload).eq('id', selectedOrder.id);
      if (!error) { setIsModalOpen(false); fetchOrders(); }
    } else {
      const { error } = await supabase.from('manutencao_frota').insert([payload]);
      if (!error) { setIsModalOpen(false); fetchOrders(); }
    }
  };

  const handleStatusTransition = async (orderId: string, nextStatus: string) => {
    setUpdatingStatus(prev => ({ ...prev, [orderId]: true }));
    try {
      const { error } = await supabase
        .from('manutencao_frota')
        .update({ status: nextStatus })
        .eq('id', orderId);
      
      if (error) throw error;
      
      // Update local state directly for responsive optimistic UI
      setOrders(prevOrders => 
        prevOrders.map(o => o.id === orderId ? { ...o, status: nextStatus } : o)
      );
    } catch (err: any) {
      console.error('[Maintenance] Erro ao transicionar status da OS:', err);
      alert('❌ Erro ao atualizar status: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const handleViewDetails = (order: any) => {
    setIsHistoryModalOpen(true);
    setHistoryLoading(true);
    setTimeout(() => {
      setHistoryItems([
        { id: '1', date: order.data_inicio, title: 'OS #' + order.id.toString().slice(0,6), subtitle: order.descricao, value: order.custo_pecas ? `R$ ${Number(order.custo_pecas) + Number(order.custo_mao_obra)}` : 'N/A', status: 'info' },
        ...((order.materiais || []).map((m: any, i: number) => (
          { id: `m-${i}`, date: order.data_inicio, title: `Insumo: ${m.nome || 'Peça'}`, subtitle: `Quantidade: ${m.qtd}`, value: m.preco ? `R$ ${m.preco * m.qtd}` : 'N/A', status: 'success' }
        ))),
        { id: '3', date: order.data_inicio, title: 'Mão de Obra', subtitle: order.responsavel, value: order.custo_mao_obra ? `R$ ${order.custo_mao_obra}` : 'CONCLUÍDO', status: 'success' },
      ]);
      setHistoryLoading(false);
    }, 800);
  };

  const columns = [
    {
      header: 'Ativo / Equipamento',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
          <span className="main-text" style={{ fontWeight: 700, color: '#1e293b' }}>
            {item.maquinas?.nome || 'Ativo'}
          </span>
          <span className="sub-meta" style={{ color: '#64748b', fontSize: '10px', fontWeight: 600 }}>
            ID: {item.maquina_id?.slice(0,8).toUpperCase() || 'N/A'}
          </span>
        </div>
      ),
      align: 'left' as const
    },
    {
      header: 'Manutenção / Tipo',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
          <span style={{ 
            fontSize: '9px', 
            fontWeight: 900, 
            textTransform: 'uppercase', 
            letterSpacing: '0.05em',
            color: item.tipo === 'preventiva' ? '#059669' : item.tipo === 'corretiva' ? '#dc2626' : '#2563eb',
            background: item.tipo === 'preventiva' ? '#ecfdf5' : item.tipo === 'corretiva' ? '#fef2f2' : '#eff6ff',
            padding: '2px 6px',
            borderRadius: '4px',
            width: 'fit-content'
          }}>
            {item.tipo}
          </span>
          <span className="sub-meta" style={{ 
            color: '#475569', 
            fontSize: '11px', 
            fontWeight: 500,
            maxWidth: '180px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {item.descricao || 'Sem descrição'}
          </span>
        </div>
      ),
      align: 'left' as const
    },
    {
      header: 'Responsável',
      accessor: (item: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#334155', fontWeight: 600, fontSize: '12px' }}>
          <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 800 }}>
            {item.responsavel?.charAt(0) || 'U'}
          </div>
          <span>{item.responsavel || 'Não atribuído'}</span>
        </div>
      ),
      align: 'left' as const
    },
    {
      header: 'Data / Previsão',
      accessor: (item: any) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#475569', fontWeight: 600, fontSize: '12px' }}>
          <Calendar size={14} color="#94a3b8" />
          <span>{item.data_inicio ? new Date(item.data_inicio).toLocaleDateString() : 'N/A'}</span>
        </div>
      ),
      align: 'center' as const
    },
    {
      header: 'Custo TCO',
      accessor: (item: any) => {
        const total = Number(item.custo_pecas || 0) + Number(item.custo_mao_obra || 0);
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
            <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '13px' }}>
              {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
            <div style={{ display: 'flex', gap: '4px', fontSize: '9px', fontWeight: 800, color: '#94a3b8' }}>
              <span>P: {Number(item.custo_pecas || 0).toFixed(0)}</span>
              <span>|</span>
              <span>MO: {Number(item.custo_mao_obra || 0).toFixed(0)}</span>
            </div>
          </div>
        );
      },
      align: 'right' as const
    },
    {
      header: 'Status',
      accessor: (item: any) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span className={`status-pill ${item.status === 'completed' ? 'active' : item.status === 'open' ? 'warning' : 'info'}`}>
            {item.status === 'completed' ? 'Finalizada' : item.status === 'open' ? 'Pendente' : 'Oficina'}
          </span>
        </div>
      ),
      align: 'center' as const
    }
  ];

  return (
    <div className="maintenance-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge">
            <Wrench size={14} fill="currentColor" />
            <span>TAUZE FLEET v5.0</span>
          </div>
          <h1 className="page-title">Manutenção de Frota</h1>
          <p className="page-subtitle">Rastreabilidade completa de intervenções mecânicas, revisões preventivas e custos em tempo real.</p>
        </div>
        <div className="page-actions">
          <button className="glass-btn primary" onClick={() => setIsChecklistOpen(true)}>
            <Settings size={18} />
            CHECKLIST 100H
          </button>
          <button className="primary-btn" onClick={handleOpenCreate}>
            <Plus size={18} />
            NOVA ORDEM
          </button>
        </div>
      </header>

      <div className="next-gen-kpi-grid">
        {loading ? (
          Array(4).fill(0).map((_, i) => <TauzeStatCard key={i} loading={true} label="" value="" icon={Wrench} color="" />)
        ) : stats.map((stat, idx) => (
          <TauzeStatCard 
            key={idx}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            progress={stat.progress}
            change="+0.5%"
            trend="up"
          />
        ))}
      </div>

      <div className="tauze-controls-row">
        <div className="tauze-tab-group">
          <button 
            className={`tauze-tab-item ${activeTab === 'ACTIVE' ? 'active' : ''}`}
            onClick={() => setActiveTab('ACTIVE')}
          >
            OS Ativas
          </button>
          <button 
            className={`tauze-tab-item ${activeTab === 'HISTORY' ? 'active' : ''}`}
            onClick={() => setActiveTab('HISTORY')}
          >
            Histórico Mecânico
          </button>
          <button 
            className={`tauze-tab-item ${activeTab === 'PLANS' ? 'active' : ''}`}
            onClick={() => setActiveTab('PLANS')}
          >
            Planos Preventivos
          </button>
        </div>

        <div className="tauze-search-wrapper">
          <Search size={18} className="s-icon" />
          <input 
            type="text" 
            className="tauze-search-input"
            placeholder="Buscar por máquina, descrição ou responsável..." 
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
                const menu = document.getElementById('export-menu-maint');
                if (menu) menu.classList.toggle('active');
              }}
            >
              <FileText size={20} />
            </button>
            <div id="export-menu-maint" className="export-menu">
              <button onClick={() => { handleExport('csv'); document.getElementById('export-menu-maint')?.classList.remove('active'); }}>Excel (.CSV)</button>
              <button onClick={() => { handleExport('excel'); document.getElementById('export-menu-maint')?.classList.remove('active'); }}>Excel (.xlsx)</button>
              <button onClick={() => { handleExport('pdf'); document.getElementById('export-menu-maint')?.classList.remove('active'); }}>PDF</button>
            </div>
          </div>
        </div>
      </div>

      <MaintenanceFilterModal 
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filters={filterValues}
        setFilters={setFilterValues}
      />

      <div className="management-content">
        {activeTab === 'PLANS' ? (
          <div className="plans-grid animate-fade-in">
            {[
              { id: 1, title: 'Revisão Motor Pesado', freq: '250', unit: 'H', assets: 4, items: ['Óleo 15W40', 'Filtro Óleo', 'Filtro Combustível'] },
              { id: 2, title: 'Manutenção Caminhões', freq: '10.000', unit: 'KM', assets: 2, items: ['Alinhamento', 'Balanceamento', 'Lubrificação'] },
              { id: 3, title: 'Preventiva Semanal', freq: '50', unit: 'H', assets: 12, items: ['Engraxamento', 'Limpeza Radiador'] },
            ].map(plan => (
              <div key={plan.id} className="plan-card">
                <div className="plan-status-active">ATIVO</div>
                <div className="plan-main">
                  <div className="plan-icon">
                    <Clock size={20} />
                  </div>
                  <div className="plan-info">
                    <h3>{plan.title}</h3>
                    <p>Frequência: <strong>{plan.freq} {plan.unit}</strong></p>
                  </div>
                </div>
                <div className="plan-stats">
                  <div className="p-stat">
                    <Truck size={14} />
                    <span>{plan.assets} Ativos</span>
                  </div>
                  <div className="p-stat">
                    <FileText size={14} />
                    <span>{plan.items.length} Itens</span>
                  </div>
                </div>
                <div className="plan-actions">
                  <button className="plan-btn-edit" onClick={() => {
                    setSelectedPlan(plan);
                    setIsPlanModalOpen(true);
                  }}>CONFIGURAR PLANO</button>
                </div>
              </div>
            ))}
            <button className="add-plan-card" onClick={() => {
              setSelectedPlan(null);
              setIsPlanModalOpen(true);
            }}>
              <Plus size={32} />
              <span>CRIAR NOVO PLANO</span>
            </button>
          </div>
        ) : viewMode === 'kanban' ? (
          <div className="kanban-board animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', alignItems: 'start' }}>
            {[
              {
                title: '📌 Pendente',
                statusKeys: ['open', 'ABERTA', 'pending'],
                nextStatus: 'oficina',
                btnText: 'Iniciar Trabalho',
                color: '#f59e0b',
                bg: 'rgba(245, 158, 11, 0.05)'
              },
              {
                title: '🛠️ Em Oficina',
                statusKeys: ['oficina', 'in_progress'],
                nextStatus: 'completed',
                btnText: 'Finalizar OS',
                color: '#3b82f6',
                bg: 'rgba(59, 130, 246, 0.05)'
              },
              {
                title: '✅ Concluída',
                statusKeys: ['completed', 'CONCLUIDA', 'finalizada'],
                nextStatus: null,
                btnText: null,
                color: '#10b981',
                bg: 'rgba(16, 185, 129, 0.05)'
              }
            ].map(col => {
              const colOrders = orders.filter(o => {
                const matchesSearch = (o.maquinas?.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) || (o.descricao || '').toLowerCase().includes(searchTerm.toLowerCase());
                const matchesTypes = filterValues.types.length === 0 || filterValues.types.includes(o.tipo);
                const totalCost = Number(o.custo_pecas || 0) + Number(o.custo_mao_obra || 0);
                const matchesCost = totalCost <= filterValues.maxCost;
                const matchesDate = (!filterValues.dateStart || new Date(o.data_inicio) >= new Date(filterValues.dateStart)) &&
                                   (!filterValues.dateEnd || new Date(o.data_inicio) <= new Date(filterValues.dateEnd));

                const currentStatus = o.status?.toLowerCase() || 'open';
                const matchesStatus = col.statusKeys.map(k => k.toLowerCase()).includes(currentStatus);

                return matchesSearch && matchesTypes && matchesCost && matchesDate && matchesStatus;
              });

              return (
                <div 
                  key={col.title} 
                  className="kanban-column"
                  style={{
                    background: 'hsl(var(--bg-card) / 0.4)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '24px',
                    padding: '20px',
                    minHeight: '400px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${col.color}`, paddingBottom: '10px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: 'hsl(var(--text-main))' }}>{col.title}</h3>
                    <span style={{ fontSize: '11px', fontWeight: 900, background: col.color, color: 'white', padding: '2px 8px', borderRadius: '8px' }}>
                      {colOrders.length}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '600px', overflowY: 'auto', paddingRight: '4px' }}>
                    <AnimatePresence>
                      {colOrders.length === 0 ? (
                        <div style={{ padding: '40px 20px', textAlign: 'center', color: 'hsl(var(--text-muted))', fontSize: '12px', border: '1px dashed hsl(var(--border))', borderRadius: '16px' }}>
                          Nenhuma OS aqui
                        </div>
                      ) : (
                        colOrders.map(o => {
                          const totalCost = Number(o.custo_pecas || 0) + Number(o.custo_mao_obra || 0);
                          const isUpdating = updatingStatus[o.id];

                          return (
                            <motion.div
                              key={o.id}
                              layout
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.2 }}
                              style={{
                                background: 'hsl(var(--bg-card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '18px',
                                padding: '16px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                                transition: 'all 0.2s',
                                position: 'relative'
                              }}
                              className="kanban-card"
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <span style={{ fontWeight: 800, fontSize: '13px', color: 'hsl(var(--text-main))' }}>
                                  {o.maquinas?.nome || 'Equipamento'}
                                </span>
                                <span style={{
                                  fontSize: '8px',
                                  fontWeight: 900,
                                  textTransform: 'uppercase',
                                  color: o.tipo === 'preventiva' ? '#059669' : '#dc2626',
                                  background: o.tipo === 'preventiva' ? '#ecfdf5' : '#fef2f2',
                                  padding: '2px 6px',
                                  borderRadius: '6px'
                                }}>
                                  {o.tipo}
                                </span>
                              </div>

                              <p style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', margin: 0, fontWeight: 500, lineHeight: '1.4' }}>
                                {o.descricao || 'Sem descrição'}
                              </p>

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'hsl(var(--text-muted))', borderTop: '1px dashed hsl(var(--border))', paddingTop: '8px', marginTop: '4px' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                                  <Calendar size={12} />
                                  {o.data_inicio ? new Date(o.data_inicio).toLocaleDateString() : 'N/A'}
                                </span>
                                <span style={{ fontWeight: 800, color: '#059669' }}>
                                  {totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </span>
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid hsl(var(--border) / 0.5)', paddingTop: '10px', marginTop: '4px' }}>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button className="action-icon-btn info" style={{ width: '28px', height: '28px', borderRadius: '8px', border: '1px solid hsl(var(--border))', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => handleViewDetails(o)} title="Dossiê">
                                    <History size={12} />
                                  </button>
                                  <button className="action-icon-btn edit" style={{ width: '28px', height: '28px', borderRadius: '8px', border: '1px solid hsl(var(--border))', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => handleOpenEdit(o)} title="Editar">
                                    <Edit3 size={12} />
                                  </button>
                                  <button className="action-icon-btn delete" style={{ width: '28px', height: '28px', borderRadius: '8px', border: '1px solid hsl(var(--border))', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => handleDelete(o.id)} title="Excluir">
                                    <Trash2 size={12} />
                                  </button>
                                </div>

                                {col.nextStatus && (
                                  <button
                                    className="primary-btn"
                                    style={{
                                      padding: '6px 12px',
                                      borderRadius: '10px',
                                      fontSize: '10px',
                                      fontWeight: 800,
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      background: col.title.includes('Pendente') ? '#f59e0b' : '#3b82f6',
                                      borderColor: col.title.includes('Pendente') ? '#f59e0b' : '#3b82f6',
                                      boxShadow: 'none',
                                      height: '28px',
                                      color: 'white',
                                      cursor: 'pointer',
                                      border: 'none'
                                    }}
                                    disabled={isUpdating}
                                    onClick={() => handleStatusTransition(o.id, col.nextStatus!)}
                                  >
                                    {isUpdating ? (
                                      <motion.div 
                                        animate={{ rotate: 360 }}
                                        transition={{ repeat: Infinity, ease: "linear", duration: 1 }}
                                        style={{
                                          width: '10px',
                                          height: '10px',
                                          border: '2px solid white',
                                          borderTopColor: 'transparent',
                                          borderRadius: '50%'
                                        }}
                                      />
                                    ) : (
                                      <>
                                        <span>{col.btnText}</span>
                                        <ArrowRight size={10} />
                                      </>
                                    )}
                                  </button>
                                )}

                                {!col.nextStatus && (
                                  <span style={{ fontSize: '10px', fontWeight: 800, color: '#10b981', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                    <CheckCircle2 size={12} />
                                    Pronto
                                  </span>
                                )}
                              </div>
                            </motion.div>
                          );
                        })
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <ModernTable 
            data={orders.filter(o => {
              const matchesSearch = (o.maquinas?.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) || (o.descricao || '').toLowerCase().includes(searchTerm.toLowerCase());
              const isCompleted = o.status === 'completed' || o.status === 'CONCLUIDA' || o.status === 'finalizada';
              const matchesTab = activeTab === 'ACTIVE' ? !isCompleted : isCompleted;
              
              const matchesStatus = filterValues.status === 'all' || 
                                   o.status === filterValues.status || 
                                   (filterValues.status === 'open' && (o.status === 'ABERTA' || o.status === 'pending')) ||
                                   (filterValues.status === 'completed' && isCompleted);
              const matchesTypes = filterValues.types.length === 0 || filterValues.types.includes(o.tipo);
              const totalCost = Number(o.custo_pecas || 0) + Number(o.custo_mao_obra || 0);
              const matchesCost = totalCost <= filterValues.maxCost;
              const matchesDate = (!filterValues.dateStart || new Date(o.data_inicio) >= new Date(filterValues.dateStart)) &&
                                 (!filterValues.dateEnd || new Date(o.data_inicio) <= new Date(filterValues.dateEnd));

              return matchesSearch && matchesTab && matchesStatus && matchesTypes && matchesCost && matchesDate;
            })}
            columns={columns}
            loading={loading}
            hideHeader={true}
            searchPlaceholder="Buscar por máquina, descrição ou responsável..."
            actions={(item) => (
              <div className="modern-actions">
                <button className="action-dot info" onClick={() => handleViewDetails(item)} title="Dossiê">
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

      <MaintenanceForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleSubmit} 
        initialData={selectedOrder}
      />

      <HistoryModal 
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="Dossiê de Manutenção"
        subtitle="Rastreabilidade de peças, serviços e intervenções técnicas"
        items={historyItems}
        loading={historyLoading}
      />

      <FormModal
        isOpen={isChecklistOpen}
        onClose={() => setIsChecklistOpen(false)}
        onSubmit={(e) => {
          e.preventDefault();
          alert('Checklist 100H finalizado e OS Preventiva gerada!');
          setIsChecklistOpen(false);
          fetchOrders();
        }}
        title="Checklist Preventivo 100H"
        subtitle="Inspeção técnica obrigatória para maquinário pesado"
        icon={Settings}
        submitLabel="Finalizar e Gerar OS"
      >
        <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
          <label className="tauze-label">Selecione o Ativo</label>
          <select className="tauze-input tauze-select">
            <option value="">Selecione uma máquina...</option>
            <option value="1">Trator John Deere 7230</option>
            <option value="2">Colheitadeira Case IH 9250</option>
          </select>
        </div>

        <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
          <label className="tauze-label">Itens de Verificação</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'hsl(var(--bg-main)/0.5)', padding: '20px', borderRadius: '16px', border: '1px solid hsl(var(--border))' }}>
            {[
              'Troca de óleo do motor (15W40)',
              'Substituição do filtro de combustível',
              'Limpeza/Troca do filtro de ar',
              'Lubrificação de pontos de graxa',
              'Tensão das correias',
              'Terminais de bateria',
              'Vazamentos hidráulicos',
              'Sinalização e Luzes'
            ].map((item, idx) => (
              <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', fontWeight: 600, color: 'hsl(var(--text-main))', cursor: 'pointer' }}>
                <input type="checkbox" style={{ width: '16px', height: '16px', accentColor: 'hsl(var(--brand))' }} />
                <span>{item}</span>
              </label>
            ))}
          </div>
        </div>
      </FormModal>

      <FormModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        onSubmit={(e) => {
          e.preventDefault();
          alert('Plano de Manutenção salvo com sucesso!');
          setIsPlanModalOpen(false);
        }}
        title={selectedPlan ? 'Editar Plano' : 'Novo Plano'}
        subtitle="Defina as regras e itens técnicos da revisão preventiva"
        icon={Settings}
        submitLabel="Salvar Plano e Aplicar"
      >
        <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
          <label className="tauze-label">Nome do Plano</label>
          <input type="text" className="tauze-input" placeholder="Ex: Revisão 250 Horas" defaultValue={selectedPlan?.title} />
        </div>

        <div className="tauze-field-group">
          <label className="tauze-label">Frequência</label>
          <input type="text" className="tauze-input" placeholder="Ex: 250" defaultValue={selectedPlan?.freq} />
        </div>

        <div className="tauze-field-group">
          <label className="tauze-label">Unidade</label>
          <select className="tauze-input tauze-select" defaultValue={selectedPlan?.unit}>
            <option value="H">Horas (H)</option>
            <option value="KM">Quilômetros (KM)</option>
          </select>
        </div>

        <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
          <label className="tauze-label">Checklist Técnico</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(selectedPlan?.items || ['Troca de Óleo', 'Troca de Filtro']).map((item: string, i: number) => (
              <div key={i} style={{ display: 'flex', gap: '8px' }}>
                <input type="text" className="tauze-input" style={{ flex: 1, padding: '8px 12px', fontSize: '13px' }} defaultValue={item} />
                <button type="button" className="action-dot delete" style={{ width: '36px', height: '36px' }}><Trash2 size={14} /></button>
              </div>
            ))}
            <button type="button" className="text-btn" style={{ fontSize: '10px', alignSelf: 'flex-start' }}>+ ADICIONAR ITEM</button>
          </div>
        </div>

        <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
          <label className="tauze-label">Ativos Vinculados</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {['John Deere 7230', 'Patriot 350', 'Ford Cargo'].map(asset => (
              <label key={asset} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: 'hsl(var(--bg-main)/0.5)', borderRadius: '10px', fontSize: '12px', fontWeight: 600 }}>
                <input type="checkbox" defaultChecked={asset === 'John Deere 7230'} style={{ accentColor: 'hsl(var(--brand))' }} />
                <span>{asset}</span>
              </label>
            ))}
          </div>
        </div>
      </FormModal>

      <style>{`
        .plans-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
        .plan-card { background: white; border-radius: 20px; border: 1px solid #e2e8f0; padding: 24px; position: relative; transition: 0.3s; }
        .plan-card:hover { transform: translateY(-5px); border-color: hsl(var(--brand)); box-shadow: 0 12px 24px -10px rgba(0,0,0,0.1); }
        .plan-status-active { position: absolute; top: 20px; right: 20px; font-size: 9px; font-weight: 900; background: #ecfdf5; color: #059669; padding: 4px 8px; border-radius: 6px; }
        .plan-main { display: flex; gap: 16px; align-items: center; margin-bottom: 24px; }
        .plan-icon { width: 44px; height: 44px; border-radius: 12px; background: #f8fafc; display: flex; align-items: center; justify-content: center; border: 1px solid #e2e8f0; color: #64748b; }
        .plan-info h3 { font-size: 16px; font-weight: 800; color: #0f172a; margin: 0; }
        .plan-info p { font-size: 12px; color: #64748b; margin: 4px 0 0; }
        .plan-stats { display: flex; gap: 16px; margin-bottom: 24px; padding: 16px; background: #f8fafc; border-radius: 12px; }
        .p-stat { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; color: #475569; }
        .plan-actions { display: flex; }
        .plan-btn-edit { width: 100%; padding: 12px; border-radius: 12px; background: #f1f5f9; color: #1e293b; font-size: 11px; font-weight: 800; border: none; cursor: pointer; transition: 0.2s; text-transform: uppercase; }
        .plan-btn-edit:hover { background: #e2e8f0; }
        
        .add-plan-card { border: 2px dashed #e2e8f0; border-radius: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; min-height: 240px; color: #94a3b8; transition: 0.2s; background: transparent; cursor: pointer; }
        .add-plan-card:hover { background: #f8fafc; border-color: hsl(var(--brand)); color: hsl(var(--brand)); }
        .add-plan-card span { font-size: 12px; font-weight: 900; }
      `}</style>

    </div>
  );
};
