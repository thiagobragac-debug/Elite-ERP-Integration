import React, { useState, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  FlaskConical, ChevronLeft, ChevronRight, CheckCircle2,
  ListChecks, Users, Calendar, Check, AlertTriangle, Clock,
  Edit3, Play, XCircle, Beef, Dna,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { Breadcrumb } from '../../components/Navigation/Breadcrumb';
import { KPISkeleton } from '../../components/Feedback/Skeleton';
import { EmptyState } from '../../components/Feedback/EmptyState';
import { ModernTable } from '../../components/DataTable/ModernTable';
import toast from 'react-hot-toast';
import { ProtocolStepExecutor } from './components/ProtocolStepExecutor';

// ─── helpers ─────────────────────────────────────────────────────────────────
const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('pt-BR') : '---';

const STATUS_COLOR: Record<string, string> = {
  realizada: 'hsl(142 71% 45%)',
  pendente:  'hsl(217 91% 55%)',
  pulada:    'hsl(38 92% 50%)',
  atrasada:  'hsl(0 84% 55%)',
};

const STATUS_LABEL: Record<string, string> = {
  realizada: 'Realizada',
  pendente:  'Pendente',
  pulada:    'Pulada',
  atrasada:  'Atrasada',
};

// ─── COMPONENTE ──────────────────────────────────────────────────────────────
export const ProtocolDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { activeTenantId } = useFarmFilter();
  const queryClient = useQueryClient();

  const [executorOpen, setExecutorOpen] = useState(searchParams.get('execute') === 'true');
  const [selectedEtapa, setSelectedEtapa] = useState<any>(null);

  // ── Query ──────────────────────────────────────────────────────────────────
  const { data: protocolo, isLoading } = useQuery({
    queryKey: ['protocolo', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('protocolos_reprodutivos')
        .select(`
          *,
          template:protocolo_templates(nome, descricao),
          protocolo_etapas(*, ordem),
          protocolo_animais(*, animais(id, brinco, categoria, fase_atual))
        `)
        .eq('id', id!)
        .single();
      if (error) {throw error;}
      return data;
    },
  });

  const etapas: any[] = useMemo(
    () => [...(protocolo?.protocolo_etapas || [])].sort((a, b) => a.ordem - b.ordem),
    [protocolo]
  );
  const animais: any[] = protocolo?.protocolo_animais || [];

  const proximaEtapa = etapas.find((e) => e.status === 'pendente' || e.status === 'atrasada');

  const handleExecuteStep = (etapa: any) => {
    setSelectedEtapa(etapa);
    setExecutorOpen(true);
  };

  if (isLoading) {
    return (
      <div className="repro-page animate-slide-up">
        <div className="next-gen-kpi-grid">
          {Array(4).fill(0).map((_, i) => <KPISkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (!protocolo) {
    return (
      <div className="repro-page">
        <p>Protocolo não encontrado.</p>
      </div>
    );
  }

  const totalEtapas = etapas.length;
  const etapasRealizadas = etapas.filter((e) => e.status === 'realizada').length;
  const pct = totalEtapas > 0 ? Math.round((etapasRealizadas / totalEtapas) * 100) : 0;
  const totalAnimais = animais.length;
  const prenhas = animais.filter((a) => a.resultado_final === 'Prenha').length;

  const animalColumns = [
    {
      header: 'Brinco',
      accessor: (pa: any) => (
        <span style={{ fontWeight: 800, color: 'hsl(var(--text-main))' }}>#{pa.animais?.brinco || '---'}</span>
      ),
    },
    {
      header: 'Categoria',
      accessor: (pa: any) => (
        <span style={{ color: 'hsl(var(--text-muted))' }}>{pa.animais?.categoria || '---'}</span>
      ),
    },
    {
      header: 'Fase Atual',
      accessor: (pa: any) => (
        <span className="status-pill info" style={{ fontSize: '10px' }}>
          {pa.animais?.fase_atual || '---'}
        </span>
      ),
    },
    {
      header: 'Resultado Final',
      accessor: (pa: any) => {
        const resultado = pa.resultado_final;
        return resultado ? (
          <span
            className={`status-pill ${resultado === 'Prenha' ? 'success' : resultado === 'Vazia' ? 'warning' : 'stopped'}`}
            style={{ fontSize: '10px' }}
          >
            {resultado}
          </span>
        ) : (
          <span style={{ color: 'hsl(var(--text-muted))', fontSize: '11px' }}>Pendente</span>
        );
      },
    },
    {
      header: 'Diagnóstico',
      accessor: (pa: any) => (
        <span style={{ color: 'hsl(var(--text-muted))' }}>{fmtDate(pa.data_diagnostico)}</span>
      ),
    },
  ];

  return (
    <div className="repro-page animate-slide-up">
      {/* Header */}
      <header className="page-header">
        <div className="header-brand-group">
          <Breadcrumb
            paths={[
              { label: 'Bovinocultura', href: '/bovinocultura/dashboard' },
              { label: 'Reprodução', href: '/bovinocultura/reproducao?tab=PROTOCOLOS' },
              { label: protocolo.nome },
            ]}
          />
          <h1 className="page-title">{protocolo.nome}</h1>
          <p className="page-subtitle">
            {protocolo.tipo} · D0: {fmtDate(protocolo.data_inicio)}
            {protocolo.tecnico_resp ? ` · ${protocolo.tecnico_resp}` : ''}
          </p>
        </div>
        <div className="page-actions">
          <button
            className="glass-btn secondary"
            onClick={() => navigate('/bovinocultura/reproducao?tab=PROTOCOLOS')}
          >
            <ChevronLeft size={18} />
            VOLTAR
          </button>
          {protocolo.status === 'ativo' && proximaEtapa && (
            <button className="primary-btn" onClick={() => handleExecuteStep(proximaEtapa)}>
              <Play size={18} />
              EXECUTAR PRÓXIMA ETAPA
            </button>
          )}
        </div>
      </header>

      {/* KPI rápido */}
      <div className="next-gen-kpi-grid" style={{ marginBottom: '24px' }}>
        {[
          {
            icon: <ListChecks size={22} />,
            label: 'Progresso',
            value: `${etapasRealizadas}/${totalEtapas}`,
            sub: `${pct}% concluído`,
            color: 'hsl(217 91% 55%)',
          },
          {
            icon: <Beef size={22} />,
            label: 'Animais',
            value: totalAnimais,
            sub: 'matrizes inscritas',
            color: 'hsl(142 71% 45%)',
          },
          {
            icon: <CheckCircle2 size={22} />,
            label: 'Prenhas',
            value: prenhas || '—',
            sub: totalAnimais > 0 ? `${Math.round((prenhas / totalAnimais) * 100)}% de concepção` : 'Aguardando diagnóstico',
            color: 'hsl(142 71% 45%)',
          },
          {
            icon: <Calendar size={22} />,
            label: 'Próxima Etapa',
            value: proximaEtapa ? proximaEtapa.nome_etapa : 'Concluído',
            sub: proximaEtapa ? fmtDate(proximaEtapa.data_prevista) : '—',
            color: proximaEtapa ? 'hsl(38 92% 50%)' : 'hsl(var(--text-muted))',
          },
        ].map((card, i) => (
          <div
            key={i}
            className="stat-card"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '20px 24px',
              display: 'flex',
              gap: '16px',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '12px',
                background: `${card.color}18`,
                border: `1.5px solid ${card.color}40`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: card.color,
                flexShrink: 0,
              }}
            >
              {card.icon}
            </div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 900, lineHeight: 1 }}>{card.value}</div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'hsl(var(--text-muted))', marginTop: '2px' }}>{card.label}</div>
              <div style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>{card.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Corpo: Timeline + Animais */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '24px', alignItems: 'start' }}>
        {/* TIMELINE das etapas */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '24px',
          }}
        >
          <h3 style={{ fontWeight: 800, marginBottom: '20px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <ListChecks size={18} /> Etapas do Protocolo
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {etapas.map((etapa, idx) => {
              const cor = STATUS_COLOR[etapa.status] || 'hsl(var(--text-muted))';
              const isLast = idx === etapas.length - 1;
              const isNext = proximaEtapa?.id === etapa.id;
              const diff = Math.ceil(
                (new Date(etapa.data_prevista).getTime() - Date.now()) / 86400000
              );

              return (
                <div key={etapa.id} style={{ display: 'flex', gap: '12px' }}>
                  {/* Indicador */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: etapa.status === 'realizada' ? cor : 'var(--bg-main)',
                        border: `2.5px solid ${cor}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: isNext ? `0 0 0 4px ${cor}25` : 'none',
                      }}
                    >
                      {etapa.status === 'realizada' ? (
                        <Check size={13} color="white" />
                      ) : etapa.status === 'atrasada' ? (
                        <AlertTriangle size={12} color={cor} />
                      ) : (
                        <Clock size={12} color={cor} />
                      )}
                    </div>
                    {!isLast && (
                      <div
                        style={{
                          width: 2,
                          flex: 1,
                          minHeight: 24,
                          background: etapa.status === 'realizada' ? cor : 'var(--border)',
                          margin: '4px 0',
                        }}
                      />
                    )}
                  </div>

                  {/* Conteúdo */}
                  <div
                    style={{
                      paddingBottom: isLast ? 0 : '16px',
                      flex: 1,
                      borderRadius: isNext ? '10px' : 0,
                      background: isNext ? `${cor}0A` : 'transparent',
                      padding: isNext ? '8px 10px' : '2px 0 16px',
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: '13px' }}>{etapa.nome_etapa}</div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: etapa.status === 'atrasada' ? 'hsl(0 84% 55%)' : 'hsl(var(--text-muted))',
                        marginTop: '2px',
                      }}
                    >
                      {etapa.status === 'realizada'
                        ? `✓ ${fmtDate(etapa.data_realizada)}`
                        : diff < 0
                        ? `Atrasada ${Math.abs(diff)}d`
                        : diff === 0
                        ? 'HOJE'
                        : fmtDate(etapa.data_prevista)}
                    </div>
                    {isNext && protocolo.status === 'ativo' && (
                      <button
                        onClick={() => handleExecuteStep(etapa)}
                        style={{
                          marginTop: '6px',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          background: cor,
                          color: 'white',
                          fontWeight: 700,
                          fontSize: '11px',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Play size={10} /> EXECUTAR
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* TABELA de animais */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '24px',
          }}
        >
          <h3 style={{ fontWeight: 800, marginBottom: '20px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Beef size={18} /> Animais Participantes ({totalAnimais})
          </h3>
          <ModernTable
            columns={animalColumns}
            data={animais}
            loading={isLoading}
            hideHeader={true}
            emptyState={
              <EmptyState
                icon={Beef}
                title="Nenhum animal inscrito"
                description="Nenhum animal foi inscrito neste protocolo ainda."
              />
            }
          />
        </div>
      </div>

      {/* SidePanel executor */}
      <ProtocolStepExecutor
        isOpen={executorOpen}
        onClose={() => { setExecutorOpen(false); setSelectedEtapa(null); }}
        etapa={selectedEtapa || proximaEtapa}
        protocolo={protocolo}
        animais={animais}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['protocolo', id] });
          setExecutorOpen(false);
          setSelectedEtapa(null);
          toast.success('Etapa registrada com sucesso!');
        }}
      />
    </div>
  );
};
