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
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { MovementForm } from '../../components/Forms/MovementForm';
import { HistoryModal } from '../../components/Modals/HistoryModal';
import { EliteStatCard } from '../../components/Cards/EliteStatCard';
import { ModernTable } from '../../components/DataTable/ModernTable';

export const MovementManagement: React.FC = () => {
  const { activeFarm } = useTenant();
  const [searchTerm, setSearchTerm] = useState('');
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'in' | 'out'>('in');
  const [activeTab, setActiveTab] = useState<'LOG' | 'ANALYSIS'>('LOG');
  const [selectedMovement, setSelectedMovement] = useState<any>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [stats, setStats] = useState<any[]>([]);

  useEffect(() => {
    if (!activeFarm) return;
    fetchMovements();
  }, [activeFarm]);

  const fetchMovements = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('movimentacoes_estoque')
      .select(`
        *,
        produtos (nome, unidade)
      `)
      .eq('fazenda_id', activeFarm.id)
      .order('data_movimentacao', { ascending: false });
    
    if (data) {
      setMovements(data);
      
      const entradas = data.filter(m => m.tipo === 'in').length;
      const saidas = data.filter(m => m.tipo === 'out').length;
      const totalMov = data.length;
      
      setStats([
        { label: 'Entradas de Insumos', value: entradas, icon: ArrowDownLeft, color: '#10b981', progress: 100 },
        { label: 'Saídas de Insumos', value: saidas, icon: ArrowUpRight, color: '#ef4444', progress: 85 },
        { label: 'Fluxo Operacional', value: totalMov, icon: ArrowRightLeft, color: '#3b82f6', progress: 100 },
        { label: 'Eficiência Carga', value: '98%', icon: Activity, color: '#166534', progress: 98 },
      ]);
    }
    setLoading(false);
  };

  const handleOpenCreate = (type: 'in' | 'out') => {
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

    const payload = {
      produto_id: formData.produto_id,
      tipo: formData.tipo,
      quantidade: parseFloat(formData.quantidade),
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
      header: 'Item / Produto',
      accessor: (item: any) => (
        <div className="table-cell-title">
          <span className="main-text">{item.produtos?.nome || 'Item Excluído'}</span>
          <div className="sub-meta uppercase font-bold text-[10px] tracking-wider">
            REF: {item.origem_destino || 'Direta'}
          </div>
        </div>
      )
    },
    {
      header: 'Movimento',
      accessor: (item: any) => (
        <div className="table-cell-meta">
          {item.tipo === 'in' ? <ArrowDownLeft size={14} className="text-emerald-500" /> : <ArrowUpRight size={14} className="text-rose-500" />}
          <span className={item.tipo === 'in' ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
            {item.tipo === 'in' ? 'Entrada' : 'Saída'}
          </span>
        </div>
      )
    },
    {
      header: 'Quantidade',
      accessor: (item: any) => (
        <div className="table-cell-meta">
          <Package size={14} />
          <span>{item.quantidade} {item.produtos?.unidade}</span>
        </div>
      )
    },
    {
      header: 'Data',
      accessor: (item: any) => (
        <div className="table-cell-meta">
          <Calendar size={14} />
          <span>{item.data_movimentacao ? new Date(item.data_movimentacao).toLocaleDateString() : 'N/A'}</span>
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
          <button className="icon-btn-secondary" title="Filtros Avançados">
            <Filter size={20} />
          </button>
          <button className="icon-btn-secondary" title="Exportar Log">
            <FileText size={20} />
          </button>
        </div>
      </div>

      <div className="management-content">
        <ModernTable 
          data={movements.filter(m => {
            const matchesSearch = (m.produtos?.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) || (m.responsavel || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesTab = activeTab === 'LOG' ? true : m.status === 'analysis';
            return matchesSearch && matchesTab;
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
