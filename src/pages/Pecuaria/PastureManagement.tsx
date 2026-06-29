import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Trees,
  Plus,
  RefreshCw,
  Search,
  Filter,
  FileText,
  Map,
  LayoutGrid,
  List as ListIcon,
  Maximize2,
  Edit3,
  Trash2,
  Activity,
  History,
  AlertCircle,
  Sprout,
  UserPlus,
  AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReportData } from '../../hooks/useReportData';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { TauzeStatCard } from '../../components/Cards/TauzeStatCard';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { KPISkeleton } from '../../components/Feedback/Skeleton';
import { EmptyState } from '../../components/Feedback/EmptyState';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/export';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { PastureFilterModal } from './components/PastureFilterModal';
import { PastureForm } from '../../components/Forms/PastureForm';
import { PastureManejoForm } from '../../components/Forms/PastureManejoForm';
import { HistoryModal } from '../../components/Modals/HistoryModal';
import { supabase } from '../../lib/supabase';
import { PastureRenovationForm } from '../../components/Forms/PastureRenovationForm';
import { PastureRelocateForm } from '../../components/Forms/PastureRelocateForm';
import { AssignToPastoForm } from '../../components/Forms/AssignToPastoForm';
import { Breadcrumb } from '../../components/Navigation/Breadcrumb';
import { usePersistentState } from '../../hooks/usePersistentState';
import { useConfirm } from '../../contexts/ConfirmContext';
import { hasDraftForKey } from '../../hooks/useFormDraft';
import { normalizePastureStatus, PASTURE_STATUS, ANIMAL_STATUS_ATIVO, CARENCIA_QUIMICA_DIAS } from '../../constants/livestock';
import { usePermissions } from '../../hooks/usePermissions';

// ─── Helper: display unificado de status (usa enum — sem strings hardcoded) ───
function getPastureDisplay(
  status: string,
  occupancyPercent: number
): { badgeText: string; badgeClass: string; borderClass: string; statusPill: string } {
  const ns = normalizePastureStatus(status);
  if (ns === PASTURE_STATUS.RESTING)    {return { badgeText: 'DESCANSO',    badgeClass: 'info-badge',    borderClass: 'info-badge',    statusPill: 'info' };}
  if (ns === PASTURE_STATUS.DEGRADED)   {return { badgeText: 'DEGRADADO',   badgeClass: 'warning-badge', borderClass: 'warning-badge', statusPill: 'warning' };}
  if (ns === PASTURE_STATUS.RENOVATION) {return { badgeText: 'REFORMA',     badgeClass: 'stopped',       borderClass: 'danger-badge',  statusPill: 'danger' };}
  if (occupancyPercent > 100) {return { badgeText: 'SUPERLOTAÇÃO', badgeClass: 'stopped',       borderClass: 'danger-badge',  statusPill: 'danger' };}
  if (occupancyPercent > 80)  {return { badgeText: 'ATENÇÃO',      badgeClass: 'warning-badge', borderClass: 'warning-badge', statusPill: 'warning' };}
  if (occupancyPercent === 0) {return { badgeText: 'LIVRE',        badgeClass: 'active',        borderClass: 'active',        statusPill: 'success' };}
  return                               { badgeText: 'IDEAL',        badgeClass: 'active',        borderClass: 'active',        statusPill: 'success' };
}

const PastureManagement: React.FC = () => {
  const { confirm } = useConfirm();
  const { can } = usePermissions();
  const { activeTenantId, activeFarmId, canCreate, insertPayload, activeFarm, isGlobalMode } =
    useFarmFilter();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPasture, setSelectedPasture] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as 'all' | 'resting' | 'occupied') || 'all';
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
  const [showAdvancedFilters, setShowAdvancedFilters] = usePersistentState(
    'PastureManagement_showAdvancedFilters',
    false
  );
  const [filterValues, setFilterValues] = useState({
    status: 'all',
    capins: [] as string[],
    minArea: 0,
    maxArea: 500,
    minUA: 0,
    maxUA: 100,
    needsFertilization: false,
  });

  const [isManejoOpen, setIsManejoOpen] = useState(false);
  const [manejoPastureId, setManejoPastureId] = useState<string | undefined>(undefined);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedPastureId, setSelectedPastureId] = useState<string | null>(null);
  const [selectedPastureName, setSelectedPastureName] = useState('');
  const [isRelocateOpen, setIsRelocateOpen] = usePersistentState(
    'PastureManagement_isRelocateOpen',
    false
  );
  const [isAssignOpen, setIsAssignOpen] = usePersistentState(
    'PastureManagement_isAssignOpen',
    false
  );
  const [isRenovationOpen, setIsRenovationOpen] = useState(false);
  const [selectedRenovationPastureId, setSelectedRenovationPastureId] = useState<string | null>(
    null
  );
  const [selectedRenovationData, setSelectedRenovationData] = useState<any>(null);

  // Auto-reabrir: restaura formulário se existe rascunho (usuário navegou sem cancelar)
  useEffect(() => {
    if (!activeTenantId || isFormOpen) {return;}
    if (hasDraftForKey(`pasture_form_${activeTenantId}`)) {setIsFormOpen(true);}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTenantId]);

  const handleOpenManejo = (pasture: any) => {
    setManejoPastureId(pasture.id);
    setIsManejoOpen(true);
  };

  const { data: rawHistoryLogs = null, isLoading: historyLoading } = useQuery({
    queryKey: ['pastos', 'history', selectedPastureId],
    queryFn: async () => {
      if (!selectedPastureId || !activeTenantId) {return null;}

      // 1. Logs diretos do pasto
      const { data: pastoLogs, error: err1 } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('entity', 'pastos')
        .eq('entity_id', selectedPastureId)
        .eq('tenant_id', activeTenantId)
        .order('created_at', { ascending: false })
        .limit(100);

      // 2. Logs de lotes com filtro de tenant (P0: vazamento de dados)
      const { data: loteLogs, error: err2 } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('entity', 'lotes')
        .eq('tenant_id', activeTenantId)
        .order('created_at', { ascending: false })
        .limit(200);

      // 3. Logs de animais individuais (ASSIGN / TRANSFER com pasto)
      const { data: animalLogs, error: err3 } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('entity', 'Animal')
        .eq('tenant_id', activeTenantId)
        .or(`new_data->>pasto_id.eq.${selectedPastureId},old_data->>pasto_id.eq.${selectedPastureId}`)
        .order('created_at', { ascending: false })
        .limit(200);

      if (err1) {throw err1;}
      if (err2) {throw err2;}
      // err3 silencioso — pode não ter RLS permissão ou query JSONB não suportada

      return {
        pastoLogs: pastoLogs || [],
        loteLogs: loteLogs || [],
        animalLogs: animalLogs || [],
      };
    },
    enabled: !!selectedPastureId && !!activeTenantId,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const historyItems = React.useMemo(() => {
    if (!selectedPastureId || !rawHistoryLogs) {return [];}
    const { pastoLogs = [], loteLogs = [], animalLogs = [] } = rawHistoryLogs as any;

    const filteredLoteLogs = (loteLogs || []).filter(
      (item: any) =>
        item.new_data?.pasto_id === selectedPastureId ||
        item.old_data?.pasto_id === selectedPastureId
    );

    const allLogs = [...pastoLogs, ...filteredLoteLogs, ...(animalLogs || [])].sort(
      (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return allLogs.map((item: any) => {
      let title = 'Evento no Pasto';
      let subtitle = item.description || '';
      let value = 'INFO';
      let status: 'success' | 'warning' | 'info' = 'info';

      if (item.action === 'INSERT' && item.entity === 'pastos') {
        title = 'Pasto Cadastrado';
        subtitle = `Área inicial: ${item.new_data?.area || 0} ha | Capim: ${item.new_data?.tipo_capim || 'N/A'}`;
        value = 'CADASTRADO';
        status = 'success';
      } else if (item.action === 'MANEJO' || item.description?.includes('Manejo')) {
        title = 'Manejo Registrado';
        subtitle = item.description || '';
        value = 'MANEJO';
        status = 'info';
      } else if (item.action === 'UPDATE' && item.entity === 'pastos') {
        const oldStatus = item.old_data?.status;
        const newStatus = item.new_data?.status;
        if (oldStatus !== newStatus && newStatus) {
          const ns = normalizePastureStatus(newStatus);
          const nsLabel = ns === PASTURE_STATUS.RESTING ? 'Descanso' : ns === PASTURE_STATUS.GRAZING ? 'Pastejo' : ns === PASTURE_STATUS.RENOVATION ? 'Reforma' : 'Degradado';
          title = 'Mudança de Status';
          subtitle = `Pasto alterado para: ${nsLabel}`;
          value = nsLabel.toUpperCase();
          status = ns === PASTURE_STATUS.RESTING ? 'info' : ns === PASTURE_STATUS.GRAZING ? 'success' : 'warning';
        } else {
          title = 'Dados Atualizados';
          subtitle = 'Alterações nas configurações ou limites físicos';
          value = 'EDITADO';
          status = 'info';
        }
      } else if (item.entity === 'lotes') {
        const isEntrance = item.new_data?.pasto_id === selectedPastureId;
        title = isEntrance ? 'Entrada de Lote' : 'Saída de Lote';
        subtitle = isEntrance
          ? `Lote "${item.new_data?.nome}" transferido para este pasto`
          : `Lote "${item.old_data?.nome}" transferido para outro pasto`;
        value = isEntrance ? 'ENTRADA' : 'SAÍDA';
        status = isEntrance ? 'success' : 'warning';
      } else if (item.entity === 'Animal') {
        const isEntrance = item.new_data?.pasto_id === selectedPastureId;
        title = isEntrance ? 'Animal Associado' : 'Animal Transferido';
        subtitle = item.description || (isEntrance ? 'Animal alocado neste pasto' : 'Animal saiu deste pasto');
        value = isEntrance ? 'ENTRADA' : 'SAÍDA';
        status = isEntrance ? 'success' : 'warning';
      }

      return { id: item.id, date: item.created_at, title, subtitle, value, status };
    });
  }, [rawHistoryLogs, selectedPastureId]);

  const handleOpenHistory = (pasture: any) => {
    setSelectedPastureName(pasture.nome);
    setSelectedPastureId(pasture.id);
    setIsHistoryOpen(true);
  };

  const handleOpenCreate = () => {
    setSelectedPasture(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (pasture: any) => {
    setSelectedPasture(pasture);
    setIsFormOpen(true);
  };

  const handleOpenRenovation = async (pasture: any) => {
    setSelectedRenovationPastureId(pasture.id);
    const { data } = await supabase
      .from('reformas_pasto')
      .select('*, etapas:reforma_etapas(*)')
      .eq('pasto_id', pasture.id)
      .eq('status', 'em_andamento')
      .order('created_at', { ascending: false, foreignTable: 'reforma_etapas' })
      .limit(1)
      .maybeSingle();

    setSelectedRenovationData(data || null);
    setIsRenovationOpen(true);
  };

  const deletePastureMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pastos').update({ status: 'INATIVO' }).eq('id', id).eq('tenant_id', activeTenantId);
      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report'] });
      toast.success('✅ Pasto inativado para manter histórico.');
    },
    onError: (err: any) => {
      toast.error(`❌ Erro ao excluir pasto: ${err.message}`);
      refresh();
    },
  });

  const handleDelete = async (pasture: any) => {
    const {id} = pasture;

    // P0: verificar animais alocados antes de qualquer confirmação
    const { count } = await supabase
      .from('animais')
      .select('*', { count: 'exact', head: true })
      .eq('pasto_id', id)
      .in('status', ANIMAL_STATUS_ATIVO as unknown as string[]);

    if (count && count > 0) {
      toast.error(
        `Impossível excluir "${pasture.nome}": ${count} animal(is) ainda alocado(s). Remaneie-os primeiro.`,
        { duration: 5000 }
      );
      return;
    }

    const areaNum = parseFloat((pasture.area || '').toString().replace(/[^\d.-]/g, ''));
    const area = isNaN(areaNum) ? 0 : areaNum;

    const isConfirmed = await confirm({
      title: `Excluir "${pasture.nome}"?`,
      description: `Esta ação removerá permanentemente o pasto "${pasture.nome}" (${area} ha | ${pasture.tipo_capim || 'capim não informado'}). Essa operação não pode ser desfeita.`,
      confirmText: 'Excluir permanentemente',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!isConfirmed) {return;}

    deletePastureMutation.mutate(id);
  };

  const savePastureMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (selectedPasture) {
        const { error } = await supabase
          .from('pastos')
          .update(payload)
          .eq('id', selectedPasture.id);
        if (error) {
          throw error;
        }
      } else {
        const { error } = await supabase.from('pastos').insert([payload]);
        if (error) {
          throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report'] });
      setIsFormOpen(false);
      toast.success(selectedPasture ? '✅ Pasto atualizado!' : '✅ Pasto cadastrado!');
    },
    onError: (err: any) => {
      toast.error(`❌ Erro ao salvar pasto: ${err.message}`);
      refresh();
    },
  });

  const handleSubmit = async (data: any) => {
    const payload = {
      nome: data.nome,
      area: parseFloat(data.area) || 0,
      capacidade_ua: parseFloat(data.capacidade_ua) || 2.5,
      tipo_capim: data.tipo_capim,
      status: data.status || PASTURE_STATUS.GRAZING,
      sistema_pastejo: data.sistema_pastejo || 'Contínuo',
      data_ultima_fertilizacao: data.data_ultima_fertilizacao || null,
      topografia: data.topografia,
      tipo_solo: data.tipo_solo,
      agua: data.agua,
      observacoes: data.observacoes,
      estado_cerca: data.estado_cerca || 'Bom',
      sombreamento: data.sombreamento || 'Natural (Árvores)',
      plantas_daninhas: data.plantas_daninhas || 'Baixa Infestação',
      coordenadas: data.coordenadas || null,
      // Campos condicionais — Rotacionado
      num_piquetes: data.num_piquetes ? parseInt(data.num_piquetes) : null,
      dias_ocupacao: data.dias_ocupacao ? parseInt(data.dias_ocupacao) : null,
      dias_descanso: data.dias_descanso ? parseInt(data.dias_descanso) : null,
      // Campo condicional — Diferido
      data_diferimento: data.data_diferimento || null,
      fazenda_id: data.fazenda_id || activeFarmId,
      tenant_id: activeTenantId,
    };

    savePastureMutation.mutate(payload);
  };

  const saveRenovationMutation = useMutation({
    mutationFn: async (payload: any) => {
      const { error } = await supabase.rpc('register_pasture_renovation_step', {
        p_payload: payload,
        p_tenant_id: activeTenantId,
        p_fazenda_id: activeFarmId,
      });

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report'] });
      setIsRenovationOpen(false);
      toast.success('✅ Etapa de Reforma registrada com sucesso!');
      refresh();
    },
    onError: (err: any) => {
      toast.error(`❌ Erro ao registrar etapa: ${err.message}`);
    },
  });

  const handleRenovationSubmit = (data: any) => {
    saveRenovationMutation.mutate(data);
  };

  const vazioSanitarioMutation = useMutation({
    mutationFn: async (pastureId: string) => {
      const { error } = await supabase
        .from('pastos')
        .update({
          status: 'resting',
          lotacao: '0.00 UA',
        })
        .eq('id', pastureId);
      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report'] });
      toast.success('✅ Vazio sanitário iniciado!');
    },
    onError: (err: any) => {
      toast.error(`❌ Erro ao iniciar vazio sanitário: ${err.message}`);
      refresh();
    },
  });

  const handleVazioSanitario = async (pasture: any) => {
    // P0: verificar se há animais alocados — Vazio Sanitário requer pasto vazio
    const { count } = await supabase
      .from('animais')
      .select('*', { count: 'exact', head: true })
      .eq('pasto_id', pasture.id)
      .in('status', ANIMAL_STATUS_ATIVO as unknown as string[]);

    if (count && count > 0) {
      toast.error(
        `"${pasture.nome}" ainda possui ${count} animal(is) alocado(s). Remaneie-os usando o botão REMANEJAR antes de iniciar o Vazio Sanitário.`,
        { duration: 6000 }
      );
      return;
    }

    const isConfirmed = await confirm({
      title: `Iniciar Vazio Sanitário em "${pasture.nome}"?`,
      description: `O pasto será colocado em período de Descanso/Vazio Sanitário. Nenhum animal poderá ser alocado durante o período. Confirma?`,
      confirmText: 'Iniciar Vazio Sanitário',
      cancelText: 'Cancelar',
      variant: 'warning',
    });
    if (!isConfirmed) {return;}

    vazioSanitarioMutation.mutate(pasture.id);
  };

  const {
    data: fetchedPastures = [],
    stats,
    loading,
    error,
    totalCount,
    refresh,
  } = useReportData('pastagens', { page, pageSize });

  const filteredPastures = fetchedPastures.filter((p) => {
    const matchesSearch = p.nome?.toLowerCase().includes(searchTerm.toLowerCase());

    // Parse values safely
    const lotacaoNum = parseFloat((p.lotacao || '').toString().replace(/[^\d.-]/g, ''));
    const lotacaoVal = isNaN(lotacaoNum) ? 0 : lotacaoNum;

    const areaNum = parseFloat((p.area || '').toString().replace(/[^\d.-]/g, ''));
    const areaVal = isNaN(areaNum) ? 0 : areaNum;

    // Tab Filter — usa enum canônico (sem strings hardcoded)
    let matchesTab = true;
    const normalizedTabStatus = normalizePastureStatus(p.status || '');

    if (activeTab === 'resting') {
      matchesTab = normalizedTabStatus === PASTURE_STATUS.RESTING;
    } else if (activeTab === 'occupied') {
      matchesTab = lotacaoVal > 0 && normalizedTabStatus !== PASTURE_STATUS.RESTING && normalizedTabStatus !== PASTURE_STATUS.RENOVATION;
    } else if (activeTab === 'renovation') {
      matchesTab = normalizedTabStatus === PASTURE_STATUS.RENOVATION;
    }

    // Status Filter — usa enum canônico (P0 fix)
    let matchesStatus = true;
    if (filterValues.status !== 'all') {
      const normalizedExplicit = normalizePastureStatus(p.status || '');
      if (filterValues.status === 'grazing') {
        matchesStatus = normalizedExplicit === PASTURE_STATUS.GRAZING;
      } else if (filterValues.status === 'resting') {
        matchesStatus = normalizedExplicit === PASTURE_STATUS.RESTING;
      } else if (filterValues.status === 'degraded') {
        matchesStatus = normalizedExplicit === PASTURE_STATUS.DEGRADED;
      } else if (filterValues.status === 'renovation') {
        matchesStatus = normalizedExplicit === PASTURE_STATUS.RENOVATION;
      }
    }

    // Forrageiras/Capim Filter
    const matchesCapim =
      filterValues.capins.length === 0 || filterValues.capins.includes(p.tipo_capim);

    // Area Filter
    const matchesArea =
      filterValues.maxArea >= 500 ||
      (areaVal >= filterValues.minArea && areaVal <= filterValues.maxArea);

    // UA Filter
    const matchesUA =
      filterValues.maxUA >= 100 ||
      (lotacaoVal >= filterValues.minUA && lotacaoVal <= filterValues.maxUA);

    // Fertilization Filter
    let matchesFertilization = true;
    if (filterValues.needsFertilization) {
      if (p.data_ultima_fertilizacao) {
        const lastFert = new Date(p.data_ultima_fertilizacao);
        const diffDays = (new Date().getTime() - lastFert.getTime()) / (1000 * 60 * 60 * 24);
        matchesFertilization = diffDays > 90 || p.needs_fertilization === true;
      } else {
        matchesFertilization = true;
      }
    }

    return (
      matchesSearch &&
      matchesTab &&
      matchesStatus &&
      matchesCapim &&
      matchesArea &&
      matchesUA &&
      matchesFertilization
    );
  });

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const exportData = filteredPastures.map((p) => {
      const area = parseFloat((p.area || '').toString().replace(/[^\d.-]/g, '')) || 0;
      const uas = parseFloat((p.lotacao || '').toString().replace(/[^\d.-]/g, '')) || 0;
      const density = area > 0 ? (uas / area).toFixed(2) : '0';
      let fertDias = '-';
      if (p.data_ultima_fertilizacao) {
        fertDias = String(Math.floor((Date.now() - new Date(p.data_ultima_fertilizacao).getTime()) / 86400000));
      }
      return {
        'Nome do Pasto': p.nome,
        'Área (ha)': area,
        'Forrageira': p.tipo_capim || 'Não informado',
        'Status': normalizePastureStatus(p.status || ''),
        'Sistema de Pastejo': p.sistema_pastejo || 'Não informado',
        'Lotação (UA)': uas,
        'Capacidade (UA)': p.capacidade_ua || 'Não configurado',
        'Pressão (UA/ha)': density,
        'Tipo de Solo': p.tipo_solo || 'Não informado',
        'Topografia': p.topografia || 'Não informado',
        'Água': p.agua || 'Não informado',
        'Dias sem Adubação': fertDias,
        'Estado da Cerca': p.estado_cerca || 'Não informado',
        'Observações': p.observacoes || '',
      };
    });

    if (format === 'csv') {
      exportToCSV(exportData, 'relatorio_pastagens');
    } else if (format === 'excel') {
      exportToExcel(exportData, 'relatorio_pastagens');
    } else if (format === 'pdf') {
      exportToPDF(exportData, 'relatorio_pastagens', 'Gestão de Pastagens');
    }
  };

  const tableColumns = [
    {
      header: 'Identificação do Pasto',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
          <span className="main-text" style={{ fontWeight: 700, color: '#1e293b' }}>
            {item.nome}
          </span>
          <span
            className="sub-meta"
            style={{ color: '#64748b', fontSize: '10px', fontWeight: 600 }}
          >
            Área: {item.area || 0} ha
          </span>
        </div>
      ),
      align: 'left' as const,
    },
    {
      header: 'Forrageira / Capim',
      accessor: (item: any) => {
        let fertDays = -1;
        if (item.data_ultima_fertilizacao) {
          fertDays = Math.floor(
            (new Date().getTime() - new Date(item.data_ultima_fertilizacao).getTime()) /
              (1000 * 3600 * 24)
          );
        }
        const needsFert = item.needs_fertilization || fertDays > 120;

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
            <span className="main-text" style={{ fontWeight: 600, color: '#334155' }}>
              {item.tipo_capim || 'Não informado'}
            </span>
            <span
              className="sub-meta"
              style={{
                fontWeight: 700,
                fontSize: '9px',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: needsFert ? '#f43f5e' : '#64748b',
              }}
            >
              {fertDays >= 0 ? `${fertDays} dias sem adubo` : 'Sem adubação'}
            </span>
          </div>
        );
      },
      align: 'left' as const,
    },
    {
      header: 'Solo & Relevo',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
            {item.tipo_solo || 'Solo: N/A'}
          </span>
          <span
            className="sub-meta"
            style={{
              fontSize: '9px',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: '#94a3b8',
            }}
          >
            {item.topografia || 'Relevo: N/A'}
          </span>
        </div>
      ),
      align: 'left' as const,
    },
    {
      header: 'Água / Acesso',
      accessor: (item: any) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 800,
              background: item.agua ? '#eff6ff' : '#f8fafc',
              color: item.agua ? '#3b82f6' : '#94a3b8',
              border: `1px solid ${item.agua ? '#bfdbfe' : '#e2e8f0'}`,
            }}
          >
            {item.agua || 'N/A'}
          </span>
        </div>
      ),
      align: 'center' as const,
    },
    {
      header: 'Lotação & Pressão',
      accessor: (item: any) => {
        const uasNum = parseFloat((item.lotacao || '').toString().replace(/[^\d.-]/g, ''));
        const uas = isNaN(uasNum) ? 0 : uasNum;

        const areaNum = parseFloat((item.area || '').toString().replace(/[^\d.-]/g, ''));
        const area = isNaN(areaNum) || areaNum <= 0 ? 0 : areaNum;

        const density = area > 0 ? (uas / area).toFixed(2) : '0';
        return (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: 700,
                color: '#0f172a',
              }}
            >
              <Activity size={14} color="#6366f1" />
              <span>{uas} UA</span>
            </div>
            <span
              style={{
                fontSize: '10px',
                color: '#94a3b8',
                fontWeight: 700,
                marginTop: '4px',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              {density} UA/ha
            </span>
          </div>
        );
      },
      align: 'center' as const,
    },
    {
      header: 'Status Pastejo',
      accessor: (item: any) => {
        const uasNum = parseFloat((item.lotacao || '').toString().replace(/[^\d.-]/g, ''));
        const uas = isNaN(uasNum) ? 0 : uasNum;
        // P0: usa capacidade_ua total (não multiplica por área)
        const area = parseFloat((item.area || '').toString().replace(/[^\d.-]/g, '')) || 0;
        const maxUa = item.capacidade_ua > 0 ? item.capacidade_ua : area * 2.5;
        const occupancyPercent = maxUa > 0 ? (uas / maxUa) * 100 : 0;
        const { badgeText, statusPill } = getPastureDisplay(item.status || '', occupancyPercent);

        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            <span className={`status-pill ${statusPill}`}>{badgeText}</span>
          </div>
        );
      },
      align: 'center' as const,
    },
  ];

  if (error) {
    console.error('[PastureManagement] Error:', error);
  }

  return (
    <div className="pasture-mgmt-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <Breadcrumb
            paths={[{ label: 'Pecuária', href: '/pecuaria/dashboard' }, { label: 'Pastos' }]}
          />
          <h1 className="page-title">Pastos</h1>
          <p className="page-subtitle">
            Monitoramento de capacidade de suporte, pressão de pastejo e rotação.
          </p>
        </div>
        <div className="page-actions">
          <button className="glass-btn secondary" onClick={() => setIsAssignOpen(true)}>
            <UserPlus size={18} />
            ASSOCIAR ANIMAIS
          </button>
          <button className="glass-btn secondary" onClick={() => setIsRelocateOpen(true)}>
            <RefreshCw size={18} />
            REMANEJAR
          </button>
          <button className="primary-btn" onClick={handleOpenCreate}>
            <Plus size={18} />
            Novo Pasto
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
            className={`tauze-tab-item ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            Todos Pastos
          </button>
          <button
            className={`tauze-tab-item ${activeTab === 'resting' ? 'active' : ''}`}
            onClick={() => setActiveTab('resting')}
          >
            Em Descanso
          </button>
          <button
            className={`tauze-tab-item ${activeTab === 'occupied' ? 'active' : ''}`}
            onClick={() => setActiveTab('occupied')}
          >
            Em Uso
          </button>
          <button
            className={`tauze-tab-item ${activeTab === 'renovation' ? 'active' : ''}`}
            onClick={() => setActiveTab('renovation')}
          >
            Em Reforma
          </button>
        </div>

        <div className="tauze-search-wrapper">
          <Search size={18} className="s-icon" />
          <input
            type="text"
            className="tauze-search-input"
            placeholder="Buscar por nome do piquete..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="view-mode-toggle">
          <button
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            <ListIcon size={18} />
          </button>
          <button
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid size={18} />
          </button>
        </div>

        <div className="tauze-filter-group">
          <button
            className={`icon-btn-secondary ${showAdvancedFilters ? 'active' : ''}`}
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            title="Filtros Avançados"
          >
            <Filter size={20} />
          </button>
          <div className="export-dropdown-container">
            <button
              className="icon-btn-secondary"
              onClick={() => {
                const menu = document.getElementById('export-menu-pasture');
                if (menu) {
                  menu.classList.toggle('active');
                }
              }}
            >
              <FileText size={20} />
            </button>
            <div id="export-menu-pasture" className="export-menu">
              <button
                onClick={() => {
                  handleExport('csv');
                  document.getElementById('export-menu-pasture')?.classList.remove('active');
                }}
              >
                Excel (.CSV)
              </button>
              <button
                onClick={() => {
                  handleExport('excel');
                  document.getElementById('export-menu-pasture')?.classList.remove('active');
                }}
              >
                Excel (.xlsx)
              </button>
              <button
                onClick={() => {
                  handleExport('pdf');
                  document.getElementById('export-menu-pasture')?.classList.remove('active');
                }}
              >
                PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="management-content">
        {viewMode === 'list' ? (
          <ModernTable
            emptyState={
              fetchedPastures.length === 0 ? (
                <EmptyState
                  title="Nenhum pasto cadastrado"
                  description="Não há áreas de pastagem registradas. Comece cadastrando seus piquetes para monitorar a lotação."
                  actionLabel="Novo Pasto"
                  onAction={handleOpenCreate}
                  icon={Trees}
                />
              ) : (
                <EmptyState
                  title="Nenhum registro encontrado"
                  description="Sua busca não retornou resultados."
                  icon={Search}
                />
              )
            }
            data={filteredPastures}
            columns={tableColumns}
            loading={loading}
            hideHeader={true}
            totalCount={totalCount}
            currentPage={page}
            onPageChange={setPage}
            itemsPerPage={pageSize}
            actions={(item) => (
              <div className="modern-actions">
                <button
                  className="action-dot info"
                  title="Manejo / Rotação"
                  onClick={() => handleOpenManejo(item)}
                >
                  <Maximize2 size={18} />
                </button>
                <button
                  className="action-dot warning"
                  title="Reforma Agronômica"
                  onClick={() => handleOpenRenovation(item)}
                >
                  <Sprout size={18} />
                </button>
                <button
                  className="action-dot success"
                  title="Histórico"
                  onClick={() => handleOpenHistory(item)}
                >
                  <History size={18} />
                </button>
                {can('pecuaria', 'edit') && (
                  <button
                    className="action-dot edit"
                    title="Editar"
                    onClick={() => handleOpenEdit(item)}
                  >
                    <Edit3 size={18} />
                  </button>
                )}
                {can('pecuaria', 'delete') && (
                  <button
                    className="action-dot delete"
                    title="Excluir"
                    onClick={() => handleDelete(item)}
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            )}
          />
        ) : (
          <div className="pasture-cards-grid animate-fade-in">
            {filteredPastures.length === 0 ? (
              <div
                className="pasture-card-premium"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '20px',
                  textAlign: 'center',
                  gap: '6px',
                  minHeight: '180px',
                  height: '100%',
                  boxShadow: 'none',
                }}
              >
                <div
                  style={{
                    margin: 0,
                    width: '40px',
                    height: '40px',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    color: '#10b981',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {fetchedPastures.length === 0 ? <Trees size={22} /> : <Search size={22} />}
                </div>
                <h3
                  style={{
                    fontSize: '14px',
                    fontWeight: 800,
                    color: 'hsl(var(--text-main))',
                    margin: 0,
                  }}
                >
                  {fetchedPastures.length === 0
                    ? 'Nenhum pasto cadastrado'
                    : 'Nenhum registro encontrado'}
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
                  {fetchedPastures.length === 0
                    ? 'Não há áreas de pastagem registradas nesta unidade.'
                    : 'Sua busca não retornou resultados.'}
                </p>
                {fetchedPastures.length === 0 && (
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
                    <span>NOVO PASTO</span>
                  </button>
                )}
              </div>
            ) : (
              filteredPastures.map((p) => {
                const uasNum = parseFloat((p.lotacao || '').toString().replace(/[^\d.-]/g, ''));
                const uas = isNaN(uasNum) ? 0 : uasNum;

                const areaNum = parseFloat((p.area || '').toString().replace(/[^\d.-]/g, ''));
                const area = isNaN(areaNum) ? 0 : areaNum;

                // P0: capacidade_ua é o total de UA do pasto (não multiplica por área)
                const maxUa = p.capacidade_ua > 0 ? p.capacidade_ua : area * 2.5;
                const occupancyPercent = maxUa > 0 ? (uas / maxUa) * 100 : 0;

                // P2: carência química
                let emCarencia = false;
                let diasCarencia = 0;
                if (p.data_ultima_fertilizacao) {
                  diasCarencia = Math.floor((Date.now() - new Date(p.data_ultima_fertilizacao).getTime()) / 86400000);
                  emCarencia = diasCarencia >= 0 && diasCarencia < CARENCIA_QUIMICA_DIAS;
                }

                const { badgeText, badgeClass, borderClass } = getPastureDisplay(p.status || '', occupancyPercent);

                return (
                  <div key={p.id} className={`pasture-card-premium ${borderClass}`}>
                    <div className="card-left-section">
                      <div className="card-avatar">
                        <Trees size={28} />
                      </div>
                      <div className="card-bottom-actions">
                        <button
                          className="action-icon-btn info"
                          title="Manejo / Rotação"
                          onClick={() => handleOpenManejo(p)}
                        >
                          <Maximize2 size={14} />
                        </button>
                        <button
                          className="action-icon-btn warning"
                          title="Reforma Agronômica"
                          onClick={() => handleOpenRenovation(p)}
                        >
                          <Sprout size={14} />
                        </button>
                        <button
                          className="action-icon-btn success"
                          title="Histórico"
                          onClick={() => handleOpenHistory(p)}
                        >
                          <History size={14} />
                        </button>
                        {can('pecuaria', 'edit') && (
                          <button
                            className="action-icon-btn"
                            title="Editar"
                            onClick={() => handleOpenEdit(p)}
                          >
                            <Edit3 size={14} />
                          </button>
                        )}
                        {can('pecuaria', 'delete') && (
                          <button
                            className="action-icon-btn delete"
                            title="Excluir"
                            onClick={() => handleDelete(p)}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="card-main-content">
                      <div
                        className="card-header-info"
                        style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '6px' }}
                      >
                        <div className="title-row" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <h3
                            style={{
                              fontSize: '16px',
                              fontWeight: 800,
                              color: 'hsl(var(--text-main))',
                            }}
                          >
                            {p.nome}
                          </h3>
                          {/* P2: Indicador de carência química */}
                          {emCarencia && (
                            <span
                              title={`Carência química ativa: ${diasCarencia} de ${CARENCIA_QUIMICA_DIAS} dias`}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: '3px',
                                fontSize: '10px', fontWeight: 800, color: '#d97706',
                                background: '#fffbeb', border: '1px solid #fde68a',
                                borderRadius: '6px', padding: '2px 6px', flexShrink: 0,
                              }}
                            >
                              <AlertTriangle size={10} />
                              CARÊNCIA {CARENCIA_QUIMICA_DIAS - diasCarencia}d
                            </span>
                          )}
                        </div>
                        <div
                          className="meta-row"
                          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                          <span className={`status-pill mini ${badgeClass}`}>{badgeText}</span>
                          <div className="card-type-meta">{p.tipo_capim || 'Capim Padrão'}</div>
                        </div>
                      </div>

                      <div className="card-occupation-section">
                        <div className="occ-header">
                          <span>OCUPAÇÃO ATUAL</span>
                          <span className={occupancyPercent > 100 ? 'critical' : ''}>
                            {Math.round(occupancyPercent)}%
                          </span>
                        </div>
                        <div className="occ-bar-container">
                          <div
                            className={`occ-bar-fill ${occupancyPercent > 100 ? 'critical' : occupancyPercent > 80 ? 'warning' : ''}`}
                            style={{ width: `${Math.min(occupancyPercent, 100)}%` }}
                          />
                        </div>
                        <div className="occ-footer">
                          {uas.toFixed(2)} / {maxUa > 0 ? maxUa.toFixed(2) : '∞'} UA
                          {/* P2: Cabeças alocadas */}
                          {p.cabecas_alocadas > 0 && (
                            <span style={{ marginLeft: '6px', color: 'hsl(var(--text-muted))', fontSize: '10px', fontWeight: 700 }}>
                              · {p.cabecas_alocadas} cab.
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="card-footer-meta">
                        <div className="meta-item">
                          <Map size={12} />
                          <span>{area.toFixed(2)} ha</span>
                        </div>
                        <div className="meta-item">
                          <Activity size={12} />
                          <span className="card-farm-meta">
                            {isGlobalMode ? 'Multi-Fazenda' : activeFarm?.name || 'Fazenda 01'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <button className="add-pasture-card-premium" onClick={handleOpenCreate}>
              <Plus size={32} />
              <span>NOVO PASTO</span>
            </button>
          </div>
        )}
      </div>

      <PastureFilterModal
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filters={filterValues}
        setFilters={setFilterValues}
      />

      <PastureForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmit}
        initialData={selectedPasture}
      />

      <PastureManejoForm
        isOpen={isManejoOpen}
        onClose={() => setIsManejoOpen(false)}
        onSubmit={refresh}
        initialPastureId={manejoPastureId}
      />

      {selectedRenovationPastureId && (
        <PastureRenovationForm
          isOpen={isRenovationOpen}
          onClose={() => setIsRenovationOpen(false)}
          onSubmit={handleRenovationSubmit}
          pastoId={selectedRenovationPastureId}
          initialData={selectedRenovationData}
        />
      )}

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => {
          setIsHistoryOpen(false);
          setSelectedPastureId(null);
        }}
        title={`Histórico - ${selectedPastureName}`}
        subtitle="Linha do tempo de ocupação, manejos e manutenções"
        items={historyItems}
        loading={historyLoading}
      />

      <PastureRelocateForm
        isOpen={isRelocateOpen}
        onClose={() => setIsRelocateOpen(false)}
        onSubmit={() => {
          refresh();
          setIsRelocateOpen(false);
        }}
      />

      <AssignToPastoForm
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        onSubmit={() => {
          refresh();
          setIsAssignOpen(false);
        }}
      />
      <style>{`
        .pasture-cards-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          padding: 8px;
        }

        @media (max-width: 1400px) {
          .pasture-cards-grid { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 900px) {
          .pasture-cards-grid { grid-template-columns: 1fr; }
        }

        .pasture-card-premium {
          background: hsl(var(--bg-card));
          border-radius: 24px;
          border: 1px solid hsl(var(--border));
          display: flex;
          overflow: hidden;
          padding: 0;
          min-height: 180px;
          height: auto;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 15px rgba(0,0,0,0.03);
          position: relative;
          text-align: left;
        }

        .pasture-card-premium::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 6px;
          background: #94a3b8;
          transition: 0.3s;
        }

        .pasture-card-premium.active::before {
          background: #10b981;
          box-shadow: 4px 0 15px rgba(16, 185, 129, 0.3);
        }

        .pasture-card-premium.info-badge::before {
          background: #3b82f6;
          box-shadow: 4px 0 15px rgba(59, 130, 246, 0.3);
        }

        .pasture-card-premium.warning-badge::before {
          background: #f59e0b;
          box-shadow: 4px 0 15px rgba(245, 158, 11, 0.3);
        }

        .pasture-card-premium.danger-badge::before {
          background: #ef4444;
          box-shadow: 4px 0 15px rgba(239, 68, 68, 0.3);
        }

        .pasture-card-premium:hover {
          transform: translateY(-6px);
          box-shadow: var(--shadow-lg);
          border-color: hsl(var(--brand) / 0.35);
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
          background: hsl(var(--bg-card));
          color: hsl(var(--brand));
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 20px rgba(0,0,0,0.1);
          border: 1px solid hsl(var(--border));
          margin-bottom: 8px;
        }

        .card-main-content {
          flex: 1;
          padding: 12px 16px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-width: 0;
        }

        .pasture-card-premium .card-header-info .title-row {
          display: flex;
          justify-content: flex-start;
          align-items: center;
          margin-bottom: 2px;
          gap: 8px;
          min-width: 0;
        }

        .pasture-card-premium .card-header-info h3 {
          font-size: 16px;
          font-weight: 900;
          letter-spacing: -0.02em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          min-width: 0;
          flex: 0 1 auto;
        }

        .pasture-card-premium .status-pill.mini {
          font-size: 9px;
          padding: 3px 8px;
          border-radius: 6px;
          flex-shrink: 0;
          white-space: nowrap;
        }

        .card-type-meta {
          font-size: 10px;
          font-weight: 800;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .card-occupation-section {
          margin: 4px 0;
        }

        .occ-header {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          font-weight: 800;
          margin-bottom: 4px;
          color: #64748b;
        }

        .occ-header .critical { color: #ef4444; }

        .occ-bar-container {
          height: 6px;
          background: hsl(var(--bg-main));
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 4px;
        }

        .occ-bar-fill {
          height: 100%;
          background: #3b82f6;
          border-radius: 3px;
          transition: 0.5s;
        }

        .occ-bar-fill.warning { background: #f59e0b; }
        .occ-bar-fill.critical { background: #ef4444; }

        .occ-footer {
          font-size: 10px;
          font-weight: 600;
          color: #94a3b8;
        }

        .card-footer-meta {
          display: flex;
          gap: 12px;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
        }

        .card-farm-meta {
          color: #10b981;
          font-weight: 800;
        }

        .card-bottom-actions {
          display: flex;
          flex-wrap: wrap;
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
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: 0.2s;
        }

        .action-icon-btn:hover {
          background: hsl(var(--brand));
          color: white;
          border-color: hsl(var(--brand));
        }

        .action-icon-btn.delete:hover { background: #ef4444; border-color: #ef4444; }

        .add-pasture-card-premium {
          border: 2px dashed #e2e8f0;
          border-radius: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          background: transparent;
          cursor: pointer;
          color: #94a3b8;
          transition: 0.2s;
          min-height: 180px;
          height: 100%;
        }

        .add-pasture-card-premium:hover {
          border-color: #10b981;
          color: #10b981;
          background: rgba(16, 185, 129, 0.02);
        }

        .add-pasture-card-premium span { font-size: 11px; font-weight: 900; letter-spacing: 0.05em; }

        [data-theme='dark'] .pasture-card-premium,
        [data-theme='dark'] .add-pasture-card-premium {
          background: hsl(var(--bg-main)) !important;
          border-color: hsl(var(--border)) !important;
          color: hsl(var(--text-main)) !important;
        }

        [data-theme='dark'] .card-left-section {
          background: hsl(var(--bg-card) / 0.3) !important;
          border-color: hsl(var(--border)) !important;
        }

        [data-theme='dark'] .card-avatar,
        [data-theme='dark'] .action-icon-btn {
          background: hsl(var(--bg-card)) !important;
          border-color: hsl(var(--border)) !important;
          color: hsl(var(--text-main)) !important;
        }

        [data-theme='dark'] .action-icon-btn:hover {
          background: hsl(var(--brand)) !important;
          color: white !important;
        }

        [data-theme='dark'] .action-icon-btn.delete:hover {
          background: #ef4444 !important;
        }
      `}</style>
    </div>
  );
};

export default PastureManagement;
