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
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/export';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { WeightForm } from '../../components/Forms/WeightForm';
import { HistoryModal } from '../../components/Modals/HistoryModal';
import { EliteStatCard } from '../../components/Cards/EliteStatCard';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { formatNumber } from '../../utils/format';
import { KPISkeleton } from '../../components/Feedback/Skeleton';
import { EmptyState } from '../../components/Feedback/EmptyState';
import { ScaleConfigModal } from './components/ScaleConfigModal';
import { WeightFilterModal } from './components/WeightFilterModal';

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
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterValues, setFilterValues] = useState({
    minWeight: 0,
    maxWeight: 1000,
    minGMD: 0,
    maxGMD: 2,
    dateStart: '',
    dateEnd: '',
    performanceLevel: 'all',
    daysSinceLastWeighing: 0
  });
  const [isScaleModalOpen, setIsScaleModalOpen] = useState(false);

  const [stats, setStats] = useState<any[]>([
    { label: 'Peso Médio Global', value: '0 kg', icon: Scale, color: '#10b981', progress: 0 },
    { label: 'Pesagens (Ciclo)', value: '0', icon: History, color: '#3b82f6', progress: 0 },
    { label: 'GMD Médio Real', value: '0.000 kg', icon: TrendingUp, color: '#f59e0b', progress: 0 },
    { label: 'Status da Operação', value: 'Sincronizando...', icon: Wifi, color: '#166534', progress: 0 },
  ]);

  useEffect(() => {
    if (!activeFarm) return;
    fetchWeighings();
  }, [activeFarm]);

  const fetchWeighings = async () => {
    try {
      // Buscamos as pesagens com dados dos animais
      const { data, error } = await supabase
        .from('pesagens')
        .select('*, animais(id, brinco)')
        .eq('fazenda_id', activeFarm.id)
        .order('data_pesagem', { ascending: false });
      
      if (error) throw error;

      if (data) {
        // Cálculo de GMD Real (Comparativo)
        const enrichedData = data.map((curr: any, idx: number) => {
          const prev = data.slice(idx + 1).find((w: any) => w.animal_id === curr.animal_id);
          
          let gmd = 0;
          if (prev) {
            const days = (new Date(curr.data_pesagem).getTime() - new Date(prev.data_pesagem).getTime()) / (1000 * 60 * 60 * 24);
            gmd = days > 0 ? (Number(curr.peso) - Number(prev.peso)) / days : 0;
          }

          return { ...curr, gmd };
        });

        setWeighings(enrichedData);
        
        const totalPesagens = enrichedData.length;
        const pesoMedio = enrichedData.reduce((acc: number, curr: any) => acc + Number(curr.peso), 0) / (totalPesagens || 1);
        const gmdMedio = enrichedData.reduce((acc: number, curr: any) => acc + (curr.gmd || 0), 0) / (totalPesagens || 1);
        
        setStats([
          { label: 'Peso Médio Global', value: `${formatNumber(pesoMedio)} kg`, icon: Scale, color: '#10b981', progress: 65 },
          { label: 'Pesagens (Ciclo)', value: String(totalPesagens), icon: History, color: '#3b82f6', progress: 100 },
          { label: 'GMD Médio Real', value: `${gmdMedio.toFixed(3)} kg`, icon: TrendingUp, color: '#f59e0b', progress: (gmdMedio / 1.2) * 100 },
          { label: 'Status da Operação', value: 'Em Dia', icon: Wifi, color: '#166534', progress: 100 },
        ]);
      }
    } catch (err) {
      console.error('Error fetching weighings:', err);
    } finally {
      setLoading(false);
    }
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

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const filteredData = weighings.filter(w => {
      const matchesSearch = w.animais?.brinco?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTab = activeTab === 'RECENT' ? true : Number(w.peso) > 400; 
      
      const weight = Number(w.peso || 0);
      const matchesWeight = weight >= filterValues.minWeight && weight <= filterValues.maxWeight;
      
      const gmd = w.gmd || 0;
      const matchesPerformance = filterValues.performanceLevel === 'all' || 
                                (filterValues.performanceLevel === 'high' && gmd > 1.0) ||
                                (filterValues.performanceLevel === 'medium' && gmd >= 0.5 && gmd <= 1.0) ||
                                (filterValues.performanceLevel === 'low' && gmd < 0.5);

      const matchesDate = (!filterValues.dateStart || new Date(w.data_pesagem) >= new Date(filterValues.dateStart)) &&
                         (!filterValues.dateEnd || new Date(w.data_pesagem) <= new Date(filterValues.dateEnd));
      
      const daysSince = (new Date().getTime() - new Date(w.data_pesagem).getTime()) / (1000 * 3600 * 24);
      const matchesDays = !filterValues.daysSinceLastWeighing || daysSince >= filterValues.daysSinceLastWeighing;

      return matchesSearch && matchesTab && matchesWeight && matchesPerformance && matchesDate && matchesDays;
    });

    const exportData = filteredData.map(item => ({
      Animal: item.animais?.brinco || 'N/A',
      Data: new Date(item.data_pesagem).toLocaleDateString(),
      Peso: item.peso,
      GMD: item.gmd?.toFixed(3),
      Observacao: item.observacao
    }));

    if (format === 'csv') exportToCSV(exportData, 'log_pesagens');
    else if (format === 'excel') exportToExcel(exportData, 'log_pesagens');
    else if (format === 'pdf') exportToPDF(exportData, 'log_pesagens', 'Relatório de Pesagens');
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
      header: 'GMD Médio Real',
      accessor: (item: any) => (
        <div className="flex items-center gap-2">
          <TrendingUp 
            size={14} 
            className={item.gmd > 0.8 ? 'text-emerald-500' : 'text-amber-500'} 
          />
          <span className={`${item.gmd > 0.8 ? 'text-emerald-600' : 'text-amber-600'} font-bold`}>
            {item.gmd?.toFixed(3)} kg/dia
          </span>
        </div>
      ),
      align: 'center' as const
    },
    {
      header: 'Projeção Abate',
      accessor: (item: any) => {
        const targetWeight = 520; // Peso alvo padrão
        const remaining = targetWeight - Number(item.peso);
        const daysToAbate = item.gmd > 0 ? Math.ceil(remaining / item.gmd) : 0;
        
        return (
          <div className="table-cell-meta">
            <span className={`status-pill ${daysToAbate < 30 ? 'warning' : 'info'}`}>
              {daysToAbate > 0 ? `~${daysToAbate} dias` : 'Pronto'}
            </span>
          </div>
        );
      },
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
          <button className="glass-btn secondary" onClick={() => setIsScaleModalOpen(true)}>
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
          <div className="export-dropdown-container">
            <button 
              className="icon-btn-secondary" 
              title="Exportar"
              onClick={() => {
                const menu = document.getElementById('export-menu-weight');
                if (menu) menu.classList.toggle('active');
              }}
            >
              <FileText size={20} />
            </button>
            <div id="export-menu-weight" className="export-menu">
              <button onClick={() => { handleExport('csv'); document.getElementById('export-menu-weight')?.classList.remove('active'); }}>CSV</button>
              <button onClick={() => { handleExport('excel'); document.getElementById('export-menu-weight')?.classList.remove('active'); }}>Excel (.xlsx)</button>
              <button onClick={() => { handleExport('pdf'); document.getElementById('export-menu-weight')?.classList.remove('active'); }}>PDF Profissional</button>
            </div>
          </div>
        </div>
      </div>

      <WeightFilterModal 
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filters={filterValues}
        setFilters={setFilterValues}
      />

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
              
              const weight = Number(w.peso || 0);
              const matchesWeight = weight >= filterValues.minWeight && weight <= filterValues.maxWeight;
              
              const gmd = w.gmd || 0;
              const matchesPerformance = filterValues.performanceLevel === 'all' || 
                                        (filterValues.performanceLevel === 'high' && gmd > 1.0) ||
                                        (filterValues.performanceLevel === 'medium' && gmd >= 0.5 && gmd <= 1.0) ||
                                        (filterValues.performanceLevel === 'low' && gmd < 0.5);

              const matchesDate = (!filterValues.dateStart || new Date(w.data_pesagem) >= new Date(filterValues.dateStart)) &&
                                 (!filterValues.dateEnd || new Date(w.data_pesagem) <= new Date(filterValues.dateEnd));
              
              const daysSince = (new Date().getTime() - new Date(w.data_pesagem).getTime()) / (1000 * 3600 * 24);
              const matchesDays = !filterValues.daysSinceLastWeighing || daysSince >= filterValues.daysSinceLastWeighing;

              return matchesSearch && matchesTab && matchesWeight && matchesPerformance && matchesDate && matchesDays;
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

      <ScaleConfigModal 
        isOpen={isScaleModalOpen} 
        onClose={() => setIsScaleModalOpen(false)} 
      />

    </div>
  );
};
