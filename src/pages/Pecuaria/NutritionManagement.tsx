import React, { useState, useEffect } from 'react';
import { 
  Beef, 
  Plus, 
  Search, 
  Filter,
  ChevronRight, 
  MoreVertical,
  Utensils,
  Wheat,
  Scale,
  TrendingUp,
  Trash2,
  Edit3,
  History,
  Package,
  FileText
} from 'lucide-react';
import { motion } from 'framer-motion';
import { HistoryModal } from '../../components/Modals/HistoryModal';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { DietForm } from '../../components/Forms/DietForm';
import { EliteStatCard } from '../../components/Cards/EliteStatCard';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { NutritionSimulatorModal } from './components/NutritionSimulatorModal';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { GlobalModeBanner } from '../../components/GlobalMode/GlobalModeBanner';

export const NutritionManagement: React.FC = () => {
  const { activeFarm, isGlobalMode, activeFarmId, applyFarmFilter, canCreate, insertPayload } = useFarmFilter();
  const [searchTerm, setSearchTerm] = useState('');
  const [diets, setDiets] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'DIETAS' | 'INSUMOS'>('DIETAS');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDiet, setSelectedDiet] = useState<any>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [stats, setStats] = useState<any[]>([]);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  useEffect(() => {
    if (!activeFarmId && !isGlobalMode) return;
    fetchDiets();
  }, [activeFarmId, isGlobalMode]);

  const fetchDiets = async () => {
    setLoading(true);
    let query = supabase.from('dietas').select('*');
    query = applyFarmFilter(query);
    const { data } = await query;
    
    if (data) {
      setDiets(data);
      const totalDiets = data.length;
      const avgCost = data.reduce((acc, curr) => acc + Number(curr.custo_por_kg), 0) / (totalDiets || 1);
      
      setStats([
        { label: 'Dietas Ativas', value: totalDiets, icon: Utensils, color: '#10b981', progress: 100 },
        { label: 'Custo Médio/kg', value: `R$ ${avgCost.toFixed(2)}`, icon: TrendingUp, color: '#3b82f6', progress: 85, trend: 'up' },
        { label: 'Estoque de Grãos', value: '145 ton', icon: Package, color: '#f59e0b', progress: 60 },
        { label: 'Eficiência Alimentar', value: '6.2:1', icon: Scale, color: '#166534', progress: 75 },
      ]);
    }
    setLoading(false);
  };

  const handleOpenCreate = () => {
    setSelectedDiet(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (diet: any) => {
    setSelectedDiet(diet);
    setIsModalOpen(true);
  };

  const handleSubmit = async (data: any) => {
    if (!canCreate && !selectedDiet) {
      alert('⚠️ Selecione uma unidade específica para formular uma nova dieta. No modo Visão Global, a fazenda deve ser definida.');
      return;
    }
    const payload = {
      nome: data.nome,
      tipo: data.tipo,
      ingredientes: data.ingredientes,
      custo_por_kg: parseFloat(data.custo_por_kg),
      descricao: data.descricao,
      status: data.status
    };

    if (selectedDiet) {
      const { error } = await supabase.from('dietas').update(payload).eq('id', selectedDiet.id);
      if (!error) { setIsModalOpen(false); fetchDiets(); }
    } else {
      const { error } = await supabase.from('dietas').insert([{ ...payload, ...insertPayload }]);
      if (!error) { setIsModalOpen(false); fetchDiets(); }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir esta dieta?')) return;
    const { error } = await supabase.from('dietas').delete().eq('id', id);
    if (!error) fetchDiets();
  };

  const handleViewHistory = async (dietId: string) => {
    setIsHistoryModalOpen(true);
    setHistoryLoading(true);
    setTimeout(() => {
      setHistoryItems([
        { id: '1', date: new Date().toISOString(), title: 'Trato Lote-A1', subtitle: 'Consumo: 450kg', value: 'R$ 832,50', status: 'success' },
        { id: '2', date: new Date(Date.now() - 86400000).toISOString(), title: 'Trato Lote-A1', subtitle: 'Consumo: 445kg', value: 'R$ 823,25', status: 'success' },
        { id: '3', date: new Date(Date.now() - 172800000).toISOString(), title: 'Trato Lote-B2', subtitle: 'Consumo: 120kg', value: 'R$ 222,00', status: 'success' },
      ]);
      setHistoryLoading(false);
    }, 800);
  };

  const columns = [
    {
      header: 'Formulação',
      accessor: (item: any) => (
        <div className="table-cell-title">
          <span className="main-text">{item.nome}</span>
          <div className="sub-meta uppercase font-bold text-[10px] tracking-wider">
            {item.tipo}
          </div>
        </div>
      )
    },
    {
      header: 'Custo / kg',
      accessor: (item: any) => (
        <div className="table-cell-meta">
          <TrendingUp size={14} />
          <span>R$ {Number(item.custo_por_kg).toFixed(2)}</span>
        </div>
      )
    },
    {
      header: 'Ingredientes',
      accessor: (item: any) => (
        <div className="flex flex-wrap gap-1">
          {item.ingredientes?.slice(0, 3).map((ing: string) => (
            <span key={ing} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-tighter">
              {ing}
            </span>
          ))}
          {item.ingredientes?.length > 3 && <span className="text-[10px] font-bold text-slate-400">+{item.ingredientes.length - 3}</span>}
        </div>
      )
    },
    {
      header: 'Status',
      accessor: (item: any) => (
        <span className={`status-pill ${item.status === 'active' ? 'active' : 'stopped'}`}>
          {item.status === 'active' ? 'Liberada' : 'Bloqueada'}
        </span>
      ),
      align: 'center' as const
    }
  ];

  return (
    <div className="nutrition-page animate-slide-up">
      <GlobalModeBanner />
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge">
            <Utensils size={14} fill="currentColor" />
            <span>ELITE LIVESTOCK v5.0</span>
          </div>
          <h1 className="page-title">Gestão de Nutrição</h1>
          <p className="page-subtitle">Formulações de precisão, controle de custos e monitoramento de conversão alimentar em tempo real.</p>
        </div>
        <div className="page-actions">
          <button className="glass-btn secondary" onClick={() => setIsSimulatorOpen(true)}>
            <Scale size={18} />
            SIMULADOR
          </button>
          <button className="primary-btn" onClick={handleOpenCreate}>
            <Plus size={18} />
            NOVA DIETA
          </button>
        </div>
      </header>

      <div className="next-gen-kpi-grid">
        {loading ? (
          Array(4).fill(0).map((_, i) => <EliteStatCard key={i} loading={true} label="" value="" icon={Utensils} color="" />)
        ) : stats.map((stat, idx) => (
          <EliteStatCard 
            key={idx}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            progress={stat.progress}
            change="+1.2%"
            trend={stat.trend}
          />
        ))}
      </div>

      <div className="elite-controls-row">
        <div className="elite-tab-group">
          <button 
            className={`elite-tab-item ${activeTab === 'DIETAS' ? 'active' : ''}`}
            onClick={() => setActiveTab('DIETAS')}
          >
            Dietas Ativas
          </button>
          <button 
            className={`elite-tab-item ${activeTab === 'INSUMOS' ? 'active' : ''}`}
            onClick={() => setActiveTab('INSUMOS')}
          >
            Matérias Primas
          </button>
        </div>

        <div className="elite-search-wrapper">
          <Search size={18} className="s-icon" />
          <input 
            type="text" 
            className="elite-search-input"
            placeholder="Buscar formulação pelo nome..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="elite-filter-group">
          <button className="icon-btn-secondary" title="Filtros Avançados">
            <Filter size={20} />
          </button>
          <button className="icon-btn-secondary" title="Exportar Dieta">
            <FileText size={20} />
          </button>
        </div>
      </div>

      <div className="management-content">
        <ModernTable 
          data={diets.filter(d => {
            const matchesSearch = (d.nome || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesTab = activeTab === 'DIETAS' ? d.tipo !== 'MATERIA_PRIMA' : d.tipo === 'MATERIA_PRIMA';
            return matchesSearch && matchesTab;
          })}
          columns={columns}
          loading={loading}
          hideHeader={true}
          searchPlaceholder="Buscar formulação pelo nome..."
          actions={(item) => (
            <div className="modern-actions">
              <button className="action-dot info" onClick={() => handleViewHistory(item.id)} title="Logs">
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

      <DietForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleSubmit}
        initialData={selectedDiet}
      />

      <HistoryModal 
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="Dossiê Nutricional"
        subtitle="Rastreabilidade de consumo e lotes atendidos"
        items={historyItems}
        loading={historyLoading}
      />

      <NutritionSimulatorModal 
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        diets={diets}
      />

    </div>
  );
};
