import React, { useState, useEffect } from 'react';
import {
  FlaskConical, Plus, Trash2, ChevronRight, Save,
  Dna, Settings2, ListChecks, Check,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { SidePanel } from '../../components/Layout/SidePanel';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────────────────
interface EtapaDraft {
  id: string;
  nome_etapa: string;
  dia_relativo: number;
  tipo_acao: string;
  instrucao: string;
  obrigatorio: boolean;
  ordem: number;
}

interface Template {
  id?: string;
  nome: string;
  tipo: string;
  descricao: string;
  is_sistema: boolean;
  protocolo_template_etapas?: EtapaDraft[];
}

interface TemplateFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Template | null;
}

const TIPOS = ['IATF', 'Monta', 'Custom'];
const TIPO_COLOR: Record<string, string> = {
  IATF:   '#3b82f6', // blue-500
  Monta:  '#22c55e', // green-500
  Custom: '#8b5cf6', // purple-500
};
const TIPO_ACAO_OPTS = [
  { value: 'farmaco', label: 'Fármaco' },
  { value: 'ia', label: 'IA / Inseminação' },
  { value: 'diagnostico', label: 'Diagnóstico' },
  { value: 'observacao', label: 'Observação' },
];

// ─────────────────────────────────────────────────────────────────────────────
export const TemplateForm: React.FC<TemplateFormProps> = ({
  isOpen, onClose, initialData,
}) => {
  const queryClient = useQueryClient();
  const isEdit = !!initialData?.id;

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ nome: '', tipo: 'IATF', descricao: '' });
  const [etapas, setEtapas] = useState<EtapaDraft[]>([]);

  // Inicializa ao abrir/trocar de registro
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      if (initialData) {
        setForm({
          nome: initialData.nome || '',
          tipo: initialData.tipo || 'IATF',
          descricao: initialData.descricao || '',
        });
        setEtapas(
          (initialData.protocolo_template_etapas || [])
            .slice()
            .sort((a, b) => a.ordem - b.ordem)
            .map((e) => ({ ...e, id: e.id || crypto.randomUUID() }))
        );
      } else {
        setForm({ nome: '', tipo: 'IATF', descricao: '' });
        setEtapas([]);
      }
    }
  }, [isOpen, initialData]);

  // ── Etapas helpers ──────────────────────────────────────────────────────
  const addEtapa = () => {
    const lastDia = etapas.length > 0 ? etapas[etapas.length - 1].dia_relativo + 7 : 0;
    setEtapas((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        nome_etapa: '',
        dia_relativo: lastDia,
        tipo_acao: 'farmaco',
        instrucao: '',
        obrigatorio: true,
        ordem: prev.length + 1,
      },
    ]);
  };

  const updateEtapa = (id: string, field: keyof EtapaDraft, value: any) => {
    setEtapas((prev) => prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  };

  const removeEtapa = (id: string) => setEtapas((prev) => prev.filter((e) => e.id !== id));

  const moveEtapa = (id: string, dir: 'up' | 'down') => {
    setEtapas((prev) => {
      const idx = prev.findIndex((e) => e.id === id);
      if (dir === 'up' && idx === 0) return prev;
      if (dir === 'down' && idx === prev.length - 1) return prev;
      const arr = [...prev];
      const other = dir === 'up' ? idx - 1 : idx + 1;
      [arr[idx], arr[other]] = [arr[other], arr[idx]];
      return arr.map((e, i) => ({ ...e, ordem: i + 1 }));
    });
  };

  // ── Salvar ──────────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (isEdit && initialData?.id) {
        // Atualizar template
        const { error: tErr } = await supabase
          .from('protocolo_templates')
          .update({ nome: form.nome, tipo: form.tipo, descricao: form.descricao })
          .eq('id', initialData.id);
        if (tErr) throw tErr;

        // Deletar etapas antigas e reinserir
        await supabase
          .from('protocolo_template_etapas')
          .delete()
          .eq('template_id', initialData.id);

        if (etapas.length > 0) {
          const { error: etErr } = await supabase
            .from('protocolo_template_etapas')
            .insert(
              etapas.map((e, idx) => ({
                template_id: initialData.id,
                nome_etapa: e.nome_etapa,
                dia_relativo: e.dia_relativo,
                tipo_acao: e.tipo_acao,
                instrucao: e.instrucao || null,
                obrigatorio: e.obrigatorio,
                ordem: idx + 1,
              }))
            );
          if (etErr) throw etErr;
        }
      } else {
        // Criar template
        const { data: tpl, error: tErr } = await supabase
          .from('protocolo_templates')
          .insert([{ nome: form.nome, tipo: form.tipo, descricao: form.descricao, is_sistema: false }])
          .select()
          .single();
        if (tErr) throw tErr;

        if (etapas.length > 0) {
          const { error: etErr } = await supabase
            .from('protocolo_template_etapas')
            .insert(
              etapas.map((e, idx) => ({
                template_id: tpl.id,
                nome_etapa: e.nome_etapa,
                dia_relativo: e.dia_relativo,
                tipo_acao: e.tipo_acao,
                instrucao: e.instrucao || null,
                obrigatorio: e.obrigatorio,
                ordem: idx + 1,
              }))
            );
          if (etErr) throw etErr;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['protocolo_templates'] });
      toast.success(isEdit ? 'Template atualizado!' : 'Template criado com sucesso!');
      onClose();
    },
    onError: (err: any) => toast.error(`Erro: ${err.message}`),
  });

  const canSave = form.nome.trim().length > 0 && form.tipo;
  const cor = TIPO_COLOR[form.tipo] || '#10b981'; // green-500 fallback

  const STEPS = [
    { id: 1, label: 'Informações', icon: Dna },
    { id: 2, label: 'Etapas', icon: ListChecks },
  ];
  const STEP_COLORS = ['#3b82f6', '#10b981'];

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Editar Template' : 'Novo Template'}
      subtitle={isEdit ? `Editando: ${initialData?.nome}` : 'Crie um template personalizado reutilizável.'}
      icon={FlaskConical}
      size="xlarge"
      customFooter={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          {step === 2 ? (
            <button type="button" className="glass-btn secondary" onClick={() => setStep(1)}>
              ← INFORMAÇÕES
            </button>
          ) : (
            <div />
          )}
          <div style={{ display: 'flex', gap: '10px' }}>
            {step === 1 && (
              <button
                type="button"
                className="primary-btn"
                disabled={!form.nome.trim()}
                onClick={() => setStep(2)}
              >
                ETAPAS <ChevronRight size={16} />
              </button>
            )}
            {step === 2 && (
              <button
                type="button"
                className="primary-btn"
                disabled={!canSave || saveMutation.isPending}
                onClick={() => saveMutation.mutate()}
              >
                <Save size={16} />
                {saveMutation.isPending ? 'Salvando...' : isEdit ? 'SALVAR ALTERAÇÕES' : 'CRIAR TEMPLATE'}
              </button>
            )}
          </div>
        </div>
      }
    >
      <div style={{ display: 'flex', gap: '24px' }}>
        {/* Sidebar */}
        <div style={{ width: '240px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {STEPS.map((s) => {
            const Icon = s.icon;
            const done = step > s.id;
            const active = step === s.id;
            const stepCor = STEP_COLORS[s.id - 1];
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => done && setStep(s.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px', borderRadius: '12px', border: 'none',
                  background: active ? `${stepCor}15` : 'transparent',
                  color: active ? stepCor : done ? 'hsl(var(--text-primary))' : 'hsl(var(--text-muted))',
                  cursor: done ? 'pointer' : active ? 'default' : 'not-allowed',
                  textAlign: 'left', fontWeight: active ? 700 : 500, transition: 'all 0.2s',
                  boxShadow: active ? `inset 3px 0 0 ${stepCor}` : 'none',
                  opacity: !done && !active ? 0.5 : 1,
                }}
              >
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  background: done ? stepCor : active ? `${stepCor}30` : 'hsl(var(--bg-main))',
                  color: done ? '#fff' : active ? stepCor : 'hsl(var(--text-muted))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {done ? <Check size={15} /> : <Icon size={15} />}
                </div>
                <span style={{ fontSize: '13px' }}>{s.id}. {s.label}</span>
                {active && <ChevronRight size={14} style={{ opacity: 0.4, marginLeft: 'auto' }} />}
              </button>
            );
          })}

          {/* Preview do template */}
          {form.nome && (
            <div style={{
              marginTop: '16px', padding: '10px 12px', borderRadius: '10px',
              background: `${cor}10`, border: `1px solid ${cor}30`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Dna size={12} style={{ color: cor }} />
                <span style={{ fontSize: '10px', fontWeight: 800, color: cor, letterSpacing: '0.05em' }}>PREVIEW</span>
              </div>
              <div style={{ fontWeight: 800, fontSize: '12px', marginBottom: '4px', wordBreak: 'break-word', lineHeight: 1.3 }}>{form.nome}</div>
              <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: '99px', background: `${cor}18`, color: cor }}>
                {form.tipo}
              </span>
              {etapas.length > 0 && (
                <div style={{ fontSize: '10px', color: 'hsl(var(--text-muted))', marginTop: '6px' }}>
                  {etapas.length} etapa{etapas.length > 1 ? 's' : ''} definida{etapas.length > 1 ? 's' : ''}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Conteúdo */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            background: 'hsl(var(--bg-card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '16px',
            padding: '24px',
          }}>
            {/* Cabeçalho da seção */}
            <div style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid hsl(var(--border))' }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '17px', fontWeight: 800 }}>
                {step === 1 ? 'Informações do Template' : 'Etapas do Protocolo'}
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: 'hsl(var(--text-muted))' }}>
                {step === 1
                  ? 'Defina o nome, tipo e descrição do template.'
                  : 'Configure as etapas e dias relativos ao D0.'}
              </p>
            </div>

            {/* STEP 1 — Informações */}
            {step === 1 && (
              <div className="tauze-input-grid grid-col-2">
                <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
                  <label className="tauze-label">Nome do Template *</label>
                  <input
                    type="text"
                    className="tauze-input"
                    placeholder="Ex: IATF Ovsynch Premium"
                    value={form.nome}
                    onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                  />
                </div>

                <div className="tauze-field-group">
                  <label className="tauze-label">Tipo de Protocolo *</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {TIPOS.map((t) => {
                      const c = TIPO_COLOR[t];
                      const sel = form.tipo === t;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, tipo: t }))}
                          style={{
                            flex: 1, padding: '8px 4px', borderRadius: '8px',
                            border: `1.5px solid ${sel ? c : 'var(--border)'}`,
                            background: sel ? `${c}15` : 'var(--bg-main)',
                            color: sel ? c : 'hsl(var(--text-muted))',
                            fontWeight: 700, fontSize: '12px', cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
                  <label className="tauze-label">Descrição</label>
                  <textarea
                    className="tauze-input"
                    rows={3}
                    placeholder="Descreva quando e como usar este protocolo..."
                    value={form.descricao}
                    onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                  />
                </div>
              </div>
            )}

            {/* STEP 2 — Etapas */}
            {step === 2 && (
              <div>
                {etapas.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px', color: 'hsl(var(--text-muted))' }}>
                    <ListChecks size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                    <p style={{ marginBottom: '16px' }}>Nenhuma etapa definida ainda. Adicione as etapas do protocolo.</p>
                    <button type="button" className="primary-btn" onClick={addEtapa}>
                      <Plus size={16} /> Adicionar Primeira Etapa
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {/* Header da tabela */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '24px 1fr 80px 140px 36px',
                      gap: '8px', padding: '0 8px',
                      fontSize: '10px', fontWeight: 700,
                      color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.06em',
                    }}>
                      <span>#</span>
                      <span>Nome da Etapa</span>
                      <span>D+</span>
                      <span>Tipo de Ação</span>
                      <span />
                    </div>

                    {etapas.map((e, idx) => (
                      <div key={e.id} style={{
                        display: 'grid',
                        gridTemplateColumns: '24px 1fr 80px 140px 36px',
                        gap: '8px', alignItems: 'center',
                        padding: '10px 8px', borderRadius: '10px',
                        background: 'hsl(var(--bg-main))',
                        border: '1px solid hsl(var(--border))',
                      }}>
                        <span style={{ fontWeight: 800, fontSize: '12px', color: 'hsl(var(--text-muted))', textAlign: 'center' }}>
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          className="tauze-input"
                          style={{ fontSize: '13px' }}
                          value={e.nome_etapa}
                          placeholder="Nome da etapa..."
                          onChange={(ev) => updateEtapa(e.id, 'nome_etapa', ev.target.value)}
                        />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '10px', color: 'hsl(var(--text-muted))', flexShrink: 0 }}>D+</span>
                          <input
                            type="number"
                            className="tauze-input"
                            style={{ textAlign: 'center', fontSize: '13px' }}
                            value={e.dia_relativo}
                            onChange={(ev) => updateEtapa(e.id, 'dia_relativo', Number(ev.target.value))}
                          />
                        </div>
                        <select
                          className="tauze-input"
                          style={{ fontSize: '12px' }}
                          value={e.tipo_acao}
                          onChange={(ev) => updateEtapa(e.id, 'tipo_acao', ev.target.value)}
                        >
                          {TIPO_ACAO_OPTS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => removeEtapa(e.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(0 84% 55%)', padding: '4px' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}

                    {/* Campo de instrução inline (expandido) */}
                    <button
                      type="button"
                      onClick={addEtapa}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '10px 16px', borderRadius: '10px',
                        background: 'transparent', border: '2px dashed var(--border)',
                        cursor: 'pointer', color: 'hsl(var(--text-muted))',
                        fontWeight: 700, fontSize: '13px', transition: 'all 0.2s', marginTop: '4px',
                      }}
                    >
                      <Plus size={16} /> Adicionar Etapa
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </SidePanel>
  );
};
