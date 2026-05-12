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
  Scale,
  LayoutGrid,
  List as ListIcon,
  Calendar
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
import { PastureFilterModal } from './components/PastureFilterModal';

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
    capins: [],
    minArea: 0,
    maxArea: 500,
    minUA: 0,
    maxUA: 100,
    needsFertilization: false
  });
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');

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
            { value: 100, label: '100%' }, { value: 100, label: '100%' }, { value: 100, label: 'Total: ' + totalArea.toFixed(0) + 'ha' }
          ]
        },
        { 
          label: 'Em Descanso (DDR)', 
          value: restingPastures, 
          icon: Trees, 
          color: '#3b82f6', 
          progress: (restingPastures / data.length) * 100,
          change: 'Média 24 dias',
          periodLabel: 'Período de Recuperação',
          sparkline: [
            { value: 30, label: '3' }, { value: 45, label: '5' }, { value: 20, label: '2' }, 
            { value: 60, label: '7' }, { value: 40, label: '4' }, { value: (restingPastures / data.length) * 100, label: restingPastures + ' em descanso' }
          ]
        },
        { 
          label: 'Pressão de Pastejo', 
          value: '92%', 
          icon: Activity, 
          color: '#f59e0b', 
          progress: 92,
          change: 'Próximo do Limite',
          periodLabel: 'UA Real vs Suportada',
          sparkline: [
            { value: 60, label: '1.2 UA' }, { value: 65, label: '1.3 UA' }, { value: 70, label: '1.4 UA' }, 
            { value: 72, label: '1.5 UA' }, { value: 85, label: '1.6 UA' }, { value: 92, label: '92%' }
          ]
        },
        { 
          label: 'Degradação Médio', 
          value: '8%', 
          icon: Target, 
          color: '#166534', 
          progress: 8,
          change: 'Nível Controlado',
          periodLabel: 'Monitoramento Solo',
          sparkline: [
            { value: 5, label: '5%' }, { value: 12, label: '12%' }, { value: 10, label: '10%' }, 
            { value: 8, label: '8%' }, { value: 6, label: '6%' }, { value: 8, label: '8%' }
          ]
        },
      ]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!activeFarm) return;
    fetchPastures();
  }, [activeFarm]);

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
      header: 'Pressão de Pastejo',
      accessor: (item: any) => {
        const pressure = item.status === 'occupied' ? 85 : 0; // Mocking pressure
        return (
          <div className="table-cell-meta">
            <div className="flex items-center gap-2 w-full">
              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${pressure > 90 ? 'bg-red-500' : 'bg-brand'}`} 
                  style={{ width: `${pressure}%` }}
                />
              </div>
              <span className="text-[11px] font-bold text-slate-600">{pressure}%</span>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Status & DDR',
      accessor: (item: any) => (
        <div className="flex flex-col items-center">
          <span className={`status-pill ${item.status}`}>
            {item.status === 'occupied' ? 'Ocupado' : item.status === 'resting' ? 'Descanso' : 'Livre'}
          </span>
          {item.status === 'resting' && (
            <span className="text-[9px] font-bold text-blue-600 mt-1">12 DIAS DDR</span>
          )}
        </div>
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

      <PastureFilterModal 
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filters={filterValues}
        setFilters={setFilterValues}
      />

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
              const matchesCapins = filterValues.capins.length === 0 || filterValues.capins.some(c => p.tipo_capim?.includes(c));
              
              const area = Number(p.area || 0);
              const matchesArea = area <= filterValues.maxArea;
              
              const ua = Number(p.capacidade_ua || 0);
              const matchesUA = ua >= filterValues.minUA && ua <= filterValues.maxUA;

              return matchesSearch && matchesTab && matchesStatus && matchesCapins && matchesArea && matchesUA;
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
                const matchesCapins = filterValues.capins.length === 0 || filterValues.capins.some(c => p.tipo_capim?.includes(c));
                
                const area = Number(p.area || 0);
                const matchesArea = area <= filterValues.maxArea;
                
                const ua = Number(p.capacidade_ua || 0);
                const matchesUA = ua >= filterValues.minUA && ua <= filterValues.maxUA;

                return matchesSearch && matchesTab && matchesStatus && matchesCapins && matchesArea && matchesUA;
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
                        <span>{p.area || 0} ha | {p.capacidade_ua || 0} UA Suportada</span>
                      </div>
                      <div className="meta-item">
                        <Activity size={14} className="meta-icon" />
                        <span>Pressão: {p.status === 'occupied' ? '85% (Equilibrada)' : '0% (Descanso)'}</span>
                      </div>
                      <div className="meta-item">
                        <Calendar size={14} className="meta-icon" />
                        <span>{p.status === 'occupied' ? 'Entrada: 12/05' : 'DDR: 14 dias'}</span>
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
          background: hsl(var(--bg-main));
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
          color: hsl(var(--text-muted));
          cursor: pointer;
          transition: 0.2s;
        }

        .view-btn.active {
          background: hsl(var(--bg-card));
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
          background: hsl(var(--bg-card));
          border-radius: 24px;
          border: 1px solid hsl(var(--border));
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
          background: hsl(var(--border-strong));
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
          transform: translateY(-8px);
          box-shadow: var(--shadow-lg);
          border-color: hsl(var(--brand) / 0.3);
        }

        .card-left-section {
          width: 130px;
          background: hsl(var(--bg-main) / 0.5);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-right: 1px solid hsl(var(--border));
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
          color: hsl(var(--text-main));
          margin-bottom: 4px;
          letter-spacing: -0.02em;
        }

        .card-role-badge {
          display: inline-block;
          font-size: 10px;
          font-weight: 800;
          color: #16a34a;
          background: hsl(var(--brand) / 0.1);
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
          color: hsl(var(--text-muted));
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
          border: 1px solid hsl(var(--border));
          background: hsl(var(--bg-card));
          color: hsl(var(--text-muted));
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
        title={`Animais no Pasto: ${pastureToView?.nome}`}
        filterField="pasto_id"
        filterValue={pastureToView?.id}
      />

    </div>
  );
};
