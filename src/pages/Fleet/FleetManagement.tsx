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
  Layout
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
          Array(4).fill(0).map((_, i) => <EliteStatCard key={i} loading={true} label="" value="" icon={Truck} color="" />)
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
        <ModernTable 
          data={machines.filter(m => {
            const matchesSearch = (m.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || m.placa?.toLowerCase().includes(searchTerm.toLowerCase()) || m.modelo?.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesCategory = activeCategory === 'All' || m.categoria === activeCategory;
            
            // Advanced Filters
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
      </div>

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
