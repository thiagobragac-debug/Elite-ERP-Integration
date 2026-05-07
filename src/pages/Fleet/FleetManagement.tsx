import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Truck, 
  Plus, 
  Search, 
  Filter,
  AlertCircle, 
  ChevronRight, 
  Wrench,
  Fuel,
  Activity,
  Calendar,
  Trash2,
  Edit3,
  History,
  FileText,
  Gauge,
  LayoutGrid,
  List as ListIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { MachineForm } from '../../components/Forms/MachineForm';
import { MaintenanceForm } from '../../components/Forms/MaintenanceForm';
import { HistoryModal } from '../../components/Modals/HistoryModal';
import { EliteStatCard } from '../../components/Cards/EliteStatCard';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { formatNumber } from '../../utils/format';
import { KPISkeleton } from '../../components/Feedback/Skeleton';
import { EmptyState } from '../../components/Feedback/EmptyState';

export const FleetManagement: React.FC = () => {
  const { activeFarm } = useTenant();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [machines, setMachines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<any>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyTitle, setHistoryTitle] = useState('');
  const [stats, setStats] = useState<any[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterValues, setFilterValues] = useState({
    status: 'all',
    marca: 'all'
  });
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');

  useEffect(() => {
    if (!activeFarm) return;
    fetchMachines();
  }, [activeFarm]);

  const fetchMachines = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('maquinas')
        .select('*')
        .eq('fazenda_id', activeFarm.id)
        .order('nome', { ascending: true });
      
      if (data) {
        setMachines(data);
        const total = data.length;
        const emManutencao = data.filter(m => m.status === 'maintenance').length;
        const emOperacao = data.filter(m => m.status === 'active').length;
        const criticos = data.filter(m => m.status === 'stopped').length;
        
        setStats([
          { 
            label: 'Frota Operacional', 
            value: total, 
            icon: Truck, 
            color: 'hsl(var(--brand))', 
            progress: 100,
            change: `${total} cadastradas`,
            periodLabel: 'Frota Geral',
            sparkline: [
              { value: 90, label: '90' }, { value: 92, label: '92' }, { value: 95, label: '95' }, 
              { value: 94, label: '94' }, { value: 96, label: '96' }, { value: 98, label: '98' }, 
              { value: 100, label: '100' }, { value: 100, label: total.toString() }
            ]
          },
          { 
            label: 'Unidades em Campo', 
            value: emOperacao, 
            icon: Activity, 
            color: '#10b981', 
            progress: (emOperacao / (total || 1)) * 100,
            change: 'Disponibilidade',
            periodLabel: 'Status Realtime',
            sparkline: [
              { value: 70, label: '70%' }, { value: 75, label: '75%' }, { value: 80, label: '80%' }, 
              { value: 85, label: '85%' }, { value: 82, label: '82%' }, { value: 88, label: '88%' }, 
              { value: 90, label: '90%' }, { value: (emOperacao / (total || 1)) * 100, label: emOperacao + ' em campo' }
            ]
          },
          { 
            label: 'Manutenção', 
            value: emManutencao, 
            icon: Wrench, 
            color: '#f59e0b', 
            progress: (emManutencao / (total || 1)) * 100,
            change: 'Preventiva/Corretiva',
            periodLabel: 'Oficina 30d',
            sparkline: [
              { value: 10, label: '1' }, { value: 15, label: '2' }, { value: 5, label: '0' }, 
              { value: 20, label: '3' }, { value: 12, label: '2' }, { value: 10, label: '1' }, 
              { value: 15, label: '2' }, { value: (emManutencao / (total || 1)) * 100, label: emManutencao + ' na oficina' }
            ]
          },
          { 
            label: 'Indisponibilidade', 
            value: criticos, 
            icon: AlertCircle, 
            color: '#ef4444', 
            progress: (criticos / (total || 1)) * 100, 
            trend: 'up',
            change: 'Crítico/Parado',
            periodLabel: 'Imobilizado',
            sparkline: [
              { value: 5, label: '0' }, { value: 8, label: '1' }, { value: 10, label: '1' }, 
              { value: 5, label: '0' }, { value: 15, label: '2' }, { value: 8, label: '1' }, 
              { value: 12, label: '2' }, { value: (criticos / (total || 1)) * 100, label: criticos + ' parados' }
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
    setSelectedMachine(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (machine: any) => {
    setSelectedMachine(machine);
    setIsModalOpen(true);
  };

  const handleSubmit = async (formData: any) => {
    if (!activeFarm) return;
    const payload = {
      nome: formData.nome,
      marca: formData.marca,
      modelo: formData.modelo,
      categoria: formData.categoria,
      ano: parseInt(formData.ano),
      placa: formData.placa,
      horimetro_atual: parseFloat(formData.horimetro_inicial),
      quilometragem_atual: parseFloat(formData.quilometragem_inicial),
      status: formData.status,
      chassi: formData.chassi,
      combustivel: formData.combustivel,
      capacidade_tanque: parseFloat(formData.capacidade_tanque) || 0,
      valor_compra: parseFloat(formData.valor_compra) || 0,
      data_proxima_revisao: formData.data_proxima_revisao || null,
      observacoes: formData.observacoes
    };

    if (selectedMachine) {
      const { error } = await supabase.from('maquinas').update(payload).eq('id', selectedMachine.id);
      if (!error) { setIsModalOpen(false); fetchMachines(); }
    } else {
      const { error } = await supabase.from('maquinas').insert([{ ...payload, fazenda_id: activeFarm.id, tenant_id: activeFarm.tenantId }]);
      if (!error) { setIsModalOpen(false); fetchMachines(); }
    }
  };

  const handleMaintenanceSubmit = async (data: any) => {
    if (!activeFarm) return;
    const { error } = await supabase.from('manutencoes').insert([{
      ...data,
      fazenda_id: activeFarm.id,
      tenant_id: activeFarm.tenantId
    }]);
    if (!error) {
      setIsMaintenanceModalOpen(false);
      fetchMachines();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este ativo?')) return;
    const { error } = await supabase.from('maquinas').delete().eq('id', id);
    if (!error) fetchMachines();
  };

  const handleViewHistory = async (machine: any) => {
    setHistoryTitle(`Histórico: ${machine.nome}`);
    setIsHistoryModalOpen(true);
    setHistoryLoading(true);
    setTimeout(() => {
      setHistoryItems([
        { id: '1', date: new Date().toISOString(), title: 'Manutenção Corretiva', subtitle: 'Troca de óleo e filtros', value: 'R$ 1.250,00', status: 'success' },
        { id: '2', date: new Date(Date.now() - 86400000 * 5).toISOString(), title: 'Abastecimento', subtitle: '450 litros (Diesel S10)', value: 'R$ 2.700,00', status: 'info' },
        { id: '3', date: new Date(Date.now() - 86400000 * 15).toISOString(), title: 'Revisão Preventiva', subtitle: 'Checklist 250 horas', value: 'Concluído', status: 'success' },
      ]);
      setHistoryLoading(false);
    }, 800);
  };

  const columns = [
    {
      header: 'Ativo',
      accessor: (item: any) => (
        <div className="table-cell-title">
          <span className="main-text">{item.nome}</span>
          <div className="sub-meta uppercase font-bold text-[10px] tracking-wider">
            {item.placa || item.modelo || 'N/A'}
          </div>
        </div>
      )
    },
    {
      header: 'Categoria',
      accessor: (item: any) => (
        <div className="table-cell-meta">
          <Layout size={14} />
          <span>{item.categoria}</span>
        </div>
      )
    },
    {
      header: 'Telemetria',
      accessor: (item: any) => (
        <div className="table-cell-meta">
          <Gauge size={14} />
          <span>{item.horimetro_atual ? `${item.horimetro_atual}h` : item.quilometragem_atual ? `${item.quilometragem_atual}km` : '0'}</span>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: (item: any) => (
        <span className={`status-pill ${item.status === 'active' ? 'active' : item.status === 'maintenance' ? 'warning' : 'stopped'}`}>
          {item.status === 'active' ? 'Em Campo' : item.status === 'maintenance' ? 'Manutenção' : 'Parado'}
        </span>
      ),
      align: 'center' as const
    }
  ];

  const categories = ['All', 'Trator', 'Caminhão', 'Implemento', 'Picape', 'Máquina'];

  return (
    <div className="fleet-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge">
            <Truck size={14} fill="currentColor" />
            <span>ELITE FLEET v5.0</span>
          </div>
          <h1 className="page-title">Gestão de Frota</h1>
          <p className="page-subtitle">Telemetria de ativos, controle de manutenção e eficiência operacional do maquinário em tempo real.</p>
        </div>
        <div className="page-actions">
          <button className="glass-btn secondary" onClick={() => setIsMaintenanceModalOpen(true)}>
            <Gauge size={18} />
            CHECKLIST
          </button>
          <button className="primary-btn" onClick={handleOpenCreate}>
            <Plus size={18} />
            NOVO ATIVO
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
          {categories.map(cat => (
            <button 
              key={cat}
              className={`elite-tab-item ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat === 'All' ? 'Todos Ativos' : cat}
            </button>
          ))}
        </div>

        <div className="elite-search-wrapper">
          <Search size={18} className="s-icon" />
          <input 
            type="text" 
            className="elite-search-input"
            placeholder="Pesquisar por modelo ou placa..." 
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
          <button className="icon-btn-secondary" title="Exportar Frota">
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
                <label className="elite-label">Status de Operação</label>
                <select 
                  className="elite-input elite-select"
                  value={filterValues.status}
                  onChange={(e) => setFilterValues({...filterValues, status: e.target.value})}
                >
                  <option value="all">Todos os Status</option>
                  <option value="active">Em Campo</option>
                  <option value="maintenance">Manutenção</option>
                  <option value="stopped">Parado</option>
                </select>
              </div>
              <div className="filter-field">
                <label className="elite-label">Marca / Fabricante</label>
                <select 
                  className="elite-input elite-select"
                  value={filterValues.marca}
                  onChange={(e) => setFilterValues({...filterValues, marca: e.target.value})}
                >
                  <option value="all">Todas as Marcas</option>
                  <option value="John Deere">John Deere</option>
                  <option value="Massey Ferguson">Massey Ferguson</option>
                  <option value="Case IH">Case IH</option>
                  <option value="New Holland">New Holland</option>
                  <option value="Toyota">Toyota</option>
                  <option value="Volkswagen">Volkswagen</option>
                </select>
              </div>
              <div className="filter-actions-inline">
                <button className="text-btn" onClick={() => setFilterValues({ status: 'all', marca: 'all' })}>
                  LIMPAR
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="management-content">
        {machines.length === 0 && !loading ? (
          <EmptyState
            title="Nenhum ativo cadastrado"
            description="A frota desta unidade ainda não possui ativos registrados. Cadastre o primeiro maquinário para iniciar o monitoramento telemetria."
            actionLabel="Novo Ativo"
            onAction={handleOpenCreate}
            icon={Truck}
          />
        ) : viewMode === 'list' ? (
          <ModernTable 
            data={machines.filter(m => {
              const matchesSearch = (m.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || m.placa?.toLowerCase().includes(searchTerm.toLowerCase()) || m.modelo?.toLowerCase().includes(searchTerm.toLowerCase()));
              const matchesCategory = activeCategory === 'All' || m.categoria === activeCategory;
              const matchesStatus = filterValues.status === 'all' || m.status === filterValues.status;
              const matchesMarca = filterValues.marca === 'all' || m.marca === filterValues.marca;
              return matchesSearch && matchesCategory && matchesStatus && matchesMarca;
            })}
            columns={columns}
            loading={loading}
            hideHeader={true}
            searchPlaceholder="Filtrar base de ativos..."
            actions={(item) => (
              <div className="modern-actions">
                <button className="action-dot info" onClick={() => handleViewHistory(item)} title="Logs">
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
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="user-cards-grid"
          >
            {machines
              .filter(m => {
                const matchesSearch = (m.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || m.placa?.toLowerCase().includes(searchTerm.toLowerCase()) || m.modelo?.toLowerCase().includes(searchTerm.toLowerCase()));
                const matchesCategory = activeCategory === 'All' || m.categoria === activeCategory;
                const matchesStatus = filterValues.status === 'all' || m.status === filterValues.status;
                const matchesMarca = filterValues.marca === 'all' || m.marca === filterValues.marca;
                return matchesSearch && matchesCategory && matchesStatus && matchesMarca;
              })
              .map(m => (
                <motion.div 
                  key={m.id} 
                  layout
                  className={`user-card-premium ${m.status === 'active' ? 'active' : m.status === 'maintenance' ? 'warning-badge' : 'danger-badge'}`}
                >
                  <div className="card-left-section">
                    <div className="card-avatar">
                      <Truck size={32} />
                    </div>
                    <div className="card-bottom-actions">
                      <button className="action-icon-btn" onClick={() => handleViewHistory(m)} title="Dossiê"><History size={16} /></button>
                      <button className="action-icon-btn" onClick={() => handleOpenEdit(m)} title="Editar"><Edit3 size={16} /></button>
                      <button className="action-icon-btn delete" onClick={() => handleDelete(m.id)} title="Excluir"><Trash2 size={16} /></button>
                    </div>
                  </div>

                  <div className="card-main-content">
                    <div className="card-header-info">
                      <h3>{m.nome}</h3>
                      <span className="card-role-badge">{m.categoria || 'Geral'}</span>
                    </div>

                    <div className="card-meta-grid">
                      <div className="meta-item">
                        <FileText size={14} className="meta-icon" />
                        <span>{m.placa || m.modelo || 'Sem placa'}</span>
                      </div>
                      <div className="meta-item">
                        <Gauge size={14} className="meta-icon" />
                        <span>{m.horimetro_atual ? `${m.horimetro_atual}h` : m.quilometragem_atual ? `${m.quilometragem_atual}km` : '0'}</span>
                      </div>
                      <div className="meta-item">
                        <Calendar size={14} className="meta-icon" />
                        <span>Próx. Revisão: {m.data_proxima_revisao ? new Date(m.data_proxima_revisao).toLocaleDateString() : 'N/D'}</span>
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
          border: 1px solid hsl(var(--border));
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
          box-shadow: var(--shadow-sm);
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
          background: #10b981;
          box-shadow: 4px 0 15px rgba(16, 185, 129, 0.3);
        }

        .user-card-premium.warning-badge::before {
          background: #f59e0b;
          box-shadow: 4px 0 15px rgba(245, 158, 11, 0.3);
        }

        .user-card-premium.danger-badge::before {
          background: #ef4444;
          box-shadow: 4px 0 15px rgba(239, 68, 68, 0.3);
        }

        .user-card-premium:hover {
          transform: translateX(8px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.08);
          border-color: #16a34a33;
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

      <MachineForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleSubmit}
        initialData={selectedMachine}
      />

      <MaintenanceForm 
        isOpen={isMaintenanceModalOpen}
        onClose={() => setIsMaintenanceModalOpen(false)}
        onSubmit={handleMaintenanceSubmit}
      />

      <HistoryModal 
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title={historyTitle}
        subtitle="Rastreabilidade completa de manutenções e intervenções"
        items={historyItems}
        loading={historyLoading}
      />
    </div>
  );
};
