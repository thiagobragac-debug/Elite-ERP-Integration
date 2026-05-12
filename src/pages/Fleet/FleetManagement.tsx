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
  List as ListIcon,
  DollarSign,
  Zap,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/export';
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
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { GlobalModeBanner } from '../../components/GlobalMode/GlobalModeBanner';
import { FleetFilterModal } from './components/FleetFilterModal';

export const FleetManagement: React.FC = () => {
  const { activeFarm, isGlobalMode, activeFarmId, applyFarmFilter, canCreate, insertPayload } = useFarmFilter();
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
    marcas: [],
    minUsage: 0,
    maxUsage: 10000,
    minYear: '',
    maxYear: ''
  });
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');

  useEffect(() => {
    if (!activeFarmId && !isGlobalMode) return;
    fetchMachines();
  }, [activeFarmId, isGlobalMode]);

  const fetchMachines = async () => {
    setLoading(true);
    try {
      let query = supabase.from('maquinas').select('*').order('nome', { ascending: true });
      query = applyFarmFilter(query);
      const { data } = await query;
      
      if (data) {
        setMachines(data);
        const total = data.length;
        const emManutencao = data.filter(m => m.status === 'maintenance').length;
        const emOperacao = data.filter(m => m.status === 'active').length;
        
        const avgEfficiency = 14.2; // L/h
        const avgTCO = 184.50; // R$/h

        setStats([
          { 
            label: 'Frota Operacional', 
            value: total, 
            icon: Truck, 
            color: 'hsl(var(--brand))', 
            progress: 100,
            change: `${total} ativos`,
            periodLabel: 'Frota Geral',
            sparkline: [{ value: 95 }, { value: 98 }, { value: 100 }]
          },
          { 
            label: 'Custos Mecânicos', 
            value: `R$ ${avgTCO.toFixed(2)}/h`, 
            icon: DollarSign, 
            color: '#ef4444', 
            progress: 85,
            trend: 'up',
            change: '+1.2%',
            periodLabel: 'TCO (Avg/h)',
            sparkline: [{ value: 170 }, { value: 180 }, { value: 184.5 }]
          },
          { 
            label: 'Eficiência Diesel', 
            value: `${avgEfficiency} L/h`, 
            icon: Activity, 
            color: '#f59e0b', 
            progress: 72,
            trend: 'down',
            change: '-2.5%',
            periodLabel: 'Consumo Médio',
            sparkline: [{ value: 15.5 }, { value: 14.8 }, { value: 14.2 }]
          },
          { 
            label: 'Disponibilidade', 
            value: `${((emOperacao / (total || 1)) * 100).toFixed(1)}%`, 
            icon: AlertCircle, 
            color: '#10b981', 
            progress: (emOperacao / (total || 1)) * 100, 
            trend: 'up',
            change: 'Operacional',
            periodLabel: 'Uptime Real',
            sparkline: [{ value: 85 }, { value: 88 }, { value: 92 }]
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
    if (!canCreate && !selectedMachine) {
      alert('⚠️ Selecione uma unidade específica para cadastrar um novo ativo. No modo Visão Global, a fazenda proprietária deve ser definida.');
      return;
    }
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
      potencia: parseInt(formData.potencia) || 0,
      peso_operacional: parseInt(formData.peso_operacional) || 0,
      intervalo_revisao: parseInt(formData.intervalo_revisao) || 250,
      consumo_estimado: parseFloat(formData.consumo_estimado) || 0,
      data_proxima_revisao: formData.data_proxima_revisao || null,
      observacoes: formData.observacoes
    };

    if (selectedMachine) {
      const { error } = await supabase.from('maquinas').update(payload).eq('id', selectedMachine.id);
      if (!error) { setIsModalOpen(false); fetchMachines(); }
    } else {
      const { error } = await supabase.from('maquinas').insert([{ ...payload, ...insertPayload }]);
      if (!error) { setIsModalOpen(false); fetchMachines(); }
    }
  };

  const handleMaintenanceSubmit = async (data: any) => {
    if (!canCreate) {
      alert('⚠️ Selecione uma unidade específica para registrar uma manutenção. No modo Visão Global, a fazenda deve ser definida.');
      return;
    }
    const { error } = await supabase.from('manutencoes').insert([{
      ...data,
      ...insertPayload
    }]);
    if (!error) {
      setIsMaintenanceModalOpen(false);
      fetchMachines();
    }
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const filteredData = machines.filter(m => {
      const matchesSearch = (
        (m.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (m.placa || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (m.modelo || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
      const matchesCategory = activeCategory === 'All' || m.categoria === activeCategory;
      const matchesStatus = filterValues.status === 'all' || m.status === filterValues.status;
      const matchesMarcas = filterValues.marcas.length === 0 || (m.marca && filterValues.marcas.includes(m.marca));
      
      const currentUsage = m.horimetro_atual || m.quilometragem_atual || 0;
      const matchesUsage = currentUsage >= filterValues.minUsage && currentUsage <= filterValues.maxUsage;
      
      const machineYear = m.ano || 0;
      const matchesYear = (!filterValues.minYear || machineYear >= parseInt(filterValues.minYear)) &&
                         (!filterValues.maxYear || machineYear <= parseInt(filterValues.maxYear));

      return matchesSearch && matchesCategory && matchesStatus && matchesMarcas && matchesUsage && matchesYear;
    });

    const exportData = filteredData.map(item => ({
      Nome: item.nome,
      Categoria: item.categoria,
      Marca: item.marca || '-',
      Modelo: item.modelo || '-',
      Ano: item.ano || '-',
      Placa: item.placa || '-',
      Uso_Atual: item.horimetro_atual ? `${item.horimetro_atual}h` : item.quilometragem_atual ? `${item.quilometragem_atual}km` : '0',
      Status: item.status === 'active' ? 'Em Campo' : item.status === 'maintenance' ? 'Manutenção' : 'Parado',
      Combustivel: item.combustivel || '-'
    }));

    if (format === 'csv') exportToCSV(exportData, 'frota_veiculos');
    else if (format === 'excel') exportToExcel(exportData, 'frota_veiculos');
    else if (format === 'pdf') exportToPDF(exportData, 'frota_veiculos', 'Relatório de Frota e Maquinários');
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
          <LayoutGrid size={14} />
          <span>{item.categoria}</span>
        </div>
      )
    },
    {
      header: 'Uso Atual',
      accessor: (item: any) => (
        <div className="table-cell-meta">
          <Gauge size={14} />
          <span>{item.horimetro_atual ? `${item.horimetro_atual}h` : item.quilometragem_atual ? `${item.quilometragem_atual}km` : '0'}</span>
        </div>
      )
    },
    {
      header: 'Eficiência',
      accessor: (item: any) => (
        <div className="table-cell-meta">
          <Fuel size={14} />
          <span className="font-bold">{item.consumo_estimado ? `${item.consumo_estimado} L/h` : '14.2 L/h'}</span>
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
      <GlobalModeBanner />
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
          <div className="export-dropdown-container">
            <button 
              className="icon-btn-secondary" 
              title="Exportar"
              onClick={() => {
                const menu = document.getElementById('export-menu-fleet');
                if (menu) menu.classList.toggle('active');
              }}
            >
              <FileText size={20} />
            </button>
            <div id="export-menu-fleet" className="export-menu">
              <button onClick={() => { handleExport('csv'); document.getElementById('export-menu-fleet')?.classList.remove('active'); }}>CSV</button>
              <button onClick={() => { handleExport('excel'); document.getElementById('export-menu-fleet')?.classList.remove('active'); }}>Excel (.xlsx)</button>
              <button onClick={() => { handleExport('pdf'); document.getElementById('export-menu-fleet')?.classList.remove('active'); }}>PDF Profissional</button>
            </div>
          </div>
        </div>
      </div>

      <FleetFilterModal 
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filters={filterValues}
        setFilters={setFilterValues}
      />

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
              const matchesSearch = (
                (m.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                (m.placa || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                (m.modelo || '').toLowerCase().includes(searchTerm.toLowerCase())
              );
              const matchesCategory = activeCategory === 'All' || m.categoria === activeCategory;
              const matchesStatus = filterValues.status === 'all' || m.status === filterValues.status;
              const matchesMarcas = filterValues.marcas.length === 0 || (m.marca && filterValues.marcas.includes(m.marca));
              
              const currentUsage = m.horimetro_atual || m.quilometragem_atual || 0;
              const matchesUsage = currentUsage >= filterValues.minUsage && currentUsage <= filterValues.maxUsage;
              
              const machineYear = m.ano || 0;
              const matchesYear = (!filterValues.minYear || machineYear >= parseInt(filterValues.minYear)) &&
                                 (!filterValues.maxYear || machineYear <= parseInt(filterValues.maxYear));

              return matchesSearch && matchesCategory && matchesStatus && matchesMarcas && matchesUsage && matchesYear;
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
                const matchesSearch = (
                  (m.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                  (m.placa || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                  (m.modelo || '').toLowerCase().includes(searchTerm.toLowerCase())
                );
                const matchesCategory = activeCategory === 'All' || m.categoria === activeCategory;
                const matchesStatus = filterValues.status === 'all' || m.status === filterValues.status;
                const matchesMarcas = filterValues.marcas.length === 0 || (m.marca && filterValues.marcas.includes(m.marca));
                
                const currentUsage = m.horimetro_atual || m.quilometragem_atual || 0;
                const matchesUsage = currentUsage >= filterValues.minUsage && currentUsage <= filterValues.maxUsage;
                
                const machineYear = m.ano || 0;
                const matchesYear = (!filterValues.minYear || machineYear >= parseInt(filterValues.minYear)) &&
                                   (!filterValues.maxYear || machineYear <= parseInt(filterValues.maxYear));

                return matchesSearch && matchesCategory && matchesStatus && matchesMarcas && matchesUsage && matchesYear;
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
                        <Zap size={14} className="meta-icon" style={{ color: '#8b5cf6' }} />
                        <span>{m.potencia ? `${m.potencia}cv` : 'Potência N/D'} • {m.peso_operacional ? `${(m.peso_operacional/1000).toFixed(1)}t` : 'N/D'}</span>
                      </div>
                      <div className="maintenance-countdown-elite">
                        <div className="countdown-header">
                          <Clock size={12} />
                          <span>Próxima Revisão</span>
                        </div>
                        {(() => {
                          const current = m.horimetro_atual || 0;
                          const interval = m.intervalo_revisao || 250;
                          const remaining = interval - (current % interval);
                          const progress = ((interval - remaining) / (interval || 1)) * 100;
                          return (
                            <div className="countdown-progress-wrapper">
                              <div className="progress-bar-bg">
                                <motion.div 
                                  className="progress-bar-fill" 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${progress}%` }}
                                  style={{ backgroundColor: progress > 85 ? '#ef4444' : progress > 60 ? '#f59e0b' : '#10b981' }}
                                />
                              </div>
                              <span className="countdown-text">{remaining}h restantes</span>
                            </div>
                          );
                        })()}
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
          height: auto;
          min-height: 200px;
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

        .maintenance-countdown-elite {
          margin-top: 12px;
          padding: 12px;
          background: hsl(var(--bg-main));
          border-radius: 12px;
          border: 1px solid hsl(var(--border));
        }

        .countdown-header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          font-weight: 800;
          color: hsl(var(--text-muted));
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 8px;
        }

        .countdown-progress-wrapper {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .progress-bar-bg {
          height: 6px;
          background: hsl(var(--border));
          border-radius: 3px;
          overflow: hidden;
        }

        .progress-bar-fill {
          height: 100%;
          border-radius: 3px;
        }

        .countdown-text {
          font-size: 11px;
          font-weight: 800;
          color: hsl(var(--text-main));
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
