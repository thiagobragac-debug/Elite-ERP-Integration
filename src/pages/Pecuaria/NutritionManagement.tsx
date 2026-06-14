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
import { BatchFeedForm } from '../../components/Forms/BatchFeedForm';
import { TauzeStatCard } from '../../components/Cards/TauzeStatCard';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { NutritionSimulatorModal } from './components/NutritionSimulatorModal';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { useReportData } from '../../hooks/useReportData';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NutritionFilterModal } from './components/NutritionFilterModal';
import { KPISkeleton } from '../../components/Feedback/Skeleton';
import { EmptyState } from '../../components/Feedback/EmptyState';
import toast from 'react-hot-toast';
import { Breadcrumb } from '../../components/Navigation/Breadcrumb';
import { useConfirm } from '../../contexts/ConfirmContext';

export const NutritionManagement: React.FC = () => {
  const { confirm } = useConfirm();
  const { activeFarm, activeFarmId, activeTenantId, applyFarmFilter, canCreate, insertPayload } = useFarmFilter();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as 'DIETAS' | 'INSUMOS' | 'TRATOS') || 'DIETAS';
  const setActiveTab = (tab: string) => {
    setSearchParams(prev => { const n = new URLSearchParams(prev); n.set('tab', tab); return n; }, { replace: true });
  };
  const [isModalOpen, setIsModalOpen] = usePersistentState('NutritionManagement_isModalOpen', false);
  const [isFeedModalOpen, setIsFeedModalOpen] = usePersistentState('NutritionManagement_isFeedModalOpen', false);
  const [formActionId, setFormActionId] = useState<number>(0);
  const [selectedDiet, setSelectedDiet] = useState<any>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = usePersistentState('NutritionManagement_isHistoryModalOpen', false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = usePersistentState('NutritionManagement_isSimulatorOpen', false);
  const [showAdvancedFilters, setShowAdvancedFilters] = usePersistentState('NutritionManagement_showAdvancedFilters', false);
  const [filterValues, setFilterValues] = useState({
    status: 'all',
    tipo: 'all',
    ingredients: [],
    maxCostMS: 100,
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
    setFormActionId(Date.now());
    setIsModalOpen(true);
  };

  const handleOpenEdit = (diet: any) => {
    setSelectedDiet(diet);
    setFormActionId(Date.now());
    setIsModalOpen(true);
  };

  const saveDietMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (selectedDiet) {
        const { error } = await supabase.from('dietas').update(payload).eq('id', selectedDiet.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('dietas').insert([{ ...payload, ...insertPayload }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report'] });
      setIsModalOpen(false);
      toast.success(selectedDiet ? '✅ Dieta atualizada!' : '✅ Dieta formulada!');
    },
    onError: (err: any) => {
      toast.error('❌ Erro ao salvar dieta: ' + err.message);
    }
  });

  const saveFeedMutation = useMutation({
    mutationFn: async (payloads: any[]) => {
      // 1. Process each lot in the payload
      for (const p of payloads) {
        let animais = [];
        if (p.animal_id) {
          animais = [{ id: p.animal_id }];
        } else {
          // Find animals in this lot
          const { data: lotesAnimais } = await supabase.from('animais').select('id').eq('lote_id', p.lote_id).eq('status', 'Ativo');
          if (lotesAnimais) animais = lotesAnimais;
        }
        
        const numAnimals = animais && animais.length > 0 ? animais.length : 1;
        
        // Calculate per animal values (for the entire lot)
        // Note: BatchFeedForm creates payloads per lot. We distribute `quantidade` from each payload item.
        const qtyPerAnimal = p.insumos.reduce((acc: number, insumo: any) => acc + insumo.quantidade, 0) / numAnimals;
        const valuePerAnimal = p.insumos.reduce((acc: number, insumo: any) => acc + (insumo.quantidade * insumo.custo_medio), 0) / numAnimals;

        // Insert nutricao_animais for each animal
        if (animais && animais.length > 0) {
          const nutricaoInserts = animais.map(a => ({
            tenant_id: activeTenantId,
            fazenda_id: activeFarmId,
            animal_id: a.id,
            dieta_id: p.dieta_id,
            lote_id: p.lote_id,
            quantidade_kg: qtyPerAnimal,
            valor_unitario_kg: qtyPerAnimal > 0 ? valuePerAnimal / qtyPerAnimal : 0,
            valor_total_consumido: valuePerAnimal,
            data_consumo: p.data_trato,
            fase: 'CRIA' // You can fetch real fase or leave null
          }));
          const { error: nutError } = await supabase.from('nutricao_animais').insert(nutricaoInserts);
          if (nutError) {
            console.error('Erro ao salvar nutricao_animais', nutError);
            toast.error('Erro na cascata nutricao_animais: ' + nutError.message);
          }
        }

        // Deduct from stock
        const stockInserts = p.insumos.map((ins: any) => ({
          tenant_id: activeTenantId,
          fazenda_id: activeFarmId,
          produto_id: ins.produto_id,
          deposito_id: p.deposito_id,
          tipo: 'SAIDA',
          quantidade: ins.quantidade,
          custo_unitario: ins.custo_medio,
          data_movimentacao: p.data_trato,
          origem_destino: 'Trato Animal',
          responsavel: 'Sistema Automático'
        }));
        
        if (stockInserts.length > 0) {
          const { error: stError } = await supabase.from('movimentacoes_estoque').insert(stockInserts);
          if (stError) {
             console.error('Erro ao deduzir estoque', stError);
             toast.error('Erro na baixa de estoque: ' + stError.message);
          } else {
             toast.success('Baixa automática no estoque realizada!');
          }
        }
      }
    },
    onSuccess: () => {
      setIsFeedModalOpen(false);
      toast.success('✅ Trato lançado com sucesso!');
    },
    onError: (err: any) => {
      toast.error('❌ Erro ao lançar trato: ' + err.message);
    }
  });

  const handleFeedSubmit = async (payloads: any[]) => {
    if (!canCreate) {
      toast.error('⚠️ Selecione uma unidade específica para lançar tratos.');
      return;
    }
    saveFeedMutation.mutate(payloads);
  };

  const handleSubmit = async (data: any) => {
    if (!canCreate && !selectedDiet) {
      toast.error('⚠️ Selecione uma unidade específica para formular uma nova dieta.');
      return;
    }

    const payload = {
      nome: data.nome,
      tipo: data.tipo,
      ingredientes: data.ingredientes,
      custo_por_kg: parseFloat(data.custo_por_kg),
      percentual_ms: parseFloat(data.percentual_ms),
      descricao: data.descricao,
      status: data.status
    };

    saveDietMutation.mutate(payload);
  };

  const deleteDietMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('dietas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report'] });
      toast.success('✅ Dieta excluída!');
    },
    onError: (err: any) => {
      toast.error('❌ Erro ao excluir dieta: ' + err.message);
    }
  });

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({ title: 'Atenção', description: 'Deseja excluir esta dieta?', confirmText: 'Confirmar', cancelText: 'Cancelar', variant: 'danger' });
    if (!isConfirmed) return;
    deleteDietMutation.mutate(id);
  };

  const { data: tratosHistory, isLoading: isLoadingTratos } = useQuery({
    queryKey: ['tratosHistory', activeFarmId, activeTenantId],
    queryFn: async () => {
      let q = supabase
        .from('nutricao_animais')
        .select(`
          id,
          data_consumo,
          quantidade_kg,
          valor_total_consumido,
          created_at,
          dietas ( nome ),
          lotes ( nome ),
          animais ( brinco, raca )
        `)
        .order('created_at', { ascending: false });
        
      q = applyFarmFilter(q);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    enabled: activeTab === 'TRATOS'
  });

  const { data: insumosList, isLoading: isLoadingInsumos } = useQuery({
    queryKey: ['insumosList', activeFarmId, activeTenantId],
    queryFn: async () => {
      let q = supabase
        .from('produtos')
        .select('*')
        .order('nome');
        
      q = applyFarmFilter(q);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    enabled: activeTab === 'INSUMOS'
  });

  const handleViewHistory = async (dietId: string) => {
    setIsHistoryModalOpen(true);
    setHistoryLoading(true);
    try {
      const { data, error } = await supabase
        .from('nutricao_animais')
        .select(`
          id,
          data_consumo,
          quantidade_kg,
          valor_total_consumido,
          lotes:lote_id (nome)
        `)
        .eq('dieta_id', dietId)
        .order('data_consumo', { ascending: false });

      if (error) throw error;

      // Group by data_consumo and lote_id
      const grouped = data.reduce((acc: any, row: any) => {
        const key = `${row.data_consumo}_${row.lotes?.nome || 'Sem Lote'}`;
        if (!acc[key]) {
          acc[key] = {
            id: key,
            date: row.data_consumo,
            title: `Trato: ${row.lotes?.nome || 'Sem Lote'}`,
            totalKg: 0,
            totalValue: 0,
            status: 'success'
          };
        }
        acc[key].totalKg += Number(row.quantidade_kg);
        acc[key].totalValue += Number(row.valor_total_consumido);
        return acc;
      }, {});

      const formatted = Object.values(grouped).map((g: any) => ({
        id: g.id,
        date: g.date,
        title: g.title,
        subtitle: `Consumo Total: ${g.totalKg.toFixed(1)} kg`,
        value: `R$ ${g.totalValue.toFixed(2)}`,
        status: g.status
      }));

      setHistoryItems(formatted);
    } catch (err: any) {
      console.error('Erro ao buscar histórico:', err);
      toast.error('Erro ao carregar histórico nutricional.');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const exportData = diets.map(item => ({
      Nome: item.nome,
      Tipo: item.tipo,
      Custo_kg_Natural: 'R$ ' + Number(item.custo_por_kg).toFixed(2),
      Percentual_MS: item.percMS + '%',
      Custo_kg_MS: 'R$ ' + (item.custoMS || 0).toFixed(2),
      Ingredientes: item.ingredientes ? item.ingredientes.map((ing: any) => typeof ing === 'string' ? ing : ing.nome).join(', ') : 'N/A',
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
                               filterValues.ingredients.some(ing => {
                                 if (!d.ingredientes) return false;
                                 return d.ingredientes.some((i: any) => (typeof i === 'string' ? i : i.nome) === ing);
                               });
    
    const matchesCost = filterValues.maxCostMS >= 100 || (d.custoMS || 0) <= filterValues.maxCostMS;
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
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', maxWidth: '200px', justifyContent: 'center' }}>
          {item.ingredientes?.slice(0, 3).map((ing: any, i: number) => (
            <span key={i} style={{ background: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase' }}>
              {typeof ing === 'string' ? ing : ing.nome}
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

  const tratosColumns = [
    {
      header: 'Data do Lançamento',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
           <span style={{ fontWeight: 600, color: 'hsl(var(--text-main))' }}>
             {new Date(item.data_consumo + 'T12:00:00Z').toLocaleDateString('pt-BR')}
           </span>
           <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>
             {new Date(item.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
           </span>
        </div>
      )
    },
    {
      header: 'Dieta',
      accessor: (item: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '32px', height: '32px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Wheat size={16} />
          </div>
          <span style={{ fontWeight: 600, color: 'hsl(var(--text-main))' }}>{item.dietas?.nome || '-'}</span>
        </div>
      )
    },
    {
      header: 'Destino do Trato',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
           <span style={{ fontWeight: 600, color: 'hsl(var(--text-main))' }}>
             {item.lotes ? `Lote: ${item.lotes.nome}` : item.animais ? `Animal: ${item.animais.brinco}` : 'Não especificado'}
           </span>
        </div>
      )
    },
    {
      header: 'Quantidade (KG)',
      accessor: (item: any) => (
        <span style={{ fontWeight: 700, color: '#059669' }}>{Number(item.quantidade_kg).toFixed(2)} kg</span>
      ),
      align: 'center' as const
    },
    {
      header: 'Custo Gerado',
      accessor: (item: any) => (
        <span style={{ fontWeight: 700, color: 'hsl(var(--text-main))' }}>
          {Number(item.valor_total_consumido).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </span>
      ),
      align: 'right' as const
    }
  ];

  const insumosColumns = [
    {
      header: 'Insumo / Matéria Prima',
      accessor: (item: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '8px', borderRadius: '8px' }}>
            <Package size={18} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 600, color: 'hsl(var(--text-main))' }}>{item.nome}</span>
            <span style={{ fontSize: '12px', color: 'hsl(var(--text-muted))' }}>Estoque: {item.estoque_atual || 0} {item.unidade_medida || 'kg'}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Custo Médio',
      accessor: (item: any) => (
        <span style={{ fontWeight: 600, color: 'hsl(var(--text-main))' }}>
          {Number(item.custo_medio || item.preco_custo || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} / {item.unidade_medida || 'kg'}
        </span>
      ),
      align: 'right' as const
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
          <button className="primary-btn" onClick={() => setIsFeedModalOpen(true)} style={{ background: '#f59e0b', color: '#fff', border: 'none' }}>
            <Wheat size={18} />
            LANÇAR TRATO
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
          <button 
            className={`tauze-tab-item ${activeTab === 'TRATOS' ? 'active' : ''}`}
            onClick={() => setActiveTab('TRATOS')}
          >
            Histórico de Tratos
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
        {activeTab === 'DIETAS' ? (
          <ModernTable 
            emptyState={<EmptyState
              title="Nenhuma dieta formulada"
              description="Não há formulações registradas para esta unidade."
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
        ) : activeTab === 'INSUMOS' ? (
          <ModernTable 
            emptyState={<EmptyState
              title="Nenhum insumo cadastrado"
              description="Não há matérias primas listadas no estoque."
              actionLabel="Estoque Geral"
              onAction={() => window.location.href = '/pecuaria/estoque'}
              icon={Package}
            />}
            data={insumosList || []}
            columns={insumosColumns}
            loading={isLoadingInsumos}
            hideHeader={true}
          />
        ) : (
          <ModernTable 
            emptyState={<EmptyState
              title="Nenhum trato registrado"
              description="Você ainda não possui histórico de tratos e consumos para esta unidade."
              actionLabel="Lançar Trato"
              onAction={() => setIsFeedModalOpen(true)}
              icon={Wheat}
            />}
            data={tratosHistory || []}
            columns={tratosColumns}
            loading={isLoadingTratos}
            hideHeader={true}
          />
        )}
      </div>

      <DietForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        actionId={formActionId}
        onSubmit={handleSubmit}
        initialData={selectedDiet}
        loading={saveDietMutation.isPending}
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

      <BatchFeedForm 
        isOpen={isFeedModalOpen}
        onClose={() => setIsFeedModalOpen(false)}
        onSubmit={handleFeedSubmit}
      />

    </div>
  );
};
