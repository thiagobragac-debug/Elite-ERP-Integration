import { useState, useEffect, useMemo } from 'react';
import { usePersistentState } from '../../hooks/usePersistentState';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

function buildSparkline(
  records: any[],
  dateField: string,
  valueField: string | null,
  buckets = 7
): { value: number; label: string }[] {
  if (!records || records.length === 0) {
    return [];
  }
  const sorted = [...records]
    .filter((r) => r[dateField])
    .sort((a, b) => new Date(a[dateField]).getTime() - new Date(b[dateField]).getTime());
  if (sorted.length === 0) {
    return [];
  }
  const first = new Date(sorted[0][dateField]).getTime();
  let last = new Date(sorted[sorted.length - 1][dateField]).getTime();
  // Ensure at least 7 days spread if all records are on the same day to avoid duplicate labels
  if (last - first < 86400000 * 7) {
    last = first + 86400000 * 7;
  }
  const totalMs = Math.max(last - first, 1);
  const bucketMs = totalMs / buckets;
  return Array.from({ length: buckets }, (_, i) => {
    const bStart = first + i * bucketMs;
    const bEnd = bStart + bucketMs;
    const inBucket = sorted.filter((r) => {
      const t = new Date(r[dateField]).getTime();
      return i === buckets - 1 ? t >= bStart && t <= bEnd : t >= bStart && t < bEnd;
    });
    const v =
      inBucket.length === 0
        ? 0
        : valueField
          ? inBucket.reduce((s, r) => s + Number(r[valueField] || 0), 0)
          : inBucket.length;
    return {
      value: Number(v.toFixed(2)),
      label: new Date(bStart + bucketMs / 2).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
      }),
    };
  });
}

function formatPlural(count: number, singular: string, plural: string) {
  return count === 1 ? `1 ${singular}` : `${count} ${plural}`;
}

import { useNavigate } from 'react-router-dom';
import {
  Truck,
  Tractor,
  Car,
  Settings,
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
  Clock,
  Wrench as Tool,
  CheckCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/export';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { MachineForm } from '../../components/Forms/MachineForm';
import { MaintenanceForm } from '../../components/Forms/MaintenanceForm';
import { HistoryModal } from '../../components/Modals/HistoryModal';
import { EmptyState } from '../../components/Feedback/EmptyState';
import { TauzeStatCard } from '../../components/Cards/TauzeStatCard';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { formatNumber } from '../../utils/format';
import { KPISkeleton } from '../../components/Feedback/Skeleton';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { FleetFilterModal } from './components/FleetFilterModal';
import { useViewMode } from '../../hooks/useViewMode';
import toast from 'react-hot-toast';
import { Breadcrumb } from '../../components/Navigation/Breadcrumb';
import { useServerPagination } from '../../hooks/useServerPagination';
import { useConfirm } from '../../contexts/ConfirmContext';
import { hasDraftForKey } from '../../hooks/useFormDraft';
import { MaintenanceBoard } from './components/MaintenanceBoard';
import { KanbanSquare } from 'lucide-react';

export const FleetManagement: React.FC = () => {
  const { page, pageSize, totalCount, setTotalCount, setPage, getRange } = useServerPagination(20);
  const { confirm } = useConfirm();
  const {
    activeFarm,
    isGlobalMode,
    activeFarmId,
    activeTenantId,
    applyFarmFilter,
    canCreate,
    insertPayload,
  } = useFarmFilter();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formActionId, setFormActionId] = useState<number>(0);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = usePersistentState(
    'FleetManagement_isMaintenanceModalOpen',
    false
  );
  const [selectedMachine, setSelectedMachine] = useState<any>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = usePersistentState(
    'FleetManagement_isHistoryModalOpen',
    false
  );
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyTitle, setHistoryTitle] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = usePersistentState(
    'FleetManagement_showAdvancedFilters',
    false
  );
  const [filterValues, setFilterValues] = useState({
    status: 'all',
    marcas: [] as string[],
    minUsage: 0,
    maxUsage: 10000,
    minYear: '',
    maxYear: '',
  });
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'kanban'>('grid');

  // Auto-reabrir: restaura formulário se existe rascunho (usuário navegou sem cancelar)
  useEffect(() => {
    if (!activeTenantId || isModalOpen) return;
    if (hasDraftForKey(`machine_form_${activeTenantId}`)) setIsModalOpen(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTenantId]);

  const { data: machinesData, isLoading: loadingMachines } = useQuery({
    queryKey: ['machines', activeFarmId, activeTenantId, isGlobalMode, page, pageSize, searchTerm, activeCategory, filterValues],
    queryFn: async () => {
      const { from, to } = getRange();
      let machQuery = supabase.from('maquinas').select('*', { count: 'exact' }).eq('tenant_id', activeTenantId);
      machQuery = applyFarmFilter(machQuery);
      
      if (searchTerm) {
        machQuery = machQuery.or(`nome.ilike.%${searchTerm}%,placa.ilike.%${searchTerm}%,modelo.ilike.%${searchTerm}%`);
      }
      if (activeCategory !== 'All') {
        machQuery = machQuery.eq('tipo', activeCategory);
      }
      if (filterValues.status !== 'all') {
        machQuery = machQuery.eq('status', filterValues.status);
      }
      if (filterValues.marcas && filterValues.marcas.length > 0) {
        machQuery = machQuery.in('marca', filterValues.marcas);
      }
      if (filterValues.minYear) {
        machQuery = machQuery.gte('ano', parseInt(filterValues.minYear));
      }
      if (filterValues.maxYear) {
        machQuery = machQuery.lte('ano', parseInt(filterValues.maxYear));
      }

      machQuery = machQuery.range(from, to).order('created_at', { ascending: false });

      const { data, error, count } = await machQuery;
      if (error) {
        throw error;
      }
      setTotalCount(count || 0);

      const finalData = data || [];
      return finalData.map((m: any) => ({
        ...m,
        modelo: m.modelo || 'N/A',
        categoria: m.tipo || 'Geral',
        ano: m.ano || 'N/A',
        status: m.status || 'active',
      }));
    },
    enabled: isGlobalMode ? !!activeTenantId : !!activeFarmId,
  });

  const machines = machinesData || [];

  const { data: fuelData = [], isLoading: loadingFuel } = useQuery({
    queryKey: ['fuelStats', activeFarmId, activeTenantId, isGlobalMode],
    queryFn: async () => {
      let fuelQuery = supabase.from('abastecimentos').select('litros, maquina_id, created_at').eq('tenant_id', activeTenantId);
      fuelQuery = applyFarmFilter(fuelQuery);
      const { data, error } = await fuelQuery;
      if (error) {
        throw error;
      }
      return data || [];
    },
    enabled: isGlobalMode ? !!activeTenantId : !!activeFarmId,
  });

  const loading = loadingMachines || loadingFuel;

  const stats = useMemo(() => {
    if (machines.length === 0) {
      return [
        {
          label: 'Frota Operacional',
          value: '---',
          icon: Truck,
          color: 'hsl(var(--brand))',
          progress: 0,
          trend: 'none' as const,
          change: 'Sem máquinas',
          periodLabel: 'Frota Geral',
          sparkline: [],
        },
        {
          label: 'Em Manutenção',
          value: 0,
          icon: Tool,
          color: '#ef4444',
          progress: 0,
          trend: 'none' as const,
          change: 'Frota operacional',
          periodLabel: 'Parada Técnica',
          sparkline: [],
        },
        {
          label: 'Consumo Total (L)',
          value: '---',
          icon: Activity,
          color: '#f59e0b',
          progress: 0,
          trend: 'none' as const,
          change: 'Sem abastecimentos',
          periodLabel: 'Total Abastecido',
          sparkline: [],
        },
        {
          label: 'Disponibilidade',
          value: '---',
          icon: AlertCircle,
          color: '#10b981',
          progress: 0,
          trend: 'none' as const,
          change: 'Sem dados',
          periodLabel: 'Uptime Real',
          sparkline: [],
        },
      ];
    }
    const total = machines.length;
    const emManutencao = machines.filter((m: any) => m.status === 'maintenance').length;
    const emOperacao = total - emManutencao;
    const disponibilidade = total > 0 ? (emOperacao / total) * 100 : 0;

    const totalLitros = fuelData.reduce((acc: number, f: any) => acc + Number(f.litros || 0), 0);
    const machinesWithFuel = new Set(fuelData.map((f: any) => f.maquina_id)).size;
    const avgConsumo = machinesWithFuel > 0 ? totalLitros / machinesWithFuel : 0;

    return [
      {
        label: 'Frota Operacional',
        value: total > 0 ? total : '0',
        icon: Truck,
        color: total > 0 ? 'hsl(var(--brand))' : '#94a3b8',
        progress: 100,
        trend: 'none' as const,
        change: total > 0 ? formatPlural(total, 'ativo', 'ativos') : 'Sem máquinas',
        periodLabel: 'Frota Geral',
        sparkline: [],
      },
      {
        label: 'Em Manutenção',
        value: emManutencao,
        icon: Tool,
        color: emManutencao > 0 ? '#ef4444' : '#10b981',
        progress: total > 0 ? (emManutencao / total) * 100 : 0,
        trend: 'none' as const,
        change: emManutencao > 0 ? formatPlural(emManutencao, 'em oficina', 'em oficina') : 'Nenhum parado',
        periodLabel: 'Parada Técnica',
        sparkline: [],
      },
      {
        label: 'Consumo Total (L)',
        value: totalLitros > 0 ? `${totalLitros.toLocaleString('pt-BR')} L` : '0 L',
        icon: Activity,
        color: totalLitros > 0 ? '#f59e0b' : '#94a3b8',
        progress: totalLitros > 0 ? Math.min(100, (totalLitros / 1000) * 10) : 0,
        trend: totalLitros > 0 ? ('up' as const) : ('none' as const),
        change: avgConsumo > 0 ? `Média: ${avgConsumo.toFixed(0)}L/máq.` : 'Sem dados no período',
        periodLabel: 'Total Abastecido',
        sparkline: fuelData.length > 0 ? buildSparkline(fuelData, 'created_at', 'litros') : [],
      },
      {
        label: 'Disponibilidade',
        value: total > 0 ? `${disponibilidade.toFixed(1)}%` : '0%',
        icon: CheckCircle,
        color: total > 0 ? '#10b981' : '#94a3b8',
        progress: disponibilidade,
        trend: disponibilidade >= 80 ? ('up' as const) : ('down' as const),
        change: total > 0 ? 'Tempo de atividade' : 'Sem dados',
        periodLabel: 'Uptime Real',
        sparkline: [],
      },
    ];
  }, [machines, fuelData]);

  const handleOpenCreate = () => {
    setSelectedMachine(null);
    setFormActionId(Date.now());
    setIsModalOpen(true);
  };

  const handleOpenEdit = (machine: any) => {
    setSelectedMachine(machine);
    setFormActionId(Date.now());
    setIsModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async (formData: any) => {
      const payload = {
        nome: formData.nome,
        patrimonio: formData.patrimonio,
        tipo: formData.categoria,
        marca: formData.marca,
        modelo: formData.modelo,
        ano: parseInt(formData.ano_fabricacao) || null,
        ano_modelo: parseInt(formData.ano_modelo) || null,
        placa: formData.placa,
        chassi: formData.chassi,
        combustivel: formData.combustivel,
        capacidade_tanque: parseFloat(formData.capacidade_tanque) || null,
        valor_compra: parseFloat(formData.valor_compra) || null,
        potencia: parseInt(formData.potencia) || null,
        peso_operacional: parseFloat(formData.peso_operacional) || null,
        intervalo_revisao: parseInt(formData.intervalo_revisao) || 250,
        consumo_estimado: parseFloat(formData.consumo_estimado) || null,
        data_proxima_revisao: formData.data_proxima_revisao || null,
        status: formData.status || 'active',
        observacoes: formData.observacoes,
        tipo_medidor:
          formData.categoria === 'Trator' || formData.categoria === 'Implemento'
            ? 'Horômetro'
            : 'Odômetro',
        horimetro_atual: parseFloat(formData.horimetro_inicial) || 0,
        quilometragem_atual: parseFloat(formData.quilometragem_inicial) || 0,
        ...insertPayload,
      };

      if (selectedMachine) {
        const { error } = await supabase
          .from('maquinas')
          .update(payload)
          .eq('id', selectedMachine.id).eq('tenant_id', activeTenantId);
        if (error) {
          throw error;
        }
      } else {
        const { error } = await supabase.from('maquinas').insert([payload]);
        if (error) {
          throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['machines', activeFarmId, activeTenantId, isGlobalMode],
      });
      setIsModalOpen(false);
      toast.success(
        selectedMachine ? 'Ativo atualizado com sucesso!' : 'Ativo cadastrado com sucesso!'
      );
    },
    onError: (err: any) => {
      toast.error(`Erro ao salvar máquina: ${err.message}`);
    },
  });

  const handleSubmit = async (formData: any) => {
    if (!canCreate && !selectedMachine) {
      toast.error(
        '⚠️ Selecione uma unidade específica para cadastrar um novo ativo. No modo Visão Global, a fazenda proprietária deve ser definida.'
      );
      return;
    }
    saveMutation.mutate(formData);
  };

  const maintenanceMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from('manutencao_frota').insert([
        {
          maquina_id: data.maquina_id,
          tipo: data.tipo,
          descricao: data.descricao,
          data_inicio: data.data_inicio,
          custo: (parseFloat(data.custo_pecas) || 0) + (parseFloat(data.custo_mao_obra) || 0),
          responsavel: data.responsavel,
          status: data.status,
          ...insertPayload,
        },
      ]);
      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['machines', activeFarmId, activeTenantId, isGlobalMode],
      });
      setIsMaintenanceModalOpen(false);
      toast.success('Manutenção registrada com sucesso!');
    },
    onError: (err: any) => {
      toast.error(`Erro ao salvar manutenção: ${err.message}`);
    },
  });

  const handleMaintenanceSubmit = async (data: any) => {
    if (!canCreate) {
      toast.error(
        '⚠️ Selecione uma unidade específica para registrar uma manutenção. No modo Visão Global, a fazenda deve ser definida.'
      );
      return;
    }
    maintenanceMutation.mutate(data);
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('maquinas').delete().eq('id', id).eq('tenant_id', activeTenantId);
      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['machines', activeFarmId, activeTenantId, isGlobalMode],
      });
      toast.success('Ativo excluído com sucesso!');
    },
    onError: (err: any) => {
      toast.error(`Erro ao excluir ativo: ${err.message}`);
    },
  });

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Atenção',
      description: 'Deseja excluir este ativo?',
      confirmText: 'Confirmar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!isConfirmed) {
      return;
    }
    deleteMutation.mutate(id);
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const filteredData = machines.filter((m) => {
      return true; // Pagination is server-side, but export handles filtered data if we fetch all. To simplify, we rely on the page data for export or we should ideally fetch all for export. Here we export the current page or fetch all if needed. Since we only have `machines` state for current page, we'll export current page.
    });

    const exportData = filteredData.map((item) => ({
      Nome: item.nome,
      Categoria: item.categoria,
      Marca: item.marca || '-',
      Modelo: item.modelo || '-',
      Ano: item.ano || '-',
      Placa: item.placa || '-',
      Uso_Atual: item.horimetro_atual
        ? `${item.horimetro_atual}h`
        : item.quilometragem_atual
          ? `${item.quilometragem_atual}km`
          : '0',
      Status:
        item.status === 'active'
          ? 'Em Campo'
          : item.status === 'maintenance'
            ? 'Manutenção'
            : 'Parado',
      Combustivel: item.combustivel || '-',
    }));

    if (format === 'csv') {
      exportToCSV(exportData, 'frota_veiculos');
    } else if (format === 'excel') {
      exportToExcel(exportData, 'frota_veiculos');
    } else if (format === 'pdf') {
      exportToPDF(exportData, 'frota_veiculos', 'Relatório de Frota e Maquinários');
    }
  };

  const handleViewHistory = async (machine: any) => {
    setHistoryTitle(`Histórico: ${machine.nome}`);
    setIsHistoryModalOpen(true);
    setHistoryLoading(true);
    try {
      // Buscar histórico real de manutenções e abastecimentos do banco
      const [maintResult, fuelResult] = await Promise.all([
        supabase
          .from('manutencao_frota')
          .select('*', { count: 'exact' }).eq('tenant_id', activeTenantId)
          .eq('maquina_id', machine.id)
          .order('data_inicio', { ascending: false }),
        supabase
          .from('abastecimentos')
          .select('*', { count: 'exact' }).eq('tenant_id', activeTenantId)
          .eq('maquina_id', machine.id)
          .order('data', { ascending: false }),
      ]);

      const maintItems = (maintResult.data || []).map((m: any) => ({
        id: m.id,
        date: m.data_inicio,
        title: `Manutenção: ${m.tipo || 'Geral'}`,
        subtitle: m.descricao || 'Sem descrição',
        value:
          m.custo > 0
            ? Number(m.custo).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            : 'Sem custo',
        status: m.status === 'CONCLUIDO' || m.status === 'completed' ? 'success' : 'warning',
      }));

      const fuelItems = (fuelResult.data || []).map((f: any) => ({
        id: f.id,
        date: f.data,
        title: `Abastecimento: ${f.litros || 0}L`,
        subtitle: f.tipo_combustivel || 'Diesel',
        value:
          f.valor_total > 0
            ? Number(f.valor_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            : '---',
        status: 'info',
      }));

      const combined = [...maintItems, ...fuelItems]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);

      setHistoryItems(
        combined.length > 0
          ? combined
          : [
              {
                id: '0',
                date: new Date().toISOString(),
                title: 'Sem registros',
                subtitle: 'Nenhuma manutenção ou abastecimento encontrado para este ativo.',
                value: '---',
                status: 'info',
              },
            ]
      );
    } catch (err) {
      console.error('[FleetManagement] Erro ao buscar histórico:', err);
      setHistoryItems([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const columns = [
    {
      header: 'Ativo / Identificação',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
          <span className="main-text" style={{ fontWeight: 800, color: '#1e293b' }}>
            {item.nome}
          </span>
          <span
            className="sub-meta"
            style={{ color: '#64748b', fontSize: '10px', fontWeight: 600 }}
          >
            {item.placa || item.modelo || 'SEM PLACA'}
          </span>
        </div>
      ),
      align: 'left' as const,
    },
    {
      header: 'Categoria & Combustível',
      accessor: (item: any) => (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
            {item.categoria}
          </span>
          <span
            className="sub-meta"
            style={{
              color: '#94a3b8',
              fontSize: '9px',
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            {item.combustivel || 'Diesel'}
          </span>
        </div>
      ),
      align: 'center' as const,
    },
    {
      header: 'Uso Atual',
      accessor: (item: any) => (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            fontSize: '12px',
            fontWeight: 700,
            color: '#0f172a',
          }}
        >
          <Gauge size={14} color="#6366f1" />
          <span>
            {item.horimetro_atual
              ? `${item.horimetro_atual} h`
              : item.quilometragem_atual
                ? `${item.quilometragem_atual} km`
                : '0'}
          </span>
        </div>
      ),
      align: 'center' as const,
    },
    {
      header: 'Eficiência Estimada',
      accessor: (item: any) => (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            fontSize: '12px',
            fontWeight: 700,
            color: '#475569',
          }}
        >
          <span>{item.consumo_estimado ? `${item.consumo_estimado} L/h` : '14.2 L/h'}</span>
        </div>
      ),
      align: 'center' as const,
    },
    {
      header: 'Próxima Revisão',
      accessor: (item: any) => {
        const current = item.horimetro_atual || item.quilometragem_atual || 0;
        const lastRev = item.ultimo_medidor_revisao || 0;
        const interval = item.intervalo_revisao || 250;
        const usageSinceLast = Math.max(0, current - lastRev);
        const remaining = Math.max(0, interval - usageSinceLast);
        const progressPercent = Math.min(100, (usageSinceLast / interval) * 100);
        const isCritical = progressPercent > 90;

        return (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              minWidth: '130px',
              margin: '0 auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '10px',
                fontWeight: 900,
                color: '#64748b',
              }}
            >
              <span>Faltam {remaining}h</span>
              <span
                style={{
                  color: isCritical ? '#f43f5e' : progressPercent > 70 ? '#f59e0b' : '#10b981',
                }}
              >
                {progressPercent.toFixed(0)}%
              </span>
            </div>
            <div
              style={{
                height: '6px',
                width: '100%',
                backgroundColor: '#f1f5f9',
                borderRadius: '99px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  transition: 'width 0.5s',
                  backgroundColor: isCritical
                    ? '#f43f5e'
                    : progressPercent > 70
                      ? '#f59e0b'
                      : '#10b981',
                  width: `${progressPercent}%`,
                }}
              />
            </div>
          </div>
        );
      },
      align: 'center' as const,
    },
    {
      header: 'Status Operacional',
      accessor: (item: any) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span
            className={`status-pill ${item.status === 'active' ? 'active' : item.status === 'maintenance' ? 'warning' : item.status === 'stopped' ? 'stopped' : 'inactive'}`}
          >
            {item.status === 'active'
              ? 'Operacional'
              : item.status === 'maintenance'
                ? 'Manutenção'
                : item.status === 'stopped'
                  ? 'Parado'
                  : 'Baixado (Inativo)'}
          </span>
        </div>
      ),
      align: 'center' as const,
    },
  ];

  const categories = ['All', 'Trator', 'Caminhão', 'Implemento', 'Picape', 'Máquina'];

  return (
    <div className="fleet-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <Breadcrumb
            paths={[
              { label: 'Máquina & Frota', href: '/frota/dashboard' },
              { label: 'Máquinas & Equipamentos' },
            ]}
          />
          <h1 className="page-title">Máquinas & Equipamentos</h1>
          <p className="page-subtitle">
            Telemetria de ativos, controle de manutenção e eficiência operacional do maquinário em
            tempo real.
          </p>
        </div>
        <div className="page-actions">
          <button className="primary-btn" onClick={handleOpenCreate}>
            <Plus size={18} />
            NOVO ATIVO
          </button>
        </div>
      </header>

      <div className="next-gen-kpi-grid">
        {loading
          ? Array(4)
              .fill(0)
              .map((_, i) => <KPISkeleton key={i} />)
          : stats.map((stat, idx) => (
              <TauzeStatCard
                key={idx}
                label={stat.label}
                value={stat.value}
                icon={stat.icon}
                color={stat.color}
                progress={stat.progress}
                change={stat.change}
                periodLabel={stat.periodLabel}
                sparkline={stat.sparkline}
                trend={stat.trend === 'up' || stat.trend === 'down' ? stat.trend : undefined}
              />
            ))}
      </div>

      <div className="tauze-controls-row">
        <div className="tauze-search-wrapper" style={{ flex: 1 }}>
          <Search size={18} className="s-icon" />
          <input
            type="text"
            className="tauze-search-input"
            style={{ width: '100%' }}
            placeholder="Pesquisar por placa, modelo ou chassi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <select 
          className="tauze-search-input" 
          style={{ width: '200px', cursor: 'pointer', height: '40px', borderRadius: '8px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--bg-main))', color: 'hsl(var(--text-main))', padding: '0 12px' }}
          value={activeCategory}
          onChange={(e) => setActiveCategory(e.target.value)}
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat === 'All' ? 'Todos os Tipos' : cat}
            </option>
          ))}
        </select>

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
          <button
            className={`view-btn ${viewMode === 'kanban' ? 'active' : ''}`}
            onClick={() => setViewMode('kanban')}
            title="Kanban de Manutenção"
          >
            <KanbanSquare size={18} />
          </button>
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
                const menu = document.getElementById('export-menu-fleet');
                if (menu) {
                  menu.classList.toggle('active');
                }
              }}
            >
              <FileText size={20} />
            </button>
            <div id="export-menu-fleet" className="export-menu">
              <button
                onClick={() => {
                  handleExport('csv');
                  document.getElementById('export-menu-fleet')?.classList.remove('active');
                }}
              >
                Excel (.CSV)
              </button>
              <button
                onClick={() => {
                  handleExport('excel');
                  document.getElementById('export-menu-fleet')?.classList.remove('active');
                }}
              >
                Excel (.xlsx)
              </button>
              <button
                onClick={() => {
                  handleExport('pdf');
                  document.getElementById('export-menu-fleet')?.classList.remove('active');
                }}
              >
                PDF
              </button>
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
        {viewMode === 'kanban' ? (
          <MaintenanceBoard />
        ) : viewMode === 'list' ? (
          <ModernTable
            emptyState={
              <EmptyState
                title="Nenhum ativo cadastrado"
                description="A frota desta unidade ainda não possui ativos registrados. Cadastre o primeiro maquinário para iniciar o monitoramento telemetria."
                actionLabel="Novo Ativo"
                onAction={handleOpenCreate}
                icon={Truck}
              />
            }
            data={machines}
            columns={columns}
            loading={loading}
            hideHeader={true}
            totalCount={totalCount}
            currentPage={page}
            onPageChange={setPage}
            itemsPerPage={pageSize}
            searchPlaceholder="Filtrar base de ativos..."
            actions={(item) => (
              <div className="modern-actions">
                <button
                  className="action-dot info"
                  onClick={() => handleViewHistory(item)}
                  title="Logs"
                >
                  <History size={18} />
                </button>
                <button
                  className="action-dot edit"
                  onClick={() => handleOpenEdit(item)}
                  title="Editar"
                >
                  <Edit3 size={18} />
                </button>
                <button
                  className="action-dot delete"
                  onClick={() => handleDelete(item.id)}
                  title="Excluir"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            )}
          />
        ) : (
          <div className="user-cards-grid">
            {(() => {
              const filteredMachines = machines;

              if (filteredMachines.length === 0) {
                return (
                  <div
                    className="user-card-premium"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      padding: '20px',
                      background: 'hsl(var(--bg-card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '24px',
                      gap: '6px',
                      minHeight: '180px',
                      height: '100%',
                      boxShadow: 'none',
                    }}
                  >
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        color: '#10b981',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Truck size={22} />
                    </div>
                    <h3
                      style={{
                        fontSize: '14px',
                        fontWeight: 800,
                        color: 'hsl(var(--text-main))',
                        margin: 0,
                      }}
                    >
                      Nenhum ativo encontrado
                    </h3>
                    <p
                      style={{
                        fontSize: '10.5px',
                        color: '#64748b',
                        margin: 0,
                        lineHeight: '1.3',
                        maxWidth: '260px',
                      }}
                    >
                      Não há maquinários que correspondam aos filtros atuais.
                    </p>
                    <button
                      className="primary-btn"
                      onClick={handleOpenCreate}
                      style={{
                        fontSize: '10.5px',
                        padding: '6px 12px',
                        height: '30px',
                        marginTop: '4px',
                        minHeight: 'auto',
                      }}
                    >
                      <Plus size={12} />
                      <span>NOVO ATIVO</span>
                    </button>
                  </div>
                );
              }

              return filteredMachines.map((m) => (
                <div
                  key={m.id}
                  className={`user-card-premium ${m.status === 'active' ? 'active' : m.status === 'maintenance' ? 'warning-badge' : m.status === 'stopped' ? 'danger-badge' : 'inactive-badge'}`}
                >
                  <div className="card-left-section">
                    <div className="card-avatar">
                      {m.categoria === 'Trator' ? <Tractor size={32} /> : 
                       m.categoria === 'Caminhão' ? <Truck size={32} /> :
                       m.categoria === 'Picape' ? <Car size={32} /> :
                       m.categoria === 'Implemento' ? <Settings size={32} /> :
                       <Truck size={32} />}
                    </div>
                    <div className="card-bottom-actions">
                      <button
                        className="action-icon-btn info"
                        onClick={() => handleViewHistory(m)}
                        title="Dossiê"
                      >
                        <History size={14} />
                      </button>
                      <button
                        className="action-icon-btn edit"
                        onClick={() => handleOpenEdit(m)}
                        title="Editar"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        className="action-icon-btn delete"
                        onClick={() => handleDelete(m.id)}
                        title="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="card-main-content">
                    <div className="card-header-info">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span 
                            style={{ 
                              width: '8px', 
                              height: '8px', 
                              borderRadius: '50%', 
                              backgroundColor: m.status === 'active' ? '#10b981' : '#94a3b8',
                              boxShadow: m.status === 'active' ? '0 0 8px rgba(16, 185, 137, 0.6)' : 'none'
                            }} 
                            title={m.status === 'active' ? 'Telemetria Online' : 'Telemetria Offline'}
                          />
                          {m.nome}
                        </h3>
                      </div>
                      <span className="card-role-badge">{m.categoria || 'Geral'}</span>
                    </div>

                    <div className="card-meta-grid">
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: '8px',
                          width: '100%',
                        }}
                      >
                        <div className="meta-item">
                          <FileText size={14} className="meta-icon" />
                          <span>{m.placa || m.modelo || 'Sem placa'}</span>
                        </div>
                        <div className="meta-item">
                          <Gauge size={14} className="meta-icon" />
                          <span>
                            {m.horimetro_atual
                              ? `${m.horimetro_atual}h`
                              : m.quilometragem_atual
                                ? `${m.quilometragem_atual}km`
                                : '0'}
                          </span>
                        </div>
                      </div>
                      <div className="meta-item">
                        <Zap size={14} className="meta-icon" style={{ color: '#8b5cf6' }} />
                        <span>
                          {m.potencia ? `${m.potencia}cv` : 'Potência N/D'} •{' '}
                          {m.peso_operacional
                            ? `${(m.peso_operacional / 1000).toFixed(1)}t`
                            : 'N/D'}
                        </span>
                      </div>
                      <div className="maintenance-countdown-tauze">
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
                                  style={{
                                    backgroundColor:
                                      progress > 85
                                        ? '#ef4444'
                                        : progress > 60
                                          ? '#f59e0b'
                                          : '#10b981',
                                  }}
                                />
                              </div>
                              <span className="countdown-text">{remaining}h restantes</span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              ));
            })()}
          </div>
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

        .card-left-section {
          width: 130px;
          flex-shrink: 0;
          background: hsl(var(--bg-main) / 0.5);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-right: 1px solid hsl(var(--border));
        }

        .card-avatar {
          width: 56px;
          height: 56px;
          background: #0f172a;
          color: white;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 900;
          margin-bottom: 8px;
          box-shadow: 0 10px 20px rgba(15, 23, 42, 0.2);
        }

        .card-main-content {
          flex: 1;
          padding: 12px 16px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-width: 0;
        }

        .card-header-info h3 {
          font-size: 16px;
          font-weight: 900;
          color: hsl(var(--text-main));
          margin-bottom: 2px;
          letter-spacing: -0.02em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .card-role-badge {
          display: inline-block;
          font-size: 9px;
          font-weight: 800;
          color: hsl(var(--brand));
          background: hsl(var(--brand) / 0.1);
          padding: 3px 8px;
          border-radius: 6px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .card-meta-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 4px;
          margin-top: 6px;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
          color: hsl(var(--text-muted));
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .meta-icon {
          color: #16a34a;
          flex-shrink: 0;
        }

        .card-bottom-actions {
          display: flex;
          flex-wrap: nowrap;
          justify-content: center;
          gap: 6px;
          width: 100%;
          margin-top: 8px;
        }

        .action-icon-btn {
          width: 32px;
          height: 32px;
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

        .maintenance-countdown-tauze {
          margin-top: 6px;
          padding: 6px 12px;
          background: hsl(var(--bg-main));
          border-radius: 10px;
          border: 1px solid hsl(var(--border));
        }

        .countdown-header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 9px;
          font-weight: 800;
          color: hsl(var(--text-muted));
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 4px;
        }

        .countdown-progress-wrapper {
          display: flex;
          flex-direction: column;
          gap: 4px;
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
        actionId={formActionId}
        onSubmit={handleSubmit}
        initialData={selectedMachine}
      />

      <MaintenanceForm
        isOpen={isMaintenanceModalOpen}
        onClose={() => setIsMaintenanceModalOpen(false)}
        actionId={formActionId}
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

