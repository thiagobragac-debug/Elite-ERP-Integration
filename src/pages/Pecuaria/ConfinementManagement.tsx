import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { usePersistentState } from '../../hooks/usePersistentState';

import { useSearchParams } from 'react-router-dom';
import {
  Building2,
  Plus,
  Search,
  Filter,
  ChevronRight,
  MoreVertical,
  Clock,
  TrendingUp,
  DollarSign,
  Beef,
  Scale,
  Target,
  Activity,
  Building,
  History,
  Edit3,
  Trash2,
  FileText,
  LayoutGrid,
  List as ListIcon,
  Tag,
  Calendar,
  LogOut,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/export';
import { HistoryModal } from '../../components/Modals/HistoryModal';
import { supabase } from '../../lib/supabase';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { useReportData } from '../../hooks/useReportData';
import { ConfinementForm } from '../../components/Forms/ConfinementForm';
import { TauzeStatCard } from '../../components/Cards/TauzeStatCard';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { CheckOutModal } from './components/CheckOutModal';
import { ConfinementFilterModal } from './components/ConfinementFilterModal';
import { KPISkeleton } from '../../components/Feedback/Skeleton';
import { EmptyState } from '../../components/Feedback/EmptyState';
import { useViewMode } from '../../hooks/useViewMode';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Breadcrumb } from '../../components/Navigation/Breadcrumb';
import { useConfirm } from '../../contexts/ConfirmContext';
import { hasDraftForKey } from '../../hooks/useFormDraft';

interface ConfinementLot {
  id: string;
  nome_curral: string;
  status: string;
  capacidade_animais?: number;
  data_inicio?: string;
  dof?: number;
  dof_alvo?: number;
  progress?: number;
  projectedWeight?: number;
  cpd?: number;
  lotes?: { nome: string };
  tenant_id?: string;
  fazenda_id?: string;
  [key: string]: unknown;
}

export const ConfinementManagement: React.FC = () => {
  const { confirm } = useConfirm();
  const {
    activeFarm,
    activeFarmId,
    activeTenantId,
    applyFarmFilter,
    canCreate,
    insertPayload,
    isGlobalMode,
  } = useFarmFilter();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as 'ATIVOS' | 'HISTORICO') || 'ATIVOS';
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
  const [isHistoryModalOpen, setIsHistoryModalOpen] = usePersistentState(
    'ConfinementManagement_isHistoryModalOpen',
    false
  );
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [viewMode, setViewMode] = useViewMode('pecuaria-confinamento', 'grid');
  const [isModalOpen, setIsModalOpen] = usePersistentState(
    'ConfinementManagement_isModalOpen',
    false
  );
  const [selectedPen, setSelectedPen] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formActionId, setFormActionId] = useState<number>(0);
  const [checkOutPens, setCheckOutPens] = useState<any[]>([]);
  const isCheckOutModalOpen = checkOutPens.length > 0;
  
  const [showAdvancedFilters, setShowAdvancedFilters] = usePersistentState(
    'ConfinementManagement_showAdvancedFilters',
    false
  );
  const [filterValues, setFilterValues] = useState({
    status: 'all',
    minDOF: 0,
    maxDOF: 180,
    minWeight: 0,
    maxWeight: 800,
    maxCPD: 30,
    onlyActive: true,
  });
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // Auto-reabrir: restaura formulário se existe rascunho (usuário navegou sem cancelar)
  useEffect(() => {
    if (!activeTenantId || isModalOpen) return;
    if (hasDraftForKey(`confinement_form_${activeTenantId}`)) setIsModalOpen(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTenantId]);

  const {
    data: rawConfinements,
    stats,
    loading,
    error,
    totalCount,
    refresh,
  } = useReportData('confinamento', { page, pageSize });

  const confinements = (rawConfinements || []) as unknown as ConfinementLot[];

  const addPenMutation = useMutation({
    mutationFn: async (payload: any) => {
      const { error } = await supabase.from('confinamento').insert([payload]);
      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report'] });
      setIsModalOpen(false);
      setSelectedPen(null);
      setIsEditMode(false);
      toast.success(isEditMode ? '✅ Curral atualizado com sucesso!' : '✅ Check-in realizado com sucesso!');
    },
    onError: (err: any) => {
      toast.error(`❌ Erro ao realizar check-in: ${err.message}`);
    },
  });

  const handleAddPen = async (data: any) => {
    // Se o form trouxer a fazenda (herdada do lote), usamos ela. Senão usamos o filtro ativo.
    const targetFarmId = data.fazenda_id || activeFarmId;

    // Validate UUID format manually just in case
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!targetFarmId || !uuidRegex.test(targetFarmId)) {
      throw new Error('⚠️ Você precisa selecionar um Lote ou estar em uma Fazenda específica para realizar o check-in.');
    }

    if (!isEditMode) {
      const { data: existing, error: checkError } = await supabase
        .from('confinamento')
        .select('id')
        .eq('nome_curral', data.nome_curral)
        .eq('fazenda_id', targetFarmId)
        .limit(1);
        
      if (checkError) {
        throw new Error(`Falha na validação: ${checkError.message}`);
      }
      if (existing && existing.length > 0) {
        throw new Error('Já existe um curral ativo com este nome nesta fazenda.');
      }
    }

    const payload = {
      ...(isEditMode ? { id: selectedPen.id } : {}),
      nome_curral: data.nome_curral,
      capacidade_animais: parseInt(data.capacidade_animais),
      peso_entrada: data.peso_entrada ? parseFloat(data.peso_entrada) : null,
      dof_alvo: parseInt(data.dof_alvo),
      data_inicio: data.data_inicio,
      lote_id: data.lote_id || null,
      ...insertPayload,
      fazenda_id: targetFarmId, // Garantindo o targetFarmId validado
    };

    if (isEditMode) {
        const { error } = await supabase.from('confinamento').update(payload).eq('id', selectedPen.id);
        if (error) throw error;
        toast.success('✅ Curral atualizado com sucesso!');
        setIsModalOpen(false);
        refresh();
    } else {
        await addPenMutation.mutateAsync(payload);
    }
  };

  const checkOutMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('confinamento')
        .update({
          data_fim: data.data_fim,
          peso_final: data.peso_final,
          destino: data.destino,
          status: 'archived',
          gmd_realizado: data.gmd_realizado,
          dof_real: data.dof_real,
          arrobas_produzidas: data.arrobas_produzidas,
          custo_total_ciclo: data.custo_total_ciclo,
          gta: data.gta
        })
        .eq('id', data.id);
      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report'] });
      setCheckOutPens([]);
      toast.success('✅ Check-out realizado com sucesso!');
    },
    onError: (err: any) => {
      toast.error(`❌ Erro ao realizar check-out: ${err.message}`);
    },
  });

  const handleCheckOut = async (data: any) => {
    return checkOutMutation.mutateAsync(data);
  };

  const handleViewDetails = async (pen: any) => {
    setIsHistoryModalOpen(true);
    setHistoryLoading(true);
    
    setTimeout(() => {
        const items = [
          {
            id: '1',
            date: pen.data_inicio,
            title: 'Início do Ciclo',
            subtitle: 'Check-in de lote no curral',
            value: `${pen.capacidade_animais} cab.`,
            status: 'success',
          },
          {
            id: '2',
            date: pen.data_inicio,
            title: 'Lote Vinculado',
            subtitle: pen.lotes?.nome || 'N/A',
            value: pen.peso_entrada ? `${pen.peso_entrada} kg (Entrada)` : 'N/A',
            status: 'info',
          }
        ];

        if (pen.status === 'archived') {
          items.push({
            id: '3',
            date: pen.data_fim || pen.data_inicio,
            title: 'Check-out (Ciclo Finalizado)',
            subtitle: `GMD: ${pen.gmd_realizado?.toFixed(2) || 0} kg/dia`,
            value: `${pen.peso_final} kg (Saída)`,
            status: 'warning'
          });
        }

        setHistoryItems(items);
        setHistoryLoading(false);
    }, 300);
  };

  const handleOpenEdit = (item: any) => {
      setSelectedPen(item);
      setIsEditMode(true);
      setIsModalOpen(true);
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const exportData = confinements.map((item) => ({
      Curral: item.nome_curral,
      Lote: item.lotes?.nome || 'N/A',
      Data_Inicio: item.data_inicio ? new Date(item.data_inicio).toLocaleDateString() : 'N/A',
      Animais: item.capacidade_animais || 0,
      DOF_Atual: item.dof || 0,
      DOF_Alvo: item.dof_alvo || 0,
      Progresso: `${Math.round(item.progress || 0)}%`,
      Peso_Projetado: `${(item.projectedWeight || 0).toFixed(1)}kg`,
      CPD: `R$ ${(item.cpd || 0).toFixed(2)}`,
      Status: (item.progress ?? 0) > 90 ? 'Terminação' : 'Engorda',
    }));

    if (format === 'csv') {
      exportToCSV(exportData, 'confinamento_pecuaria');
    } else if (format === 'excel') {
      exportToExcel(exportData, 'confinamento_pecuaria');
    } else if (format === 'pdf') {
      exportToPDF(exportData, 'confinamento_pecuaria', 'Relatório de Performance - Confinamento');
    }
  };

  const filteredConfinements = useMemo(() => {
    return confinements.filter((p) => {
      const matchesSearch = (p.nome_curral || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTab = activeTab === 'ATIVOS' ? p.status !== 'archived' : p.status === 'archived';

      const matchesStatus =
        filterValues.status === 'all' ||
        (filterValues.status === 'ENGORDA' && (p.progress ?? 0) <= 90) ||
        (filterValues.status === 'TERMINACAO' && (p.progress ?? 0) > 90) ||
        (filterValues.status === 'CHECKOUT' && (p.progress ?? 0) >= 98);

      const matchesDOF =
        filterValues.maxDOF >= 180 || ((p.dof ?? 0) >= filterValues.minDOF && (p.dof ?? 0) <= filterValues.maxDOF);
      const matchesWeight =
        filterValues.maxWeight >= 800 ||
        ((p.projectedWeight || 0) >= filterValues.minWeight &&
          (p.projectedWeight || 0) <= filterValues.maxWeight);
      const matchesCPD = filterValues.maxCPD >= 30 || (p.cpd || 0) <= filterValues.maxCPD;
      const matchesActive =
        activeTab === 'HISTORICO' ? true : !filterValues.onlyActive || p.status !== 'archived';

      const lote = (p.lotes?.nome || '').toLowerCase();
      const matchesLote = lote.includes(searchTerm.toLowerCase());

      return (
        (matchesSearch || matchesLote) &&
        matchesTab &&
        matchesStatus &&
        matchesDOF &&
        matchesWeight &&
        matchesCPD &&
        matchesActive
      );
    });
  }, [confinements, searchTerm, activeTab, filterValues]);

  const tableColumns = useMemo(() => [
    {
      header: 'Curral / Código',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
          <span className="main-text" style={{ fontWeight: 800, color: '#1e293b' }}>
            {item.nome_curral}
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
      header: 'Lote Ativo',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
            {item.lotes?.nome || 'Sem Lote'}
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
            Confinamento
          </span>
        </div>
      ),
      align: 'left' as const,
    },
    {
      header: 'Início do Ciclo',
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
          <span>{item.data_inicio ? new Date(item.data_inicio).toLocaleDateString() : 'N/A'}</span>
        </div>
      ),
      align: 'center' as const,
    },
    {
      header: 'Ocupação Curral',
      accessor: (item: any) => (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            color: '#1e293b',
            fontWeight: 800,
          }}
        >
          <Beef size={14} color="#10b981" />
          <span>{item.capacidade_animais || 0} cab</span>
        </div>
      ),
      align: 'center' as const,
    },
    {
      header: 'Performance DOF',
      accessor: (item: any) => (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            minWidth: '135px',
            textAlign: 'left',
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
            <span>
              DOF {item.dof} / {item.dof_alvo}
            </span>
            <span style={{ color: item.progress > 90 ? '#f59e0b' : '#10b981' }}>
              {Math.round(item.progress)}%
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
                backgroundColor: item.progress > 90 ? '#f59e0b' : '#10b981',
                width: `${item.progress}%`,
              }}
            />
          </div>
        </div>
      ),
      align: 'left' as const,
    },
    {
      header: 'Status Operacional',
      accessor: (item: any) => {
        let status = item.progress > 90 ? 'Terminação' : 'Engorda';
        let pillClass = item.progress > 90 ? 'active' : 'info';
        
        // M6: Adaptation phase (first 15 days of DOF)
        if (item.dof !== undefined && item.dof <= 15) {
            status = 'Adaptação';
            pillClass = 'pending';
        }

        return (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <span className={`status-pill ${pillClass}`}>
                {status}
              </span>
            </div>
        );
      },
      align: 'center' as const,
    },
  ], []);

  const deleteConfinementMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('confinamento').delete().eq('id', id);
      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report'] });
      toast.success('✅ Curral excluído!');
    },
    onError: (err: any) => {
      toast.error(`❌ Erro ao excluir curral: ${err.message}`);
    },
  });

  const handleDelete = async (id: string) => {
    const pen = confinements.find(p => p.id === id);
    if (pen?.status === 'archived' || (pen?.dof || 0) > 0) {
      toast.error('❌ Não é possível excluir um curral que já possui histórico. Use o Check-out ou edite os dados.');
      return;
    }
    
    const isConfirmed = await confirm({
      title: 'Atenção',
      description: 'Deseja excluir este curral?',
      confirmText: 'Confirmar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!isConfirmed) {
      return;
    }
    deleteConfinementMutation.mutate(id);
  };

  return (
    <div className="confinement-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <Breadcrumb
            paths={[{ label: 'Pecuária', href: '/pecuaria/dashboard' }, { label: 'Confinamento' }]}
          />
          <h1 className="page-title">Confinamento</h1>
          <p className="page-subtitle">
            Terminação intensiva, controle de DOF e projeção de performance em tempo real.
          </p>
        </div>
        <div className="page-actions">
          <button 
            className="glass-btn secondary" 
            onClick={() => setCheckOutPens(confinements.filter((p) => p.status !== 'archived' && p.lote_id))}
          >
            <Scale size={18} />
            Check-out Lote
          </button>
          <button className="primary-btn" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} />
            Novo Check-in
          </button>
        </div>
      </header>

      <style>{`
        .next-gen-kpi-grid {
          display: grid !important;
          grid-template-columns: repeat(4, 1fr) !important;
          gap: 20px !important;
          margin-bottom: 32px !important;
        }

        @media (max-width: 1024px) {
          .next-gen-kpi-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }

        @media (max-width: 640px) {
          .next-gen-kpi-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

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
            className={`tauze-tab-item ${activeTab === 'ATIVOS' ? 'active' : ''}`}
            onClick={() => setActiveTab('ATIVOS')}
          >
            Currais Ativos
          </button>
          <button
            className={`tauze-tab-item ${activeTab === 'HISTORICO' ? 'active' : ''}`}
            onClick={() => setActiveTab('HISTORICO')}
          >
            Histórico de Ciclos
          </button>
        </div>

        <div className="tauze-search-wrapper">
          <Search size={18} className="s-icon" />
          <input
            type="text"
            className="tauze-search-input"
            placeholder="Buscar por curral ou lote..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

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
                const menu = document.getElementById('export-menu-confinement');
                if (menu) {
                  menu.classList.toggle('active');
                }
              }}
            >
              <FileText size={20} />
            </button>
            <div id="export-menu-confinement" className="export-menu">
              <button
                onClick={() => {
                  handleExport('csv');
                  document.getElementById('export-menu-confinement')?.classList.remove('active');
                }}
              >
                Excel (.CSV)
              </button>
              <button
                onClick={() => {
                  handleExport('excel');
                  document.getElementById('export-menu-confinement')?.classList.remove('active');
                }}
              >
                Excel (.xlsx)
              </button>
              <button
                onClick={() => {
                  handleExport('pdf');
                  document.getElementById('export-menu-confinement')?.classList.remove('active');
                }}
              >
                PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfinementFilterModal
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filters={filterValues}
        setFilters={setFilterValues}
      />

      <div className="management-content">
        {viewMode === 'list' ? (
          <ModernTable
            emptyState={
              confinements.length === 0 ? (
                <EmptyState
                  title="Nenhum ciclo de confinamento"
                  description="Não há currais ativos para esta unidade. Inicie a terminação intensiva realizando o primeiro check-in."
                  actionLabel="Novo Check-in"
                  onAction={() => setIsModalOpen(true)}
                  icon={Building2}
                />
              ) : (
                <EmptyState
                  title="Nenhum registro encontrado"
                  description="Sua busca não retornou resultados."
                  icon={Search}
                />
              )
            }
            data={filteredConfinements}
            columns={tableColumns}
            loading={loading}
            hideHeader={true}
            totalCount={totalCount}
            currentPage={page}
            onPageChange={setPage}
            itemsPerPage={pageSize}
            searchPlaceholder="Filtrar base de currais..."
            actions={(item) => (
              <div className="modern-actions">
                <button
                  className="action-dot info"
                  onClick={() => handleViewDetails(item)}
                  title="Detalhes"
                >
                  <History size={18} />
                </button>
                <button className="action-dot edit" onClick={() => handleOpenEdit(item)} title="Editar">
                  <Edit3 size={18} />
                </button>
                {item.status !== 'archived' && (
                  <button 
                    className="action-dot warning" 
                    onClick={() => setCheckOutPens([item])} 
                    title="Realizar Check-out"
                    style={{ backgroundColor: 'hsl(38 92% 50% / 0.1)', color: 'hsl(38 92% 50%)' }}
                  >
                    <LogOut size={18} />
                  </button>
                )}
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
          <div className="confinement-cards-grid animate-fade-in">
            {filteredConfinements.length === 0 ? (
              <EmptyState
                title={confinements.length === 0 ? 'Nenhum ciclo de confinamento' : 'Nenhum registro encontrado'}
                description={confinements.length === 0 ? 'Não há currais ativos para esta unidade.' : 'Sua busca não retornou resultados.'}
                icon={confinements.length === 0 ? Building2 : Search}
                actionLabel={confinements.length === 0 ? 'NOVO CHECK-IN' : undefined}
                onAction={confinements.length === 0 ? () => setIsModalOpen(true) : undefined}
              />
            ) : (
              filteredConfinements.map((p) => {
                const progress = p.progress || 0;
                let badgeClass = 'active'; // green
                let badgeText = 'ENGORDA';
                let borderClass = 'active';

                if (p.dof !== undefined && p.dof <= 15) {
                    badgeClass = 'pending';
                    badgeText = 'ADAPTAÇÃO';
                    borderClass = 'pending';
                } else if (progress > 90) {
                  badgeClass = 'warning-badge';
                  badgeText = 'TERMINAÇÃO';
                  borderClass = 'warning-badge';
                } else if (p.status === 'archived') {
                  badgeClass = 'stopped';
                  badgeText = 'ARQUIVADO';
                  borderClass = 'danger-badge';
                }

                return (
                  <div key={p.id} className={`confinement-card-premium ${borderClass}`}>
                    <div className="card-left-section">
                      <div className="card-avatar">
                        <Building2 size={28} />
                      </div>
                      <div className="card-bottom-actions">
                        <button
                          className="action-icon-btn info"
                          onClick={() => handleViewDetails(p)}
                          title="Histórico"
                        >
                          <History size={14} />
                        </button>
                        <button className="action-icon-btn edit" onClick={() => handleOpenEdit(p)} title="Editar">
                          <Edit3 size={14} />
                        </button>
                        {p.status !== 'archived' && (
                          <button 
                            className="action-icon-btn warning" 
                            onClick={() => setCheckOutPens([p])} 
                            title="Realizar Check-out"
                            style={{ color: 'hsl(38 92% 50%)' }}
                          >
                            <LogOut size={14} />
                          </button>
                        )}
                        <button
                          className="action-icon-btn delete"
                          onClick={() => handleDelete(p.id)}
                          title="Excluir"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="card-main-content">
                      <div
                        className="card-header-info"
                        style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '6px' }}
                      >
                        <div className="title-row" style={{ width: '100%' }}>
                          <h3
                            style={{
                              fontSize: '16px',
                              fontWeight: 800,
                              color: 'hsl(var(--text-main))',
                              width: '100%',
                            }}
                          >
                            {p.nome_curral}
                          </h3>
                        </div>
                        <div
                          className="meta-row"
                          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                          <span className={`status-pill mini ${badgeClass}`}>{badgeText}</span>
                          <div className="card-type-meta">Lote: {p.lotes?.nome || 'Vazio'}</div>
                        </div>
                      </div>

                      <div className="card-occupation-section">
                        <div className="occ-header">
                          <span>DOF / PROCESSO</span>
                          <span className={progress > 90 ? 'critical' : ''}>
                            {Math.round(progress)}%
                          </span>
                        </div>
                        <div className="occ-bar-container">
                          <div
                            className={`occ-bar-fill ${progress > 90 ? 'warning' : ''}`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                        <div className="occ-footer">
                          {p.dof}d / {p.dof_alvo}d DOF
                        </div>
                      </div>

                      <div className="card-footer-meta" style={{ flexDirection: 'column', gap: '8px', alignItems: 'stretch' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div className="meta-item">
                            <Activity size={12} />
                            <span>{p.capacidade_animais || 0} cab.</span>
                          </div>
                          <div className="meta-item">
                            <TrendingUp size={12} />
                            <span className="card-farm-meta">
                              {isGlobalMode ? 'Multi-Fazenda' : activeFarm?.name || 'Fazenda 01'}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'hsl(var(--bg-main))', padding: '6px 8px', borderRadius: '8px', fontSize: '10px' }}>
                           <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                             <span style={{ color: 'hsl(var(--text-muted))' }}>Peso Proj.</span>
                             <span style={{ fontWeight: 800, color: 'hsl(var(--brand))' }}>{p.projectedWeight ? `${p.projectedWeight.toFixed(1)} kg` : '---'}</span>
                           </div>
                           <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'right' }}>
                             <span style={{ color: 'hsl(var(--text-muted))' }}>Custo Diária</span>
                             <span style={{ fontWeight: 800, color: 'hsl(var(--warning))' }}>{p.cpd ? `R$ ${p.cpd.toFixed(2)}` : '---'}</span>
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <button className="add-confinement-card-premium" onClick={() => setIsModalOpen(true)}>
              <Plus size={32} />
              <span>NOVO CHECK-IN</span>
            </button>
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
          color: #16a34a;
          box-shadow: 0 4px 10px rgba(0,0,0,0.05);
        }

        .user-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: 20px;
          padding: 8px;
        }

        .user-card-premium {
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

        .user-card-premium::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 6px;
          background: hsl(var(--border-strong));
          transition: 0.3s;
        }

        .user-card-premium.active::before {
          background: #16a34a;
          box-shadow: 4px 0 15px rgba(22, 163, 74, 0.3);
        }

        .user-card-premium.stopped-badge::before {
          background: #f59e0b;
          box-shadow: 4px 0 15px rgba(245, 158, 11, 0.3);
        }

        .user-card-premium:hover {
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
          font-size: 24px;
          font-weight: 900;
          margin-bottom: 8px;
          box-shadow: 0 8px 20px rgba(0,0,0,0.1);
          border: 1px solid hsl(var(--border));
        }

        .card-main-content {
          flex: 1;
          padding: 12px 16px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-width: 0;
        }

        .confinement-card-premium .card-header-info {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 6px;
        }

        .confinement-card-premium .title-row {
          display: flex;
          justify-content: flex-start;
          align-items: center;
          margin-bottom: 2px;
          gap: 8px;
          min-width: 0;
        }

        .confinement-card-premium .card-header-info h3 {
          font-size: 16px;
          font-weight: 900;
          letter-spacing: -0.02em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          min-width: 0;
          flex: 0 1 auto;
        }

        .card-role-badge {
          display: inline-block;
          font-size: 9px;
          font-weight: 800;
          color: #16a34a;
          background: hsl(var(--brand) / 0.1);
          padding: 3px 8px;
          border-radius: 8px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .card-meta-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 6px;
          margin-top: 4px;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
          color: hsl(var(--text-muted));
          font-size: 11px;
          font-weight: 600;
        }

        .meta-icon {
          color: #16a34a;
        }

        .card-footer-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: auto;
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

        .confinement-cards-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          padding: 8px;
        }

        @media (max-width: 1400px) {
          .confinement-cards-grid { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 900px) {
          .confinement-cards-grid { grid-template-columns: 1fr; }
        }

        .confinement-card-premium {
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

        .confinement-card-premium::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 6px;
          background: #94a3b8;
          transition: 0.3s;
        }

        .confinement-card-premium.active::before {
          background: #10b981;
          box-shadow: 4px 0 15px rgba(16, 185, 129, 0.3);
        }

        .confinement-card-premium.info-badge::before {
          background: #3b82f6;
          box-shadow: 4px 0 15px rgba(59, 130, 246, 0.3);
        }

        .confinement-card-premium.warning-badge::before {
          background: #f59e0b;
          box-shadow: 4px 0 15px rgba(245, 158, 11, 0.3);
        }

        .confinement-card-premium.danger-badge::before {
          background: #ef4444;
          box-shadow: 4px 0 15px rgba(239, 68, 68, 0.3);
        }

        .confinement-card-premium:hover {
          transform: translateY(-6px);
          box-shadow: var(--shadow-lg);
          border-color: hsl(var(--brand) / 0.35);
        }

        .add-confinement-card-premium {
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

        .add-confinement-card-premium:hover {
          border-color: #10b981;
          color: #10b981;
          background: rgba(16, 185, 129, 0.02);
        }

        .add-confinement-card-premium span { font-size: 11px; font-weight: 900; letter-spacing: 0.05em; }

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

        .occ-footer {
          font-size: 10px;
          font-weight: 700;
          color: #94a3b8;
          text-align: right;
        }

        [data-theme='dark'] .confinement-card-premium,
        [data-theme='dark'] .add-confinement-card-premium {
          background: hsl(var(--bg-main)) !important;
          border-color: hsl(var(--border)) !important;
          color: hsl(var(--text-main)) !important;
        }
      `}</style>

      <ConfinementForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        actionId={formActionId}
        onSubmit={handleAddPen}
        loading={addPenMutation.isPending || checkOutMutation.isPending}
      />

      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="Dossiê do Confinamento"
        subtitle="Rastreabilidade de ciclo e performance nutricional"
        items={historyItems}
        loading={historyLoading}
      />

      <CheckOutModal
        isOpen={isCheckOutModalOpen}
        onClose={() => setCheckOutPens([])}
        activePens={checkOutPens}
        onCheckOut={handleCheckOut}
        activeFarm={activeFarm}
      />
    </div>
  );
};
