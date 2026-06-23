import React, { useState, useEffect } from 'react';
import { usePersistentState } from '../../hooks/usePersistentState';

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
  const last = new Date(sorted[sorted.length - 1][dateField]).getTime();
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
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ShoppingCart,
  Plus,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  MoreVertical,
  Calendar,
  User,
  Package,
  AlertTriangle,
  ArrowRight,
  Trash2,
  Edit3,
  Zap,
  History,
  FileText,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/export';
import { supabase } from '../../lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTenant } from '../../contexts/TenantContext';
import { PurchaseRequestForm } from '../../components/Forms/PurchaseRequestForm';
import { HistoryModal } from '../../components/Modals/HistoryModal';
import { TauzeStatCard } from '../../components/Cards/TauzeStatCard';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { PurchaseRequestFilterModal } from './components/PurchaseRequestFilterModal';
import { EmptyState } from '../../components/Feedback/EmptyState';
import { useDebounce } from '../../hooks/useDebounce';
import toast from 'react-hot-toast';
import { Breadcrumb } from '../../components/Navigation/Breadcrumb';
import { useConfirm } from '../../contexts/ConfirmContext';

export const PurchaseRequest: React.FC = () => {
  const { activeTenantId } = useTenant();
  const { confirm } = useConfirm();
  const { activeFarm, isGlobalMode, activeFarmId, applyFarmFilter, canCreate, insertPayload } =
    useFarmFilter();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = usePersistentState('PurchaseRequest_isModalOpen', false);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as 'PENDING' | 'QUOTING') || 'PENDING';
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
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = usePersistentState(
    'PurchaseRequest_isHistoryModalOpen',
    false
  );
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = usePersistentState(
    'PurchaseRequest_showAdvancedFilters',
    false
  );
  const [filterValues, setFilterValues] = useState({
    status: 'all',
    priorities: [] as string[],
    departments: [] as string[],
    maxAmount: 100000,
    dateStart: '',
    dateEnd: '',
  });
  const [showOnlyUrgent, setShowOnlyUrgent] = usePersistentState(
    'PurchaseRequest_showOnlyUrgent',
    false
  );

  const debouncedSearch = useDebounce(searchTerm, 500);

  const isReady = isGlobalMode ? !!activeTenantId : !!activeFarmId;

  // React Query Fetch
  const { data: requests = [], isLoading: loading } = useQuery({
    queryKey: [
      'purchasing_requests',
      activeFarmId,
      activeTenantId,
      isGlobalMode,
      debouncedSearch,
      filterValues,
      activeTab,
    ],
    queryFn: async () => {
      let query = supabase
        .from('solicitacoes_compra')
        .select(
          'id, titulo, departamento, prioridade, status, descricao, valor_estimado, solicitante, fazenda_id, tenant_id, created_at'
        )
        .limit(500)
        .order('created_at', { ascending: false });
      query = applyFarmFilter(query);
      const { data, error } = await query;
      if (error) {
        throw error;
      }
      return data || [];
    },
    enabled: isReady,
  });

  // Dynamic stats calculation
  const abertas = requests.filter((r) => r.status === 'pending').length;
  const urgentes = requests.filter(
    (r) => r.prioridade === 'high' || r.prioridade === 'Urgente'
  ).length;
  const valorTotal = requests.reduce((acc, curr) => acc + Number(curr.valor_estimado || 0), 0);
  const totalRequests = requests.length || 1;
  const avgValue = valorTotal / totalRequests;

  const stats = [
    {
      label: 'Requisições Ativas',
      value: abertas > 0 ? abertas : '---',
      icon: ShoppingCart,
      color: '#10b981',
      progress: abertas > 0 ? 100 : 0,
      change: abertas > 0 ? 'Volume de Entrada' : 'Sem requisições',
      sparkline: buildSparkline(requests || [], 'created_at', null),
      trend: undefined,
      periodLabel: 'Mês Atual',
    },
    {
      label: 'Ticket Médio (Est.)',
      value:
        avgValue > 0
          ? avgValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
          : '---',
      icon: Zap,
      color: '#3b82f6',
      progress: avgValue > 0 ? 100 : 0,
      change: avgValue > 0 ? 'Impacto Financeiro' : 'Sem valores',
      sparkline: buildSparkline(requests || [], 'created_at', null),
      trend: undefined,
      periodLabel: 'Mês Atual',
    },
    {
      label: 'SLA Médio (dias)',
      value: (() => {
        const pendentes = requests.filter((r: any) => r.status === 'pending');
        if (pendentes.length === 0) {
          return '---';
        }
        const mediaMs =
          pendentes.reduce(
            (acc: number, r: any) => acc + (Date.now() - new Date(r.created_at).getTime()),
            0
          ) / pendentes.length;
        const mediaDias = mediaMs / (1000 * 3600 * 24);
        return `${mediaDias.toFixed(1)} dias`;
      })(),
      icon: Clock,
      color: '#f59e0b',
      progress: (() => {
        const pendentes = requests.filter((r: any) => r.status === 'pending');
        if (pendentes.length === 0) {
          return 0;
        }
        const mediaMs =
          pendentes.reduce(
            (acc: number, r: any) => acc + (Date.now() - new Date(r.created_at).getTime()),
            0
          ) / pendentes.length;
        const mediaDias = mediaMs / (1000 * 3600 * 24);
        return Math.max(0, Math.min(100, 100 - mediaDias * 10));
      })(),
      trend: 'up' as const,
      change: 'Tempo Médio de Espera',
      sparkline: buildSparkline(requests || [], 'created_at', null),
      periodLabel: 'Mês Atual',
    },
    {
      label: 'Nível de Urgência',
      value: urgentes > 0 ? urgentes : '---',
      icon: AlertTriangle,
      color: '#ef4444',
      progress: totalRequests > 1 ? (urgentes / totalRequests) * 100 : 0,
      trend: urgentes > 0 ? ('up' as const) : undefined,
      change: urgentes > 0 ? 'Prioridade Alta' : 'Sem urgêntes',
      sparkline: buildSparkline(requests || [], 'created_at', null),
      periodLabel: 'Mês Atual',
    },
  ];

  const handleOpenCreate = () => {
    setSelectedRequest(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (request: any) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  const saveRequestMutation = useMutation({
    mutationFn: async (formData: any) => {
      const payload = {
        titulo: formData.title || formData.titulo,
        departamento: formData.department || formData.departamento,
        prioridade: formData.priority || formData.prioridade,
        valor_estimado: parseFloat(formData.estimatedValue || formData.valor_estimado),
        descricao: formData.description || formData.descricao,
        status: selectedRequest?.status || 'pending',
        solicitante: formData.solicitante || 'Usuário Atual',
      };

      if (selectedRequest) {
        const { error } = await supabase
          .from('solicitacoes_compra')
          .update(payload)
          .eq('id', selectedRequest.id);
        if (error) {
          throw error;
        }
      } else {
        const { error } = await supabase
          .from('solicitacoes_compra')
          .insert([{ ...payload, ...insertPayload }]);
        if (error) {
          throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchasing_requests'] });
      setIsModalOpen(false);
      toast.success(selectedRequest ? 'Solicitação atualizada!' : 'Solicitação criada!');
    },
    onError: (err: any) => {
      toast.error(`Erro ao salvar solicitação: ${err.message}`);
    },
  });

  const handleSubmit = async (formData: any) => {
    if (!canCreate) {
      toast.error(
        '⚠️ Selecione uma unidade específica para criar uma nova solicitação. No modo Visão Global, o cadastro requer uma fazenda definida.'
      );
      return;
    }
    saveRequestMutation.mutate(formData);
  };

  const deleteRequestMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('solicitacoes_compra').delete().eq('id', id);
      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchasing_requests'] });
      toast.success('Solicitação excluída!');
    },
    onError: (err: any) => {
      toast.error(`Erro ao excluir solicitação: ${err.message}`);
    },
  });

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Atenção',
      description: 'Deseja excluir esta solicitação?',
      confirmText: 'Confirmar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!isConfirmed) {
      return;
    }
    deleteRequestMutation.mutate(id);
  };

  const handleViewDetails = (req: any) => {
    setIsHistoryModalOpen(true);
    setHistoryLoading(true);
    setTimeout(() => {
      setHistoryItems([
        {
          id: '1',
          date: req.created_at,
          title: `Item Solicitado: ${req.titulo || req.title}`,
          subtitle: `Departamento: ${req.departamento || req.department}`,
          value: `R$ ${Number(req.valor_estimado).toLocaleString()}`,
          status: req.status === 'approved' ? 'success' : 'pending',
        },
        {
          id: '2',
          date: req.created_at,
          title: 'Justificativa Operacional',
          subtitle: req.descricao || 'Necessidade de reposição',
          value: 'OK',
          status: 'info',
        },
        {
          id: '3',
          date: new Date().toISOString(),
          title: 'Triagem Compras',
          subtitle: 'Aguardando cotação de mercado',
          value: '--',
          status: 'warning',
        },
      ]);
      setHistoryLoading(false);
    }, 800);
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const filteredData = requests.filter((r) => {
      const matchesSearch =
        (r.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.titulo || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTab = activeTab === 'PENDING' ? r.status === 'pending' : r.status === 'approved';
      const matchesUrgency = showOnlyUrgent
        ? r.prioridade === 'high' || r.prioridade === 'Urgente'
        : true;
      const matchesPriority =
        filterValues.priorities.length === 0 ||
        filterValues.priorities.includes(r.prioridade?.toLowerCase());
      const matchesDept =
        filterValues.departments.length === 0 || filterValues.departments.includes(r.departamento);
      const matchesAmount =
        filterValues.maxAmount >= 100000 || Number(r.valor_estimado) <= filterValues.maxAmount;
      const matchesDate =
        (!filterValues.dateStart || new Date(r.created_at) >= new Date(filterValues.dateStart)) &&
        (!filterValues.dateEnd || new Date(r.created_at) <= new Date(filterValues.dateEnd));

      return (
        matchesSearch &&
        matchesTab &&
        matchesUrgency &&
        matchesPriority &&
        matchesDept &&
        matchesAmount &&
        matchesDate
      );
    });

    const exportData = filteredData.map((item) => ({
      ID: `#${item.id?.slice(0, 8)?.toUpperCase() || 'N/A'}`,
      Titulo: item.titulo || 'SOLICITAÇÃO',
      Departamento: item.departamento,
      Solicitante: item.solicitante || '---',
      Prioridade: item.prioridade,
      Valor_Estimado: `R$ ${Number(item.valor_estimado).toLocaleString()}`,
      Data: new Date(item.created_at).toLocaleDateString(),
      Status:
        item.status === 'approved'
          ? 'Em Cotação'
          : item.status === 'pending'
            ? 'Triagem'
            : 'Rejeitado',
    }));

    if (format === 'csv') {
      exportToCSV(exportData, 'solicitacoes_compra');
    } else if (format === 'excel') {
      exportToExcel(exportData, 'solicitacoes_compra');
    } else if (format === 'pdf') {
      exportToPDF(exportData, 'solicitacoes_compra', 'Relatório de Solicitações de Compra');
    }
  };

  const tableColumns = [
    {
      header: 'Solicitação / Código',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
          <span className="main-text" style={{ fontWeight: 800, color: '#1e293b' }}>
            {item.titulo || 'SOLICITAÇÃO'}
          </span>
          <span
            className="sub-meta"
            style={{ color: '#64748b', fontSize: '10px', fontWeight: 600 }}
          >
            ID: {item.id?.slice(0, 8).toUpperCase()}
          </span>
        </div>
      ),
      align: 'left' as const,
    },
    {
      header: 'Departamento / Origem',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: '#334155',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <User size={12} color="#94a3b8" />
            {item.departamento}
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
            Solicitante: {item.solicitante || 'N/A'}
          </span>
        </div>
      ),
      align: 'left' as const,
    },
    {
      header: 'Prioridade',
      accessor: (item: any) => {
        const isUrgent =
          item.prioridade === 'high' ||
          item.prioridade === 'urgent' ||
          item.prioridade === 'Urgente';
        return (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <span
              className={`status-pill ${isUrgent ? 'stopped' : 'info'}`}
              style={{ fontSize: '9px', padding: '2px 8px', fontWeight: 800 }}
            >
              {isUrgent ? 'URGENTE' : 'NORMAL'}
            </span>
          </div>
        );
      },
      align: 'center' as const,
    },
    {
      header: 'Dias em Espera',
      accessor: (item: any) => {
        const daysAgo = Math.floor(
          (new Date().getTime() - new Date(item.created_at).getTime()) / (1000 * 3600 * 24)
        );
        return (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              color: daysAgo > 3 ? '#ef4444' : '#475569',
              fontWeight: 700,
              fontSize: '12px',
            }}
          >
            <Clock size={14} />
            <span>
              {daysAgo} {daysAgo === 1 ? 'dia' : 'dias'}
            </span>
          </div>
        );
      },
      align: 'center' as const,
    },
    {
      header: 'Valor Estimado',
      accessor: (item: any) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 900, color: '#059669' }}>
            {Number(item.valor_estimado).toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
          </span>
        </div>
      ),
      align: 'center' as const,
    },
    {
      header: 'Status Triagem',
      accessor: (item: any) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span
            className={`status-pill ${item.status === 'approved' ? 'active' : item.status === 'pending' ? 'warning' : 'stopped'}`}
          >
            {item.status === 'approved'
              ? 'Em Cotação'
              : item.status === 'pending'
                ? 'Triagem'
                : 'Rejeitado'}
          </span>
        </div>
      ),
      align: 'center' as const,
    },
  ];

  return (
    <div className="requests-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <Breadcrumb
            paths={[
              { label: 'Compras', href: '/compras/dashboard' },
              { label: 'Solicitações de Compra' },
            ]}
          />
          <h1 className="page-title">Solicitações de Compra</h1>
          <p className="page-subtitle">
            Fluxo interno de requisições de materiais, serviços e reposição de ativos em tempo real.
          </p>
        </div>
        <div className="page-actions">
          <button
            className={`glass-btn secondary ${showOnlyUrgent ? 'active' : ''}`}
            onClick={() => setShowOnlyUrgent(!showOnlyUrgent)}
            style={
              showOnlyUrgent
                ? {
                    background: 'hsl(var(--brand) / 0.1)',
                    borderColor: 'hsl(var(--brand))',
                    color: 'hsl(var(--brand))',
                    boxShadow: '0 0 15px hsl(var(--brand) / 0.2)',
                  }
                : {}
            }
          >
            <Zap size={18} fill={showOnlyUrgent ? 'currentColor' : 'none'} />
            {showOnlyUrgent ? 'FILTRO ATIVO' : 'PRIORIDADES'}
          </button>
          <button className="primary-btn" onClick={handleOpenCreate}>
            <Plus size={18} />
            NOVA REQUISIÇÃO
          </button>
        </div>
      </header>

      <div className="next-gen-kpi-grid">
        {loading
          ? Array(4)
              .fill(0)
              .map((_, i) => (
                <TauzeStatCard
                  key={i}
                  loading={true}
                  label=""
                  value=""
                  icon={ShoppingCart}
                  color=""
                  periodLabel="Mês Atual"
                />
              ))
          : stats.map((stat, idx) => (
              <TauzeStatCard
                key={idx}
                label={stat.label}
                value={stat.value}
                icon={stat.icon}
                color={stat.color}
                progress={stat.progress}
                change={stat.change}
                trend={stat.trend}
                sparkline={stat.sparkline}
                periodLabel={stat.periodLabel}
              />
            ))}
      </div>

      <div className="tauze-controls-row">
        <div className="tauze-tab-group">
          <button
            className={`tauze-tab-item ${activeTab === 'PENDING' ? 'active' : ''}`}
            onClick={() => setActiveTab('PENDING')}
          >
            Aguardando Triagem
          </button>
          <button
            className={`tauze-tab-item ${activeTab === 'QUOTING' ? 'active' : ''}`}
            onClick={() => setActiveTab('QUOTING')}
          >
            Em Cotação
          </button>
        </div>

        <div className="tauze-search-wrapper">
          <Search size={18} className="s-icon" />
          <input
            type="text"
            className="tauze-search-input"
            placeholder="Pesquisar por título, solicitante ou departamento..."
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
                const menu = document.getElementById('export-menu-request');
                if (menu) {
                  menu.classList.toggle('active');
                }
              }}
            >
              <FileText size={20} />
            </button>
            <div id="export-menu-request" className="export-menu">
              <button
                onClick={() => {
                  handleExport('csv');
                  document.getElementById('export-menu-request')?.classList.remove('active');
                }}
              >
                Excel (.CSV)
              </button>
              <button
                onClick={() => {
                  handleExport('excel');
                  document.getElementById('export-menu-request')?.classList.remove('active');
                }}
              >
                Excel (.xlsx)
              </button>
              <button
                onClick={() => {
                  handleExport('pdf');
                  document.getElementById('export-menu-request')?.classList.remove('active');
                }}
              >
                PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      <PurchaseRequestFilterModal
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filters={filterValues}
        setFilters={setFilterValues}
      />

      <div className="management-content">
        <ModernTable
          emptyState={
            requests.filter((r) =>
              activeTab === 'PENDING' ? r.status === 'pending' : r.status === 'approved'
            ).length === 0 ? (
              <EmptyState
                title={
                  activeTab === 'PENDING'
                    ? 'Nenhuma solicitação aguardando triagem'
                    : 'Nenhuma solicitação em cotação'
                }
                description={
                  activeTab === 'PENDING'
                    ? 'Não há solicitações de compra aguardando triagem no momento.'
                    : 'Não há solicitações de compra em cotação de mercado.'
                }
                actionLabel="Nova Requisição"
                onAction={handleOpenCreate}
                icon={ShoppingCart}
              />
            ) : (
              <EmptyState
                title="Nenhum registro encontrado"
                description="Sua busca não retornou resultados."
                icon={Search}
              />
            )
          }
          data={requests.filter((r) => {
            const matchesSearch =
              (r.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
              (r.titulo || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesTab =
              activeTab === 'PENDING' ? r.status === 'pending' : r.status === 'approved';
            const matchesUrgency = showOnlyUrgent
              ? r.prioridade === 'high' || r.prioridade === 'Urgente'
              : true;

            const matchesPriority =
              filterValues.priorities.length === 0 ||
              filterValues.priorities.includes(r.prioridade?.toLowerCase());
            const matchesDept =
              filterValues.departments.length === 0 ||
              filterValues.departments.includes(r.departamento);
            const matchesAmount =
              filterValues.maxAmount >= 100000 ||
              Number(r.valor_estimado) <= filterValues.maxAmount;
            const matchesDate =
              (!filterValues.dateStart ||
                new Date(r.created_at) >= new Date(filterValues.dateStart)) &&
              (!filterValues.dateEnd || new Date(r.created_at) <= new Date(filterValues.dateEnd));

            return (
              matchesSearch &&
              matchesTab &&
              matchesUrgency &&
              matchesPriority &&
              matchesDept &&
              matchesAmount &&
              matchesDate
            );
          })}
          columns={tableColumns}
          loading={loading}
          hideHeader={true}
          actions={(item) => (
            <div className="modern-actions">
              <button
                className="action-dot info"
                onClick={() => handleViewDetails(item)}
                title="Dossiê"
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
      </div>

      <PurchaseRequestForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        initialData={selectedRequest}
      />

      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="Dossiê da Solicitação"
        subtitle="Rastreabilidade completa da requisição e aprovações"
        items={historyItems}
        loading={historyLoading}
      />
    </div>
  );
};
