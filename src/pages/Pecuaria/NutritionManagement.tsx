import React, { useState } from 'react';
import { usePersistentState } from '../../hooks/usePersistentState';

import { useSearchParams } from 'react-router-dom';
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
import { motion, AnimatePresence } from 'framer-motion';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/export';
import { HistoryModal } from '../../components/Modals/HistoryModal';
import { supabase } from '../../lib/supabase';
import { DietForm } from '../../components/Forms/DietForm';
import { TauzeStatCard } from '../../components/Cards/TauzeStatCard';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { NutritionSimulatorModal } from './components/NutritionSimulatorModal';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { useReportData } from '../../hooks/useReportData';
import { NutritionFilterModal } from './components/NutritionFilterModal';
import { KPISkeleton } from '../../components/Feedback/Skeleton';
import { EmptyState } from '../../components/Feedback/EmptyState';
import toast from 'react-hot-toast';
import { Breadcrumb } from '../../components/Navigation/Breadcrumb';

export const NutritionManagement: React.FC = () => {
  const { activeFarm, activeFarmId, activeTenantId, applyFarmFilter, canCreate, insertPayload } = useFarmFilter();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as 'DIETAS' | 'INSUMOS') || 'DIETAS';
  const setActiveTab = (tab: string) => {
    setSearchParams(prev => { const n = new URLSearchParams(prev); n.set('tab', tab); return n; }, { replace: true });
  };
  const [isModalOpen, setIsModalOpen] = usePersistentState('NutritionManagement_isModalOpen', false);
  const [selectedDiet, setSelectedDiet] = useState<any>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterValues, setFilterValues] = useState({
    status: 'all',
    tipo: 'all',
    ingredients: [],
    maxCostMS: 5,
    minMS: 0,
    onlyActive: true
  });
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const { 
    data: diets, 
    stats, 
    loading, 
    error, 
    totalCount,
    refresh 
  } = useReportData('dietas', { page, pageSize });

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
      toast.error('⚠️ Selecione uma unidade específica para formular uma nova dieta.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        nome: data.nome,
        tipo: data.tipo,
        ingredientes: data.ingredientes,
        custo_por_kg: parseFloat(data.custo_por_kg),
        percentual_ms: parseFloat(data.percentual_ms),
        descricao: data.descricao,
        status: data.status
      };

      if (selectedDiet) {
        const { error } = await supabase.from('dietas').update(payload).eq('id', selectedDiet.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('dietas').insert([{ ...payload, ...insertPayload }]);
        if (error) throw error;
      }

      setIsModalOpen(false);
      refresh();
    } catch (err: any) {
      toast.error('❌ Erro ao salvar dieta: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir esta dieta?')) return;
    try {
      const { error } = await supabase.from('dietas').delete().eq('id', id);
      if (error) throw error;
      refresh();
    } catch (err: any) {
      toast.error('❌ Erro ao excluir dieta: ' + err.message);
    }
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

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const exportData = diets.map(item => ({
      Nome: item.nome,
      Tipo: item.tipo,
      Custo_kg_Natural: 'R$ ' + Number(item.custo_por_kg).toFixed(2),
      Percentual_MS: item.percMS + '%',
      Custo_kg_MS: 'R$ ' + (item.custoMS || 0).toFixed(2),
      Ingredientes: item.ingredientes?.join(', ') || 'N/A',
      Status: item.status === 'active' ? 'Liberada' : 'Bloqueada'
    }));

    if (format === 'csv') exportToCSV(exportData, 'dietas_nutricao');
    else if (format === 'excel') exportToExcel(exportData, 'dietas_nutricao');
    else if (format === 'pdf') exportToPDF(exportData, 'dietas_nutricao', 'Relatório Nutricional - Formulações');
  };

  const filteredDiets = diets.filter(d => {
    const matchesSearch = (d.nome || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'DIETAS' ? d.tipo !== 'MATERIA_PRIMA' : d.tipo === 'MATERIA_PRIMA';
    
    const matchesStatus = filterValues.status === 'all' || d.status === filterValues.status;
    const matchesTipo = filterValues.tipo === 'all' || d.tipo === filterValues.tipo;
    
    const matchesIngredients = filterValues.ingredients.length === 0 || 
                               filterValues.ingredients.some(ing => d.ingredientes?.includes(ing));
    
    const matchesCost = (d.custoMS || 0) <= filterValues.maxCostMS;
    const matchesMS = (d.percMS || 0) >= filterValues.minMS;
    const matchesActive = !filterValues.onlyActive || d.status === 'active';

    return matchesSearch && matchesTab && matchesStatus && matchesTipo && matchesIngredients && matchesCost && matchesMS && matchesActive;
  });

  const tableColumns = [
    { 
      header: 'Dieta / Identificação', 
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
          <span className="main-text" style={{ fontWeight: 800, color: '#1e293b' }}>{item.nome}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, fontSize: '9px', letterSpacing: '0.05em', color: '#64748b', textTransform: 'uppercase' }}>
            <Wheat size={12} color={item.tipo === 'MATERIA_PRIMA' ? '#f59e0b' : '#10b981'} />
            {item.tipo === 'MATERIA_PRIMA' ? 'Matéria Prima' : 'Fórmula / Dieta'}
          </div>
        </div>
      ),
      align: 'left' as const
    },
    {
      header: 'Matéria Seca (M.S.)',
      accessor: (item: any) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span style={{ 
            padding: '2px 8px', 
            borderRadius: '6px', 
            fontSize: '11px', 
            fontWeight: 800,
            background: 'hsl(var(--bg-main))',
            color: '#475569',
            border: '1px solid #e2e8f0'
          }}>
            {item.percMS || item.percentual_ms || 0}% MS
          </span>
        </div>
      ),
      align: 'center' as const
    },
    {
      header: 'Custo por kg MS',
      accessor: (item: any) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 900, color: '#059669' }}>
            R$ {(item.custoMS || 0).toFixed(2)}
          </span>
        </div>
      ),
      align: 'center' as const
    },
    {
      header: 'Custo Matéria Natural',
      accessor: (item: any) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>
            R$ {Number(item.custo_por_kg || 0).toFixed(2)} / kg
          </span>
        </div>
      ),
      align: 'center' as const
    },
    {
      header: 'Composição',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '200px', justifyContent: 'center' }}>
          {item.ingredientes?.slice(0, 3).map((ing: string) => (
            <span key={ing} style={{ padding: '2px 6px', backgroundColor: '#f1f5f9', color: '#475569', borderRadius: '4px', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.05em' }}>
              {ing}
            </span>
          ))}
          {item.ingredientes?.length > 3 && <span style={{ fontSize: '9px', fontWeight: 700, color: '#94a3b8' }}>+{item.ingredientes.length - 3}</span>}
          {(!item.ingredientes || item.ingredientes.length === 0) && <span style={{ fontSize: '9px', fontWeight: 700, color: '#94a3b8' }}>Puro</span>}
        </div>
      ),
      align: 'center' as const
    },
    {
      header: 'Status',
      accessor: (item: any) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span className={`status-pill ${item.status === 'active' ? 'active' : 'stopped'}`}>
            {item.status === 'active' ? 'Liberada' : 'Bloqueada'}
          </span>
        </div>
      ),
      align: 'center' as const
    }
  ];

  return (
    <div className="nutrition-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <Breadcrumb paths={[{ label: 'Pecuária', href: '/pecuaria/dashboard' }, { label: 'Nutrição' }]} />
          <h1 className="page-title">Nutrição</h1>
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
          Array(4).fill(0).map((_, i) => <KPISkeleton key={i} />)
        ) : stats?.map((stat: any, idx: number) => (
          <TauzeStatCard 
            key={idx}
            {...stat}
          />
        ))}
      </div>

      <div className="tauze-controls-row">
        <div className="tauze-tab-group">
          <button 
            className={`tauze-tab-item ${activeTab === 'DIETAS' ? 'active' : ''}`}
            onClick={() => setActiveTab('DIETAS')}
          >
            Dietas Ativas
          </button>
          <button 
            className={`tauze-tab-item ${activeTab === 'INSUMOS' ? 'active' : ''}`}
            onClick={() => setActiveTab('INSUMOS')}
          >
            Matérias Primas
          </button>
        </div>

        <div className="tauze-search-wrapper">
          <Search size={18} className="s-icon" />
          <input 
            type="text" 
            className="tauze-search-input"
            placeholder="Buscar formulação pelo nome..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="tauze-filter-group">
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
                const menu = document.getElementById('export-menu-nutrition');
                if (menu) menu.classList.toggle('active');
              }}
            >
              <FileText size={20} />
            </button>
            <div id="export-menu-nutrition" className="export-menu">
              <button onClick={() => { handleExport('csv'); document.getElementById('export-menu-nutrition')?.classList.remove('active'); }}>Excel (.CSV)</button>
              <button onClick={() => { handleExport('excel'); document.getElementById('export-menu-nutrition')?.classList.remove('active'); }}>Excel (.xlsx)</button>
              <button onClick={() => { handleExport('pdf'); document.getElementById('export-menu-nutrition')?.classList.remove('active'); }}>PDF</button>
            </div>
          </div>
        </div>
      </div>

      <NutritionFilterModal 
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filters={filterValues}
        setFilters={setFilterValues}
      />

      <div className="management-content">
        <ModernTable 
          emptyState={<EmptyState
            title="Nenhuma dieta formulada"
            description="Não há formulações registradas para esta unidade. Inicie o controle nutricional criando a primeira dieta de precisão."
            actionLabel="Nova Dieta"
            onAction={handleOpenCreate}
            icon={Utensils}
          />}
          data={filteredDiets}
            columns={tableColumns}
            loading={loading}
            hideHeader={true}
            totalCount={totalCount}
            currentPage={page}
            onPageChange={setPage}
            itemsPerPage={pageSize}
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
        loading={isSubmitting}
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
