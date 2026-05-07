import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Map, 
  Plus, 
  Search, 
  Filter,
  Activity, 
  Maximize, 
  ChevronRight, 
  Trees,
  CloudRain,
  Edit3,
  Trash2,
  FileText,
  Target,
  LayoutGrid,
  List as ListIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimalListModal } from '../../components/Modals/AnimalListModal';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { PastureForm } from '../../components/Forms/PastureForm';
import { PastureManejoForm } from '../../components/Forms/PastureManejoForm';
import { EliteStatCard } from '../../components/Cards/EliteStatCard';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { formatNumber, formatPercent } from '../../utils/format';
import { KPISkeleton } from '../../components/Feedback/Skeleton';
import { EmptyState } from '../../components/Feedback/EmptyState';

export const PastureManagement: React.FC = () => {
  const { activeFarm } = useTenant();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [pastures, setPastures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isManejoModalOpen, setIsManejoModalOpen] = useState(false);
  const [selectedPasture, setSelectedPasture] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'ATIVOS' | 'HISTORICO'>('ATIVOS');
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [pastureToView, setPastureToView] = useState<any>(null);
  const [stats, setStats] = useState<any[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterValues, setFilterValues] = useState({
    status: 'all',
    tipo_capim: 'all'
  });
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');

  useEffect(() => {
    if (!activeFarm) return;
    fetchPastures();
  }, [activeFarm]);

  const fetchPastures = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('pastos')
      .select('*')
      .eq('fazenda_id', activeFarm.id);
    
    if (data) {
      setPastures(data);
      const totalArea = data.reduce((acc, curr) => acc + Number(curr.area), 0);
      const restingPastures = data.filter(p => p.status === 'resting').length;
      const occupiedPastures = data.filter(p => p.status === 'occupied').length;
      
      setStats([
        { 
          label: 'Área Total (ha)', 
          value: `${formatNumber(totalArea)}`, 
          icon: Maximize, 
          color: '#10b981', 
          progress: 100,
          change: `${data.length} pastos`,
          periodLabel: 'Mapeamento Atual',
          sparkline: [
            { value: 100, label: '100%' }, { value: 100, label: '100%' }, { value: 100, label: '100%' }, 
            { value: 100, label: '100%' }, { value: 100, label: '100%' }, { value: 100, label: '100%' }, 
            { value: 100, label: '100%' }, { value: 100, label: 'Total: ' + totalArea.toFixed(0) + 'ha' }
          ]
        },
        { 
          label: 'Pastos em Descanso', 
          value: restingPastures, 
          icon: Trees, 
          color: '#3b82f6', 
          progress: (restingPastures / data.length) * 100,
          change: `${occupiedPastures} em uso`,
          periodLabel: 'Rotacionamento',
          sparkline: [
            { value: 30, label: '3' }, { value: 45, label: '5' }, { value: 20, label: '2' }, 
            { value: 60, label: '7' }, { value: 40, label: '4' }, { value: 50, label: '6' }, 
            { value: 55, label: '6' }, { value: (restingPastures / data.length) * 100, label: restingPastures + ' em descanso' }
          ]
        },
        { 
          label: 'Taxa de Lotação', 
          value: '1.4 UA/ha', 
          icon: Activity, 
          color: '#f59e0b', 
          progress: 70,
          periodLabel: 'Carga Animal',
          sparkline: [
            { value: 60, label: '1.2 UA' }, { value: 65, label: '1.3 UA' }, { value: 70, label: '1.4 UA' }, 
            { value: 68, label: '1.3 UA' }, { value: 72, label: '1.5 UA' }, { value: 70, label: '1.4 UA' }, 
            { value: 71, label: '1.4 UA' }, { value: 70, label: '1.4 UA' }
          ]
        },
        { 
          label: 'Pluviosidade Mês', 
          value: '120mm', 
          icon: CloudRain, 
          color: '#166534', 
          progress: 85,
          periodLabel: 'Índice Pluviom.',
          sparkline: [
            { value: 20, label: '20mm' }, { value: 40, label: '40mm' }, { value: 10, label: '10mm' }, 
            { value: 80, label: '120mm' }, { value: 30, label: '45mm' }, { value: 50, label: '70mm' }, 
            { value: 90, label: '140mm' }, { value: 85, label: '120mm' }
          ]
        },
      ]);
    }
    setLoading(false);
  };

  const handleOpenCreate = () => {
    setSelectedPasture(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (pasture: any) => {
    setSelectedPasture(pasture);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este pasto?')) return;
    const { error } = await supabase.from('pastos').delete().eq('id', id);
    if (!error) fetchPastures();
  };

  const handleSubmit = async (data: any) => {
    if (!activeFarm) return;

    const payload = {
      nome: data.nome,
      area: parseFloat(data.area),
      capacidade_ua: parseFloat(data.capacidade_ua),
      tipo_capim: data.tipo_capim,
      status: data.status,
      data_ultima_fertilizacao: data.data_ultima_fertilizacao || null,
      topografia: data.topografia,
      tipo_solo: data.tipo_solo,
      agua: data.agua,
      observacoes: data.observacoes
    };

    if (selectedPasture) {
      const { error } = await supabase
        .from('pastos')
        .update(payload)
        .eq('id', selectedPasture.id);
      if (!error) {
        setIsModalOpen(false);
        fetchPastures();
      }
    } else {
      const { error } = await supabase.from('pastos').insert([{
        ...payload,
        fazenda_id: activeFarm.id,
        tenant_id: activeFarm.tenantId
      }]);
      if (!error) {
        setIsModalOpen(false);
        fetchPastures();
      }
    }
  };

  const handleViewAnimals = (pasture: any) => {
    setPastureToView(pasture);
    setIsDetailsModalOpen(true);
  };

  const columns = [
    {
      header: 'Pasto',
      accessor: (item: any) => (
        <div className="table-cell-title">
          <span className="main-text">{item.nome}</span>
          <div className="sub-meta uppercase font-bold text-[10px] tracking-wider">
            {item.tipo_capim}
          </div>
        </div>
      )
    },
    {
      header: 'Área',
      accessor: (item: any) => (
        <div className="table-cell-meta">
          <Maximize size={14} />
          <span>{formatNumber(item.area)} ha</span>
        </div>
      )
    },
    {
      header: 'Lotação',
      accessor: (item: any) => (
        <div className="table-cell-meta">
          <Activity size={14} />
          <span>{item.capacidade_ua} UA</span>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: (item: any) => (
        <span className={`status-pill ${item.status}`}>
          {item.status === 'occupied' ? 'Ocupado' : item.status === 'resting' ? 'Descanso' : 'Livre'}
        </span>
      ),
      align: 'center' as const
    }
  ];

  return (
    <div className="pasture-mgmt-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge">
            <Trees size={14} fill="currentColor" />
            <span>ELITE LIVESTOCK v5.0</span>
          </div>
          <h1 className="page-title">Gestão de Pastagens</h1>
          <p className="page-subtitle">Monitoramento de ocupação, lotação e saúde da forrageira em tempo real.</p>
        </div>
        <div className="page-actions">
          <button className="glass-btn secondary" onClick={() => setIsManejoModalOpen(true)}>
            <Target size={18} />
            LANÇAR MANEJO
          </button>
          <button className="primary-btn" onClick={handleOpenCreate}>
            <Plus size={18} />
            NOVO PASTO
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
            className={`elite-tab-item ${activeTab === 'ATIVOS' ? 'active' : ''}`}
            onClick={() => setActiveTab('ATIVOS')}
          >
            Pastos Ativos
          </button>
          <button 
            className={`elite-tab-item ${activeTab === 'HISTORICO' ? 'active' : ''}`}
            onClick={() => setActiveTab('HISTORICO')}
          >
            Histórico de Ocupação
          </button>
        </div>

        <div className="elite-search-wrapper">
          <Search size={18} className="s-icon" />
          <input 
            type="text" 
            className="elite-search-input"
            placeholder="Buscar pastagem por nome ou tipo de capim..." 
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
          <button className="icon-btn-secondary" title="Exportar">
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
                <label className="elite-label">Status de Ocupação</label>
                <select 
                  className="elite-input elite-select"
                  value={filterValues.status}
                  onChange={(e) => setFilterValues({...filterValues, status: e.target.value})}
                >
                  <option value="all">Todos</option>
                  <option value="occupied">Ocupado</option>
                  <option value="resting">Em Descanso</option>
                  <option value="free">Livre</option>
                </select>
              </div>
              <div className="filter-field">
                <label className="elite-label">Tipo de Capim</label>
                <select 
                  className="elite-input elite-select"
                  value={filterValues.tipo_capim}
                  onChange={(e) => setFilterValues({...filterValues, tipo_capim: e.target.value})}
                >
                  <option value="all">Todos os tipos</option>
                  <option value="Brachiaria">Brachiaria</option>
                  <option value="Panicum">Panicum</option>
                  <option value="Cynodon">Cynodon</option>
                  <option value="Estrela">Estrela</option>
                </select>
              </div>
              <div className="filter-actions-inline">
                <button className="text-btn" onClick={() => setFilterValues({ status: 'all', tipo_capim: 'all' })}>
                  LIMPAR
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="management-content">
        {pastures.length === 0 && !loading ? (
          <EmptyState
            title="Nenhuma pastagem cadastrada"
            description="Não há pastos registrados para esta fazenda. Mapeie as áreas de pastejo para começar o controle de rotação e lotação."
            actionLabel="Novo Pasto"
            onAction={handleOpenCreate}
            icon={Trees}
          />
        ) : viewMode === 'list' ? (
          <ModernTable 
            data={pastures.filter(p => {
              const matchesSearch = (p.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) || (p.tipo_capim || '').toLowerCase().includes(searchTerm.toLowerCase());
              const matchesTab = activeTab === 'ATIVOS' ? p.status !== 'archived' : p.status === 'archived';
              const matchesStatus = filterValues.status === 'all' || p.status === filterValues.status;
              const matchesCapim = filterValues.tipo_capim === 'all' || p.tipo_capim === filterValues.tipo_capim;
              return matchesSearch && matchesTab && matchesStatus && matchesCapim;
            })}
            columns={columns}
            loading={loading}
            hideHeader={true}
            searchPlaceholder="Pesquisar na base de pastagens..."
            actions={(item) => (
              <div className="modern-actions">
                <button className="action-dot info" onClick={() => handleViewAnimals(item)} title="Ver Animais"><Activity size={18} /></button>
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
            {pastures
              .filter(p => {
                const matchesSearch = (p.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) || (p.tipo_capim || '').toLowerCase().includes(searchTerm.toLowerCase());
                const matchesTab = activeTab === 'ATIVOS' ? p.status !== 'archived' : p.status === 'archived';
                const matchesStatus = filterValues.status === 'all' || p.status === filterValues.status;
                const matchesCapim = filterValues.tipo_capim === 'all' || p.tipo_capim === filterValues.tipo_capim;
                return matchesSearch && matchesTab && matchesStatus && matchesCapim;
              })
              .map(p => (
                <motion.div 
                  key={p.id} 
                  layout
                  className={`user-card-premium ${p.status === 'occupied' ? 'info-badge' : 'active'}`}
                >
                  <div className="card-left-section">
                    <div className="card-avatar">
                      <Trees size={32} />
                    </div>
                    <div className="card-bottom-actions">
                      <button className="action-icon-btn" onClick={() => handleViewAnimals(p)} title="Ver Animais"><Activity size={16} /></button>
                      <button className="action-icon-btn" onClick={() => handleOpenEdit(p)} title="Editar"><Edit3 size={16} /></button>
                      <button className="action-icon-btn delete" onClick={() => handleDelete(p.id)} title="Excluir"><Trash2 size={16} /></button>
                    </div>
                  </div>

                  <div className="card-main-content">
                    <div className="card-header-info">
                      <h3>{p.nome}</h3>
                      <span className="card-role-badge">{p.tipo_capim || 'Brachiaria'}</span>
                    </div>

                    <div className="card-meta-grid">
                      <div className="meta-item">
                        <Maximize size={14} className="meta-icon" />
                        <span>{p.area || 0} ha</span>
                      </div>
                      <div className="meta-item">
                        <Activity size={14} className="meta-icon" />
                        <span>Capacidade: {p.capacidade_ua || 0} UA</span>
                      </div>
                      <div className="meta-item">
                        <Target size={14} className="meta-icon" />
                        <span>Status: {p.status === 'occupied' ? 'Ocupado' : 'Descanso'}</span>
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

        .user-card-premium.info-badge::before {
          background: #3b82f6;
          box-shadow: 4px 0 15px rgba(59, 130, 246, 0.3);
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

      <PastureForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleSubmit}
        initialData={selectedPasture}
      />

      <PastureManejoForm 
        isOpen={isManejoModalOpen}
        onClose={() => setIsManejoModalOpen(false)}
        onSubmit={() => {
          fetchPastures();
          setIsManejoModalOpen(false);
        }}
      />

      <AnimalListModal 
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        pasture={pastureToView}
      />

    </div>
  );
};
