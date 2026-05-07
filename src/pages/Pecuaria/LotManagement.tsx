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
  Calendar,
  LayoutGrid,
  List as ListIcon,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { LotForm } from '../../components/Forms/LotForm';
import { RelocateForm } from '../../components/Forms/RelocateForm';
import { AnimalListModal } from '../../components/Modals/AnimalListModal';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { EliteStatCard } from '../../components/Cards/EliteStatCard';
import { KPISkeleton } from '../../components/Feedback/Skeleton';
import { EmptyState } from '../../components/Feedback/EmptyState';
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
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');

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

        <div className="view-mode-toggle">
          <button 
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="Visualização em Lista"
          >
            <ListIcon size={18} />
          </button>
          <button 
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Visualização em Cards"
          >
            <LayoutGrid size={18} />
          </button>
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
        {lots.length === 0 && !loading ? (
          <EmptyState
            title="Nenhum lote cadastrado"
            description="Nenhum lote operacional foi criado para esta fazenda. Organize o rebanho criando o primeiro lote de manejo."
            actionLabel="Novo Lote"
            onAction={handleOpenCreate}
            icon={Layers}
          />
        ) : viewMode === 'list' ? (
          <ModernTable 
            data={lots.filter(l => {
              const matchesSearch = (l.nome || '').toLowerCase().includes(searchTerm.toLowerCase());
              const matchesTab = activeTab === 'ATIVO' ? (l.status === 'ATIVO' || !l.status) : l.status === 'ARQUIVADO';
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
                <button className="action-dot info" onClick={() => handleViewDetails(item)} title="Detalhes"><Eye size={18} /></button>
                <button className="action-dot edit" onClick={() => handleOpenEdit(item)} title="Editar"><Edit3 size={18} /></button>
                <button className="action-dot delete" onClick={() => handleDelete(item.id)} title="Excluir"><Trash2 size={18} /></button>
              </div>
            )}
          />
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="user-cards-grid"
          >
            {lots
              .filter(l => {
                const matchesSearch = (l.nome || '').toLowerCase().includes(searchTerm.toLowerCase());
                const matchesTab = activeTab === 'ATIVO' ? (l.status === 'ATIVO' || !l.status) : l.status === 'ARQUIVADO';
                const matchesStatus = filterValues.status === 'all' || l.status === filterValues.status;
                const matchesDate = (!filterValues.dateStart || new Date(l.created_at) >= new Date(filterValues.dateStart)) &&
                                   (!filterValues.dateEnd || new Date(l.created_at) <= new Date(filterValues.dateEnd));
                return matchesSearch && matchesTab && matchesStatus && matchesDate;
              })
              .map(l => (
                <motion.div 
                  key={l.id} 
                  layout
                  className={`user-card-premium ${l.status === 'ATIVO' || !l.status ? 'active' : 'warning-badge'}`}
                >
                  <div className="card-left-section">
                    <div className="card-avatar">
                      <Layers size={32} />
                    </div>
                    <div className="card-bottom-actions">
                      <button className="action-icon-btn" onClick={() => handleViewDetails(l)} title="Detalhes"><Eye size={16} /></button>
                      <button className="action-icon-btn" onClick={() => handleOpenEdit(l)} title="Editar"><Edit3 size={16} /></button>
                      <button className="action-icon-btn delete" onClick={() => handleDelete(l.id)} title="Excluir"><Trash2 size={16} /></button>
                    </div>
                  </div>

                  <div className="card-main-content">
                    <div className="card-header-info">
                      <h3>{l.nome}</h3>
                      <span className="card-role-badge">{l.status || 'ATIVO'}</span>
                    </div>

                    <div className="card-meta-grid">
                      <div className="meta-item">
                        <Users size={14} className="meta-icon" />
                        <span>{l.capacidade || 0} Animais</span>
                      </div>
                      <div className="meta-item">
                        <TrendingUp size={14} className="meta-icon" />
                        <span>GMD Alvo: {l.gmd_alvo || 0} kg</span>
                      </div>
                      <div className="meta-item">
                        <Calendar size={14} className="meta-icon" />
                        <span>Início: {l.data_inicio ? new Date(l.data_inicio).toLocaleDateString() : 'N/D'}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
          </motion.div>
        )}
      </div>

      <style>{`
        .view-mode-toggle {
          display: flex;
          background: #f1f5f9;
          padding: 4px;
          border-radius: 12px;
          gap: 4px;
          margin: 0 16px;
        }

        .view-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: #64748b;
          cursor: pointer;
          transition: 0.2s;
        }

        .view-btn.active {
          background: white;
          color: #16a34a;
          box-shadow: 0 4px 10px rgba(0,0,0,0.05);
        }

        .user-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: 20px;
          padding: 8px;
        }

        .user-card-premium {
          background: white;
          border-radius: 24px;
          border: 1px solid #e2e8f0;
          display: flex;
          overflow: hidden;
          padding: 0;
          height: 180px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 15px rgba(0,0,0,0.03);
          position: relative;
          text-align: left;
        }

        .user-card-premium::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 6px;
          background: #cbd5e1;
          transition: 0.3s;
        }

        .user-card-premium.active::before {
          background: #16a34a;
          box-shadow: 4px 0 15px rgba(22, 163, 74, 0.3);
        }

        .user-card-premium.warning-badge::before {
          background: #f59e0b;
          box-shadow: 4px 0 15px rgba(245, 158, 11, 0.3);
        }

        .user-card-premium:hover {
          transform: translateX(8px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.08);
          border-color: #16a34a33;
        }

        .card-left-section {
          width: 130px;
          background: #f8fafc;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-right: 1px solid #f1f5f9;
        }

        .card-avatar {
          width: 70px;
          height: 70px;
          background: #0f172a;
          color: white;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          font-weight: 900;
          margin-bottom: 12px;
          box-shadow: 0 10px 20px rgba(15, 23, 42, 0.2);
        }

        .card-main-content {
          flex: 1;
          padding: 20px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .card-header-info h3 {
          font-size: 19px;
          font-weight: 900;
          color: #0f172a;
          margin-bottom: 4px;
          letter-spacing: -0.02em;
        }

        .card-role-badge {
          display: inline-block;
          font-size: 10px;
          font-weight: 800;
          color: #16a34a;
          background: #f0fdf4;
          padding: 4px 10px;
          border-radius: 8px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .card-meta-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 8px;
          margin-top: 12px;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #64748b;
          font-size: 12px;
          font-weight: 600;
        }

        .meta-icon {
          color: #16a34a;
        }

        .card-bottom-actions {
          display: flex;
          gap: 8px;
          margin-top: 15px;
        }

        .action-icon-btn {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          border: 1px solid #f1f5f9;
          background: white;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: 0.2s;
        }

        .action-icon-btn:hover {
          background: #0f172a;
          color: white;
          transform: scale(1.1);
        }

        .action-icon-btn.delete:hover {
          background: #ef4444;
          border-color: #ef4444;
          color: white;
        }
      `}</style>

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
