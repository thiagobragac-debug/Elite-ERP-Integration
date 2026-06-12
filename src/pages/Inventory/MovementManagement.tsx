import React, { useState, useEffect } from 'react';
import { usePersistentState } from '../../hooks/usePersistentState';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useSearchParams } from 'react-router-dom';

function buildSparkline(records: any[], dateField: string, valueField: string | null, buckets = 7): { value: number; label: string }[] {
  if (!records || records.length === 0) return [];
  const sorted = [...records].filter(r => r[dateField]).sort((a, b) => new Date(a[dateField]).getTime() - new Date(b[dateField]).getTime());
  if (sorted.length === 0) return [];
  const first = new Date(sorted[0][dateField]).getTime();
  const last = new Date(sorted[sorted.length - 1][dateField]).getTime();
  const totalMs = Math.max(last - first, 1);
  const bucketMs = totalMs / buckets;
  return Array.from({ length: buckets }, (_, i) => {
    const bStart = first + i * bucketMs;
    const bEnd = bStart + bucketMs;
    const inBucket = sorted.filter(r => { const t = new Date(r[dateField]).getTime(); return i === buckets - 1 ? t >= bStart && t <= bEnd : t >= bStart && t < bEnd; });
    const v = inBucket.length === 0 ? 0 : valueField ? inBucket.reduce((s, r) => s + Number(r[valueField] || 0), 0) : inBucket.length;
    return { value: Number(v.toFixed(2)), label: new Date(bStart + bucketMs / 2).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) };
  });
}
import { 
  ArrowRightLeft, 
  Plus, 
  Search, 
  Filter,
  ArrowUpRight, 
  ArrowDownLeft, 
  ChevronRight, 
  Calendar,
  Building2,
  FileText,
  Trash2,
  Edit3,
  Activity,
  Package,
  History,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/export';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { MovementForm } from '../../components/Forms/MovementForm';
import { HistoryModal } from '../../components/Modals/HistoryModal';
import { TauzeStatCard } from '../../components/Cards/TauzeStatCard';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { MovementFilterModal } from './components/MovementFilterModal';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { EmptyState } from '../../components/Feedback/EmptyState';
import toast from 'react-hot-toast';
import { Breadcrumb } from '../../components/Navigation/Breadcrumb';

export const MovementManagement: React.FC = () => {
  const { isGlobalMode, activeFarmId, activeTenantId, applyFarmFilter, canCreate, activeFarm } = useFarmFilter();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = usePersistentState('MovementManagement_isModalOpen', false);
  const [modalType, setModalType] = useState<'in' | 'out' | 'transfer'>('in');
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as 'LOG' | 'ANALYSIS') || 'LOG';
  const setActiveTab = (tab: string) => {
    setSearchParams(prev => { const n = new URLSearchParams(prev); n.set('tab', tab); return n; }, { replace: true });
  };
  const [selectedMovement, setSelectedMovement] = useState<any>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = usePersistentState('MovementManagement_isHistoryModalOpen', false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [stats, setStats] = useState<any[]>([
    { label: 'Movimentações', value: '---', icon: ArrowDownLeft, color: '#10b981', progress: 0, change: 'Volume de Log', sparkline: [] },
    { label: 'Entradas (Pag.)', value: '---', icon: ArrowUpRight, color: '#3b82f6', progress: 0, change: 'Entradas', sparkline: [] },
    { label: 'Saídas (Pag.)', value: '---', icon: Activity, color: '#166534', progress: 0, change: 'Saídas', sparkline: [] },
    { label: 'Sincronismo', value: 'Ativo', icon: Zap, color: '#f59e0b', progress: 100, change: 'Tempo Real', sparkline: [] },
  ]);
  const [showAdvancedFilters, setShowAdvancedFilters] = usePersistentState('MovementManagement_showAdvancedFilters', false);
  const [filterValues, setFilterValues] = useState({
    type: 'all',
    minAmount: 0,
    maxAmount: 1000000,
    dateStart: '',
    dateEnd: ''
  });

  // Server-side pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);

  const queryClient = useQueryClient();

  const { data: movementsData, isLoading: queryLoading, refetch: refetchMovements } = useQuery({
    queryKey: ['movements', activeTenantId, activeFarmId, isGlobalMode, page, searchTerm],
    queryFn: async () => {
      if (!activeFarmId && !isGlobalMode) {
        return { data: [], count: 0 };
      }
      let query = supabase.from('movimentacoes_estoque').select(`
        *,
        produtos (
          nome,
          unidade,
          categoria_id,
          categorias_sistema (
            nome
          )
        )
      `, { count: 'exact' });
      
      query = applyFarmFilter(query);

      if (searchTerm) {
        query = query.or(`responsavel.ilike.%${searchTerm}%,origem_destino.ilike.%${searchTerm}%`);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, count, error } = await query
        .order('data_movimentacao', { ascending: false })
        .range(from, to);
      
      if (error) throw error;
      const mapped = (data || []).map((m: any) => ({
        ...m,
        produtos: m.produtos ? {
          ...m.produtos,
          categoria: m.produtos.categorias_sistema?.nome || 'Geral'
        } : null
      }));
      return { data: mapped, count: count || 0 };
    },
    enabled: !!activeTenantId && (isGlobalMode || !!activeFarmId)
  });

  const movements = movementsData?.data || [];
  const totalCount = movementsData?.count || 0;
  const loading = queryLoading;

  useEffect(() => {
    if (movementsData) {
      const count = movementsData.count;
      const data = movementsData.data;
      setStats([
        { label: 'Movimentações', 
          value: count > 0 ? String(count) : '---', 
          icon: ArrowDownLeft, color: '#10b981', 
          progress: count > 0 ? 100 : 0, 
          change: count > 0 ? 'Volume de Log' : 'Sem movimentações',
          sparkline: buildSparkline(data || [], 'data', 'quantidade')
        },
        { label: 'Entradas (Pág.)', 
          value: (() => { const n = data.filter((m: any) => m.tipo === 'ENTRADA' || m.tipo === 'in').length; return n > 0 ? n : '---'; })(), 
          icon: ArrowUpRight, color: '#10b981', 
          progress: data.length > 0 ? (data.filter((m: any) => m.tipo === 'ENTRADA' || m.tipo === 'in').length / data.length) * 100 : 0, 
          change: 'Entradas desta página',
          sparkline: buildSparkline(data || [], 'data', 'quantidade')
        },
        { label: 'Saídas (Pág.)', 
          value: (() => { const n = data.filter((m: any) => m.tipo === 'SAIDA' || m.tipo === 'out').length; return n > 0 ? n : '---'; })(), 
          icon: Activity, color: '#ef4444', 
          progress: data.length > 0 ? (data.filter((m: any) => m.tipo === 'SAIDA' || m.tipo === 'out').length / data.length) * 100 : 0, 
          change: 'Saídas desta página',
          sparkline: buildSparkline(data || [], 'data', 'quantidade')
        },
        { label: 'Sincronismo', value: 'Ativo', icon: Zap, color: '#f59e0b', progress: 100, change: 'Tempo Real', sparkline: buildSparkline(data || [], 'data', 'quantidade') },
      ]);
    }
  }, [movementsData]);

  const movementMutation = useMutation({
    mutationFn: async ({ payloads, isEdit, id }: { payloads: any[]; isEdit: boolean; id?: string }) => {
      if (isEdit && id) {
        const { data, error } = await supabase
          .from('movimentacoes_estoque')
          .update(payloads[0])
          .eq('id', id)
          .select();
        if (error) throw error;
        return { data: data?.[0], isEdit: true, id };
      } else {
        const { data, error } = await supabase
          .from('movimentacoes_estoque')
          .insert(payloads)
          .select();
        if (error) throw error;
        return { data: data || [], isEdit: false };
      }
    },
    onMutate: async ({ payloads, isEdit, id }) => {
      const queryKey = ['movements', activeTenantId, activeFarmId, isGlobalMode, page, searchTerm];
      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData<any>(queryKey);

      if (previousData) {
        queryClient.setQueryData(queryKey, (old: any) => {
          if (!old) return old;
          let newDataList = [...old.data];
          if (isEdit && id) {
            newDataList = newDataList.map((item: any) => 
              item.id === id ? { ...item, ...payloads[0] } : item
            );
          } else {
            const optimisticItems = payloads.map((payload, idx) => ({
              id: `optimistic-${Date.now()}-${idx}`,
              ...payload,
              produtos: { nome: 'Insumo (Atualizando...)', unidade: '', categoria: '' }
            }));
            newDataList = [...optimisticItems, ...newDataList];
          }
          return {
            ...old,
            data: newDataList,
            count: isEdit ? old.count : old.count + payloads.length
          };
        });
      }

      return { previousData, queryKey };
    },
    onError: (err: any, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(context.queryKey, context.previousData);
      }
      toast.error('❌ Erro ao salvar movimentação: ' + err.message);
    },
    onSettled: (data, error, variables, context) => {
      queryClient.invalidateQueries({ queryKey: context?.queryKey });
      refetchMovements();
    }
  });

  const deleteMovementMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('movimentacoes_estoque').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onMutate: async (id) => {
      const queryKey = ['movements', activeTenantId, activeFarmId, isGlobalMode, page, searchTerm];
      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData<any>(queryKey);

      if (previousData) {
        queryClient.setQueryData(queryKey, (old: any) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.filter((item: any) => item.id !== id),
            count: Math.max(0, old.count - 1)
          };
        });
      }

      return { previousData, queryKey };
    },
    onError: (err: any, id, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(context.queryKey, context.previousData);
      }
      toast.error('❌ Erro ao excluir movimentação: ' + err.message);
    },
    onSettled: (data, error, id, context) => {
      queryClient.invalidateQueries({ queryKey: context?.queryKey });
      refetchMovements();
    }
  });

  const handleOpenCreate = (type: 'in' | 'out' | 'transfer') => {
    if (!activeFarmId || isGlobalMode) {
      toast.error('⚠️ Selecione uma unidade/fazenda específica no menu superior para lançar movimentações. Não é possível movimentar no modo Visão Global.');
      return;
    }
    setSelectedMovement(null);
    setModalType(type);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (move: any) => {
    if (!activeFarmId || isGlobalMode) {
      toast.error('⚠️ Selecione uma unidade/fazenda específica no menu superior para editar movimentações. Não é possível editar no modo Visão Global.');
      return;
    }
    setSelectedMovement(move);
    setModalType(move.tipo);
    setIsModalOpen(true);
  };

  const handleSubmit = async (formData: any) => {
    if (!activeFarm) return;

    const isEdit = !!selectedMovement;
    const items = formData.items || [];

    if (formData.tipo === 'transfer') {
      try {
        const outPayloads = [];
        const inPayloads = [];

        for (const item of items) {
          const { data: product } = await supabase
            .from('produtos')
            .select('custo_medio')
            .eq('id', item.produto_id)
            .single();
          
          const currentCost = product?.custo_medio || 0;

          outPayloads.push({
            produto_id: item.produto_id,
            tipo: 'out',
            quantidade: parseFloat(item.quantidade),
            deposito_id: formData.deposito_origem_id,
            valor_unitario: currentCost,
            data_movimentacao: formData.data_movimentacao,
            origem_destino: `Transferência para depósito destino`,
            responsavel: formData.responsavel,
            fazenda_id: activeFarm.id,
            tenant_id: activeFarm.tenantId
          });

          inPayloads.push({
            produto_id: item.produto_id,
            tipo: 'in',
            quantidade: parseFloat(item.quantidade),
            deposito_id: formData.destino_deposito_id,
            valor_unitario: currentCost,
            data_movimentacao: formData.data_movimentacao,
            origem_destino: `Transferência de depósito origem`,
            responsavel: formData.responsavel,
            fazenda_id: activeFarm.id,
            tenant_id: activeFarm.tenantId
          });
        }

        await movementMutation.mutateAsync({ payloads: [...outPayloads, ...inPayloads], isEdit: false });
        setIsModalOpen(false);
      } catch (err) {
        console.error('Error in transfer:', err);
      }
      return;
    }

    // Normal IN / OUT
    try {
      if (isEdit && items.length === 1) {
        const item = items[0];
        let costToUse = parseFloat(item.valor_unitario || 0);

        if (formData.tipo === 'out') {
          const { data: product } = await supabase
            .from('produtos')
            .select('custo_medio')
            .eq('id', item.produto_id)
            .single();
          costToUse = product?.custo_medio || 0;
        }

        const dbTipo = formData.tipo === 'in' ? 'ENTRADA' : formData.tipo === 'out' ? 'SAIDA' : 'TRANSFERENCIA';

        const payload = {
          produto_id: item.produto_id,
          tipo: dbTipo,
          quantidade: parseFloat(item.quantidade),
          deposito_id: item.deposito_id,
          custo_unitario: costToUse,
          data_movimentacao: formData.data_movimentacao,
          origem_destino: formData.origem_destino,
          responsavel: formData.responsavel,
          lote: item.lote || null,
          data_validade: item.data_validade || null,
          fazenda_id: activeFarm.id,
          tenant_id: activeFarm.tenantId
        };

        await movementMutation.mutateAsync({ payloads: [payload], isEdit: true, id: selectedMovement.id });
        setIsModalOpen(false);
      } else {
        const payloads = [];
        for (const item of items) {
          let costToUse = parseFloat(item.valor_unitario || 0);

          if (formData.tipo === 'out') {
            const { data: product } = await supabase
              .from('produtos')
              .select('custo_medio')
              .eq('id', item.produto_id)
              .single();
            costToUse = product?.custo_medio || 0;
          }

          const dbTipo = formData.tipo === 'in' ? 'ENTRADA' : formData.tipo === 'out' ? 'SAIDA' : 'TRANSFERENCIA';

          payloads.push({
            produto_id: item.produto_id,
            tipo: dbTipo,
            quantidade: parseFloat(item.quantidade),
            deposito_id: item.deposito_id,
            custo_unitario: costToUse,
            data_movimentacao: formData.data_movimentacao,
            origem_destino: formData.origem_destino,
            responsavel: formData.responsavel,
            lote: item.lote || null,
            data_validade: item.data_validade || null,
            fazenda_id: activeFarm.id,
            tenant_id: activeFarm.tenantId
          });
        }

        await movementMutation.mutateAsync({ payloads, isEdit: false });
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error('Insert error:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta movimentação?')) return;
    try {
      await deleteMovementMutation.mutateAsync(id);
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const filteredData = movements.filter(m => {
      const matchesSearch = (m.produtos?.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) || (m.responsavel || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTab = activeTab === 'all' ? true : 
                         activeTab === 'in' ? (m.tipo === 'ENTRADA') : 
                         activeTab === 'out' ? (m.tipo === 'SAIDA') : 
                         (m.tipo === 'TRANSFERENCIA');
      
      const matchesType = filterValues.type === 'all' || m.tipo === filterValues.type;
      const amount = Number(m.quantidade) * Number(m.custo_unitario || 0);
      const matchesAmount = amount >= filterValues.minAmount && amount <= filterValues.maxAmount;
      const matchesDate = (!filterValues.dateStart || new Date(m.data_movimentacao) >= new Date(filterValues.dateStart)) &&
                         (!filterValues.dateEnd || new Date(m.data_movimentacao) <= new Date(filterValues.dateEnd));

      return matchesSearch && matchesTab && matchesType && matchesAmount && matchesDate;
    });

    const exportData = filteredData.map(item => ({
      Data: item.data_movimentacao ? new Date(item.data_movimentacao).toLocaleDateString() : 'N/A',
      Produto: item.produtos?.nome || 'Item Excluído',
      Tipo: (item.tipo === 'ENTRADA' || item.tipo === 'in') ? 'Entrada' : (item.tipo === 'TRANSFERENCIA' || item.tipo === 'transfer') ? 'Transferência' : 'Saída',
      Quantidade: `${item.quantidade} ${item.produtos?.unidade || ''}`,
      Valor_Unitario: item.custo_unitario,
      Valor_Total: (Number(item.quantidade) * Number(item.custo_unitario || 0)),
      Responsavel: item.responsavel,
      Origem_Destino: item.origem_destino
    }));

    if (format === 'csv') exportToCSV(exportData, 'log_movimentacoes');
    else if (format === 'excel') exportToExcel(exportData, 'log_movimentacoes');
    else if (format === 'pdf') exportToPDF(exportData, 'log_movimentacoes', 'Relatório de Movimentação de Estoque');
  };

  const handleViewDetails = (move: any) => {
    setIsHistoryModalOpen(true);
    setHistoryItems([
      { id: '1', date: move.data_movimentacao, title: (move.tipo === 'ENTRADA' || move.tipo === 'in') ? 'Entrada de Mercadoria' : 'Saída de Mercadoria', subtitle: 'Produto: ' + (move.produtos?.nome || 'Item'), value: `${move.quantidade} ${move.produtos?.unidade || ''}`, status: (move.tipo === 'ENTRADA' || move.tipo === 'in') ? 'success' : 'error' },
      { id: '2', date: move.data_movimentacao, title: 'Documento de Origem', subtitle: move.origem_destino || 'N/A', value: 'Vinculado', status: 'info' },
      { id: '3', date: move.created_at, title: 'Operador', subtitle: move.responsavel, value: 'OK', status: 'success' },
    ]);
  };

  const columns = [
    {
      header: 'Produto / Código',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
          <span className="main-text" style={{ fontWeight: 800, color: '#1e293b' }}>
            {item.produtos?.nome || 'Item Excluído'}
          </span>
          <span className="sub-meta" style={{ color: '#64748b', fontSize: '10px', fontWeight: 600 }}>
            ID: {item.id?.slice(0, 8).toUpperCase()}
          </span>
        </div>
      ),
      align: 'left' as const
    },
    {
      header: 'Tipo de Operação',
      accessor: (item: any) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span className={`status-pill ${(item.tipo === 'ENTRADA' || item.tipo === 'in') ? 'success' : (item.tipo === 'TRANSFERENCIA' || item.tipo === 'transfer') ? 'warning' : 'danger'}`} style={{ textTransform: 'uppercase', fontWeight: 900 }}>
            {(item.tipo === 'ENTRADA' || item.tipo === 'in') ? 'Entrada' : (item.tipo === 'TRANSFERENCIA' || item.tipo === 'transfer') ? 'Transf.' : 'Saída'}
          </span>
        </div>
      ),
      align: 'center' as const
    },
    {
      header: 'Lote & Validade',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
            Lote: {item.lote || 'N/A'}
          </span>
          {item.data_validade ? (
            <span className={`flex items-center gap-1 text-[10px] font-bold ${new Date(item.data_validade) < new Date() ? 'text-red-500' : 'text-amber-500'}`}>
              <Calendar size={10} /> Val: {new Date(item.data_validade).toLocaleDateString()}
            </span>
          ) : (
            <span style={{ fontSize: '9px', fontWeight: 700, color: '#94a3b8' }}>
              Sem Validade
            </span>
          )}
        </div>
      ),
      align: 'left' as const
    },
    {
      header: 'Quantidade / Local',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: '#334155', fontSize: '12px' }}>
            <Package size={14} color="#64748b" />
            <span>{item.quantidade} {item.produtos?.unidade}</span>
          </div>
          {item.origem_destino && (
            <span style={{ fontSize: '9px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }} className="truncate max-w-[150px]">
              {item.origem_destino}
            </span>
          )}
        </div>
      ),
      align: 'left' as const
    },
    {
      header: 'Custo Unitário',
      accessor: (item: any) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.custo_unitario || 0),
    },
    {
      header: 'Valor Total',
      accessor: (item: any) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 900, color: '#059669' }}>
            R$ {(Number(item.quantidade) * Number(item.custo_unitario || 0)).toLocaleString('pt-BR')}
          </span>
        </div>
      ),
      align: 'center' as const
    },
    {
      header: 'Data / Responsável',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={12}/> {item.data_movimentacao ? new Date(item.data_movimentacao).toLocaleDateString() : 'N/A'}
          </span>
          <span style={{ fontSize: '9px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
            {item.responsavel || 'Sistema'}
          </span>
        </div>
      ),
      align: 'center' as const
    }
  ];

  return (
    <div className="movement-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <Breadcrumb paths={[{ label: 'Estoque & Insumos', href: '/estoque/dashboard' }, { label: 'Movimentações' }]} />
          <h1 className="page-title">Movimentações</h1>
          <p className="page-subtitle">Rastreabilidade total de entradas, saídas e transferências de insumos em tempo real.</p>
        </div>
        <div className="page-actions">
          <button className="glass-btn secondary" onClick={() => handleOpenCreate('transfer')}>
            <ArrowRightLeft size={18} />
            TRANSFERÊNCIA
          </button>
          <button className="glass-btn secondary" onClick={() => handleOpenCreate('out')}>
            <Plus size={18} />
            LANÇAR SAÍDA
          </button>
          <button className="primary-btn" onClick={() => handleOpenCreate('in')}>
            <Plus size={18} />
            LANÇAR ENTRADA
          </button>
        </div>
      </header>

      <div className="next-gen-kpi-grid">
        {loading ? (
          Array(4).fill(0).map((_, i) => <TauzeStatCard key={i} loading={true} label="" value="" icon={Package} color=""  periodLabel="Estoque Atual" />)
        ) : stats.map((stat, idx) => (
          <TauzeStatCard 
            key={idx}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            progress={stat.progress}
            change={stat.change || '+4.2%'}
            trend={stat.trend || 'up'}
            sparkline={stat.sparkline}
           periodLabel="Estoque Atual" />
        ))}
      </div>

      <div className="tauze-controls-row">
        <div className="tauze-tab-group">
          <button 
            className={`tauze-tab-item ${activeTab === 'LOG' ? 'active' : ''}`}
            onClick={() => { setActiveTab('LOG'); setPage(1); }}
          >
            Log de Movimentos
          </button>
          <button 
            className={`tauze-tab-item ${activeTab === 'ANALYSIS' ? 'active' : ''}`}
            onClick={() => { setActiveTab('ANALYSIS'); setPage(1); }}
          >
            Análise de Fluxo
          </button>
        </div>

        <div className="tauze-search-wrapper">
          <Search size={18} className="s-icon" />
          <input 
            type="text" 
            className="tauze-search-input"
            placeholder="Buscar por item, referência ou responsável..." 
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
                const menu = document.getElementById('export-menu-movements');
                if (menu) menu.classList.toggle('active');
              }}
            >
              <FileText size={20} />
            </button>
            <div id="export-menu-movements" className="export-menu">
              <button onClick={() => { handleExport('csv'); document.getElementById('export-menu-movements')?.classList.remove('active'); }}>Excel (.CSV)</button>
              <button onClick={() => { handleExport('excel'); document.getElementById('export-menu-movements')?.classList.remove('active'); }}>Excel (.xlsx)</button>
              <button onClick={() => { handleExport('pdf'); document.getElementById('export-menu-movements')?.classList.remove('active'); }}>PDF</button>
            </div>
          </div>
        </div>

        <MovementFilterModal 
          isOpen={showAdvancedFilters}
          onClose={() => setShowAdvancedFilters(false)}
          filters={filterValues}
          setFilters={setFilterValues}
        />
      </div>

      <div className="management-content">
          <ModernTable 
          emptyState={
            !searchTerm && filterValues.type === 'all' && filterValues.minAmount === 0 && filterValues.maxAmount === 1000000 && !filterValues.dateStart && !filterValues.dateEnd ? (
              <EmptyState
                title={activeTab === 'LOG' ? "Nenhum movimento registrado" : "Nenhuma análise disponível"}
                description={activeTab === 'LOG' ? "O log de movimentações está vazio no momento." : "Não há dados suficientes para a análise de fluxo."}
                actionLabel={activeTab === 'LOG' ? "Lançar Entrada" : undefined}
                onAction={activeTab === 'LOG' ? () => handleOpenCreate('in') : undefined}
                icon={ArrowRightLeft}
              />
            ) : (
              <EmptyState
                title="Nenhum registro encontrado"
                description="Sua busca não retornou resultados."
                icon={Search}
              />
            )
          } 
          data={movements}
          columns={columns}
          loading={loading}
          hideHeader={true}
          totalCount={totalCount}
          currentPage={page}
          onPageChange={setPage}
          itemsPerPage={pageSize}
          searchPlaceholder="Buscar por item, referência ou responsável..."
          actions={(item) => (
            <div className="modern-actions">
              <button className="action-dot info" onClick={() => handleViewDetails(item)} title="Detalhes">
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

      <MovementForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleSubmit} 
        defaultType={modalType}
        initialData={selectedMovement}
      />

      <HistoryModal 
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="Detalhes da Movimentação"
        subtitle="Rastreabilidade completa do lançamento"
        items={historyItems}
        loading={historyLoading}
      />
    </div>
  );
};
