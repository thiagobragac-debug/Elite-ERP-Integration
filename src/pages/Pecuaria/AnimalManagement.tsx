import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Tag, 
  Scale, 
  Activity, 
  Beef, 
  TrendingUp, 
  Trash2,
  Search,
  Filter,
  Eye,
  ChevronRight,
  FileText,
  Edit3,
  LayoutGrid,
  List as ListIcon,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimalForm } from '../../components/Forms/AnimalForm';
import { HistoryModal } from '../../components/Modals/HistoryModal';
import { AnimalFilterModal } from './components/AnimalFilterModal';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { EliteStatCard } from '../../components/Cards/EliteStatCard';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { GlobalModeBanner } from '../../components/GlobalMode/GlobalModeBanner';
import { formatNumber } from '../../utils/format';
import { useSearchParams } from 'react-router-dom';

export const AnimalManagement: React.FC = () => {
  const { activeFarm, isGlobalMode, activeFarmId, applyFarmFilter, canCreate, insertPayload } = useFarmFilter();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [animals, setAnimals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnimal, setSelectedAnimal] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'TODOS' | 'ATIVO' | 'ABATIDO'>('TODOS');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterValues, setFilterValues] = useState({
    status: 'all',
    sexo: 'all',
    lote: 'all',
    racas: [],
    minWeight: 0,
    sanidadeOk: true
  });
  const [stats, setStats] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');

  useEffect(() => {
    if (!activeFarmId && !isGlobalMode) return;
    fetchAnimals();
  }, [activeFarmId, isGlobalMode]);

  const [searchParams] = useSearchParams();

  // Deep Linking: Abre o animal automaticamente se vier com ?id=
  useEffect(() => {
    const id = searchParams.get('id');
    if (id && animals.length > 0) {
      const animal = animals.find(a => a.id === id);
      if (animal) {
        handleOpenEdit(animal);
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [searchParams, animals]);

  const fetchAnimals = async () => {
    setLoading(true);
    let query = supabase.from('animais').select('*').order('created_at', { ascending: false });
    query = applyFarmFilter(query);
    const { data } = await query;
    
    if (data) {
      setAnimals(data);
      
      const totalAnimals = data.length;
      const activeAnimals = data.filter(a => a.status === 'Ativo').length;
      const avgWeight = data.reduce((acc, curr) => acc + (Number(curr.peso_atual || curr.peso_inicial) || 0), 0) / (totalAnimals || 1);
      
      const avgGmd = data.reduce((acc, curr) => {
        const weightDiff = (curr.peso_atual || curr.peso_inicial) - curr.peso_inicial;
        const days = Math.max(1, Math.floor((new Date().getTime() - new Date(curr.created_at).getTime()) / (1000 * 60 * 60 * 24)));
        return acc + (weightDiff / days);
      }, 0) / (totalAnimals || 1);
      
      setStats([
        { 
          label: 'Total Rebanho', 
          value: String(totalAnimals), 
          icon: Beef, 
          color: '#10b981', 
          progress: 100,
          change: `${activeAnimals} ativos`,
          periodLabel: 'Censo Atual',
          sparkline: [
            { value: 40, label: 'Jan' }, { value: 45, label: 'Fev' }, { value: 50, label: 'Mar' }, 
            { value: 60, label: 'Abr' }, { value: 55, label: 'Mai' }, { value: 70, label: 'Jun' }, 
            { value: 75, label: 'Jul' }, { value: 85, label: 'Hoje' }
          ]
        },
        { 
          label: 'Peso Médio', 
          value: `${formatNumber(avgWeight)} kg`, 
          icon: Scale, 
          color: '#3b82f6', 
          progress: 65,
          change: '+2.4kg/mês',
          periodLabel: 'Média do Plantel',
          sparkline: [
            { value: 30, label: '420kg' }, { value: 35, label: '425kg' }, { value: 40, label: '430kg' }, 
            { value: 50, label: '440kg' }, { value: 55, label: '445kg' }, { value: 60, label: '450kg' }, 
            { value: 65, label: '455kg' }, { value: 70, label: avgWeight.toFixed(0) + 'kg' }
          ]
        },
        { 
          label: 'GMD Médio', 
          value: `${avgGmd.toFixed(3)} kg`, 
          icon: TrendingUp, 
          color: '#f59e0b', 
          progress: 80,
          change: 'Meta: 1.0kg',
          periodLabel: 'Ganho Diário',
          sparkline: [
            { value: 60, label: '0.6kg' }, { value: 65, label: '0.65kg' }, { value: 70, label: '0.7kg' }, 
            { value: 75, label: '0.75kg' }, { value: 80, label: '0.8kg' }, { value: 85, label: '0.85kg' }, 
            { value: 82, label: '0.82kg' }, { value: 80, label: '0.8kg' }
          ]
        },
        { 
          label: 'Sanidade Ok', 
          value: '100%', 
          icon: Activity, 
          color: '#166534', 
          progress: 100,
          periodLabel: 'Status Sanitário',
          sparkline: [
            { value: 100, label: 'OK' }, { value: 100, label: 'OK' }, { value: 100, label: 'OK' }, 
            { value: 100, label: 'OK' }, { value: 100, label: 'OK' }, { value: 100, label: 'OK' }, 
            { value: 100, label: 'OK' }, { value: 100, label: 'OK' }
          ]
        },
      ]);
    }
    setLoading(false);
  };

  const handleOpenCreate = () => {
    setSelectedAnimal(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (animal: any) => {
    setSelectedAnimal(animal);
    setIsModalOpen(true);
  };

  const handleSubmit = async (formData: any) => {
    if (!canCreate && !selectedAnimal) {
      alert('⚠️ Selecione uma unidade específica para registrar um novo animal. No modo Visão Global, a fazenda de origem deve ser definida.');
      return;
    }

    const payload = {
      brinco: formData.brinco,
      raca: formData.raca,
      sexo: formData.sexo,
      data_nascimento: formData.data_nascimento,
      lote_id: formData.lote_id,
      status: formData.status || 'Ativo',
      peso_inicial: parseFloat(formData.peso_inicial) || 0,
      pelagem: formData.pelagem,
      origem: formData.origem,
      mae_brinco: formData.mae_brinco,
      pai_brinco: formData.pai_brinco,
      valor_compra: parseFloat(formData.valor_compra) || 0,
      categoria: formData.categoria,
      finalidade: formData.finalidade
    };

    if (selectedAnimal) {
      const { error } = await supabase
        .from('animais')
        .update(payload)
        .eq('id', selectedAnimal.id);
      
      if (!error) {
        setIsModalOpen(false);
        fetchAnimals();
      }
    } else {
      const { error } = await supabase.from('animais').insert([{
        ...payload,
        ...insertPayload
      }]);

      if (!error) {
        setIsModalOpen(false);
        fetchAnimals();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este animal?')) return;
    const { error } = await supabase.from('animais').delete().eq('id', id);
    if (!error) fetchAnimals();
  };

  const tableColumns = [
    { 
      header: 'Brinco / Identificação', 
      accessor: (item: any) => (
        <div className="table-cell-title">
          <div className="title-with-badge">
            <span className="main-text">#{item.brinco}</span>
            {item.status === 'Ativo' && (item.peso_atual || item.peso_inicial) > 550 && (
              <span className="mini-badge warning">PRONTO</span>
            )}
          </div>
          <div className="sub-meta">
            <Tag size={12} />
            <span>{item.raca} | {item.sexo}</span>
          </div>
        </div>
      )
    },
    { 
      header: 'Performance', 
      accessor: (item: any) => {
        const weight = item.peso_atual || item.peso_inicial || 0;
        const gain = weight - (item.peso_inicial || 0);
        return (
          <div className="table-cell-meta">
            <div className="meta-main">
              <Scale size={16} color="hsl(var(--brand))" />
              <span>{weight} kg</span>
            </div>
            <span className={`meta-sub ${gain >= 0 ? 'text-success' : 'text-danger'}`}>
              {gain >= 0 ? '+' : ''}{gain}kg total
            </span>
          </div>
        );
      }
    },
    { 
      header: 'Segurança', 
      accessor: (item: any) => (
        <div className="status-indicator-group">
          <div className={`status-dot ${item.status === 'Ativo' ? 'success' : 'neutral'}`}></div>
          <span className="status-text">{item.status.toUpperCase()}</span>
          {/* Alerta de Carência Sanitária (Simulado) */}
          {item.id.includes('7') && (
            <div className="alert-icon-mini" title="Período de Carência Ativo">
              <Activity size={14} color="#ef4444" />
            </div>
          )}
        </div>
      ),
      align: 'center' as const
    }
  ];

  return (
    <div className="animal-mgmt-page animate-slide-up">
      <GlobalModeBanner />
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge">
            <Beef size={14} fill="currentColor" />
            <span>ELITE LIVESTOCK v5.0</span>
          </div>
          <h1 className="page-title">Gestão do Rebanho</h1>
          <p className="page-subtitle">Inventário individualizado e controle de ativos biológicos em tempo real.</p>
        </div>
        <div className="page-actions">
          <button className="glass-btn secondary" onClick={() => navigate('/pecuaria/lote')}>
            <Tag size={18} />
            Lotes
          </button>
          <button className="primary-btn" onClick={handleOpenCreate}>
            <Plus size={18} />
            Novo Animal
          </button>
        </div>
      </header>

      <div className="next-gen-kpi-grid">
        {loading ? (
          Array(4).fill(0).map((_, i) => <EliteStatCard key={i} loading={true} label="" value="" icon={Beef} color="" />)
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
            className={`elite-tab-item ${activeTab === 'TODOS' ? 'active' : ''}`}
            onClick={() => setActiveTab('TODOS')}
          >
            Todos Animais
          </button>
          <button 
            className={`elite-tab-item ${activeTab === 'ATIVO' ? 'active' : ''}`}
            onClick={() => setActiveTab('ATIVO')}
          >
            Ativos
          </button>
          <button 
            className={`elite-tab-item ${activeTab === 'ABATIDO' ? 'active' : ''}`}
            onClick={() => setActiveTab('ABATIDO')}
          >
            Abatidos
          </button>
        </div>

        <div className="elite-search-wrapper">
          <Search size={18} className="s-icon" />
          <input 
            type="text" 
            className="elite-search-input"
            placeholder="Filtrar por brinco, raça ou lote..." 
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

      <AnimalFilterModal 
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filters={filterValues}
        setFilters={setFilterValues}
      />

      <div className="management-content">
        {viewMode === 'list' ? (
          <ModernTable 
            data={animals.filter(a => {
              const matchesSearch = (a.brinco || '').toLowerCase().includes(searchTerm.toLowerCase());
              const matchesTab = activeTab === 'TODOS' || a.status?.toUpperCase() === activeTab;
              const matchesStatus = filterValues.status === 'all' || a.status === filterValues.status;
              const matchesSexo = filterValues.sexo === 'all' || a.sexo === filterValues.sexo;
              const matchesLote = filterValues.lote === 'all' || (a.lotes?.nome || '').toLowerCase().includes(filterValues.lote.toLowerCase());
              const matchesRaca = filterValues.racas.length === 0 || filterValues.racas.includes(a.raca);
              const matchesWeight = (a.peso_atual || a.peso_inicial || 0) >= filterValues.minWeight;
              
              return matchesSearch && matchesTab && matchesStatus && matchesSexo && matchesLote && matchesRaca && matchesWeight;
            })}
            columns={tableColumns}
            loading={loading}
            hideHeader={true}
            searchPlaceholder="Filtrar por brinco, raça ou lote..."
            actions={(item) => (
              <div className="modern-actions">
                <button className="action-dot info" onClick={() => navigate(`/pecuaria/animal/${item.id}`)} title="Detalhes & Histórico">
                  <Eye size={18} />
                </button>
                <button className="action-dot success" title="Manejos">
                  <Activity size={18} />
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
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="user-cards-grid"
          >
            {animals
              .filter(a => {
                const matchesSearch = (a.brinco || '').toLowerCase().includes(searchTerm.toLowerCase());
                const matchesTab = activeTab === 'TODOS' || a.status?.toUpperCase() === activeTab;
                const matchesStatus = filterValues.status === 'all' || a.status === filterValues.status;
                const matchesSexo = filterValues.sexo === 'all' || a.sexo === filterValues.sexo;
                const matchesLote = filterValues.lote === 'all' || (a.lotes?.nome || '').toLowerCase().includes(filterValues.lote.toLowerCase());
                const matchesRaca = filterValues.racas.length === 0 || filterValues.racas.includes(a.raca);
                const matchesWeight = (a.peso_atual || a.peso_inicial || 0) >= filterValues.minWeight;
                
                return matchesSearch && matchesTab && matchesStatus && matchesSexo && matchesLote && matchesRaca && matchesWeight;
              })
              .map(a => (
                <motion.div 
                  key={a.id} 
                  layout
                  className={`user-card-premium ${a.status === 'Ativo' ? 'active' : ''}`}
                >
                  <div className="card-left-section">
                    <div className="card-avatar">
                      <Beef size={32} />
                    </div>
                    <div className="card-bottom-actions">
                      <button className="action-icon-btn" onClick={() => navigate(`/pecuaria/animal/${a.id}`)} title="Dossiê"><Eye size={16} /></button>
                      <button className="action-icon-btn" onClick={() => handleOpenEdit(a)} title="Editar"><Edit3 size={16} /></button>
                      <button className="action-icon-btn delete" onClick={() => handleDelete(a.id)} title="Excluir"><Trash2 size={16} /></button>
                    </div>
                  </div>

                  <div className="card-main-content">
                    <div className="card-header-info">
                      <h3>#{a.brinco}</h3>
                      <span className="card-role-badge">{a.raca || 'Nelorado'}</span>
                    </div>

                    <div className="card-meta-grid">
                      <div className="meta-item">
                        <Scale size={14} className="meta-icon" />
                        <span>{a.peso_atual || a.peso_inicial || 0} kg</span>
                      </div>
                      <div className="meta-item">
                        <Activity size={14} className="meta-icon" />
                        <span>Status: {a.status}</span>
                      </div>
                      <div className="meta-item">
                        <Calendar size={14} className="meta-icon" />
                        <span>Sexo: {a.sexo === 'M' ? 'Macho' : 'Fêmea'}</span>
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
          color: hsl(var(--brand));
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
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
          background: hsl(var(--bg-main));
          color: hsl(var(--text-main));
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          font-weight: 900;
          margin-bottom: 12px;
          box-shadow: 0 10px 20px rgba(0,0,0,0.2);
          border: 1px solid hsl(var(--border));
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
          color: hsl(var(--brand));
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
          color: hsl(var(--brand));
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
          background: hsl(var(--brand));
          color: white;
          transform: scale(1.1);
          border-color: hsl(var(--brand));
        }

        .action-icon-btn.delete:hover {
          background: #ef4444;
          border-color: #ef4444;
          color: white;
        }

        .title-with-badge {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .mini-badge {
          font-size: 9px;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 800;
        }

        .mini-badge.warning {
          background: #fef3c7;
          color: #d97706;
          border: 1px solid #fcd34d;
        }

        .status-indicator-group {
          display: flex;
          align-items: center;
          gap: 8px;
          justify-content: center;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .status-dot.success { background: #10b981; box-shadow: 0 0 8px rgba(16, 185, 129, 0.5); }
        .status-dot.neutral { background: #94a3b8; }

        .alert-icon-mini {
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }

        .meta-main {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 700;
          color: hsl(var(--text-main));
        }

        .meta-sub {
          font-size: 11px;
          font-weight: 600;
          margin-left: 22px;
        }
      `}</style>

      <AnimalForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleSubmit}
        initialData={selectedAnimal}
      />
    </div>
  );
};
