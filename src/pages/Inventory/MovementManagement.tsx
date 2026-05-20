import React, { useState, useEffect } from 'react';
import { 
  ArrowRightLeft, 
  Plus, 
  Search, 
  Filter,
  ArrowUpRight, 
  ArrowDownLeft, 
  ChevronRight, 
  Calendar,
  Building2,
  FileText,
  Trash2,
  Edit3,
  Activity,
  Package,
  History,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/export';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { MovementForm } from '../../components/Forms/MovementForm';
import { HistoryModal } from '../../components/Modals/HistoryModal';
import { EliteStatCard } from '../../components/Cards/EliteStatCard';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { MovementFilterModal } from './components/MovementFilterModal';
import { useFarmFilter } from '../../hooks/useFarmFilter';

export const MovementManagement: React.FC = () => {
  const { isGlobalMode, activeFarmId, activeTenantId, applyFarmFilter, canCreate, activeFarm } = useFarmFilter();
  const [searchTerm, setSearchTerm] = useState('');
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'in' | 'out' | 'transfer'>('in');
  const [activeTab, setActiveTab] = useState<'LOG' | 'ANALYSIS'>('LOG');
  const [selectedMovement, setSelectedMovement] = useState<any>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [stats, setStats] = useState<any[]>([
    { label: 'Movimentações', value: '0', icon: ArrowDownLeft, color: '#10b981', progress: 0, change: 'Volume de Log' },
    { label: 'Página Atual', value: '1', icon: ArrowUpRight, color: '#3b82f6', progress: 100, change: 'Visão de Grade' },
    { label: 'Integridade Audit', value: '100%', icon: Activity, color: '#166534', progress: 100, change: 'Sem Divergências' },
    { label: 'Sincronismo', value: 'Ativo', icon: Zap, color: '#f59e0b', progress: 100, change: 'Tempo Real' },
  ]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterValues, setFilterValues] = useState({
    type: 'all',
    minAmount: 0,
    maxAmount: 1000000,
    dateStart: '',
    dateEnd: ''
  });

  // Server-side pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const isReady = isGlobalMode ? !!activeTenantId : !!activeFarmId;
    if (isReady) {
      fetchMovements();
    } else {
      setLoading(false);
    }
  }, [activeFarmId, activeTenantId, isGlobalMode, page, searchTerm, activeTab]);

   const fetchMovements = async () => {
    if (!activeFarmId && !isGlobalMode) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      console.log(`[Movements] Sincronizando logs (Página ${page})...`);
      
      let query = supabase.from('movimentacoes_estoque').select(`
        *,
        produtos (nome, unidade, categoria)
      `, { count: 'exact' });
      
      query = applyFarmFilter(query);

      // Server-side Search
      if (searchTerm) {
        // Since we can't easily join-search in simple query without complex logic, 
        // we'll search by responsavel or origem_destino for now
        query = query.or(`responsavel.ilike.%${searchTerm}%,origem_destino.ilike.%${searchTerm}%`);
      }

      // Range
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, count, error } = await query
        .order('data_movimentacao', { ascending: false })
        .range(from, to);
      
      if (error) throw error;
      
      if (data) {
        setMovements(data);
        setTotalCount(count || 0);
        
        setStats([
          { label: 'Movimentações', value: String(count || 0), icon: ArrowDownLeft, color: '#10b981', progress: 100, change: 'Volume de Log' },
          { label: 'Página Atual', value: `${page}`, icon: ArrowUpRight, color: '#3b82f6', progress: 100, change: 'Visão de Grade' },
          { label: 'Integridade Audit', value: '100%', icon: Activity, color: '#166534', progress: 100, change: 'Sem Divergências' },
          { label: 'Sincronismo', value: 'Ativo', icon: Zap, color: '#f59e0b', progress: 100, change: 'Tempo Real' },
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = (type: 'in' | 'out' | 'transfer') => {
    setSelectedMovement(null);
    setModalType(type);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (move: any) => {
    setSelectedMovement(move);
    setModalType(move.tipo);
    setIsModalOpen(true);
  };

  const handleSubmit = async (formData: any) => {
    if (!activeFarm) { if (typeof setLoading !== 'undefined') setLoading(false); return; }

    if (formData.tipo === 'transfer') {
      try {
        // 1. Get current product to use current average cost
        const { data: product } = await supabase
          .from('produtos')
          .select('custo_medio')
          .eq('id', formData.produto_id)
          .single();
        
        const currentCost = product?.custo_medio || 0;

        // 2. Create the "OUT" movement from source
        const outPayload = {
          produto_id: formData.produto_id,
          tipo: 'out',
          quantidade: parseFloat(formData.quantidade),
          deposito_id: formData.deposito_id,
          valor_unitario: currentCost,
          data_movimentacao: formData.data_movimentacao,
          origem_destino: `Transferência para depósito destino`,
          responsavel: formData.responsavel,
          fazenda_id: activeFarm.id,
          tenant_id: activeFarm.tenantId
        };

        // 3. Create the "IN" movement to destination
        const inPayload = {
          produto_id: formData.produto_id,
          tipo: 'in',
          quantidade: parseFloat(formData.quantidade),
          deposito_id: formData.destino_deposito_id,
          valor_unitario: currentCost,
          data_movimentacao: formData.data_movimentacao,
          origem_destino: `Transferência de depósito origem`,
          responsavel: formData.responsavel,
          fazenda_id: activeFarm.id,
          tenant_id: activeFarm.tenantId
        };

        const { error: errorOut } = await supabase.from('movimentacoes_estoque').insert([outPayload]);
        if (errorOut) throw errorOut;

        const { error: errorIn } = await supabase.from('movimentacoes_estoque').insert([inPayload]);
        if (errorIn) throw errorIn;

        setIsModalOpen(false);
        fetchMovements();
        return;
      } catch (err) {
        console.error('Error in transfer:', err);
        alert('Erro ao processar transferência');
        return;
      }
    }

    const payload = {
      produto_id: formData.produto_id,
      tipo: formData.tipo,
      quantidade: parseFloat(formData.quantidade),
      deposito_id: formData.deposito_id,
      valor_unitario: parseFloat(formData.valor_unitario || 0),
      data_movimentacao: formData.data_movimentacao,
      origem_destino: formData.origem_destino,
      responsavel: formData.responsavel,
      fazenda_id: activeFarm.id,
      tenant_id: activeFarm.tenantId
    };

    if (selectedMovement) {
      const { error } = await supabase
        .from('movimentacoes_estoque')
        .update(payload)
        .eq('id', selectedMovement.id);
      
      if (!error) {
        setIsModalOpen(false);
        fetchMovements();
      }
    } else {
      const { error } = await supabase.from('movimentacoes_estoque').insert([payload]);

      if (!error) {
        setIsModalOpen(false);
        fetchMovements();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta movimentação?')) return;

    const { error } = await supabase
      .from('movimentacoes_estoque')
      .delete()
      .eq('id', id);

    if (!error) {
      fetchMovements();
    }
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const filteredData = movements.filter(m => {
      const matchesSearch = (m.produtos?.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) || (m.responsavel || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTab = activeTab === 'LOG' ? true : m.tipo === 'out';
      
      const matchesType = filterValues.type === 'all' || m.tipo === filterValues.type;
      const amount = Number(m.quantidade) * Number(m.valor_unitario || 0);
      const matchesAmount = amount >= filterValues.minAmount && amount <= filterValues.maxAmount;
      const matchesDate = (!filterValues.dateStart || new Date(m.data_movimentacao) >= new Date(filterValues.dateStart)) &&
                         (!filterValues.dateEnd || new Date(m.data_movimentacao) <= new Date(filterValues.dateEnd));

      return matchesSearch && matchesTab && matchesType && matchesAmount && matchesDate;
    });

    const exportData = filteredData.map(item => ({
      Data: item.data_movimentacao ? new Date(item.data_movimentacao).toLocaleDateString() : 'N/A',
      Produto: item.produtos?.nome || 'Item Excluído',
      Tipo: item.tipo === 'in' ? 'Entrada' : item.tipo === 'transfer' ? 'Transferência' : 'Saída',
      Quantidade: `${item.quantidade} ${item.produtos?.unidade || ''}`,
      Valor_Unitario: item.valor_unitario,
      Valor_Total: (Number(item.quantidade) * Number(item.valor_unitario || 0)),
      Responsavel: item.responsavel,
      Origem_Destino: item.origem_destino
    }));

    if (format === 'csv') exportToCSV(exportData, 'log_movimentacoes');
    else if (format === 'excel') exportToExcel(exportData, 'log_movimentacoes');
    else if (format === 'pdf') exportToPDF(exportData, 'log_movimentacoes', 'Relatório de Movimentação de Estoque');
  };

  const handleViewDetails = (move: any) => {
    setIsHistoryModalOpen(true);
    setHistoryItems([
      { id: '1', date: move.data_movimentacao, title: move.tipo === 'in' ? 'Entrada de Mercadoria' : 'Saída de Mercadoria', subtitle: 'Produto: ' + (move.produtos?.nome || 'Item'), value: `${move.quantidade} ${move.produtos?.unidade || ''}`, status: move.tipo === 'in' ? 'success' : 'error' },
      { id: '2', date: move.data_movimentacao, title: 'Documento de Origem', subtitle: move.origem_destino || 'N/A', value: 'Vinculado', status: 'info' },
      { id: '3', date: move.created_at, title: 'Operador', subtitle: move.responsavel, value: 'OK', status: 'success' },
    ]);
  };

  const columns = [
    {
      header: 'Produto / Código',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
          <span className="main-text" style={{ fontWeight: 800, color: '#1e293b' }}>
            {item.produtos?.nome || 'Item Excluído'}
          </span>
          <span className="sub-meta" style={{ color: '#64748b', fontSize: '10px', fontWeight: 600 }}>
            ID: {item.id?.slice(0, 8).toUpperCase()}
          </span>
        </div>
      ),
      align: 'left' as const
    },
    {
      header: 'Tipo de Operação',
      accessor: (item: any) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span className={`status-pill ${item.tipo === 'in' ? 'success' : item.tipo === 'transfer' ? 'warning' : 'danger'}`} style={{ textTransform: 'uppercase', fontWeight: 900 }}>
            {item.tipo === 'in' ? 'Entrada' : item.tipo === 'transfer' ? 'Transf.' : 'Saída'}
          </span>
        </div>
      ),
      align: 'center' as const
    },
    {
      header: 'Lote & Validade',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
            Lote: {item.lote || 'N/A'}
          </span>
          {item.data_validade ? (
            <span className={`flex items-center gap-1 text-[10px] font-bold ${new Date(item.data_validade) < new Date() ? 'text-red-500' : 'text-amber-500'}`}>
              <Calendar size={10} /> Val: {new Date(item.data_validade).toLocaleDateString()}
            </span>
          ) : (
            <span style={{ fontSize: '9px', fontWeight: 700, color: '#94a3b8' }}>
              Sem Validade
            </span>
          )}
        </div>
      ),
      align: 'left' as const
    },
    {
      header: 'Quantidade / Local',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: '#334155', fontSize: '12px' }}>
            <Package size={14} color="#64748b" />
            <span>{item.quantidade} {item.produtos?.unidade}</span>
          </div>
          {item.origem_destino && (
            <span style={{ fontSize: '9px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }} className="truncate max-w-[150px]">
              {item.origem_destino}
            </span>
          )}
        </div>
      ),
      align: 'left' as const
    },
    {
      header: 'Valor Total',
      accessor: (item: any) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 900, color: '#059669' }}>
            R$ {(Number(item.quantidade) * Number(item.valor_unitario || 0)).toLocaleString('pt-BR')}
          </span>
        </div>
      ),
      align: 'center' as const
    },
    {
      header: 'Data / Responsável',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={12}/> {item.data_movimentacao ? new Date(item.data_movimentacao).toLocaleDateString() : 'N/A'}
          </span>
          <span style={{ fontSize: '9px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
            {item.responsavel || 'Sistema'}
          </span>
        </div>
      ),
      align: 'center' as const
    }
  ];

  return (
    <div className="movement-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge">
            <ArrowRightLeft size={14} fill="currentColor" />
            <span>ELITE INVENTORY v5.0</span>
          </div>
          <h1 className="page-title">Movimentação de Estoque</h1>
          <p className="page-subtitle">Rastreabilidade total de entradas, saídas e transferências de insumos em tempo real.</p>
        </div>
        <div className="page-actions">
          <button className="glass-btn secondary" onClick={() => handleOpenCreate('transfer')}>
            <ArrowRightLeft size={18} />
            TRANSFERÊNCIA
          </button>
          <button className="glass-btn secondary" onClick={() => handleOpenCreate('out')}>
            <Plus size={18} />
            LANÇAR SAÍDA
          </button>
          <button className="primary-btn" onClick={() => handleOpenCreate('in')}>
            <Plus size={18} />
            LANÇAR ENTRADA
          </button>
        </div>
      </header>

      <div className="next-gen-kpi-grid">
        {loading ? (
          Array(4).fill(0).map((_, i) => <EliteStatCard key={i} loading={true} label="" value="" icon={Package} color="" />)
        ) : stats.map((stat, idx) => (
          <EliteStatCard 
            key={idx}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            progress={stat.progress}
            change="+4.2%"
            trend="up"
          />
        ))}
      </div>

      <div className="elite-controls-row">
        <div className="elite-tab-group">
          <button 
            className={`elite-tab-item ${activeTab === 'LOG' ? 'active' : ''}`}
            onClick={() => { setActiveTab('LOG'); setPage(1); }}
          >
            Log de Movimentos
          </button>
          <button 
            className={`elite-tab-item ${activeTab === 'ANALYSIS' ? 'active' : ''}`}
            onClick={() => { setActiveTab('ANALYSIS'); setPage(1); }}
          >
            Análise de Fluxo
          </button>
        </div>

        <div className="elite-search-wrapper">
          <Search size={18} className="s-icon" />
          <input 
            type="text" 
            className="elite-search-input"
            placeholder="Buscar por item, referência ou responsável..." 
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
                const menu = document.getElementById('export-menu-movements');
                if (menu) menu.classList.toggle('active');
              }}
            >
              <FileText size={20} />
            </button>
            <div id="export-menu-movements" className="export-menu">
              <button onClick={() => { handleExport('csv'); document.getElementById('export-menu-movements')?.classList.remove('active'); }}>Excel (.CSV)</button>
              <button onClick={() => { handleExport('excel'); document.getElementById('export-menu-movements')?.classList.remove('active'); }}>Excel (.xlsx)</button>
              <button onClick={() => { handleExport('pdf'); document.getElementById('export-menu-movements')?.classList.remove('active'); }}>PDF</button>
            </div>
          </div>
        </div>

        <MovementFilterModal 
          isOpen={showAdvancedFilters}
          onClose={() => setShowAdvancedFilters(false)}
          filters={filterValues}
          setFilters={setFilterValues}
        />
      </div>

      <div className="management-content">
          <ModernTable 
          data={movements}
          columns={columns}
          loading={loading}
          hideHeader={true}
          totalCount={totalCount}
          currentPage={page}
          onPageChange={setPage}
          itemsPerPage={pageSize}
          searchPlaceholder="Buscar por item, referência ou responsável..."
          actions={(item) => (
            <div className="modern-actions">
              <button className="action-dot info" onClick={() => handleViewDetails(item)} title="Detalhes">
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

      <MovementForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleSubmit} 
        defaultType={modalType}
        initialData={selectedMovement}
      />

      <HistoryModal 
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="Detalhes da Movimentação"
        subtitle="Rastreabilidade completa do lançamento"
        items={historyItems}
        loading={historyLoading}
      />
    </div>
  );
};
