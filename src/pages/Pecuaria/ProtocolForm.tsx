import React, { useState, useEffect, useMemo } from 'react';
import {
  FlaskConical, ChevronLeft, ChevronRight, Check,
  Dna, Beef, Calendar, ListChecks, Settings2,
  Plus, Trash2, Search, X, GripVertical, Edit2,
  ChevronDown, Syringe,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import toast from 'react-hot-toast';
import { SidePanel } from '../../components/Layout/SidePanel';
import { TemplateForm } from './TemplateForm';

// ─── TIPOS ────────────────────────────────────────────────────────────────────
interface Template {
  id: string;
  nome: string;
  descricao?: string;
  tipo: string;
  is_sistema: boolean;
  protocolo_template_etapas?: TemplateEtapa[];
}

interface TemplateEtapa {
  id: string;
  nome_etapa: string;
  dia_relativo: number;
  tipo_acao: string;
  instrucao?: string;
  obrigatorio: boolean;
  ordem: number;
}

interface Animal {
  id: string;
  brinco?: string;
  categoria?: string;
  fase_atual?: string;
  lote_id?: string;
}

interface Lote {
  id: string;
  nome: string;
  quantidade_animais?: number;
}

interface FarmacoDraft {
  id: string;
  nome: string;
  dose: string;
  unidade: string;
}

interface EtapaDraft {
  id: string;
  nome_etapa: string;
  dia_relativo: number;
  tipo_acao: string;
  instrucao?: string;
  obrigatorio: boolean;
  ordem: number;
  data_prevista?: string;
  farmacos?: FarmacoDraft[];
}

// ─── STEP INDICATOR ──────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Template',      icon: Dna        },
  { id: 2, label: 'Configuração',  icon: Settings2  },
  { id: 3, label: 'Animais',       icon: Beef       },
  { id: 4, label: 'Cronograma',    icon: Calendar   },
  { id: 5, label: 'Confirmação',   icon: ListChecks },
];

const addDays = (base: string, days: number) => {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};
const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('pt-BR') : '---');

const TIPO_COLOR: Record<string, string> = {
  IATF:   'hsl(217 91% 55%)',
  Monta:  'hsl(142 71% 45%)',
  Custom: 'hsl(258 90% 66%)',
};

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
interface ProtocolFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProtocolForm: React.FC<ProtocolFormProps> = ({ isOpen, onClose }) => {
  const { activeTenantId, activeFarmId, insertPayload } = useFarmFilter();

  const [step, setStep] = useState(1);

  // Step 1 — Template
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [templateFormOpen, setTemplateFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  // Step 4 — Cronograma expanded panels
  const [expandedEtapas, setExpandedEtapas] = useState<Set<string>>(new Set());

  // Step 2 — Configuração
  const [config, setConfig] = useState({
    nome: '',
    tipo: 'IATF' as string,
    data_inicio: new Date().toISOString().split('T')[0],
    tecnico_resp: '',
    touro_id: '',
    data_fim_monta: '',
    observacoes: '',
  });

  // Step 3 — Animais
  const [selMode, setSelMode] = useState<'lote' | 'individual' | 'hibrido'>('lote');
  const [selectedLoteId, setSelectedLoteId] = useState('');
  const [selectedAnimais, setSelectedAnimais] = useState<Animal[]>([]);
  const [animalSearch, setAnimalSearch] = useState('');

  // Step 4 — Etapas/Cronograma
  const [etapas, setEtapas] = useState<EtapaDraft[]>([]);

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: templates = [] } = useQuery<Template[]>({
    queryKey: ['protocolo_templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('protocolo_templates')
        .select('*, protocolo_template_etapas(*)');
      if (error) throw error;
      return data as Template[];
    },
  });

  const { data: lotes = [] } = useQuery<Lote[]>({
    queryKey: ['lotes_select', activeTenantId],
    enabled: !!activeTenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lotes')
        .select('id, nome, quantidade_animais')
        .eq('tenant_id', activeTenantId!)
        .order('nome');
      if (error) throw error;
      return data as Lote[];
    },
  });

  const { data: animaisLote = [], isLoading: loadingAnimais } = useQuery<Animal[]>({
    queryKey: ['animais_lote', selectedLoteId],
    enabled: !!selectedLoteId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('animais')
        .select('id, brinco, categoria, fase_atual, lote_id')
        .eq('lote_id', selectedLoteId)
        .eq('tenant_id', activeTenantId!);
      if (error) throw error;
      return data as Animal[];
    },
  });

  const { data: todosAnimais = [] } = useQuery<Animal[]>({
    queryKey: ['animais_all_select', activeTenantId],
    enabled: !!activeTenantId && (selMode === 'individual' || selMode === 'hibrido'),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('animais')
        .select('id, brinco, categoria, fase_atual, lote_id')
        .eq('tenant_id', activeTenantId!)
        .order('brinco');
      if (error) throw error;
      return data as Animal[];
    },
  });

  // Quando muda lote — popula animais selecionados
  useEffect(() => {
    if ((selMode === 'lote' || selMode === 'hibrido') && animaisLote.length > 0) {
      setSelectedAnimais((prev) => {
        const ids = new Set(prev.map((a) => a.id));
        const novos = animaisLote.filter((a) => !ids.has(a.id));
        return selMode === 'lote' ? animaisLote : [...prev, ...novos];
      });
    }
  }, [animaisLote, selMode]);

  // Quando seleciona template — popula etapas
  useEffect(() => {
    if (selectedTemplate?.protocolo_template_etapas) {
      const base =
        config.data_inicio || new Date().toISOString().split('T')[0];
      const draft: EtapaDraft[] = selectedTemplate.protocolo_template_etapas
        .slice()
        .sort((a, b) => a.ordem - b.ordem)
        .map((e) => ({
          ...e,
          id: crypto.randomUUID(),
          data_prevista: addDays(base, e.dia_relativo),
        }));
      setEtapas(draft);
      setConfig((c) => ({ ...c, tipo: selectedTemplate.tipo }));
    } else if (selectedTemplate?.nome === 'Protocolo Livre') {
      setEtapas([]);
    }
  }, [selectedTemplate]);

  // Recalcular datas quando muda data_inicio
  useEffect(() => {
    if (etapas.length > 0 && config.data_inicio) {
      setEtapas((prev) =>
        prev.map((e) => ({ ...e, data_prevista: addDays(config.data_inicio, e.dia_relativo) }))
      );
    }
  }, [config.data_inicio]);

  // ── Validação por step ─────────────────────────────────────────────────────
  const canNext = useMemo(() => {
    if (step === 1) return !!selectedTemplate;
    if (step === 2) return !!config.nome && !!config.data_inicio;
    if (step === 3) return selectedAnimais.length > 0;
    if (step === 4) return etapas.length > 0;
    return true;
  }, [step, selectedTemplate, config, selectedAnimais, etapas]);

  // ── Salvar ─────────────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async () => {
      // 1. Criar protocolo
      const { data: proto, error: protoErr } = await supabase
        .from('protocolos_reprodutivos')
        .insert([{
          ...insertPayload,
          template_id: selectedTemplate?.nome === 'Protocolo Livre' ? null : selectedTemplate?.id,
          nome: config.nome,
          tipo: config.tipo,
          data_inicio: config.data_inicio,
          tecnico_resp: config.tecnico_resp || null,
          touro_id: config.touro_id || null,
          data_fim_monta: config.data_fim_monta || null,
          observacoes: config.observacoes || null,
          status: 'ativo',
        }])
        .select()
        .single();
      if (protoErr) throw protoErr;

      // 2. Criar etapas do protocolo (cronograma geral)
      if (etapas.length > 0) {
        const etapasPayload = etapas.map((e, idx) => ({
          protocolo_id: proto.id,
          nome_etapa: e.nome_etapa,
          dia_relativo: e.dia_relativo,
          data_prevista: e.data_prevista!,
          tipo_acao: e.tipo_acao,
          instrucao: e.instrucao || null,
          obrigatorio: e.obrigatorio,
          ordem: idx + 1,
          status: 'pendente',
        }));
        const { error: etErr } = await supabase
          .from('protocolo_etapas')
          .insert(etapasPayload);
        if (etErr) throw etErr;
      }

      // 3. Inserir animais vinculados ao protocolo
      if (selectedAnimais.length > 0) {
        const animaisPayload = selectedAnimais.map((a) => ({
          protocolo_id: proto.id,
          animal_id: a.id,
          lote_id: a.lote_id || null,
        }));
        const { error: aniErr } = await supabase
          .from('protocolo_animais')
          .insert(animaisPayload);
        if (aniErr) throw aniErr;
      }

      // 4. ── EXPLOSÃO DE EVENTOS INDIVIDUAIS ────────────────────────────────
      // Gera (N animais × M etapas) eventos pendentes nas DUAS tabelas:
      //   → eventos_reprodutivos  (Módulo Reprodução)
      //   → sanidade              (Módulo Sanidade — fármacos e procedimentos)
      if (selectedAnimais.length > 0 && etapas.length > 0) {
        const refLabel = `[PROTOCOLO:${proto.id}]`;

        // 4a. eventos_reprodutivos ───────────────────────────────────────────
        const eventosRepro = selectedAnimais.flatMap((animal) =>
          etapas.map((etapa) => ({
            ...insertPayload,
            animal_id:    animal.id,
            tipo_evento:  config.tipo || 'IATF',
            data_evento:  etapa.data_prevista ?? config.data_inicio,
            status:       'pendente',
            resultado:    '',
            observacoes:  `${etapa.nome_etapa} — ${refLabel}`,
            tecnico:      config.tecnico_resp || null,
            protocolo_id: proto.id,
          }))
        );
        const { error: reproErr } = await supabase
          .from('eventos_reprodutivos')
          .insert(eventosRepro);
        if (reproErr) {
          // Não bloqueia o fluxo — loga no console para diagnóstico
          console.error('Aviso: erro ao gerar eventos_reprodutivos:', reproErr.message);
        }

        // 4b. sanidade ───────────────────────────────────────────────────────
        const eventosSanidade = selectedAnimais.flatMap((animal) =>
          etapas.map((etapa) => ({
            ...insertPayload,
            animal_id:   animal.id,
            titulo:      etapa.nome_etapa,
            tipo:        etapa.tipo_acao === 'farmaco' ? 'medicamento' : 'procedimento',
            produto:     etapa.instrucao ? etapa.instrucao.split('\n')[0] : null,
            dose:        null,
            data_manejo: etapa.data_prevista ?? config.data_inicio,
            status:      'PENDENTE',
            observacao:  `Protocolo Reprodutivo: ${config.nome} ${refLabel}`,
            veterinario: config.tecnico_resp || null,
          }))
        );
        const { error: sanErr } = await supabase
          .from('sanidade')
          .insert(eventosSanidade);
        if (sanErr) {
          // Não bloqueia o fluxo — loga no console para diagnóstico
          console.error('Aviso: erro ao gerar sanidade:', sanErr.message);
        }
      }

      return proto;
    },
    onSuccess: () => {
      const total = selectedAnimais.length * etapas.length;
      toast.success(
        `✅ Protocolo "${config.nome}" iniciado com sucesso!` +
        (total > 0 ? ` ${total} evento(s) pendente(s) gerado(s) em Reprodução e Sanidade.` : '')
      );
      onClose();
    },
    onError: (err: any) => toast.error(`Erro: ${err.message}`),
  });

  // ── Helpers de etapas ──────────────────────────────────────────────────────
  const addEtapa = () => {
    const lastDia = etapas.length > 0 ? etapas[etapas.length - 1].dia_relativo + 7 : 0;
    setEtapas((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        nome_etapa: '',
        dia_relativo: lastDia,
        tipo_acao: 'farmaco',
        obrigatorio: true,
        ordem: prev.length + 1,
        data_prevista: addDays(config.data_inicio, lastDia),
      },
    ]);
  };

  const updateEtapa = (id: string, field: keyof EtapaDraft, value: any) => {
    setEtapas((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        const updated = { ...e, [field]: value };
        if (field === 'dia_relativo') {
          updated.data_prevista = addDays(config.data_inicio, Number(value));
        }
        if (field === 'data_prevista') {
          const diff = Math.round(
            (new Date(value).getTime() - new Date(config.data_inicio).getTime()) / 86400000
          );
          updated.dia_relativo = diff;
        }
        return updated;
      })
    );
  };

  const removeEtapa = (id: string) => setEtapas((prev) => prev.filter((e) => e.id !== id));

  const toggleEtapaExpand = (id: string) => {
    setExpandedEtapas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const addFarmaco = (etapaId: string) => {
    setEtapas((prev) => prev.map((e) =>
      e.id !== etapaId ? e : {
        ...e,
        farmacos: [...(e.farmacos || []), { id: crypto.randomUUID(), nome: '', dose: '', unidade: 'mL' }],
      }
    ));
  };

  const updateFarmaco = (etapaId: string, farmacoId: string, field: keyof FarmacoDraft, value: string) => {
    setEtapas((prev) => prev.map((e) =>
      e.id !== etapaId ? e : {
        ...e,
        farmacos: (e.farmacos || []).map((f) => f.id === farmacoId ? { ...f, [field]: value } : f),
      }
    ));
  };

  const removeFarmaco = (etapaId: string, farmacoId: string) => {
    setEtapas((prev) => prev.map((e) =>
      e.id !== etapaId ? e : { ...e, farmacos: (e.farmacos || []).filter((f) => f.id !== farmacoId) }
    ));
  };

  const toggleAnimal = (animal: Animal) => {
    setSelectedAnimais((prev) => {
      const exists = prev.find((a) => a.id === animal.id);
      return exists ? prev.filter((a) => a.id !== animal.id) : [...prev, animal];
    });
  };

  const filteredAnimais = todosAnimais.filter((a) => {
    const q = animalSearch.toLowerCase();
    return (
      (a.brinco || '').toLowerCase().includes(q) ||
      (a.categoria || '').toLowerCase().includes(q)
    );
  });

  const templatesPorTipo = useMemo(() => {
    const grupos: Record<string, Template[]> = {};
    templates.forEach((t) => {
      const key = t.is_sistema ? 'Sistema' : 'Meus Templates';
      if (!grupos[key]) grupos[key] = [];
      grupos[key].push(t);
    });
    return grupos;
  }, [templates]);

  // ─── RENDER ───────────────────────────────────────────────────────────────
  if (!isOpen) return null;

  const STEP_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#06b6d4'];

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      title="Novo Protocolo"
      subtitle="Escolha um template, configure as etapas e adicione animais ao protocolo."
      icon={FlaskConical}
      size="xlarge"
      customFooter={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <button
            type="button"
            className="glass-btn secondary"
            disabled={step === 1}
            onClick={() => setStep((s) => s - 1)}
          >
            <ChevronLeft size={18} /> ANTERIOR
          </button>
          <span style={{ fontSize: '13px', color: 'hsl(var(--text-muted))' }}>
            Etapa {step} de {STEPS.length}
          </span>
          {step < STEPS.length ? (
            <button
              type="button"
              className="primary-btn"
              disabled={!canNext}
              onClick={() => setStep((s) => s + 1)}
            >
              PRÓXIMO <ChevronRight size={18} />
            </button>
          ) : (
            <button
              type="button"
              className="primary-btn"
              disabled={saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
            >
              {saveMutation.isPending ? 'Salvando...' : (
                <><FlaskConical size={18} /> INICIAR PROTOCOLO</>
              )}
            </button>
          )}
        </div>
      }
    >
      <div style={{ display: 'flex', gap: '24px' }}>
        {/* ── Sidebar de Etapas (padrão ReproductionForm) ── */}
        <div style={{ width: '200px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {STEPS.map((s) => {
            const Icon = s.icon;
            const done = step > s.id;
            const active = step === s.id;
            const cor = STEP_COLORS[s.id - 1];
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => done && setStep(s.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  background: active ? `${cor}15` : 'transparent',
                  color: active ? cor : done ? 'hsl(var(--text-primary))' : 'hsl(var(--text-muted))',
                  cursor: done ? 'pointer' : active ? 'default' : 'not-allowed',
                  textAlign: 'left',
                  fontWeight: active ? 700 : 500,
                  transition: 'all 0.2s',
                  boxShadow: active ? `inset 3px 0 0 ${cor}` : 'none',
                  opacity: !done && !active ? 0.5 : 1,
                }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: done ? cor : active ? `${cor}30` : 'hsl(var(--bg-main))',
                  color: done ? '#fff' : active ? cor : 'hsl(var(--text-muted))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {done ? <Check size={16} /> : <Icon size={16} />}
                </div>
                <span style={{ fontSize: '13px', flex: 1 }}>{s.id}. {s.label}</span>
                {active && <ChevronRight size={16} style={{ opacity: 0.5 }} />}
              </button>
            );
          })}
        </div>

        {/* ── Área de Conteúdo (padrão ReproductionForm) ── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.18 }}
            >
              <div style={{
                background: 'hsl(var(--bg-card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '16px',
                padding: '24px',
              }}>
                {/* Cabeçalho da seção */}
                <div style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid hsl(var(--border))' }}>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '17px', fontWeight: 800 }}>
                    {STEPS.find((s) => s.id === step)?.label}
                  </h3>
                  <p style={{ margin: 0, fontSize: '13px', color: 'hsl(var(--text-muted))' }}>
                    {step === 1 && 'Escolha um protocolo padrão da indústria ou um template personalizado.'}
                    {step === 2 && 'Defina o nome, data de início D0 e responsável técnico.'}
                    {step === 3 && 'Adicione matrizes ao protocolo por lote ou individualmente.'}
                    {step === 4 && 'Revise e ajuste as datas calculadas automaticamente pelo template.'}
                    {step === 5 && 'Confirme o resumo antes de iniciar o protocolo.'}
                  </p>
                </div>

                {/* STEP 1 — Template */}
                {step === 1 && (
                  <div>
                    {Object.entries(templatesPorTipo).map(([grupo, tmps]) => (
                      <div key={grupo} style={{ marginBottom: '20px' }}>
                        <h4 style={{ fontWeight: 700, color: 'hsl(var(--text-muted))', marginBottom: '8px', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.08em' }}>
                          {grupo}
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {tmps.map((t) => {
                            const cor = TIPO_COLOR[t.tipo] || 'hsl(var(--brand))';
                            const isSelected = selectedTemplate?.id === t.id;
                            return (
                              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button
                                  type="button"
                                  onClick={() => setSelectedTemplate(t)}
                                  style={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    background: isSelected ? `${cor}10` : 'var(--bg-main)',
                                    border: `1.5px solid ${isSelected ? cor : 'var(--border)'}`,
                                    borderRadius: '10px',
                                    padding: '10px 14px',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    transition: 'all 0.15s',
                                  }}
                                >
                                  <div style={{ width: 34, height: 34, borderRadius: '8px', background: `${cor}18`, border: `1px solid ${cor}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Dna size={16} style={{ color: cor }} />
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                                      <span style={{ fontWeight: 700, fontSize: '13px' }}>{t.nome}</span>
                                      <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 7px', borderRadius: '99px', background: `${cor}18`, color: cor, flexShrink: 0 }}>
                                        {t.tipo}
                                      </span>
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {t.descricao}
                                    </div>
                                  </div>
                                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: isSelected ? cor : 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                                    <Check size={11} color="white" />
                                  </div>
                                </button>
                                {/* Botão editar — só para templates personalizados */}
                                {!t.is_sistema && (
                                  <button
                                    type="button"
                                    title="Editar template"
                                    onClick={(e) => { e.stopPropagation(); setEditingTemplate(t); setTemplateFormOpen(true); }}
                                    style={{
                                      flexShrink: 0, width: 32, height: 32,
                                      borderRadius: '8px', border: '1px solid var(--border)',
                                      background: 'var(--bg-main)', cursor: 'pointer',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      color: 'hsl(var(--text-muted))', transition: 'all 0.15s',
                                    }}
                                  >
                                    <Edit2 size={13} />
                                  </button>
                                )}
                              </div>

                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* STEP 2 — Configuração */}
                {step === 2 && (
                  <div className="tauze-input-grid grid-col-2">
                    <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
                      <label className="tauze-label">Nome do Protocolo *</label>
                      <input
                        type="text"
                        className="tauze-input"
                        placeholder={`Ex: IATF ${selectedTemplate?.nome || ''} — Lote A — Jun/25`}
                        value={config.nome}
                        onChange={(e) => setConfig((c) => ({ ...c, nome: e.target.value }))}
                      />
                    </div>
                    <div className="tauze-field-group">
                      <label className="tauze-label">Data D0 (Início) *</label>
                      <input type="date" className="tauze-input" value={config.data_inicio} onChange={(e) => setConfig((c) => ({ ...c, data_inicio: e.target.value }))} />
                    </div>
                    <div className="tauze-field-group">
                      <label className="tauze-label">Técnico / Inseminador Responsável</label>
                      <input type="text" className="tauze-input" placeholder="Nome do técnico" value={config.tecnico_resp} onChange={(e) => setConfig((c) => ({ ...c, tecnico_resp: e.target.value }))} />
                    </div>
                    {config.tipo === 'Monta' && (
                      <>
                        <div className="tauze-field-group">
                          <label className="tauze-label">Nome / ID do Touro</label>
                          <input type="text" className="tauze-input" placeholder="Ex: Touro Nelore #BT001" value={config.touro_id} onChange={(e) => setConfig((c) => ({ ...c, touro_id: e.target.value }))} />
                        </div>
                        <div className="tauze-field-group">
                          <label className="tauze-label">Fim da Estação de Monta</label>
                          <input type="date" className="tauze-input" value={config.data_fim_monta} onChange={(e) => setConfig((c) => ({ ...c, data_fim_monta: e.target.value }))} />
                        </div>
                      </>
                    )}
                    <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
                      <label className="tauze-label">Observações Gerais</label>
                      <textarea className="tauze-input" rows={3} placeholder="Informações adicionais sobre o protocolo..." value={config.observacoes} onChange={(e) => setConfig((c) => ({ ...c, observacoes: e.target.value }))} />
                    </div>
                  </div>
                )}


                {/* STEP 3 — Animais */}
                {step === 3 && (
                  <div>
                    {selectedAnimais.length > 0 && (
                      <div style={{ padding: '8px 14px', borderRadius: '8px', background: 'hsl(142 71% 45% / 0.08)', border: '1px solid hsl(142 71% 45% / 0.2)', marginBottom: '16px', fontSize: '13px', fontWeight: 700, color: 'hsl(142 71% 38%)' }}>
                        ✓ {selectedAnimais.length} animais selecionados
                      </div>
                    )}
                    <div className="tauze-tab-group" style={{ marginBottom: '16px' }}>
                      {[{ id: 'lote', label: 'Por Lote' }, { id: 'individual', label: 'Individual' }, { id: 'hibrido', label: 'Lote + Ajuste' }].map((m) => (
                        <button type="button" key={m.id} className={`tauze-tab-item ${selMode === m.id ? 'active' : ''}`} onClick={() => { setSelMode(m.id as any); setSelectedAnimais([]); setSelectedLoteId(''); }}>
                          {m.label}
                        </button>
                      ))}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div>
                        {(selMode === 'lote' || selMode === 'hibrido') && (
                          <div className="form-group" style={{ marginBottom: '12px' }}>
                            <label className="form-label">Selecionar Lote</label>
                            <select className="form-input" value={selectedLoteId} onChange={(e) => setSelectedLoteId(e.target.value)}>
                              <option value="">Escolha um lote...</option>
                              {lotes.map((l) => (<option key={l.id} value={l.id}>{l.nome} ({l.quantidade_animais || 0} animais)</option>))}
                            </select>
                          </div>
                        )}
                        {(selMode === 'individual' || selMode === 'hibrido') && (
                          <div>
                            <div className="tauze-search-wrapper" style={{ marginBottom: '10px' }}>
                              <Search size={16} className="s-icon" />
                              <input type="text" className="tauze-search-input" placeholder="Buscar brinco ou categoria..." value={animalSearch} onChange={(e) => setAnimalSearch(e.target.value)} />
                            </div>
                            <div style={{ maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {filteredAnimais.slice(0, 50).map((a) => {
                                const isSel = selectedAnimais.some((x) => x.id === a.id);
                                return (
                                  <button type="button" key={a.id} onClick={() => toggleAnimal(a)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '8px', background: isSel ? 'hsl(142 71% 45% / 0.1)' : 'var(--bg-card)', border: `1px solid ${isSel ? 'hsl(142 71% 45% / 0.4)' : 'var(--border)'}`, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                                    <div style={{ width: 18, height: 18, borderRadius: '4px', border: `2px solid ${isSel ? 'hsl(142 71% 45%)' : 'var(--border)'}`, background: isSel ? 'hsl(142 71% 45%)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                      {isSel && <Check size={11} color="white" />}
                                    </div>
                                    <span style={{ fontWeight: 700, fontSize: '13px' }}>#{a.brinco}</span>
                                    <span style={{ fontSize: '12px', color: 'hsl(var(--text-muted))' }}>{a.categoria}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '11px', marginBottom: '10px', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                          Animais Selecionados ({selectedAnimais.length})
                        </div>
                        <div style={{ maxHeight: '360px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {selectedAnimais.length === 0 ? (
                            <div style={{ padding: '32px', textAlign: 'center', color: 'hsl(var(--text-muted))', fontSize: '13px' }}>Nenhum animal selecionado ainda.</div>
                          ) : (
                            selectedAnimais.map((a) => (
                              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '8px', background: 'hsl(142 71% 45% / 0.06)', border: '1px solid hsl(142 71% 45% / 0.2)' }}>
                                <span style={{ fontWeight: 700, fontSize: '13px', flex: 1 }}>#{a.brinco}</span>
                                <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>{a.categoria}</span>
                                <button type="button" onClick={() => setSelectedAnimais((prev) => prev.filter((x) => x.id !== a.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--text-muted))', padding: '2px' }}><X size={14} /></button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4 — Cronograma */}
                {step === 4 && (
                  <div>
                    {etapas.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '32px', color: 'hsl(var(--text-muted))' }}>
                        <Calendar size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                        <p style={{ marginBottom: '16px' }}>Nenhuma etapa definida. Adicione etapas manualmente ou volte ao passo 1 e selecione um template.</p>
                        <button type="button" className="primary-btn" onClick={addEtapa}>
                          <Plus size={16} /> Adicionar Primeira Etapa
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {etapas.map((e, idx) => {
                          const isFarmaco = e.tipo_acao === 'farmaco';
                          const isExpanded = expandedEtapas.has(e.id);
                          const farmCount = e.farmacos?.length || 0;
                          return (
                            <div key={e.id} style={{ borderRadius: '10px', border: `1px solid ${isFarmaco && isExpanded ? 'hsl(258 90% 66% / 0.35)' : 'hsl(var(--border))'}`, overflow: 'hidden', transition: 'border-color 0.2s' }}>
                              {/* Linha principal */}
                              <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 90px 145px 130px 36px', gap: '8px', alignItems: 'center', padding: '10px 14px', background: isFarmaco && isExpanded ? 'hsl(258 90% 66% / 0.04)' : 'hsl(var(--bg-main))' }}>
                                <span style={{ fontWeight: 800, fontSize: '12px', color: 'hsl(var(--text-muted))', textAlign: 'center' }}>{idx + 1}</span>
                                <input type="text" className="form-input" style={{ fontWeight: 700, fontSize: '13px' }} value={e.nome_etapa} placeholder="Nome da etapa..." onChange={(ev) => updateEtapa(e.id, 'nome_etapa', ev.target.value)} />
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', whiteSpace: 'nowrap' }}>D+</span>
                                  <input type="number" className="form-input" style={{ width: '56px', textAlign: 'center' }} value={e.dia_relativo} onChange={(ev) => updateEtapa(e.id, 'dia_relativo', Number(ev.target.value))} />
                                </div>
                                <input type="date" className="form-input" value={e.data_prevista || ''} onChange={(ev) => updateEtapa(e.id, 'data_prevista', ev.target.value)} />
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <select className="form-input" style={{ fontSize: '12px', flex: 1 }} value={e.tipo_acao} onChange={(ev) => updateEtapa(e.id, 'tipo_acao', ev.target.value)}>
                                    <option value="farmaco">Fármaco</option>
                                    <option value="ia">IA</option>
                                    <option value="diagnostico">Diagnóstico</option>
                                    <option value="observacao">Observação</option>
                                  </select>
                                  {isFarmaco && (
                                    <button
                                      type="button"
                                      onClick={() => toggleEtapaExpand(e.id)}
                                      title={isExpanded ? 'Ocultar insumos' : `${farmCount} insumo${farmCount !== 1 ? 's' : ''} — clique para gerenciar`}
                                      style={{
                                        width: 28, height: 28, flexShrink: 0,
                                        borderRadius: '6px',
                                        border: `1px solid ${isExpanded ? 'hsl(258 90% 66% / 0.5)' : 'var(--border)'}`,
                                        background: isExpanded ? 'hsl(258 90% 66% / 0.12)' : 'var(--bg-card)',
                                        color: isExpanded ? 'hsl(258 90% 66%)' : 'hsl(var(--text-muted))',
                                        cursor: 'pointer', display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', transition: 'all 0.15s', position: 'relative',
                                      }}
                                    >
                                      <Syringe size={13} />
                                      {farmCount > 0 && (
                                        <span style={{
                                          position: 'absolute', top: -5, right: -5,
                                          width: 14, height: 14, borderRadius: '50%',
                                          background: 'hsl(258 90% 66%)', color: '#fff',
                                          fontSize: '9px', fontWeight: 800,
                                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>{farmCount}</span>
                                      )}
                                    </button>
                                  )}
                                </div>
                                <button type="button" onClick={() => removeEtapa(e.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(0 84% 55%)', padding: '4px' }}>
                                  <Trash2 size={15} />
                                </button>
                              </div>

                              {/* Painel de insumos — apenas para etapas Fármaco */}
                              {isFarmaco && isExpanded && (
                                <div style={{
                                  padding: '12px 16px 16px',
                                  borderTop: '1px solid hsl(258 90% 66% / 0.2)',
                                  background: 'hsl(258 90% 66% / 0.03)',
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <Syringe size={13} style={{ color: 'hsl(258 90% 66%)' }} />
                                      <span style={{ fontSize: '11px', fontWeight: 800, color: 'hsl(258 90% 66%)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                        Insumos Fármacos
                                      </span>
                                      <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>
                                        — defina os produtos para esta etapa
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => addFarmaco(e.id)}
                                      style={{
                                        display: 'flex', alignItems: 'center', gap: '5px',
                                        padding: '5px 10px', borderRadius: '6px',
                                        border: '1px solid hsl(258 90% 66% / 0.4)',
                                        background: 'hsl(258 90% 66% / 0.1)',
                                        color: 'hsl(258 90% 66%)', cursor: 'pointer',
                                        fontWeight: 700, fontSize: '12px',
                                      }}
                                    >
                                      <Plus size={13} /> Adicionar Insumo
                                    </button>
                                  </div>

                                  {(e.farmacos || []).length === 0 ? (
                                    <div style={{ padding: '14px', textAlign: 'center', color: 'hsl(var(--text-muted))', fontSize: '12px', borderRadius: '8px', border: '1px dashed hsl(var(--border))' }}>
                                      Nenhum insumo adicionado. Clique em "Adicionar Insumo" para definir os produtos desta etapa.
                                    </div>
                                  ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                      {/* Header */}
                                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 90px 32px', gap: '8px', padding: '0 4px', fontSize: '10px', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                        <span>Produto / Fármaco</span>
                                        <span>Dose</span>
                                        <span>Unidade</span>
                                        <span />
                                      </div>
                                      {(e.farmacos || []).map((f) => (
                                        <div key={f.id} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 90px 32px', gap: '8px', alignItems: 'center' }}>
                                          <input
                                            type="text"
                                            className="form-input"
                                            placeholder="Ex: GnRH — Fertagyl"
                                            value={f.nome}
                                            onChange={(ev) => updateFarmaco(e.id, f.id, 'nome', ev.target.value)}
                                          />
                                          <input
                                            type="text"
                                            className="form-input"
                                            placeholder="2.5"
                                            value={f.dose}
                                            onChange={(ev) => updateFarmaco(e.id, f.id, 'dose', ev.target.value)}
                                            style={{ textAlign: 'center' }}
                                          />
                                          <select
                                            className="form-input"
                                            style={{ fontSize: '12px' }}
                                            value={f.unidade}
                                            onChange={(ev) => updateFarmaco(e.id, f.id, 'unidade', ev.target.value)}
                                          >
                                            <option value="mL">mL</option>
                                            <option value="mg">mg</option>
                                            <option value="UI">UI</option>
                                            <option value="mcg">μg</option>
                                            <option value="doses">doses</option>
                                            <option value="comprimido">comp.</option>
                                          </select>
                                          <button
                                            type="button"
                                            onClick={() => removeFarmaco(e.id, f.id)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(0 84% 55%)', padding: '4px' }}
                                          >
                                            <X size={13} />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        <button type="button" onClick={addEtapa} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '10px', background: 'transparent', border: '2px dashed var(--border)', cursor: 'pointer', color: 'hsl(var(--text-muted))', fontWeight: 700, fontSize: '13px', transition: 'all 0.2s', marginTop: '4px' }}>
                          <Plus size={16} /> Adicionar Etapa
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 5 — Confirmação */}
                {step === 5 && (
                  <div style={{ maxWidth: '480px' }}>
                    <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'hsl(var(--brand) / 0.15)', border: '1.5px solid hsl(var(--brand) / 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <FlaskConical size={20} style={{ color: 'hsl(var(--brand))' }} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 900, fontSize: '16px' }}>{config.nome || '(sem nome)'}</div>
                          <div style={{ fontSize: '12px', color: 'hsl(var(--text-muted))' }}>{selectedTemplate?.nome} · {config.tipo}</div>
                        </div>
                      </div>
                      <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />
                      {[
                        { label: 'Data D0', value: config.data_inicio },
                        { label: 'Técnico', value: config.tecnico_resp || 'Não informado' },
                        { label: 'Animais', value: `${selectedAnimais.length} matrizes` },
                        { label: 'Etapas', value: `${etapas.length} etapas programadas` },
                        { label: 'Última etapa', value: etapas.length > 0 ? etapas[etapas.length - 1].data_prevista || '---' : '---' },
                      ].map((row) => (
                        <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                          <span style={{ color: 'hsl(var(--text-muted))' }}>{row.label}</span>
                          <span style={{ fontWeight: 700 }}>{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      {/* Modal de edição rápida de template */}
      <TemplateForm
        isOpen={templateFormOpen}
        onClose={() => { setTemplateFormOpen(false); setEditingTemplate(null); }}
        initialData={editingTemplate}
      />
    </SidePanel>
  );
};

