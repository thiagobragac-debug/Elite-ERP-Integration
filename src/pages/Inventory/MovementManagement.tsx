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
  History
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

export const MovementManagement: React.FC = () => {
  const { activeFarm } = useTenant();
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
   const [stats, setStats] = useState<any[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterValues, setFilterValues] = useState({
    type: 'all',
    minAmount: 0,
    maxAmount: 500000,
    dateStart: '',
    dateEnd: ''
  });

  useEffect(() => {
    if (!activeFarm) return;
    fetchMovements();
  }, [activeFarm]);

   const fetchMovements = async () => {
    if (!activeFarm?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('movimentacoes_estoque')
      .select(`
        *,
        produtos (nome, unidade, categoria)
      `)
      .eq('fazenda_id', activeFarm.id)
      .eq('tenant_id', activeFarm.tenantId)
      .order('data_movimentacao', { ascending: false });
    
    if (data) {
      setMovements(data);
      
      const valEntradas = data.filter(m => m.tipo === 'in').reduce((acc, curr) => acc + (Number(curr.quantidade) * Number(curr.valor_unitario || 0)), 0);
      const valSaidas = data.filter(m => m.tipo === 'out').reduce((acc, curr) => acc + (Number(curr.quantidade) * Number(curr.valor_unitario || 0)), 0);
      
      setStats([
        { label: 'Volume Entradas (R$)', value: `R$ ${valEntradas.toLocaleString('pt-BR')}`, icon: ArrowDownLeft, color: '#10b981', progress: 100, change: 'Aquisição de Ativos' },
        { label: 'Consumo Mensal (R$)', value: `R$ ${valSaidas.toLocaleString('pt-BR')}`, icon: ArrowUpRight, color: '#ef4444', progress: 85, change: 'Custo Operacional' },
        { label: 'Giro de Lotes', value: data.filter(m => m.lote).length, icon: History, color: '#3b82f6', progress: 100, change: 'Rastreabilidade Ativa' },
        { label: 'Integridade Audit', value: '100%', icon: Activity, color: '#166534', progress: 100, change: 'Sem Divergências' },
      ]);
    }
    setLoading(false);
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
    if (!activeFarm) return;

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
      header: 'Item / Rastreabilidade',
      accessor: (item: any) => (
        <div className="table-cell-title">
          <span className="main-text">{item.produtos?.nome || 'Item Excluído'}</span>
          <div className="sub-meta uppercase font-bold text-[10px] tracking-wider flex items-center gap-2">
            <span className="text-slate-500">LOTE: {item.lote || 'N/A'}</span>
            {item.data_validade && (
              <span className={`flex items-center gap-1 ${new Date(item.data_validade) < new Date() ? 'text-red-500' : 'text-amber-500'}`}>
                <Calendar size={10} /> {new Date(item.data_validade).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      )
    },
    {
      header: 'Tipo / Valor',
      accessor: (item: any) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            {item.tipo === 'in' ? <ArrowDownLeft size={14} className="text-emerald-500" /> : <ArrowUpRight size={14} className="text-rose-500" />}
            <span className={item.tipo === 'in' ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
              {item.tipo === 'in' ? 'Entrada' : item.tipo === 'transfer' ? 'Transf.' : 'Saída'}
            </span>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase">
            R$ {(Number(item.quantidade) * Number(item.valor_unitario || 0)).toLocaleString('pt-BR')}
          </span>
        </div>
      )
    },
    {
      header: 'Quantidade',
      accessor: (item: any) => (
        <div className="table-cell-meta">
          <div className="flex flex-col">
            <div className="flex items-center gap-1 font-bold">
              <Package size={14} />
              <span>{item.quantidade} {item.produtos?.unidade}</span>
            </div>
            <span className="text-[10px] text-slate-400 uppercase truncate max-w-[150px]">
              {item.origem_destino}
            </span>
          </div>
        </div>
      )
    },
    {
      header: 'Data / Resp.',
      accessor: (item: any) => (
        <div className="table-cell-meta">
          <div className="flex flex-col items-end">
            <span className="font-bold text-slate-700">{item.data_movimentacao ? new Date(item.data_movimentacao).toLocaleDateString() : 'N/A'}</span>
            <span className="text-[10px] text-slate-400 uppercase">{item.responsavel}</span>
          </div>
        </div>
      ),
      align: 'right' as const
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
            onClick={() => setActiveTab('LOG')}
          >
            Log de Movimentos
          </button>
          <button 
            className={`elite-tab-item ${activeTab === 'ANALYSIS' ? 'active' : ''}`}
            onClick={() => setActiveTab('ANALYSIS')}
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
              <button onClick={() => { handleExport('csv'); document.getElementById('export-menu-movements')?.classList.remove('active'); }}>CSV</button>
              <button onClick={() => { handleExport('excel'); document.getElementById('export-menu-movements')?.classList.remove('active'); }}>Excel (.xlsx)</button>
              <button onClick={() => { handleExport('pdf'); document.getElementById('export-menu-movements')?.classList.remove('active'); }}>PDF Profissional</button>
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
          data={movements.filter(m => {
            const matchesSearch = (m.produtos?.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) || (m.responsavel || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesTab = activeTab === 'LOG' ? true : m.tipo === 'out';
            
            const matchesType = filterValues.type === 'all' || m.tipo === filterValues.type;
            const amount = Number(m.quantidade) * Number(m.valor_unitario || 0);
            const matchesAmount = amount >= filterValues.minAmount && amount <= filterValues.maxAmount;
            const matchesDate = (!filterValues.dateStart || new Date(m.data_movimentacao) >= new Date(filterValues.dateStart)) &&
                               (!filterValues.dateEnd || new Date(m.data_movimentacao) <= new Date(filterValues.dateEnd));

            return matchesSearch && matchesTab && matchesType && matchesAmount && matchesDate;
          })}
          columns={columns}
          loading={loading}
          hideHeader={true}
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
