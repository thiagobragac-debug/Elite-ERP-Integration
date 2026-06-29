import React, { useState, useEffect } from 'react';
import { usePersistentState } from '../../hooks/usePersistentState';
import { useDebounce } from '../../hooks/useDebounce';
import { hasDraftForKey } from '../../hooks/useFormDraft';

import { useSearchParams } from 'react-router-dom';
import {
  HeartPulse,
  Plus,
  AlertCircle,
  ShieldCheck,
  Calendar,
  FlaskConical,
  Clock,
  Trash2,
  Edit3,
  Activity,
  CheckCircle2,
  Search,
  Filter,
  Stethoscope,
  ChevronRight,
  History,
  FileText,
} from 'lucide-react';
import { useConfirm } from '../../contexts/ConfirmContext';
import { motion, AnimatePresence } from 'framer-motion';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/export';
import { supabase } from '../../lib/supabase';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { useReportData } from '../../hooks/useReportData';
import { HealthForm } from '../../components/Forms/HealthForm';
import { HistoryModal } from '../../components/Modals/HistoryModal';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { TauzeStatCard } from '../../components/Cards/TauzeStatCard';
import { KPISkeleton } from '../../components/Feedback/Skeleton';
import { EmptyState } from '../../components/Feedback/EmptyState';
import { HealthProtocolsModal } from './components/HealthProtocolsModal';
import { HealthFilterModal } from './components/HealthFilterModal';
import './HealthManagement.css';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Breadcrumb } from '../../components/Navigation/Breadcrumb';
import { usePermissions } from '../../hooks/usePermissions';

interface HealthRecord {
  id: string;
  animal_id?: string;
  titulo?: string;
  produto?: string;
  dose?: string;
  tipo?: string;
  status?: string;
  data_manejo?: string;
  data_evento?: string;
  data_vacinacao?: string;
  data_nascimento?: string;
  peso?: number;
  carencia_dias?: number;
  isBlocked?: boolean;
  targetName?: string;
  observacao?: string;
  [key: string]: unknown;
}

export const HealthManagement: React.FC = () => {
  const { activeFarm, activeFarmId, activeTenantId, applyFarmFilter, canCreate, insertPayload } =
    useFarmFilter();
  const { can } = usePermissions();
  const { confirm } = useConfirm();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as 'MANEJOS' | 'PROTOCOLOS') || 'MANEJOS';
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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formActionId, setFormActionId] = useState<number>(0);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = usePersistentState(
    'HealthManagement_showAdvancedFilters',
    false
  );
  const [filterValues, setFilterValues] = useState({
    status: 'all',
    tipo: 'all',
    onlyBlocked: false,
    minCarencia: 0,
    dateStart: '',
    dateEnd: '',
  });
  const [isProtocolsModalOpen, setIsProtocolsModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // Auto-reabrir: restaura formulário se existe rascunho (usuário navegou sem cancelar)
  useEffect(() => {
    if (!activeTenantId || isModalOpen) {return;}
    if (hasDraftForKey(`health_form_${activeTenantId}`)) {setIsModalOpen(true);}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTenantId]);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const {
    data: rawEvents,
    stats,
    loading,
    error,
    totalCount,
    refresh,
  } = useReportData('sanidade-animal', { page, pageSize });
  const events = (rawEvents || []) as unknown as HealthRecord[];

  const handleOpenCreate = () => {
    setSelectedEvent(null);
    setFormActionId(Date.now());
    setIsModalOpen(true);
  };

  const handleOpenEdit = (event: any) => {
    setSelectedEvent(event);
    setFormActionId(Date.now());
    setIsModalOpen(true);
  };

  const deleteHealthMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('rpc_delete_health_event', {
        p_id: id,
        p_tenant_id: activeTenantId,
      });
      if (error) {
        throw error;
      }
    },
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: ['report'] });
      const previousData = queryClient.getQueryData(['report']);
      queryClient.setQueryData(['report'], (old: any) => {
        if (!old) {return old;}
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
      toast.error(`❌ Erro ao excluir registro: ${err.message}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report'] });
      toast.success('✅ Registro sanitário excluído!');
    },
  });

  const applyProtocolMutation = useMutation({
    mutationFn: async (insertions: any[]) => {
      // Utiliza a nova RPC transacional para garantir consistência no banco de dados (ACID)
      const { error } = await supabase.rpc('apply_health_protocol', {
        p_payload: insertions,
      });
      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report'] });
      setIsProtocolsModalOpen(false);
      toast.success('✅ Protocolo aplicado com sucesso!');
    },
    onError: (err: any) => {
      toast.error(`❌ Erro ao aplicar protocolo: ${err.message}`);
    },
  });

  const handleDeleteConfirmed = (id: string) => {
    deleteHealthMutation.mutate(id);
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Excluir registro sanitário?',
      description: 'Remove também a movimentação de estoque vinculada. Esta ação não pode ser desfeita.',
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (isConfirmed) {
      deleteHealthMutation.mutate(id);
    }
  };

  const handleViewDetails = (event: any) => {
    const items: any[] = [];

    // 1. Identificação do Manejo
    items.push({
      id: '1',
      date: event.data_manejo,
      title: event.titulo || event.produto || 'Manejo Sanitário',
      subtitle: `Tipo: ${event.tipo || '—'} • Via: ${event.via_aplicacao || 'N/A'} • Aplicador: ${event.aplicador || 'N/I'}`,
      value: event.status === 'REALIZADO' ? 'REALIZADO' : event.status || 'PENDENTE',
      status: event.status === 'REALIZADO' ? 'success' : event.status === 'PENDENTE' ? 'warning' : 'info',
    });

    // 2. Fármaco / Produto
    if (event.produto) {
      items.push({
        id: '2',
        date: event.data_manejo,
        title: `Fármaco: ${event.produto}`,
        subtitle: `Dose: ${event.dose || 'N/D'} • Local: ${event.local_aplicacao || 'N/I'}`,
        value: event.dose || '—',
        status: 'info',
      });
    }

    // 3. Carência Abate
    if ((event.carencia_abate_dias || 0) > 0) {
      const liberacao = new Date(event.data_manejo);
      liberacao.setDate(liberacao.getDate() + Number(event.carencia_abate_dias));
      const hoje = new Date();
      const diasRestantes = Math.ceil((liberacao.getTime() - hoje.getTime()) / 86400000);
      items.push({
        id: '3',
        date: event.data_manejo,
        title: `🥩 Carência Abate — ${event.carencia_abate_dias} dias`,
        subtitle: diasRestantes > 0
          ? `Bloqueio até ${liberacao.toLocaleDateString('pt-BR')} (${diasRestantes}d restantes)`
          : `Liberado em ${liberacao.toLocaleDateString('pt-BR')}`,
        value: diasRestantes > 0 ? 'BLOQUEADO' : 'LIBERADO',
        status: diasRestantes > 0 ? 'warning' : 'success',
      });
    }

    // 4. Carência Leite
    if ((event.carencia_leite_dias || 0) > 0) {
      const liberacao = new Date(event.data_manejo);
      liberacao.setDate(liberacao.getDate() + Number(event.carencia_leite_dias));
      const hoje = new Date();
      const diasRestantes = Math.ceil((liberacao.getTime() - hoje.getTime()) / 86400000);
      items.push({
        id: '4',
        date: event.data_manejo,
        title: `🥛 Carência Leite — ${event.carencia_leite_dias} dias`,
        subtitle: diasRestantes > 0
          ? `Descarte até ${liberacao.toLocaleDateString('pt-BR')} (${diasRestantes}d restantes)`
          : `Leite liberado em ${liberacao.toLocaleDateString('pt-BR')}`,
        value: diasRestantes > 0 ? 'DESCARTE' : 'LIBERADO',
        status: diasRestantes > 0 ? 'warning' : 'success',
      });
    }

    // 5. Vínculo com Protocolo Reprodutivo (detecta referência [PROTOCOLO:...])
    const protocolRef = (event.observacao || '').match(/\[PROTOCOLO:([^\]]+)\]/);
    if (protocolRef) {
      items.push({
        id: '5',
        date: event.data_manejo,
        title: '🔗 Origem: Protocolo Reprodutivo',
        subtitle: `Gerado automaticamente via Protocolo ID ${protocolRef[1]}. Acesse Reprodução > Protocolos para gerenciar.`,
        value: 'PROTOCOLO',
        status: 'info',
      });
    }

    // 6. Observação
    if (event.observacao && !protocolRef) {
      items.push({
        id: '6',
        date: event.data_manejo,
        title: 'Observações',
        subtitle: event.observacao,
        value: 'Nota',
        status: 'info',
      });
    }

    // 7. Veterinário responsável
    if (event.veterinario) {
      items.push({
        id: '7',
        date: event.data_manejo,
        title: `👨‍⚕️ Responsável: ${event.veterinario}`,
        subtitle: event.receituario ? `Receituário: ${event.receituario}` : 'Sem receituário registrado',
        value: 'Resp.',
        status: 'info',
      });
    }

    setIsHistoryModalOpen(true);
    setHistoryItems(items);
  };

  const tableColumns = [
    {
      header: 'Fármaco / Manejo',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
          <span className="main-text" style={{ fontWeight: 800, color: 'hsl(var(--text-main))' }}>
            {item.produto || item.titulo || 'Manejo Geral'}
          </span>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 700,
              fontSize: '10px',
              color: 'hsl(var(--text-muted))',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            <HeartPulse size={12} color={item.tipo === 'VACINA' ? '#6366f1' : '#10b981'} />
            {item.tipo} {item.via_aplicacao ? `• ${item.via_aplicacao}` : ''}
          </div>
        </div>
      ),
      align: 'left' as const,
    },
    {
      header: 'Alvo (Animal / Lote)',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
          <span className="main-text" style={{ fontWeight: 700, color: 'hsl(var(--text-secondary))' }}>
            {item.targetName}
          </span>
          <span
            className="sub-meta"
            style={{
              textTransform: 'uppercase',
              fontWeight: 700,
              fontSize: '9px',
              letterSpacing: '0.05em',
              color: '#94a3b8',
            }}
          >
            {item.targetType}
          </span>
        </div>
      ),
      align: 'left' as const,
    },
    {
      header: 'Dosagem & Local',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 700,
              color: 'hsl(var(--text-secondary))',
              fontSize: '12px',
            }}
          >
            <FlaskConical size={14} color="#3b82f6" />
            <span>{item.dose || 'N/A'}</span>
          </div>
        </div>
      ),
      align: 'left' as const,
    },
    {
      header: 'Segurança (Carência)',
      accessor: (item: any) => {
        if (item.isBlocked) {
          return (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '140px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  fontWeight: 900,
                  color: '#dc2626',
                  marginBottom: '2px',
                }}
              >
                <AlertCircle size={14} />
                <span>BLOQUEADO ({item.diasRestantes}d)</span>
              </div>
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 700,
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Liberação:{' '}
                {item.dataLiberacao instanceof Date &&
                !isNaN(new Date(item.dataLiberacao).getTime())
                  ? new Date(item.dataLiberacao).toLocaleDateString()
                  : '---'}
              </span>
            </div>
          );
        }
        return (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontWeight: 900,
              color: '#059669',
              justifyContent: 'center',
            }}
          >
            <CheckCircle2 size={14} />
            <span>LIBERADO</span>
          </div>
        );
      },
      align: 'center' as const,
    },
    {
      header: 'Data do Manejo',
      accessor: (item: any) => (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            color: 'hsl(var(--text-muted))',
            fontWeight: 600,
            fontSize: '12px',
          }}
        >
          <Calendar size={14} />
          <span>{item.data_manejo ? new Date(item.data_manejo).toLocaleDateString() : 'N/I'}</span>
        </div>
      ),
      align: 'center' as const,
    },
    {
      header: 'Status & Obs',
      accessor: (item: any) => (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
          }}
        >
          <span className={`status-pill ${item.status === 'REALIZADO' ? 'success' : 'pending'}`}>
            {item.status}
          </span>
          {item.observacao && (
            <span
              style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 600, maxWidth: '100px' }}
              className="truncate"
              title={item.observacao}
            >
              {item.observacao}
            </span>
          )}
        </div>
      ),
      align: 'center' as const,
    },
  ];

  const saveHealthMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (selectedEvent) {
        const updatePayload = Array.isArray(payload) ? { ...payload[0] } : { ...payload };
        delete updatePayload.produto_id;
        const { error } = await supabase
          .from('sanidade')
          .update(updatePayload)
          .eq('id', selectedEvent.id)
          .eq('tenant_id', activeTenantId);
        if (error) {
          throw error;
        }
      } else {
        const insertions = Array.isArray(payload)
          ? payload.map((item) => ({ ...item, ...insertPayload }))
          : [{ ...payload, ...insertPayload }];

        const recordsToInsert = insertions.map((p) => {
          const copy = { ...p };
          delete copy.produto_id;
          return copy;
        });

        const { error } = await supabase.rpc('register_health_event', {
          p_payload: recordsToInsert,
          p_tenant_id: activeTenantId,
          p_fazenda_id: activeFarmId,
        });

        if (error) {
          console.error('Erro ao registrar evento de sanidade via RPC:', error);
          throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report'] });
      // Invalida o dossie de TODOS os animais afetados (por animal_id ou lote)
      queryClient.invalidateQueries({ queryKey: ['animal_costs'] });
      queryClient.invalidateQueries({ queryKey: ['animal_weights'] });
      setIsModalOpen(false);
      toast.success(
        selectedEvent ? '✅ Registro sanitário atualizado!' : '✅ Registro sanitário cadastrado!'
      );
    },
    onError: (err: any) => {
      toast.error(`❌ Erro ao salvar registro sanitário: ${err.message}`);
    },
  });

  const handleSubmit = async (data: any) => {

    if (Array.isArray(data.produtos) && data.produtos.length > 0) {
      const payload = data.produtos.map((p: any) => {
        const custoTotal =
          Number(p.custo_total || 0) > 0
            ? Number(p.custo_total)
            : Number(p.custo_medio || 0) * Number(p.quantidade || 1);
        return {
          tipo: data.tipo,
          titulo: data.titulo,
          animal_id: data.animal_id || null,
          lote_id: data.lote_id || null,
          data_manejo: data.data_manejo,
          produto: p.produto || p.nome,
          produto_id: p.produto_id || null,
          dose: p.dose || String(p.quantidade || ''),
          via_aplicacao: p.via_aplicacao || null,
          local_aplicacao: p.local_aplicacao || null,
          carencia_abate_dias: parseInt(p.carencia_abate_dias) || 0,
          carencia_leite_dias: parseInt(p.carencia_leite_dias) || 0,
          temperatura_aplicacao: parseFloat(data.temperatura_aplicacao) || null,
          aplicador: data.aplicador || null,
          data_revisao: data.data_revisao || null,
          receituario: data.receituario || null,
          veterinario: data.veterinario || null,
          custo: custoTotal,
          observacao: data.observacao,
          status: data.status,
        };
      });
      saveHealthMutation.mutate(payload);
    } else {
      const payload = {
        tipo: data.tipo,
        titulo: data.titulo,
        animal_id: data.animal_id || null,
        lote_id: data.lote_id || null,
        data_manejo: data.data_manejo,
        produto: data.produto,
        produto_id: data.produto_id || null,
        dose: data.dose,
        via_aplicacao: data.via_aplicacao,
        local_aplicacao: data.local_aplicacao,
        carencia_abate_dias: parseInt(data.carencia_abate_dias) || 0,
        carencia_leite_dias: parseInt(data.carencia_leite_dias) || 0,
        temperatura_aplicacao: parseFloat(data.temperatura_aplicacao) || null,
        aplicador: data.aplicador || null,
        data_revisao: data.data_revisao || null,
        receituario: data.receituario || null,
        veterinario: data.veterinario || null,
        custo: parseFloat(String(data.custo || 0)) || 0,
        observacao: data.observacao,
        status: data.status,
      };
      saveHealthMutation.mutate(payload);
    }
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const exportData = events.map((item) => ({
      Data: item.data_manejo ? new Date(item.data_manejo).toLocaleDateString() : 'N/A',
      Titulo: item.titulo,
      Produto: item.produto,
      Dosagem: item.dose,
      Status: item.status,
      Carencia: item.carencia_dias ? `${item.carencia_dias} dias` : 'N/A',
    }));

    if (format === 'csv') {
      exportToCSV(exportData, 'log_saude');
    } else if (format === 'excel') {
      exportToExcel(exportData, 'log_saude');
    } else if (format === 'pdf') {
      exportToPDF(exportData, 'log_saude', 'Relatório de Manejo Sanitário');
    }
  };

  const filteredEvents = events.filter((e) => {
    const matchesSearch =
      (e.titulo || '').toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      (e.targetName || '').toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      (e.produto || '').toLowerCase().includes(debouncedSearchTerm.toLowerCase());
    
    // Se aba = MANEJOS, mostra tudo. Se aba = PROTOCOLOS, filtra apenas tipo PROTOCOLO ou eventos agrupados.
    const matchesTab = activeTab === 'MANEJOS' ? true : e.tipo === 'PROTOCOLO';

    const matchesStatus = filterValues.status === 'all' || e.status === filterValues.status;
    const matchesTipo = filterValues.tipo === 'all' || e.tipo === filterValues.tipo;
    const matchesBlocked = !filterValues.onlyBlocked || e.isBlocked;
    const matchesCarencia = (e.carencia_dias || 0) >= filterValues.minCarencia;

    const matchesDate =
      (!filterValues.dateStart || new Date(e.data_manejo ?? '') >= new Date(filterValues.dateStart)) &&
      (!filterValues.dateEnd || new Date(e.data_manejo ?? '') <= new Date(filterValues.dateEnd));

    return (
      matchesSearch &&
      matchesTab &&
      matchesStatus &&
      matchesTipo &&
      matchesBlocked &&
      matchesCarencia &&
      matchesDate
    );
  });

  return (
    <div className="health-mgmt-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <Breadcrumb
            paths={[{ label: 'Bovinocultura', href: '/bovinocultura/dashboard' }, { label: 'Sanidade' }]}
          />
          <h1 className="page-title">Sanidade</h1>
          <p className="page-subtitle">
            Rastreabilidade de vacinas, tratamentos e controle de carência medicamentosa em tempo
            real.
          </p>
        </div>
        <div className="page-actions">
          {can('bovinocultura', 'view') && (
            <button className="glass-btn secondary" onClick={() => setIsProtocolsModalOpen(true)}>
              <ShieldCheck size={18} />
              PROTOCOLOS
            </button>
          )}
          {can('bovinocultura', 'create') && (
            <button className="primary-btn" onClick={handleOpenCreate}>
              <Plus size={18} />
              NOVO REGISTRO
            </button>
          )}
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
            className={`tauze-tab-item ${activeTab === 'MANEJOS' ? 'active' : ''}`}
            onClick={() => setActiveTab('MANEJOS')}
          >
            Manejos Sanitários
          </button>
          <button
            className={`tauze-tab-item ${activeTab === 'PROTOCOLOS' ? 'active' : ''}`}
            onClick={() => setActiveTab('PROTOCOLOS')}
          >
            Protocolos Ativos
          </button>
        </div>

        <div className="tauze-search-wrapper">
          <Search size={18} className="s-icon" />
          <input
            type="text"
            className="tauze-search-input"
            placeholder="Filtrar por protocolo ou fármaco..."
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
                const menu = document.getElementById('export-menu-health');
                if (menu) {
                  menu.classList.toggle('active');
                }
              }}
            >
              <FileText size={20} />
            </button>
            <div id="export-menu-health" className="export-menu">
              <button
                onClick={() => {
                  handleExport('csv');
                  document.getElementById('export-menu-health')?.classList.remove('active');
                }}
              >
                Excel (.CSV)
              </button>
              <button
                onClick={() => {
                  handleExport('excel');
                  document.getElementById('export-menu-health')?.classList.remove('active');
                }}
              >
                Excel (.xlsx)
              </button>
              <button
                onClick={() => {
                  handleExport('pdf');
                  document.getElementById('export-menu-health')?.classList.remove('active');
                }}
              >
                PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      <HealthFilterModal
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filters={filterValues}
        setFilters={setFilterValues}
      />

      <div className="management-content">
        <ModernTable
          emptyState={
            <EmptyState
              title="Nenhum registro sanitário"
              description="Nenhum manejo ou protocolo foi lançado para esta unidade. Inicie o controle sanitário registrando a primeira vacinação ou tratamento."
              actionLabel="Novo Registro"
              onAction={handleOpenCreate}
              icon={HeartPulse}
            />
          }
          data={filteredEvents}
          columns={tableColumns}
          loading={loading}
          hideHeader={true}
          totalCount={totalCount}
          currentPage={page}
          onPageChange={setPage}
          itemsPerPage={pageSize}
          searchPlaceholder="Filtrar por protocolo ou fármaco..."
          actions={(item) => (
            <div className="modern-actions">
              <button
                className="action-dot info"
                onClick={() => handleViewDetails(item)}
                title="Detalhes"
              >
                <History size={18} />
              </button>
              {can('bovinocultura', 'edit') && (
                <button
                  className="action-dot edit"
                  onClick={() => handleOpenEdit(item)}
                  title="Editar"
                >
                  <Edit3 size={18} />
                </button>
              )}
              {can('bovinocultura', 'delete') && (
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
      </div>

      <HealthForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        actionId={formActionId}
        onSubmit={handleSubmit}
        initialData={selectedEvent}
        loading={saveHealthMutation.isPending || applyProtocolMutation.isPending}
      />

      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="Dossiê Sanitário"
        subtitle="Rastreabilidade completa do manejo e fármacos aplicados"
        items={historyItems}
        loading={false}
      />

      <HealthProtocolsModal
        isOpen={isProtocolsModalOpen}
        onClose={() => setIsProtocolsModalOpen(false)}
        onApply={async (data) => {
          const { protocol, targetType, targetId, startDate } = data;
          const start = new Date(startDate);
          const insertions = protocol.steps.map((step: any) => {
            const manejoDate = new Date(start);
            manejoDate.setDate(manejoDate.getDate() + step.day);

            return {
              ...insertPayload,
              titulo: `Protocolo: ${protocol.name}`,
              tipo: 'PROTOCOLO',
              data_manejo: manejoDate.toISOString().split('T')[0],
              produto: step.product,
              produto_id: step.produto_id || null,
              dose: step.dose,
              status: step.day === 0 ? 'REALIZADO' : 'PENDENTE',
              animal_id: targetType === 'ANIMAL' ? targetId : null,
              lote_id: targetType === 'LOTE' ? targetId : null,
              observacao: `Etapa D${step.day} do protocolo ${protocol.name}`,
            };
          });

          applyProtocolMutation.mutate(insertions);
        }}
      />
      <style>{`
        .export-dropdown-container {
          position: relative;
        }

        .export-menu {
          position: absolute;
          top: 100%;
          right: 0;
          background: hsl(var(--bg-card));
          border: 1px solid hsl(var(--border));
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          z-index: 100;
          display: none;
          flex-direction: column;
          padding: 8px;
          min-width: 160px;
          margin-top: 8px;
        }

        .export-menu.active {
          display: flex;
        }

        .export-menu button {
          padding: 10px 16px;
          text-align: left;
          background: transparent;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
          transition: all 0.2s;
        }

        .export-menu button:hover {
          background: hsl(var(--bg-main));
          color: #0f172a;
        }
      `}</style>
    </div>
  );
};
