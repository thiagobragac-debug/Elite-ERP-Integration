import React, { useState, useEffect } from 'react';
import { 
  Scale, 
  Plus, 
  Search, 
  Filter,
  TrendingUp, 
  History,
  Wifi,
  Trash2,
  Edit3,
  ChevronRight,
  Calendar,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { WeightForm } from '../../components/Forms/WeightForm';
import { HistoryModal } from '../../components/Modals/HistoryModal';
import { EliteStatCard } from '../../components/Cards/EliteStatCard';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { formatNumber } from '../../utils/format';
import { KPISkeleton } from '../../components/Feedback/Skeleton';
import { EmptyState } from '../../components/Feedback/EmptyState';

export const WeightManagement: React.FC = () => {
  const { activeFarm } = useTenant();
  const [searchTerm, setSearchTerm] = useState('');
  const [weighings, setWeighings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWeight, setSelectedWeight] = useState<any>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'RECENT' | 'PERFORMANCE'>('RECENT');
  const [stats, setStats] = useState<any[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterValues, setFilterValues] = useState({
    minWeight: '',
    maxWeight: '',
    dateStart: '',
    dateEnd: ''
  });

  useEffect(() => {
    if (!activeFarm) return;
    fetchWeighings();
  }, [activeFarm]);

  const fetchWeighings = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('pesagens')
      .select('*, animais(brinco)')
      .eq('fazenda_id', activeFarm.id)
      .order('data_pesagem', { ascending: false });
    
    if (data) {
      setWeighings(data);
      const totalPesagens = data.length;
      const pesoMedio = data.reduce((acc: number, curr: any) => acc + Number(curr.peso), 0) / (totalPesagens || 1);
      
      setStats([
        { label: 'Peso Médio Global', value: `${formatNumber(pesoMedio)} kg`, icon: Scale, color: '#10b981', progress: 65 },
        { label: 'Pesagens Realizadas', value: String(totalPesagens), icon: History, color: '#3b82f6', progress: 100 },
        { label: 'GMD Médio (Lote)', value: '0.850 kg', icon: TrendingUp, color: '#f59e0b', progress: 80 },
        { label: 'Status da Operação', value: 'Em Dia', icon: Wifi, color: '#166534', progress: 100 },
      ]);
    }
    setLoading(false);
  };

  const handleOpenCreate = () => {
    setSelectedWeight(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (w: any) => {
    setSelectedWeight(w);
    setIsModalOpen(true);
  };

  const handleSubmit = async (formData: any) => {
    if (!activeFarm) return;
    
    const payload = {
      animal_id: formData.animal_id,
      peso: parseFloat(formData.peso),
      data_pesagem: formData.data_pesagem,
      observacao: formData.observacao
    };

    if (selectedWeight) {
      const { error } = await supabase
        .from('pesagens')
        .update(payload)
        .eq('id', selectedWeight.id);
      
      if (!error) {
        setIsModalOpen(false);
        fetchWeighings();
      }
    } else {
      const { error } = await supabase.from('pesagens').insert([{
        ...payload,
        fazenda_id: activeFarm.id,
        tenant_id: activeFarm.tenantId
      }]);

      if (!error) {
        setIsModalOpen(false);
        fetchWeighings();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta pesagem?')) return;
    const { error } = await supabase.from('pesagens').delete().eq('id', id);
    if (!error) fetchWeighings();
  };

  const columns = [
    {
      header: 'Animal (Brinco)',
      accessor: (item: any) => (
        <div className="table-cell-title">
          <span className="main-text">#{item.animais?.brinco}</span>
          <div className="sub-meta uppercase font-bold text-[10px] tracking-wider">
            ID: {item.id?.slice(0, 8)}
          </div>
        </div>
      )
    },
    {
      header: 'Data Pesagem',
      accessor: (item: any) => (
        <div className="table-cell-meta">
          <Calendar size={14} />
          <span>{item.data_pesagem ? new Date(item.data_pesagem).toLocaleDateString() : 'N/A'}</span>
        </div>
      )
    },
    {
      header: 'Peso Atual',
      accessor: (item: any) => (
        <div className="table-cell-meta">
          <Scale size={14} />
          <span className="font-bold">{item.peso} kg</span>
        </div>
      )
    },
    {
      header: 'GMD Estimado',
      accessor: (item: any) => (
        <div className="flex items-center gap-2">
          <TrendingUp size={14} className="text-emerald-500" />
          <span className="text-emerald-600 font-bold">0.850 kg</span>
        </div>
      ),
      align: 'center' as const
    }
  ];

  return (
    <div className="weight-mgmt-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge">
            <Scale size={14} fill="currentColor" />
            <span>ELITE LIVESTOCK v5.0</span>
          </div>
          <h1 className="page-title">Controle de Pesagem</h1>
          <p className="page-subtitle">Monitoramento de ganho de peso individual e performance do lote em tempo real.</p>
        </div>
        <div className="page-actions">
          <button className="glass-btn secondary">
            <Wifi size={18} />
            CONFIGURAR BALANÇA
          </button>
          <button className="primary-btn" onClick={handleOpenCreate}>
            <Plus size={18} />
            NOVA PESAGEM
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
            change="+0.8%"
          />
        ))}
      </div>

      <div className="elite-controls-row">
        <div className="elite-tab-group">
          <button 
            className={`elite-tab-item ${activeTab === 'RECENT' ? 'active' : ''}`}
            onClick={() => setActiveTab('RECENT')}
          >
            Últimas Pesagens
          </button>
          <button 
            className={`elite-tab-item ${activeTab === 'PERFORMANCE' ? 'active' : ''}`}
            onClick={() => setActiveTab('PERFORMANCE')}
          >
            Performance do Lote
          </button>
        </div>

        <div className="elite-search-wrapper">
          <Search size={18} className="s-icon" />
          <input 
            type="text" 
            className="elite-search-input"
            placeholder="Pesquisar por brinco..." 
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
                <label className="elite-label">Peso Mínimo (kg)</label>
                <input 
                  className="elite-input"
                  type="number" 
                  placeholder="0"
                  value={filterValues.minWeight}
                  onChange={(e) => setFilterValues({...filterValues, minWeight: e.target.value})}
                />
              </div>
              <div className="filter-field">
                <label className="elite-label">Peso Máximo (kg)</label>
                <input 
                  className="elite-input"
                  type="number" 
                  placeholder="1000"
                  value={filterValues.maxWeight}
                  onChange={(e) => setFilterValues({...filterValues, maxWeight: e.target.value})}
                />
              </div>
              <div className="filter-field">
                <label className="elite-label">Data Inicial</label>
                <input 
                  className="elite-input"
                  type="date" 
                  value={filterValues.dateStart}
                  onChange={(e) => setFilterValues({...filterValues, dateStart: e.target.value})}
                />
              </div>
              <div className="filter-field">
                <label className="elite-label">Data Final</label>
                <input 
                  className="elite-input"
                  type="date" 
                  value={filterValues.dateEnd}
                  onChange={(e) => setFilterValues({...filterValues, dateEnd: e.target.value})}
                />
              </div>
              <div className="filter-actions-inline">
                <button className="text-btn" onClick={() => setFilterValues({ minWeight: '', maxWeight: '', dateStart: '', dateEnd: '' })}>
                  LIMPAR
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="management-content">
        {weighings.length === 0 && !loading ? (
          <EmptyState
            title="Nenhuma pesagem registrada"
            description="Ainda não há pesagens lançadas para esta unidade. Inicie o controle de GMD registrando a primeira pesagem do lote."
            actionLabel="Nova Pesagem"
            onAction={handleOpenCreate}
            icon={Scale}
          />
        ) : (
          <ModernTable 
            data={weighings.filter(w => {
              const matchesSearch = w.animais?.brinco?.toLowerCase().includes(searchTerm.toLowerCase());
              const matchesTab = activeTab === 'RECENT' ? true : Number(w.peso) > 400; 
              const matchesMinWeight = !filterValues.minWeight || Number(w.peso) >= Number(filterValues.minWeight);
              const matchesMaxWeight = !filterValues.maxWeight || Number(w.peso) <= Number(filterValues.maxWeight);
              const matchesDate = (!filterValues.dateStart || new Date(w.data_pesagem) >= new Date(filterValues.dateStart)) &&
                                 (!filterValues.dateEnd || new Date(w.data_pesagem) <= new Date(filterValues.dateEnd));
              return matchesSearch && matchesTab && matchesMinWeight && matchesMaxWeight && matchesDate;
            })}
            columns={columns}
            loading={loading}
            hideHeader={true}
            searchPlaceholder="Pesquisar por brinco..."
            actions={(item) => (
              <div className="modern-actions">
                <button className="action-dot info" title="Histórico"><History size={18} /></button>
                <button className="action-dot edit" onClick={() => handleOpenEdit(item)} title="Editar"><Edit3 size={18} /></button>
                <button className="action-dot delete" onClick={() => handleDelete(item.id)} title="Excluir"><Trash2 size={18} /></button>
              </div>
            )}
          />
        )}
      </div>

      <WeightForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleSubmit}
        initialData={selectedWeight}
      />

    </div>
  );
};
