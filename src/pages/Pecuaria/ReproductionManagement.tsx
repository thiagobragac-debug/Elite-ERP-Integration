import React, { useState, useEffect } from 'react';
import { usePersistentState } from '../../hooks/usePersistentState';

import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Heart,
  Plus,
  Search,
  Filter,
  Calendar,
  Activity,
  ChevronRight,
  MoreVertical,
  Baby,
  Thermometer,
  ClipboardCheck,
  Percent,
  Trash2,
  Edit3,
  History,
  TrendingUp,
  FileText,
  FlaskConical,
  LayoutTemplate,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/export';
import { supabase } from '../../lib/supabase';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { usePermissions } from '../../hooks/usePermissions';
import { useReportData } from '../../hooks/useReportData';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ReproductionForm } from '../../components/Forms/ReproductionForm';
import { HistoryModal } from '../../components/Modals/HistoryModal';
import { TauzeStatCard } from '../../components/Cards/TauzeStatCard';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { BatchReproModal } from './components/BatchReproModal';
import { ReproductionFilterModal } from './components/ReproductionFilterModal';
import { KPISkeleton } from '../../components/Feedback/Skeleton';
import { EmptyState } from '../../components/Feedback/EmptyState';
import toast from 'react-hot-toast';
import { Breadcrumb } from '../../components/Navigation/Breadcrumb';
import { useConfirm } from '../../contexts/ConfirmContext';
import { ProtocolManagement } from './ProtocolManagement';
import { ProtocolForm } from './ProtocolForm';
import { hasDraftForKey } from '../../hooks/useFormDraft';

interface ReproductionRecord {
  id: string;
  brinco?: string;
  animal_id?: string;
  tipo_evento?: string;
  status?: string;
  resultado?: string;
  ecc?: number;
  touro?: string;
  observacoes?: string;
  previsaoParto?: string | Date;
  diasGestacao?: number;
  progressoGestacao?: number;
  data_evento?: string;
  data_cobertura?: string;
  data_parto_previsto?: string;
  data_parto?: string;
  animais?: { brinco?: string; [key: string]: unknown };
  [key: string]: unknown;
}

export const ReproductionManagement: React.FC = () => {
  const { confirm } = useConfirm();
  const { can } = usePermissions();
  const {
    activeFarm,
    activeTenantId,
    activeFarmId,
    isGlobalMode,
    applyFarmFilter,
    canCreate,
    insertPayload,
  } = useFarmFilter();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as 'ESTACAO' | 'PARTOS' | 'PROTOCOLOS' | 'TEMPLATES') || 'ESTACAO';
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
  const [isProtocolModalOpen, setIsProtocolModalOpen] = useState(false);
  const [isTemplateFormOpen, setIsTemplateFormOpen] = useState(false);
  const [formActionId, setFormActionId] = useState<'create' | 'edit' | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = usePersistentState(
    'ReproductionManagement_isHistoryModalOpen',
    false
  );
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = usePersistentState(
    'ReproductionManagement_isBatchModalOpen',
    false
  );
  const [showAdvancedFilters, setShowAdvancedFilters] = usePersistentState(
    'ReproductionManagement_showAdvancedFilters',
    false
  );
  const [filterValues, setFilterValues] = useState({
    tipo_evento: 'all',
    results: [] as string[],
    minECC: 1,
    maxECC: 5,
    dateStart: '',
    dateEnd: '',
    nearParto: false,
  });

  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Auto-reabrir: restaura formulário se existe rascunho (usuário navegou sem cancelar)
  useEffect(() => {
    if (!activeTenantId || isModalOpen) return;
    if (hasDraftForKey(`reproduction_form_${activeTenantId}`)) setIsModalOpen(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTenantId]);

  const {
    data: rawEvents,
    stats,
    loading,
    error,
    totalCount,
    refresh,
  } = useReportData('reproducao', { page, pageSize });

  const events = (rawEvents || []) as unknown as ReproductionRecord[];

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

  const saveReproMutation = useMutation({
    mutationFn: async ({ reproPayload, animalId, resultado, produtos }: any) => {
      const { data, error } = await supabase.rpc('register_reproduction_event', {
        p_repro_payload: reproPayload,
        p_animal_id: animalId,
        p_resultado: resultado,
        p_produtos: produtos || [],
        p_insert_payload: insertPayload,
        p_event_id: selectedEvent?.id || null
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report'] });
      setIsModalOpen(false);
      toast.success(
        selectedEvent ? '✅ Evento reprodutivo atualizado!' : '✅ Evento reprodutivo cadastrado!'
      );
    },
    onError: (err: any) => {
      toast.error(`❌ Erro ao salvar evento reprodutivo: ${err.message}`);
    },
  });

  const handleSubmit = async (data: any) => {
    if (!canCreate && !selectedEvent) {
      toast.error('⚠️ Selecione uma unidade específica para registrar um novo evento reprodutivo.');
      return;
    }

    const payload = {
      animal_id: data.animal_id,
      tipo_evento: data.tipo_evento,
      data_evento: data.data_evento,
      resultado: data.resultado || data.resultado_diagnostico,
      observacoes: data.observacoes || '',
      status: data.status,
      tecnico: data.tecnico || null,
      partida_semen: data.partida_semen || null,
      metodo_diagnostico: data.metodo_diagnostico || null,
      numero_fetos: data.numero_fetos || null,
      peso_nascimento: data.peso_nascimento ? parseFloat(data.peso_nascimento) : null,
      retencao_placenta: data.retencao_placenta || false,
      dificuldade_parto: data.dificuldade_parto || null,
      teat_sealant: data.teat_sealant || false,
      periodo_secagem: data.periodo_secagem ? parseInt(data.periodo_secagem) : null,
      dias_gestacao: data.dias_gestacao ? parseInt(data.dias_gestacao) : null,
      sexo_cria: data.sexo_cria || null,
      id_cria: data.id_cria || null,
      touro: data.touro || null,
      ecc: data.ecc ? parseFloat(data.ecc) : null,
    };

    saveReproMutation.mutate({
      reproPayload: payload,
      animalId: data.animal_id,
      resultado: data.resultado || data.resultado_diagnostico,
      produtos: data.produtos || [],
    });
  };

  const batchSaveReproMutation = useMutation({
    mutationFn: async (batchData: any[]) => {
      const { error } = await supabase
        .from('eventos_reprodutivos')
        .insert(batchData.map((d) => ({ ...d, ...insertPayload })));
      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report'] });
      setIsBatchModalOpen(false);
      toast.success('✅ Lançamento em lote salvo!');
    },
    onError: (err: any) => {
      toast.error(`❌ Erro ao salvar lote reprodutivo: ${err.message}`);
    },
  });

  const handleBatchSubmit = async (batchData: any[]) => {
    batchSaveReproMutation.mutate(batchData);
  };

  const deleteReproMutation = useMutation({
    mutationFn: async (id: string) => {
      // 1. Apaga sanidades geradas
      await supabase.from('sanidade').delete().like('observacao', `%[REF:${id}]%`);
      // 2. Apaga movimentações de estoque geradas
      await supabase.from('movimentacoes_estoque').delete().like('origem_destino', `%[REF:${id}]%`);
      // 3. Por fim apaga o evento
      const { error } = await supabase.from('eventos_reprodutivos').delete().eq('id', id);
      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report'] });
      toast.success('✅ Evento reprodutivo excluído!');
    },
    onError: (err: any) => {
      toast.error(`❌ Erro ao excluir evento: ${err.message}`);
    },
  });

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Atenção',
      description: 'Deseja excluir este evento?',
      confirmText: 'Confirmar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!isConfirmed) return;
    deleteReproMutation.mutate(id);
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const exportData = events.map((item) => ({
      Animal: item.animais?.brinco || 'N/A',
      Evento: item.tipo_evento,
      Data: item.data_evento ? new Date(item.data_evento).toLocaleDateString() : 'N/A',
      Resultado: item.resultado || 'Aguardando',
      ECC: item.ecc || '-',
      Touro: item.touro || '-',
      Prev_Parto: item.previsaoParto ? new Date(item.previsaoParto).toLocaleDateString() : '-',
      Gestacao_Dias: item.diasGestacao || 0,
      Observacoes: item.observacoes || '',
    }));

    if (format === 'csv') {
      exportToCSV(exportData, 'log_reproducao');
    } else if (format === 'excel') {
      exportToExcel(exportData, 'log_reproducao');
    } else if (format === 'pdf') {
      exportToPDF(exportData, 'log_reproducao', 'Relatório de Reprodução');
    }
  };

  const handleViewDetails = async (event: any) => {
    setIsHistoryModalOpen(true);
    setHistoryLoading(true);

    try {
      const { data, error } = await supabase
        .from('eventos_reprodutivos')
        .select('*')
        .eq('animal_id', event.animal_id || event.animais?.id)
        .order('data_evento', { ascending: false });

      if (error) throw error;

      const items = (data || []).map((e: any) => {
        let nextStep = 'Novo Ciclo';
        if (e.tipo_evento === 'IATF') nextStep = 'Palpação em 60 dias';
        else if (e.tipo_evento === 'Palpação' && e.resultado === 'Prenha') {
          nextStep = e.previsaoParto ? `Parição em ${new Date(e.previsaoParto).toLocaleDateString()}` : 'Monitorar Parição';
        }

        return {
          id: e.id,
          date: e.data_evento,
          title: `Evento: ${e.tipo_evento}`,
          subtitle: `Próximo Passo: ${nextStep} | ECC: ${e.ecc || '-'}`,
          value: e.resultado || 'Pendente',
          status: e.status === 'completed' ? 'success' : 'pending',
        };
      });
      setHistoryItems(items);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar histórico reprodutivo.');
    } finally {
      setHistoryLoading(false);
    }
  };

  const filteredEvents = events.filter((e) => {
    const matchesSearch =
      (e.animais?.brinco || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.tipo_evento || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab =
      activeTab === 'ESTACAO' ? e.tipo_evento !== 'Parto' : e.resultado === 'Prenha';

    const matchesTipo =
      filterValues.tipo_evento === 'all' || e.tipo_evento === filterValues.tipo_evento;
    const matchesResults =
      filterValues.results.length === 0 || filterValues.results.includes(e.resultado ?? '');

    const ecc = Number(e.ecc || 0);
    const matchesECC =
      filterValues.maxECC >= 5 ||
      !e.ecc ||
      (ecc >= filterValues.minECC && ecc <= filterValues.maxECC);

    const matchesNearParto =
      !filterValues.nearParto || ((e.progressoGestacao ?? 0) > 80 && (e.progressoGestacao ?? 0) < 100);

    const matchesDate =
      (!filterValues.dateStart || new Date(e.data_evento ?? '') >= new Date(filterValues.dateStart)) &&
      (!filterValues.dateEnd || new Date(e.data_evento ?? '') <= new Date(filterValues.dateEnd));

    return (
      matchesSearch &&
      matchesTab &&
      matchesTipo &&
      matchesResults &&
      matchesECC &&
      matchesNearParto &&
      matchesDate
    );
  });

  const columns = [
    {
      header: 'Matriz / Brinco',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
          <span className="main-text" style={{ fontWeight: 800, color: '#1e293b' }}>
            #{item.animais?.brinco || 'N/A'}
          </span>
          <span
            className="sub-meta"
            style={{ color: '#64748b', fontSize: '10px', fontWeight: 600 }}
          >
            ID: {item.animal_id?.slice(0, 8).toUpperCase() || item.id?.slice(0, 8).toUpperCase()}
          </span>
        </div>
      ),
      align: 'left' as const,
    },
    {
      header: 'Evento / Protocolo',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {item.tipo_evento === 'Parto' ? (
              <Baby size={14} color="#ec4899" />
            ) : (
              <Thermometer size={14} color="#3b82f6" />
            )}
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
              {item.tipo_evento}
            </span>
          </div>
          {item.touro && (
            <span
              style={{
                fontSize: '9px',
                fontWeight: 800,
                color: '#475569',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Touro: {item.touro}
            </span>
          )}
        </div>
      ),
      align: 'left' as const,
    },

    {
      header: 'Data do Evento',
      accessor: (item: any) => (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            color: '#64748b',
            fontWeight: 600,
            fontSize: '12px',
          }}
        >
          <Calendar size={14} />
          <span>{item.data_evento ? new Date(item.data_evento).toLocaleDateString() : 'N/A'}</span>
        </div>
      ),
      align: 'center' as const,
    },
    {
      header: 'Resultado / Gestação',
      accessor: (item: any) => {
        if (item.resultado === 'Prenha') {
          return (
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '140px' }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '10px',
                  fontWeight: 800,
                  color: '#475569',
                }}
              >
                <span>
                  {item.previsaoParto instanceof Date
                    ? item.previsaoParto.toLocaleDateString()
                    : 'Prev. Parto'}
                </span>
                <span>{Math.round(item.progressoGestacao || 0)}%</span>
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
                    transition: 'width 0.7s',
                    backgroundColor: (item.progressoGestacao || 0) > 80 ? '#f59e0b' : '#ec4899',
                    width: `${item.progressoGestacao || 0}%`,
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 800,
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                }}
              >
                {item.diasGestacao || 0} dias
              </span>
            </div>
          );
        }
        return (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <span className={`status-pill ${item.resultado === 'Vazia' ? 'warning' : 'info'}`}>
              {item.resultado || 'Aguardando'}
            </span>
          </div>
        );
      },
      align: 'center' as const,
    },
    {
      header: 'Status',
      accessor: (item: any) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 800,
              textTransform: 'uppercase',
              color: item.status === 'completed' ? '#10b981' : '#f59e0b',
            }}
          >
            {item.status === 'completed' ? 'Concluído' : 'Pendente'}
          </span>
        </div>
      ),
      align: 'center' as const,
    },
  ];

  return (
    <div className="repro-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <Breadcrumb
            paths={[{ label: 'Pecuária', href: '/pecuaria/dashboard' }, { label: 'Reprodução' }]}
          />
          <h1 className="page-title">Reprodução</h1>
          <p className="page-subtitle">
            Controle de biotecnologias, diagnóstico de gestação e monitoramento de parição em tempo
            real.
          </p>
        </div>
        <div className="page-actions">
          {activeTab !== 'PROTOCOLOS' && activeTab !== 'TEMPLATES' && (
            <button className="glass-btn secondary" onClick={() => setIsBatchModalOpen(true)}>
              <ClipboardCheck size={18} />
              LANÇAMENTO LOTE
            </button>
          )}
          
          {activeTab === 'TEMPLATES' ? (
            <button className="primary-btn" onClick={() => setIsTemplateFormOpen(true)}>
              <Plus size={18} />
              NOVO TEMPLATE
            </button>
          ) : activeTab === 'PROTOCOLOS' ? (
            <button className="primary-btn" onClick={() => setIsProtocolModalOpen(true)}>
              <Plus size={18} />
              NOVO PROTOCOLO
            </button>
          ) : (
            <button className="primary-btn" onClick={handleOpenCreate}>
              <Plus size={18} />
              NOVO EVENTO
            </button>
          )}
        </div>
      </header>

      {/* KPI Grid — sempre visível */}
      <div className="next-gen-kpi-grid">
        {loading
          ? Array(4).fill(0).map((_, i) => <KPISkeleton key={i} />)
          : stats?.map((stat: any, idx: number) => <TauzeStatCard key={idx} {...stat} />)}
      </div>

      {/* Controls Row — 3 abas principais + busca + filtro */}
      <div className="tauze-controls-row">
        <div className="tauze-tab-group">
          <button
            className={`tauze-tab-item ${activeTab === 'ESTACAO' ? 'active' : ''}`}
            onClick={() => setActiveTab('ESTACAO')}
          >
            Estação de Monta
          </button>
          <button
            className={`tauze-tab-item ${activeTab === 'PARTOS' ? 'active' : ''}`}
            onClick={() => setActiveTab('PARTOS')}
          >
            Previsão de Partos
          </button>
          <button
            className={`tauze-tab-item ${activeTab === 'PROTOCOLOS' || activeTab === 'TEMPLATES' ? 'active' : ''}`}
            onClick={() => setActiveTab('PROTOCOLOS')}
          >
            Protocolos
          </button>
        </div>

        <div className="tauze-search-wrapper">
          <Search size={18} className="s-icon" />
          <input
            type="text"
            className="tauze-search-input"
            placeholder={
              activeTab === 'PROTOCOLOS' || activeTab === 'TEMPLATES'
                ? 'Buscar protocolo ou template...'
                : 'Buscar por animal ou tipo de evento...'
            }
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
                const menu = document.getElementById('export-menu-repro');
                if (menu) menu.classList.toggle('active');
              }}
            >
              <FileText size={20} />
            </button>
            <div id="export-menu-repro" className="export-menu">
              <button onClick={() => { handleExport('csv'); document.getElementById('export-menu-repro')?.classList.remove('active'); }}>Excel (.CSV)</button>
              <button onClick={() => { handleExport('excel'); document.getElementById('export-menu-repro')?.classList.remove('active'); }}>Excel (.xlsx)</button>
              <button onClick={() => { handleExport('pdf'); document.getElementById('export-menu-repro')?.classList.remove('active'); }}>PDF</button>
            </div>
          </div>
        </div>
      </div>

      <ReproductionFilterModal
        isOpen={showAdvancedFilters && (activeTab === 'ESTACAO' || activeTab === 'PARTOS')}
        onClose={() => setShowAdvancedFilters(false)}
        filters={filterValues}
        setFilters={setFilterValues}
      />

      {/* Aba Protocolos — renderiza o ProtocolManagement com sub-tabs Protocolos/Templates */}
      {(activeTab === 'PROTOCOLOS' || activeTab === 'TEMPLATES') ? (
        <ProtocolManagement
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenCreate={() => setIsProtocolModalOpen(true)}
          externalTemplateOpen={isTemplateFormOpen}
          onExternalTemplateClose={() => setIsTemplateFormOpen(false)}
          searchTerm={searchTerm}
          showFilters={showAdvancedFilters}
          onCloseFilters={() => setShowAdvancedFilters(false)}
        />
      ) : (
        <div className="management-content">
          <ModernTable
            emptyState={
              <EmptyState
                title="Nenhum evento reprodutivo"
                description="Não há registros reprodutivos para esta unidade. Inicie o controle registrando a primeira inseminação ou diagnóstico."
                actionLabel="Novo Evento"
                onAction={handleOpenCreate}
                icon={Heart}
              />
            }
            data={filteredEvents}
            columns={columns}
            loading={loading}
            hideHeader={true}
            totalCount={totalCount}
            currentPage={page}
            onPageChange={setPage}
            itemsPerPage={pageSize}
            searchPlaceholder="Pesquisar por animal ou tipo de evento..."
            actions={(item) => (
              <div className="modern-actions">
                <button
                  className="action-dot info"
                  onClick={() => handleViewDetails(item)}
                  title="Dossiê"
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
        </div>
      )}

      <ReproductionForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        actionId={formActionId}
        onSubmit={handleSubmit}
        initialData={selectedEvent}
        loading={saveReproMutation.isPending || batchSaveReproMutation.isPending}
      />

      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="Dossiê Reprodutivo"
        subtitle="Rastreabilidade do ciclo e próximos passos da matriz"
        items={historyItems}
        loading={historyLoading}
      />

      <BatchReproModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        onBatchSubmit={handleBatchSubmit}
        activeFarmId={activeFarmId || ''}
        tenantId={activeTenantId || ''}
      />

      <ProtocolForm
        isOpen={isProtocolModalOpen}
        onClose={() => setIsProtocolModalOpen(false)}
      />
    </div>
  );
};
