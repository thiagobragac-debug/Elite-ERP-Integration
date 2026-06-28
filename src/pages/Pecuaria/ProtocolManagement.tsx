import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FlaskConical,
  Play,
  Eye,
  XCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Dna,
  Beef,
  TrendingUp,
  Calendar,
  ChevronRight,
  LayoutTemplate,
  Edit2,
  Trash2,
  Lock,
  Copy,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { usePersistentState } from '../../hooks/usePersistentState';
import { TauzeStatCard } from '../../components/Cards/TauzeStatCard';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { EmptyState } from '../../components/Feedback/EmptyState';
import { useSuperAdmin } from '../../hooks/useSuperAdmin';
import { usePermissions } from '../../hooks/usePermissions';
import { ProtocolFilterModal } from './components/ProtocolFilterModal';
import { KPISkeleton } from '../../components/Feedback/Skeleton';
import { Breadcrumb } from '../../components/Navigation/Breadcrumb';
import { useConfirm } from '../../contexts/ConfirmContext';
import { TemplateForm } from './TemplateForm';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────────────────────
interface Protocolo {
  id: string;
  nome: string;
  tipo: string;
  status: string;
  data_inicio: string;
  tecnico_resp?: string;
  touro_id?: string;
  data_fim_monta?: string;
  observacoes?: string;
  protocolo_etapas?: EtapaProtocolo[];
  protocolo_animais?: { count: number }[];
  template?: { nome: string };
}

interface EtapaProtocolo {
  id: string;
  nome_etapa: string;
  dia_relativo: number;
  data_prevista: string;
  data_realizada?: string;
  status: string;
  ordem: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('pt-BR') : '---';

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  ativo:      { label: 'Ativo',      cls: 'active',  icon: Play        },
  rascunho:   { label: 'Rascunho',   cls: 'pending', icon: Clock       },
  concluido:  { label: 'Concluído',  cls: 'success', icon: CheckCircle2},
  cancelado:  { label: 'Cancelado',  cls: 'stopped', icon: XCircle     },
};

const TIPO_COLOR: Record<string, string> = {
  IATF:   '#3b82f6', // blue-500
  Monta:  '#22c55e', // green-500
  Custom: '#8b5cf6', // purple-500
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
// ── Tipos extras ─────────────────────────────────────────────────────────────
interface Template {
  id: string;
  nome: string;
  tipo: string;
  descricao: string;
  is_sistema: boolean;
  protocolo_template_etapas?: any[];
}

export const ProtocolManagement: React.FC<{
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenCreate: () => void;
  externalTemplateOpen: boolean;
  onExternalTemplateClose: () => void;
  searchTerm: string;
  showFilters: boolean;
  onCloseFilters: () => void;
}> = ({ activeTab, setActiveTab, onOpenCreate, externalTemplateOpen, onExternalTemplateClose, searchTerm, showFilters, onCloseFilters }) => {
  const navigate = useNavigate();
  const { confirm } = useConfirm();
  const { can } = usePermissions();
  const { activeTenantId, activeFarmId, applyFarmFilter } = useFarmFilter();
  const queryClient = useQueryClient();
  const { isSuperAdmin } = useSuperAdmin();

  const [showFiltersLocal, setShowFiltersLocal] = usePersistentState(
    'ProtocolManagement_showFilters',
    false
  );
  const [filterProtocol, setFilterProtocol] = usePersistentState(
    'ProtocolManagement_filterProtocol',
    { status: 'todos', tipo: 'todos', dateStart: '', dateEnd: '', onlyComSaldo: false }
  );

  const [templateFormOpen, setTemplateFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  // Sync external template open trigger from parent header button
  useEffect(() => {
    if (externalTemplateOpen) {
      setEditingTemplate(null);
      setTemplateFormOpen(true);
      onExternalTemplateClose();
    }
  }, [externalTemplateOpen, onExternalTemplateClose]);

  // ── Query principal ───────────────────────────────────────────────────────
  const { data: protocolos = [], isLoading } = useQuery({
    queryKey: ['protocolos', activeTenantId, activeFarmId],
    enabled: !!activeTenantId,
    queryFn: async () => {
      let query = supabase
        .from('protocolos_reprodutivos')
        .select(`
          *,
          template:protocolo_templates(nome),
          protocolo_etapas(id, nome_etapa, dia_relativo, data_prevista, data_realizada, status, ordem),
          protocolo_animais(count)
        `)
        .order('created_at', { ascending: false });
      query = applyFarmFilter(query);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Protocolo[];
    },
  });

  // ── Query templates (para o gerenciador) ────────────────────────────────────────
  const { data: templates = [], isLoading: isLoadingTemplates } = useQuery<Template[]>({
    queryKey: ['protocolo_templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('protocolo_templates')
        .select('*, protocolo_template_etapas(*)');
      if (error) throw error;
      return data as Template[];
    },
  });

  const templateColumns = [
    {
      header: 'Template',
      accessor: (t: Template) => {
        const cor = TIPO_COLOR[t.tipo] || '#10b981'; // green-500 fallback
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: 32, height: 32, borderRadius: '8px', background: `${cor}15`, border: `1px solid ${cor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Dna size={15} style={{ color: cor }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="main-text" style={{ fontWeight: 800 }}>{t.nome}</span>
                <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '99px', background: `${cor}15`, color: cor }}>{t.tipo}</span>
                {t.is_sistema && <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '99px', background: 'hsl(var(--text-muted) / 0.15)', color: 'hsl(var(--text-muted))' }}>SISTEMA</span>}
              </div>
              <span className="sub-meta">{t.descricao || 'Sem descrição'}</span>
            </div>
          </div>
        );
      },
      align: 'left' as const,
    },
    {
      header: 'Etapas',
      accessor: (t: Template) => (
        <span style={{ fontWeight: 700, fontSize: '13px' }}>{t.protocolo_template_etapas?.length || 0} etapas</span>
      ),
      align: 'center' as const,
    },
    {
      header: 'Origem',
      accessor: (t: Template) => (
        <span className={`status-pill ${t.is_sistema ? 'active' : 'pending'}`}>
          {t.is_sistema ? 'Sistema' : 'Personalizado'}
        </span>
      ),
      align: 'center' as const,
    },
  ];

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('protocolo_templates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['protocolo_templates'] });
      toast.success('Template excluído.');
    },
    onError: (err: any) => toast.error(`Erro: ${err.message}`),
  });

  const handleDeleteTemplate = async (t: Template) => {
    const ok = await confirm({
      title: 'Excluir Template',
      message: `Excluir "${t.nome}"? Esta ação não poderá ser desfeita.`,
      confirmLabel: 'Excluir',
      variant: 'danger',
    });
    if (ok) deleteTemplateMutation.mutate(t.id);
  };

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const ativos = protocolos.filter((p) => p.status === 'ativo').length;
    const animaisTotal = protocolos
      .filter((p) => p.status === 'ativo')
      .reduce((acc, p) => {
        const cnt = (p.protocolo_animais as any)?.[0]?.count ?? 0;
        return acc + Number(cnt);
      }, 0);

    const hoje = new Date();
    const em7Dias = new Date();
    em7Dias.setDate(em7Dias.getDate() + 7);
    const proximasEtapas = protocolos
      .filter((p) => p.status === 'ativo')
      .flatMap((p) => p.protocolo_etapas || [])
      .filter(
        (e) =>
          e.status === 'pendente' &&
          new Date(e.data_prevista) >= hoje &&
          new Date(e.data_prevista) <= em7Dias
      ).length;

    const concluidos = protocolos.filter((p) => p.status === 'concluido');
    // Taxa de concepção: % de animais com resultado_final = 'Prenha' (placeholder — viria de query detalhada)
    const taxaConcep = concluidos.length > 0 ? '—' : '---';

    return [
      {
        label: 'Protocolos Ativos',
        value: ativos || '0',
        icon: FlaskConical,
        color: 'hsl(217 91% 55%)',
        subtitle: 'Programas em andamento',
        change: ativos > 0 ? `${ativos} ativo${ativos > 1 ? 's' : ''}` : 'Nenhum ativo',
        trend: ativos > 0 ? ('up' as const) : ('neutral' as const),
      },
      {
        label: 'Animais em Protocolo',
        value: animaisTotal || '0',
        icon: Beef,
        color: 'hsl(142 71% 45%)',
        subtitle: 'Matrizes participantes',
        change: animaisTotal > 0 ? `${animaisTotal} matrizes` : 'Sem animais',
        trend: 'neutral' as const,
      },
      {
        label: 'Etapas Próximos 7 dias',
        value: proximasEtapas || '0',
        icon: Calendar,
        color: proximasEtapas > 0 ? 'hsl(38 92% 50%)' : 'hsl(var(--text-muted))',
        subtitle: 'Pendentes até 7 dias',
        change: proximasEtapas > 0 ? 'Requer atenção!' : 'Nada pendente',
        trend: proximasEtapas > 0 ? ('up' as const) : ('neutral' as const),
      },
      {
        label: 'Taxa Concepção Média',
        value: taxaConcep,
        icon: TrendingUp,
        color: 'hsl(258 90% 66%)',
        subtitle: 'Protocolos concluídos',
        change: concluidos.length > 0 ? `${concluidos.length} concluído(s)` : 'Sem concluídos',
        trend: 'neutral' as const,
      },
    ];
  }, [protocolos]);

  // ── Cancelar protocolo ────────────────────────────────────────────────────
  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('protocolos_reprodutivos')
        .update({ status: 'cancelado' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['protocolos'] });
      toast.success('Protocolo cancelado.');
    },
    onError: (err: any) => toast.error(`Erro: ${err.message}`),
  });

  const handleCancel = async (id: string) => {
    const ok = await confirm({
      title: 'Cancelar Protocolo',
      message: 'Tem certeza? Esta ação não poderá ser desfeita.',
      confirmLabel: 'Cancelar Protocolo',
      variant: 'danger',
    });
    if (ok) cancelMutation.mutate(id);
  };

  // ── Filtro + Busca ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return protocolos
      .filter((p) => filterProtocol.status === 'todos' || p.status === filterProtocol.status)
      .filter((p) => filterProtocol.tipo === 'todos' || p.tipo === filterProtocol.tipo)
      .filter((p) => {
        if (!filterProtocol.dateStart) return true;
        return new Date(p.data_inicio) >= new Date(filterProtocol.dateStart);
      })
      .filter((p) => {
        if (!filterProtocol.dateEnd) return true;
        return new Date(p.data_inicio) <= new Date(filterProtocol.dateEnd);
      })
      .filter((p) => {
        if (!filterProtocol.onlyComSaldo) return true;
        const cnt = (p.protocolo_animais as any)?.[0]?.count ?? 0;
        return cnt > 0;
      })
      .filter((p) => {
        const q = searchTerm.toLowerCase();
        return (
          p.nome.toLowerCase().includes(q) ||
          (p.tipo || '').toLowerCase().includes(q) ||
          (p.tecnico_resp || '').toLowerCase().includes(q)
        );
      });
  }, [protocolos, filterProtocol, searchTerm]);

  // ── Colunas da tabela ─────────────────────────────────────────────────────
  const columns = [
    {
      header: 'Protocolo',
      accessor: (p: Protocolo) => {
        const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG['rascunho'];
        const cor = TIPO_COLOR[p.tipo] || 'hsl(var(--brand))';
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: `${cor}18`,
                border: `1.5px solid ${cor}40`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Dna size={18} style={{ color: cor }} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '14px' }}>{p.nome}</div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '2px' }}>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '99px',
                    background: `${cor}18`,
                    color: cor,
                    border: `1px solid ${cor}40`,
                  }}
                >
                  {p.tipo}
                </span>
                {p.template?.nome && (
                  <span className="sub-meta">{p.template.nome}</span>
                )}
              </div>
            </div>
          </div>
        );
      },
      align: 'left' as const,
    },
    {
      header: 'Animais',
      accessor: (p: Protocolo) => {
        const cnt = (p.protocolo_animais as any)?.[0]?.count ?? 0;
        return (
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontWeight: 800, fontSize: '18px' }}>{cnt}</span>
            <div className="sub-meta">matrizes</div>
          </div>
        );
      },
      align: 'center' as const,
    },
    {
      header: 'Progresso',
      accessor: (p: Protocolo) => {
        const etapas = p.protocolo_etapas || [];
        const total = etapas.length;
        const feitas = etapas.filter((e) => e.status === 'realizada').length;
        const pct = total > 0 ? Math.round((feitas / total) * 100) : 0;
        const proxima = etapas
          .filter((e) => e.status === 'pendente')
          .sort((a, b) => a.ordem - b.ordem)[0];

        return (
          <div style={{ minWidth: '160px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '11px',
                fontWeight: 700,
                marginBottom: '4px',
                color: 'hsl(var(--text-main))',
              }}
            >
              <span>{feitas}/{total} etapas</span>
              <span>{pct}%</span>
            </div>
            <div
              style={{
                height: '6px',
                borderRadius: '99px',
                background: 'hsl(var(--bg-main))',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${pct}%`,
                  background: pct === 100 ? 'hsl(142 71% 45%)' : 'hsl(var(--brand))',
                  borderRadius: '99px',
                  transition: 'width 0.5s',
                }}
              />
            </div>
            {proxima && (
              <div className="sub-meta" style={{ marginTop: '4px', fontSize: '10px' }}>
                Próx: {proxima.nome_etapa} — {fmtDate(proxima.data_prevista)}
              </div>
            )}
          </div>
        );
      },
      align: 'left' as const,
    },
    {
      header: 'Próxima Etapa',
      accessor: (p: Protocolo) => {
        const etapas = p.protocolo_etapas || [];
        const proxima = etapas
          .filter((e) => e.status === 'pendente')
          .sort((a, b) => a.ordem - b.ordem)[0];

        if (!proxima) {
          return (
            <span className="status-pill success" style={{ fontSize: '11px' }}>
              Todas concluídas
            </span>
          );
        }

        const diff = Math.ceil(
          (new Date(proxima.data_prevista).getTime() - Date.now()) / 86400000
        );
        const isAtrasada = diff < 0;
        const isHoje = diff === 0;

        return (
          <div>
            <div style={{ fontWeight: 700, fontSize: '13px' }}>{proxima.nome_etapa}</div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: isAtrasada
                  ? 'hsl(0 84% 55%)'
                  : isHoje
                  ? 'hsl(38 92% 45%)'
                  : 'hsl(var(--text-muted))',
                marginTop: '2px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {isAtrasada ? (
                <>
                  <AlertTriangle size={11} /> ATRASADA {Math.abs(diff)}d
                </>
              ) : isHoje ? (
                <>
                  <Clock size={11} /> HOJE
                </>
              ) : (
                <>{fmtDate(proxima.data_prevista)}</>
              )}
            </div>
          </div>
        );
      },
      align: 'left' as const,
    },
    {
      header: 'Início / Técnico',
      accessor: (p: Protocolo) => (
        <div>
          <div style={{ fontWeight: 700, fontSize: '13px' }}>{fmtDate(p.data_inicio)}</div>
          {p.tecnico_resp && <div className="sub-meta">{p.tecnico_resp}</div>}
        </div>
      ),
      align: 'left' as const,
    },
    {
      header: 'Status',
      accessor: (p: Protocolo) => {
        const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG['rascunho'];
        const Icon = cfg.icon;
        return (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <span className={`status-pill ${cfg.cls}`} style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <Icon size={11} /> {cfg.label}
            </span>
          </div>
        );
      },
      align: 'center' as const,
    },
  ];

  // ── JSX ───────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Sub-navegação interna: Protocolos ↔ Templates */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0' }}>
        <button
          onClick={() => setActiveTab('PROTOCOLOS')}
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 700,
            color: activeTab === 'PROTOCOLOS' ? '#3b82f6' : 'hsl(var(--text-muted))',
            background: 'transparent',
            border: 'none',
            borderBottom: `2px solid ${activeTab === 'PROTOCOLOS' ? '#3b82f6' : 'transparent'}`,
            cursor: 'pointer',
            marginBottom: '-1px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.15s',
          }}
        >
          <FlaskConical size={14} />
          Protocolos Ativos
        </button>
        <button
          onClick={() => setActiveTab('TEMPLATES')}
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 700,
            color: activeTab === 'TEMPLATES' ? '#8b5cf6' : 'hsl(var(--text-muted))',
            background: 'transparent',
            border: 'none',
            borderBottom: `2px solid ${activeTab === 'TEMPLATES' ? '#8b5cf6' : 'transparent'}`,
            cursor: 'pointer',
            marginBottom: '-1px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.15s',
          }}
        >
          <LayoutTemplate size={14} />
          Templates
        </button>
      </div>

      {/* Gerenciador de Templates */}
      {activeTab === 'TEMPLATES' && (
      <div className="management-content">
        <ModernTable
          data={templates}
          columns={templateColumns}
          loading={isLoadingTemplates}
          hideHeader={true}
          totalCount={templates.length}
          currentPage={1}
          onPageChange={() => {}}
          itemsPerPage={20}
          emptyState={
            <EmptyState
              title="Nenhum template cadastrado"
              description="Crie templates de protocolo para padronizar suas etapas reprodutivas."
              actionLabel="Novo Template"
              onAction={() => { setEditingTemplate(null); setTemplateFormOpen(true); }}
              icon={LayoutTemplate}
            />
          }
          actions={(t: Template) => (
            <div className="modern-actions">
              <button
                className="action-dot info"
                title="Duplicar Template (Criar Cópia)"
                onClick={() => {
                  setEditingTemplate({
                    ...t,
                    id: undefined, // undefined ID ensures it acts as a "Create" rather than "Edit"
                    nome: `${t.nome} (Cópia)`,
                    is_sistema: false,
                  });
                  setTemplateFormOpen(true);
                }}
              >
                <Copy size={14} />
              </button>
              {t.is_sistema && !isSuperAdmin ? (
                <button className="action-dot" title="Template do sistema — somente leitura" disabled style={{ opacity: 0.4, cursor: 'not-allowed' }}>
                  <Lock size={14} />
                </button>
              ) : (
                <>
                  {can('pecuaria', 'edit') && (
                    <button
                      className="action-dot edit"
                      title={t.is_sistema ? "Editar Template do Sistema (Super Admin)" : "Editar Template"}
                      onClick={() => { setEditingTemplate(t); setTemplateFormOpen(true); }}
                    >
                      <Edit2 size={14} />
                    </button>
                  )}
                  {can('pecuaria', 'delete') && (
                    <button
                      className="action-dot delete"
                      title="Excluir Template"
                      onClick={() => handleDeleteTemplate(t)}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        />
      </div>
      )}

      {/* Tabela — só mostra quando na aba Protocolos */}
      {activeTab === 'PROTOCOLOS' && (
      <div className="management-content">
        <ModernTable
          data={filtered}
          columns={columns}
          loading={isLoading}
          hideHeader={true}
          totalCount={filtered.length}
          currentPage={1}
          onPageChange={() => {}}
          itemsPerPage={15}
          emptyState={
            <EmptyState
              title="Nenhum protocolo encontrado"
              description="Inicie um protocolo de IATF, Monta Natural ou personalizado para gerenciar as etapas reprodutivas do seu rebanho."
              actionLabel="Novo Protocolo"
              onAction={onOpenCreate}
              icon={FlaskConical}
            />
          }
          actions={(p: Protocolo) => (
            <div className="modern-actions">
              <button
                className="action-dot info"
                title="Ver Detalhes"
                onClick={() => navigate(`/pecuaria/reproducao/protocolos/${p.id}`)}
              >
                <Eye size={16} />
              </button>
              {can('pecuaria', 'edit') && p.status === 'ativo' && (
                <button
                  className="action-dot edit"
                  title="Executar Próxima Etapa"
                  onClick={() => navigate(`/pecuaria/reproducao/protocolos/${p.id}?execute=true`)}
                >
                  <Play size={16} />
                </button>
              )}
              {can('pecuaria', 'delete') && (p.status === 'ativo' || p.status === 'rascunho') && (
                <button
                  className="action-dot delete"
                  title="Cancelar Protocolo"
                  onClick={() => handleCancel(p.id)}
                >
                  <XCircle size={16} />
                </button>
              )}
            </div>
          )}
        />
      </div>
      )}


      {/* Filtro Avançado de Protocolos */}
      <ProtocolFilterModal
        isOpen={showFilters && activeTab === 'PROTOCOLOS'}
        onClose={onCloseFilters}
        filters={filterProtocol}
        setFilters={setFilterProtocol}
      />

      {/* Modal de Template */}
      <TemplateForm
        isOpen={templateFormOpen}
        onClose={() => { setTemplateFormOpen(false); setEditingTemplate(null); }}
        initialData={editingTemplate}
      />
    </>
  );
};
