import React, { useState, useEffect, useMemo } from 'react';
import { usePersistentState } from '../../hooks/usePersistentState';
import { useDebounce } from '../../hooks/useDebounce';

import { useSearchParams } from 'react-router-dom';
import {
  Beef,
  Plus,
  Search,
  Filter,


  MoreVertical,
  Utensils,
  Wheat,
  Scale,
  TrendingUp,
  Trash2,
  Edit3,
  History,
  Package,
  FileText,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/export';
import { HistoryModal } from '../../components/Modals/HistoryModal';
import { supabase } from '../../lib/supabase';
import { DietForm } from '../../components/Forms/DietForm';
import { BatchFeedForm } from '../../components/Forms/BatchFeedForm';
import { usePermissions } from '../../hooks/usePermissions';
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

interface Diet {
  id?: number | string;
  nome?: string;
  tipo?: string;
  status?: string;
  custo_por_kg?: number;
  percMS?: number;
  percentual_ms?: number;
  custoMS?: number;
  custo_medio?: number;
  preco_custo?: number;
  consumo_esperado?: number | null;
  ingredientes?: Array<string | { nome: string }>;
}

export const NutritionManagement: React.FC = () => {
  const { confirm } = useConfirm();
  const { can } = usePermissions();
  const { activeFarm, activeFarmId, activeTenantId, applyFarmFilter, canCreate, insertPayload } =
    useFarmFilter();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  // ── Lotes enriquecidos para o Simulador Nutricional ──────────────────────
  const [lotesSimulador, setLotesSimulador] = useState<any[]>([]);
  useEffect(() => {
    if (!activeFarm?.id) return;
    const fetchLotes = async () => {
      const { data, error } = await applyFarmFilter(
        supabase.from('vw_lotes_simulador').select('lote_id, nome, num_animais, peso_medio').eq('tenant_id', activeTenantId)
      );
      if (!error && data) {
        setLotesSimulador(data.map((row: any) => ({
          id: row.lote_id,
          nome: row.nome,
          num_animais: Number(row.num_animais),
          peso_medio: Number(row.peso_medio),
        })));
      }
    };
    fetchLotes();
  }, [activeFarm?.id]);

  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as 'DIETAS' | 'INSUMOS' | 'TRATOS') || 'DIETAS';
  const setActiveTab = (tab: string) => {
    setSearchParams(
      (prev) => {
        const n = new URLSearchParams(prev);
        n.set('tab', tab);
        return n;
      },
      { replace: true }
    );
  };
  const [isModalOpen, setIsModalOpen] = usePersistentState(
    'NutritionManagement_isModalOpen',
    false
  );
  const [isFeedModalOpen, setIsFeedModalOpen] = usePersistentState(
    'NutritionManagement_isFeedModalOpen',
    false
  );
  const [formActionId, setFormActionId] = useState<number>(0);
  const [selectedDiet, setSelectedDiet] = useState<any>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = usePersistentState(
    'NutritionManagement_isHistoryModalOpen',
    false
  );
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = usePersistentState(
    'NutritionManagement_isSimulatorOpen',
    false
  );
  const [showAdvancedFilters, setShowAdvancedFilters] = usePersistentState(
    'NutritionManagement_showAdvancedFilters',
    false
  );
  const [filterValues, setFilterValues] = useState({
    status: 'all',
    tipo: 'all',
    ingredients: [],
    maxCostMS: 100,
    minMS: 0,
    onlyActive: true,
  });
  const [page, setPage] = useState(1);
  const pageSize = 12;



  const {
    data: rawDiets,
    stats,
    loading,
    error,
    totalCount,
    refresh,
  } = useReportData('dietas', { page, pageSize });

  const diets = (rawDiets || []) as unknown as Diet[];

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
        const { error } = await supabase.from('dietas').update(payload).eq('id', selectedDiet.id).eq('tenant_id', activeTenantId);
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
      toast.error(`❌ Erro ao salvar dieta: ${err.message}`);
    },
  });

  const saveFeedMutation = useMutation({
    mutationFn: async (payloads: any[]) => {
      // Usa a nova RPC transacional para garantir consistência no banco (ACID)
      const { error } = await supabase.rpc('apply_nutrition_feed', {
        p_payload: payloads,
        p_tenant_id: activeTenantId,
        p_fazenda_id: activeFarmId,
      });

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      setIsFeedModalOpen(false);
      toast.success('✅ Trato lançado com sucesso!');
    },
    onError: (err: any) => {
      toast.error(`❌ Erro ao lançar trato: ${err.message}`);
    },
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
      status: data.status,
      data_vigencia: data.data_vigencia || null,
      vigencia_bloqueante: data.vigencia_bloqueante ?? false,
      pb: data.pb ? parseFloat(data.pb) : null,
      ndt: data.ndt ? parseFloat(data.ndt) : null,
      consumo_esperado: data.consumo_esperado ? parseFloat(data.consumo_esperado) : null,
    };
    saveDietMutation.mutate(payload);
  };

  const archiveDietMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('dietas').update({ status: 'archived' }).eq('id', id).eq('tenant_id', activeTenantId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report'] });
      toast.success('✅ Dieta arquivada. Histórico de tratos preservado.');
    },
    onError: (err: any) => toast.error(`❌ Erro ao arquivar dieta: ${err.message}`),
  });

  const deleteDietMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('rpc_soft_delete_dieta', { p_id: id, p_tenant_id: activeTenantId });
      if (error) throw error;
    },
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: ['report'] });
      const previousData = queryClient.getQueryData(['report']);
      queryClient.setQueryData(['report'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data ? old.data.filter((item: any) => item.id !== deletedId) : [],
        };
      });
      return { previousData };
    },
    onError: (err: any, deletedId, context: any) => {
      if (context?.previousData) {
        queryClient.setQueryData(['report'], context.previousData);
      }
      toast.error(`❌ Erro ao excluir dieta: ${err.message}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report'] });
      toast.success('✅ Dieta excluída (arquivada para histórico).');
    },
  });

  const handleDelete = async (id: string) => {
    // 1. Verificar se a dieta tem tratos registrados (dependências)
    const { count: tratoCount } = await supabase
      .from('nutricao_animais')
      .select('id', { count: 'exact', head: true }).eq('tenant_id', activeTenantId)
      .eq('dieta_id', id)
      .eq('tenant_id', activeTenantId);

    if ((tratoCount || 0) > 0) {
      // Dieta em uso — oferecer Arquivar como alternativa segura
      const shouldArchive = await confirm({
        title: 'Dieta em uso',
        description: `Esta dieta possui ${tratoCount} lançamento(s) de trato vinculado(s). Excluí-la quebraria o histórico nutricional. Deseja arquivá-la (fica inativa mas preserva o histórico)?`,
        confirmText: 'Arquivar dieta',
        cancelText: 'Cancelar',
        variant: 'danger',
      });
      if (shouldArchive) archiveDietMutation.mutate(id);
      return;
    }

    // 2. Sem dependências — excluir com confirmação padrão
    const isConfirmed = await confirm({
      title: 'Excluir dieta',
      description: 'Nenhum trato vinculado encontrado. Deseja excluir esta dieta permanentemente?',
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!isConfirmed) return;
    deleteDietMutation.mutate(id);
  };

  const [insumosPage, setInsumosPage] = useState(1);
  const insumosPageSize = 12;

  // ── Histórico de Tratos: registros individuais, sem agrupamento ──────────
  const { data: tratosHistory, isLoading: isLoadingTratos } = useQuery({
    queryKey: ['tratosHistory', activeFarmId, activeTenantId],
    queryFn: async () => {
      let q = supabase
        .from('nutricao_animais')
        .select(
          `
          id,
          data_consumo,
          quantidade_kg,
          valor_total_consumido,
          created_at,
          dietas ( nome ).eq('tenant_id', activeTenantId),
          lotes ( nome ),
          animais ( brinco, raca ),
          depositos ( nome )
        `
        )
        .order('created_at', { ascending: false })
        .limit(200);

      q = applyFarmFilter(q);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    enabled: activeTab === 'TRATOS',
  });

  // ── Insumos: filtrados por tipo MATERIA_PRIMA com paginação server-side ──
  const { data: insumosData, isLoading: isLoadingInsumos } = useQuery({
    queryKey: ['insumosList', activeFarmId, activeTenantId, insumosPage],
    queryFn: async () => {
      const from = (insumosPage - 1) * insumosPageSize;
      const to = from + insumosPageSize - 1;
      let q = supabase
        .from('produtos')
        .select('*', { count: 'exact' }).eq('tenant_id', activeTenantId)
        .eq('tipo', 'MATERIA_PRIMA')
        .order('nome')
        .range(from, to);

      q = applyFarmFilter(q as any) as any;
      const { data, error, count } = await q as any;
      if (error) throw error;
      return { list: data || [], total: count || 0 };
    },
    enabled: activeTab === 'INSUMOS',
  });
  const insumosList = insumosData?.list || [];
  const insumosTotal = insumosData?.total || 0;

  const handleViewHistory = async (dietId: string) => {
    setIsHistoryModalOpen(true);
    setHistoryLoading(true);
    try {
      const { data, error } = await supabase
        .from('nutricao_animais')
        .select(
          `
          id,
          data_consumo,
          quantidade_kg,
          valor_total_consumido,
          lotes:lote_id (nome).eq('tenant_id', activeTenantId)
        `
        )
        .eq('dieta_id', dietId)
        .eq('tenant_id', activeTenantId)
        .order('data_consumo', { ascending: false });

      if (error) {
        throw error;
      }

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
            status: 'success',
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
        status: g.status,
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
    const exportData = ((diets || []) as unknown as Diet[]).map((item) => ({
      Nome: item.nome,
      Tipo: item.tipo,
      Custo_kg_Natural: `R$ ${Number(item.custo_por_kg).toFixed(2)}`,
      Percentual_MS: `${item.percMS}%`,
      Custo_kg_MS: `R$ ${(item.custoMS || 0).toFixed(2)}`,
      Ingredientes: item.ingredientes
        ? item.ingredientes.map((ing: any) => (typeof ing === 'string' ? ing : ing.nome)).join(', ')
        : 'N/A',
      Status: item.status === 'active' ? 'Liberada' : 'Bloqueada',
    }));

    if (format === 'csv') {
      exportToCSV(exportData, 'dietas_nutricao');
    } else if (format === 'excel') {
      exportToExcel(exportData, 'dietas_nutricao');
    } else if (format === 'pdf') {
      exportToPDF(exportData, 'dietas_nutricao', 'Relatório Nutricional - Formulações');
    }
  };

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const filteredDiets = diets.filter((d) => {
    const matchesSearch = (d.nome || '').toLowerCase().includes(debouncedSearchTerm.toLowerCase());
    // Aba DIETAS mostra apenas formulações (não MP); aba INSUMOS é server-side separada
    const matchesTab = d.tipo !== 'MATERIA_PRIMA';
    const matchesStatus = filterValues.status === 'all' || d.status === filterValues.status;
    const matchesTipo = filterValues.tipo === 'all' || d.tipo === filterValues.tipo;
    const matchesIngredients =
      filterValues.ingredients.length === 0 ||
      filterValues.ingredients.some((ing) => {
        if (!d.ingredientes) return false;
        return d.ingredientes.some((i: any) => (typeof i === 'string' ? i : i.nome) === ing);
      });
    const matchesCost = filterValues.maxCostMS >= 100 || (d.custoMS || 0) <= filterValues.maxCostMS;
    const matchesMS = (d.percMS || 0) >= filterValues.minMS;
    const matchesActive = !filterValues.onlyActive || d.status === 'active';
    return matchesSearch && matchesTab && matchesStatus && matchesTipo && matchesIngredients && matchesCost && matchesMS && matchesActive;
  });

  // Tratos filtrados por busca (nome da dieta ou lote)
  const filteredTratos = (tratosHistory || []).filter((t: any) => {
    if (!debouncedSearchTerm) return true;
    const term = debouncedSearchTerm.toLowerCase();
    return (
      (t.dietas?.nome || '').toLowerCase().includes(term) ||
      (t.lotes?.nome || '').toLowerCase().includes(term) ||
      (t.animais?.brinco || '').toLowerCase().includes(term)
    );
  });

  // Lista dinâmica de ingredientes presentes nas dietas carregadas (para o FilterModal)
  const availableIngredients = useMemo(() => {
    const set = new Set<string>();
    (diets as any[]).forEach((d) => {
      (d.ingredientes || []).forEach((ing: any) => {
        const nome = typeof ing === 'string' ? ing : ing?.nome;
        if (nome) set.add(nome);
      });
    });
    return Array.from(set).sort();
  }, [diets]);

  const tableColumns = [
    {
      header: 'Dieta / Identificação',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
          <span className="main-text" style={{ fontWeight: 800 }}>
            {item.nome}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, fontSize: '9px', letterSpacing: '0.05em', color: '#64748b', textTransform: 'uppercase' }}>
            <Wheat size={12} color="#10b981" />
            Fórmula / Dieta
          </div>
        </div>
      ),
      align: 'left' as const,
    },
    {
      header: 'M.S. / Custo kg MS',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'center' }}>
          <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800, background: 'hsl(var(--bg-main))', color: '#475569', border: '1px solid #e2e8f0' }}>
            {item.percMS || item.percentual_ms || 0}% MS
          </span>
          <span style={{ fontSize: '12px', fontWeight: 900, color: '#059669' }}>
            R$ {(item.custoMS || 0).toFixed(2)}/kg MS
          </span>
          <span style={{ fontSize: '10px', fontWeight: 600, color: '#94a3b8' }}>
            R$ {Number(item.custo_por_kg || 0).toFixed(2)}/kg MN
          </span>
        </div>
      ),
      align: 'center' as const,
    },
    {
      header: 'Consumo Esperado',
      accessor: (item: any) => {
        const ce = item.consumo_esperado;
        return (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            {ce ? (
              <span style={{ padding: '3px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 800, background: 'hsl(217 91% 50% / 0.1)', color: 'hsl(217 91% 45%)', border: '1px solid hsl(217 91% 50% / 0.2)' }}>
                {ce}% PV
              </span>
            ) : (
              <span style={{ fontSize: '10px', color: '#94a3b8', fontStyle: 'italic' }}>Não definido</span>
            )}
          </div>
        );
      },
      align: 'center' as const,
    },
    {
      header: 'Ingredientes',
      accessor: (item: any) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(var(--text-muted))' }}>
            {item.ingredientes?.length ?? 0} ingrediente{item.ingredientes?.length !== 1 ? 's' : ''}
          </span>
        </div>
      ),
      align: 'center' as const,
    },
    {
      header: 'Status',
      accessor: (item: any) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span className={`status-pill ${
            item.status === 'active' ? 'active' : item.status === 'archived' ? 'pending' : 'stopped'
          }`}>
            {item.status === 'active' ? 'Liberada' : item.status === 'archived' ? 'Arquivada' : 'Bloqueada'}
          </span>
        </div>
      ),
      align: 'center' as const,
    },
  ];

  const tratosColumns = [
    {
      header: 'Data / Hora',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 700, color: 'hsl(var(--text-main))' }}>
            {new Date(`${item.data_consumo}T12:00:00Z`).toLocaleDateString('pt-BR')}
          </span>
          <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>
            {new Date(item.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      ),
    },
    {
      header: 'Dieta',
      accessor: (item: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '30px', height: '30px', background: 'hsl(217 91% 50% / 0.1)', color: 'hsl(217 91% 50%)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Wheat size={15} />
          </div>
          <span style={{ fontWeight: 600, color: 'hsl(var(--text-main))' }}>
            {item.dietas?.nome || 'Sem dieta'}
          </span>
        </div>
      ),
    },
    {
      header: 'Destino',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
          <span style={{ fontWeight: 700, color: 'hsl(var(--text-main))' }}>
            {item.lotes ? item.lotes.nome : item.animais ? item.animais.brinco : 'Não especificado'}
          </span>
          <span style={{ fontSize: '10px', color: 'hsl(var(--text-muted))', fontWeight: 600 }}>
            {item.lotes ? 'Lote' : item.animais ? `${item.animais.raca || 'Animal'}` : ''}
          </span>
        </div>
      ),
    },
    {
      header: 'Depósito de Origem',
      accessor: (item: any) => (
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(var(--text-muted))' }}>
          {item.depositos?.nome || '—'}
        </span>
      ),
      align: 'center' as const,
    },
    {
      header: 'Qtd. (kg)',
      accessor: (item: any) => (
        <span style={{ fontWeight: 800, color: '#059669' }}>
          {Number(item.quantidade_kg).toFixed(2)} kg
        </span>
      ),
      align: 'center' as const,
    },
    {
      header: 'Custo Gerado',
      accessor: (item: any) => (
        <span style={{ fontWeight: 700, color: 'hsl(var(--text-main))' }}>
          {Number(item.valor_total_consumido).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </span>
      ),
      align: 'right' as const,
    },
  ];

  const insumosColumns = [
    {
      header: 'Insumo / Matéria Prima',
      accessor: (item: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            className="icon-wrapper"
            style={{
              background: 'rgba(16, 185, 129, 0.1)',
              color: '#10b981',
              padding: '8px',
              borderRadius: '8px',
            }}
          >
            <Package size={18} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 600, color: 'hsl(var(--text-main))' }}>{item.nome}</span>
            <span style={{ fontSize: '12px', color: 'hsl(var(--text-muted))' }}>
              Estoque: {item.estoque_atual || 0} {item.unidade_medida || 'kg'}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'Custo Médio',
      accessor: (item: any) => (
        <span style={{ fontWeight: 600, color: 'hsl(var(--text-main))' }}>
          {Number(item.custo_medio || item.preco_custo || 0).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          })}{' '}
          / {item.unidade_medida || 'kg'}
        </span>
      ),
      align: 'right' as const,
    },
  ];

  return (
    <div className="nutrition-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <Breadcrumb
            paths={[{ label: 'Pecuária', href: '/pecuaria/dashboard' }, { label: 'Nutrição' }]}
          />
          <h1 className="page-title">Nutrição</h1>
          <p className="page-subtitle">
            Formulações de precisão, controle de custos e monitoramento de conversão alimentar em
            tempo real.
          </p>
        </div>
        <div className="page-actions">
          <button className="glass-btn secondary" onClick={() => setIsSimulatorOpen(true)}>
            <Scale size={18} />
            SIMULADOR
          </button>

          <button className="glass-btn secondary" onClick={() => setIsFeedModalOpen(true)}>
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
        {loading
          ? Array(4)
              .fill(0)
              .map((_, i) => <KPISkeleton key={i} />)
          : stats?.map((stat: any, idx: number) => <TauzeStatCard key={idx} {...stat} />)}
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
                if (menu) {
                  menu.classList.toggle('active');
                }
              }}
            >
              <FileText size={20} />
            </button>
            <div id="export-menu-nutrition" className="export-menu">
              <button
                onClick={() => {
                  handleExport('csv');
                  document.getElementById('export-menu-nutrition')?.classList.remove('active');
                }}
              >
                Excel (.CSV)
              </button>
              <button
                onClick={() => {
                  handleExport('excel');
                  document.getElementById('export-menu-nutrition')?.classList.remove('active');
                }}
              >
                Excel (.xlsx)
              </button>
              <button
                onClick={() => {
                  handleExport('pdf');
                  document.getElementById('export-menu-nutrition')?.classList.remove('active');
                }}
              >
                PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      <NutritionFilterModal
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filters={filterValues}
        setFilters={setFilterValues}
        availableIngredients={availableIngredients}
      />

      <div className="management-content">
        {activeTab === 'DIETAS' ? (
          <ModernTable
            emptyState={
              <EmptyState
                title="Nenhuma dieta formulada"
                description="Não há formulações registradas para esta unidade."
                actionLabel="Nova Dieta"
                onAction={handleOpenCreate}
                icon={Utensils}
              />
            }
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
                <button
                  className="action-dot info"
                  onClick={() => handleViewHistory(item.id)}
                  title="Logs"
                >
                  <History size={18} />
                </button>
                {can('pecuaria', 'edit') && (
                  <button
                    className="action-dot edit"
                    onClick={() => handleOpenEdit(item)}
                    title="Editar"
                  >
                    <Edit3 size={18} />
                  </button>
                )}
                {can('pecuaria', 'delete') && (
                  <button
                    className="action-dot delete"
                    onClick={() => handleDelete(item.id)}
                    title="Excluir"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            )}
          />
        ) : activeTab === 'INSUMOS' ? (
          <ModernTable
            emptyState={
              <EmptyState
                title="Nenhuma matéria prima cadastrada"
                description="Cadastre insumos nutricionais no módulo de Estoque para visualizá-los aqui."
                actionLabel="Ir para Estoque"
                onAction={() => (window.location.href = '/pecuaria/estoque')}
                icon={Package}
              />
            }
            data={insumosList}
            columns={insumosColumns}
            loading={isLoadingInsumos}
            hideHeader={true}
            totalCount={insumosTotal}
            currentPage={insumosPage}
            onPageChange={setInsumosPage}
            itemsPerPage={insumosPageSize}
          />
        ) : (
          <ModernTable
            emptyState={
              <EmptyState
                title="Nenhum trato registrado"
                description="Você ainda não possui histórico de tratos e consumos para esta unidade."
                actionLabel="Lançar Trato"
                onAction={() => setIsFeedModalOpen(true)}
                icon={Wheat}
              />
            }
            data={filteredTratos}
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
        lotes={lotesSimulador}
      />

      <BatchFeedForm
        isOpen={isFeedModalOpen}
        onClose={() => setIsFeedModalOpen(false)}
        onSubmit={handleFeedSubmit}
      />
    </div>
  );
};
