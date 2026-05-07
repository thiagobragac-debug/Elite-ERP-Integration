import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ClipboardList, 
  Plus, 
  Users, 
  Scale, 
  Layers, 
  ArrowRightLeft,
  Trash2,
  Search,
  Filter,
  FileText,
  Edit3,
  Eye,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { LotForm } from '../../components/Forms/LotForm';
import { RelocateForm } from '../../components/Forms/RelocateForm';
import { AnimalListModal } from '../../components/Modals/AnimalListModal';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { EliteStatCard } from '../../components/Cards/EliteStatCard';
import './LotManagement.css';

export const LotManagement: React.FC = () => {
  const { activeFarm } = useTenant();
  const navigate = useNavigate();
  const [lots, setLots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRelocateModalOpen, setIsRelocateModalOpen] = useState(false);
  const [selectedLot, setSelectedLot] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [lotToView, setLotToView] = useState<any>(null);
  const [stats, setStats] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'ATIVO' | 'ARQUIVADO'>('ATIVO');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterValues, setFilterValues] = useState({
    status: 'all',
    dateStart: '',
    dateEnd: ''
  });

  useEffect(() => {
    if (!activeFarm) return;
    fetchLots();
  }, [activeFarm]);

  const fetchLots = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('lotes')
        .select('*')
        .eq('fazenda_id', activeFarm.id)
        .order('created_at', { ascending: false });
      
        if (data) {
          setLots(data);
          const totalLots = data.length;
          const activeLots = data.filter(l => l.status === 'Ativo').length;
          
          setStats([
            { 
              label: 'Lotes Operacionais', 
              value: totalLots, 
              icon: Layers, 
              color: '#10b981', 
              progress: 100,
              change: `${activeLots} ativos`,
              periodLabel: 'Ciclo Atual',
              sparkline: [
                { value: 40, label: '4' }, { value: 50, label: '5' }, { value: 45, label: '4' }, 
                { value: 60, label: '6' }, { value: 55, label: '5' }, { value: 70, label: '7' }, 
                { value: 65, label: '6' }, { value: 80, label: totalLots.toString() }
              ]
            },
            { 
              label: 'Efetivo Estimado', 
              value: '1.240', 
              icon: Users, 
              color: '#3b82f6', 
              progress: 85,
              change: '+150 cabeças',
              periodLabel: 'População em Lotes',
              sparkline: [
                { value: 30, label: '900' }, { value: 45, label: '1.050' }, { value: 40, label: '1.000' }, 
                { value: 65, label: '1.200' }, { value: 60, label: '1.150' }, { value: 85, label: '1.300' }, 
                { value: 80, label: '1.250' }, { value: 82, label: '1.240' }
              ]
            },
            { 
              label: 'Peso Médio Lote', 
              value: '450 kg', 
              icon: Scale, 
              color: '#f59e0b', 
              progress: 70,
              periodLabel: 'Média Ponderada',
              sparkline: [
                { value: 60, label: '420kg' }, { value: 65, label: '430kg' }, { value: 70, label: '440kg' }, 
                { value: 68, label: '435kg' }, { value: 75, label: '450kg' }, { value: 70, label: '445kg' }, 
                { value: 72, label: '455kg' }, { value: 70, label: '450kg' }
              ]
            },
            { 
              label: 'Taxa de Giro', 
              value: '12/mês', 
              icon: ArrowRightLeft, 
              color: '#166534', 
              progress: 40,
              periodLabel: 'Movimentação',
              sparkline: [
                { value: 20, label: '5' }, { value: 30, label: '8' }, { value: 25, label: '6' }, 
                { value: 50, label: '12' }, { value: 40, label: '10' }, { value: 45, label: '11' }, 
                { value: 55, label: '13' }, { value: 50, label: '12' }
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
    setSelectedLot(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (lot: any) => {
    setSelectedLot(lot);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este lote?')) return;
    const { error } = await supabase.from('lotes').delete().eq('id', id);
    if (!error) fetchLots();
  };

  const handleViewDetails = (lot: any) => {
    setLotToView(lot);
    setIsDetailsModalOpen(true);
  };

  const handleSubmit = async (data: any) => {
    if (!activeFarm) return;

    const payload = {
      nome: data.nome,
      descricao: data.descricao,
      status: data.status,
      capacidade: parseInt(data.capacidade) || 0,
      data_inicio: data.data_inicio,
      data_fim_prevista: data.data_fim_prevista || null,
      gmd_alvo: parseFloat(data.gmd_alvo) || 0,
      peso_alvo: parseFloat(data.peso_alvo) || 0
    };

    if (selectedLot) {
      const { error } = await supabase
        .from('lotes')
        .update(payload)
        .eq('id', selectedLot.id);
      if (!error) {
        setIsModalOpen(false);
        fetchLots();
      }
    } else {
      const { error } = await supabase.from('lotes').insert([{
        ...payload,
        fazenda_id: activeFarm.id,
        tenant_id: activeFarm.tenantId
      }]);
      if (!error) {
        setIsModalOpen(false);
        fetchLots();
      }
    }
  };

  const tableColumns = [
    { 
      header: 'Identificação / Nome', 
      accessor: (item: any) => (
        <div className="table-cell-title">
          <span className="main-text">{item.nome}</span>
          <div className="sub-meta uppercase font-bold text-[10px] tracking-wider">
            {item.status || 'ATIVO'}
          </div>
        </div>
      )
    },
    { 
      header: 'Efetivo', 
      accessor: (item: any) => (
        <div className="table-cell-meta">
          <Users size={14} />
          <span>{item.capacidade || 0} animais</span>
        </div>
      )
    },
    { 
      header: 'Data de Criação', 
      accessor: (item: any) => (
        <div className="table-cell-meta text-slate-500">
          <Calendar size={14} />
          <span>{new Date(item.created_at).toLocaleDateString()}</span>
        </div>
      )
    },
    { 
      header: 'Status', 
      accessor: (item: any) => (
        <span className={`status-pill ${item.status === 'ATIVO' ? 'active' : 'warning'}`}>
          {item.status === 'ATIVO' ? 'EM USO' : 'ARQUIVADO'}
        </span>
      ),
      align: 'center' as const
    }
  ];

  return (
    <div className="lot-mgmt-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge">
            <Layers size={14} fill="currentColor" />
            <span>ELITE LIVESTOCK v5.0</span>
          </div>
          <h1 className="page-title">Gestão de Lotes</h1>
          <p className="page-subtitle">Organização do rebanho, rastreabilidade por grupo e controle de lotação em tempo real.</p>
        </div>
        <div className="page-actions">
          <button className="glass-btn secondary" onClick={() => setIsRelocateModalOpen(true)}>
            <ArrowRightLeft size={18} />
            REMANEJAR
          </button>
          <button className="primary-btn" onClick={handleOpenCreate}>
            <Plus size={18} />
            NOVO LOTE
          </button>
        </div>
      </header>

      <div className="next-gen-kpi-grid">
        {loading ? (
          Array(4).fill(0).map((_, i) => <EliteStatCard key={i} loading={true} label="" value="" icon={Layers} color="" />)
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
          />
        ))}
      </div>

      <div className="elite-controls-row">
        <div className="elite-tab-group">
          <button 
            className={`elite-tab-item ${activeTab === 'ATIVO' ? 'active' : ''}`}
            onClick={() => setActiveTab('ATIVO')}
          >
            Lotes Ativos
          </button>
          <button 
            className={`elite-tab-item ${activeTab === 'ARQUIVADO' ? 'active' : ''}`}
            onClick={() => setActiveTab('ARQUIVADO')}
          >
            Arquivados
          </button>
        </div>

        <div className="elite-search-wrapper">
          <Search size={18} className="s-icon" />
          <input 
            type="text" 
            className="elite-search-input"
            placeholder="Filtrar por nome do lote..." 
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
          <button className="icon-btn-secondary" title="Exportar Log">
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
                <label className="elite-label">Status do Lote</label>
                <select 
                  className="elite-input elite-select"
                  value={filterValues.status}
                  onChange={(e) => setFilterValues({...filterValues, status: e.target.value})}
                >
                  <option value="all">Todos</option>
                  <option value="ATIVO">Em Uso</option>
                  <option value="ARQUIVADO">Arquivado</option>
                </select>
              </div>
              <div className="filter-field">
                <label className="elite-label">Criado Após</label>
                <input 
                  className="elite-input"
                  type="date" 
                  value={filterValues.dateStart}
                  onChange={(e) => setFilterValues({...filterValues, dateStart: e.target.value})}
                />
              </div>
              <div className="filter-field">
                <label className="elite-label">Criado Antes</label>
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
        <ModernTable 
          data={lots.filter(l => {
            const matchesSearch = (l.nome || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesTab = activeTab === 'ATIVO' ? (l.status === 'ATIVO' || !l.status) : l.status === 'ARQUIVADO';
            
            // Advanced Filters
            const matchesStatus = filterValues.status === 'all' || l.status === filterValues.status;
            const matchesDate = (!filterValues.dateStart || new Date(l.created_at) >= new Date(filterValues.dateStart)) &&
                               (!filterValues.dateEnd || new Date(l.created_at) <= new Date(filterValues.dateEnd));

            return matchesSearch && matchesTab && matchesStatus && matchesDate;
          })}
          columns={tableColumns}
          loading={loading}
          hideHeader={true}
          searchPlaceholder="Filtrar base de lotes..."
          actions={(item) => (
            <div className="modern-actions">
              <button className="action-dot info" onClick={() => handleViewDetails(item)} title="Detalhes">
                <Eye size={18} />
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

      <LotForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleSubmit}
        initialData={selectedLot}
      />

      <RelocateForm 
        isOpen={isRelocateModalOpen}
        onClose={() => setIsRelocateModalOpen(false)}
        onSubmit={() => {
          fetchLots();
          setIsRelocateModalOpen(false);
        }}
      />

      <AnimalListModal 
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        lot={lotToView}
      />
    </div>
  );
};
