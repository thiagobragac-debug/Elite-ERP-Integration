import React, { useState, useEffect, useMemo } from 'react';
import './DietForm.css';

import {
  Utensils,
  Tag,
  Layers,
  CheckCircle2,
  Wheat,
  Droplets,
  Shuffle,
  DollarSign,
  Scale,
  Activity,
  Flame,
  Zap,
  Lock,
  Calendar,
  Info,
  Stethoscope,
  ShieldCheck,
  FileText,
  ToggleLeft,
  ToggleRight,
  CheckSquare,
  AlertTriangle,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Save,
  Pencil,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SidePanel } from '../Layout/SidePanel';
import { ConsumptionCart } from './ConsumptionCart';
import type { ConsumptionItem } from './ConsumptionCart';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DietFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  loading?: boolean;
  actionId?: number;
}

type Etapa = 0 | 1 | 2;

// ─── Etapas ──────────────────────────────────────────────────────────────────

const ETAPAS = [
  { id: 0, icon: Tag,          nome: '1. Identificação',       descricao: 'Nome, tipo e vigência da dieta' },
  { id: 1, icon: Layers,       nome: '2. Composição & Custos', descricao: 'Ingredientes e cálculo automático' },
  { id: 2, icon: CheckCircle2, nome: '3. Parâmetros & Revisão', descricao: 'Bromatologia e dados nutricionais' },
];

const TIPOS_FORMULACAO = [
  { value: 'Concentrado', label: 'Concentrado', Icon: Layers  },
  { value: 'Sal Mineral', label: 'Sal Mineral', Icon: Droplets },
  { value: 'Total Mix',   label: 'Total Mix',   Icon: Shuffle  },
  { value: 'Volumoso',    label: 'Volumoso',    Icon: Wheat    },
];

const MS_DEFAULTS: Record<string, number> = {
  Concentrado: 88,
  'Sal Mineral': 99,
  'Total Mix': 45,
  Volumoso: 30,
};

const INITIAL_FORM = {
  nome: '',
  tipo: 'Concentrado',
  descricao: '',
  custo_por_kg: '0',
  percentual_ms: '88',
  pb: '',
  ndt: '',
  consumo_esperado: '',
  // 'active' = Liberada para uso imediato | 'inactive' = Bloqueada/inativa
  status: 'active' as 'active' | 'inactive',
  data_vigencia: new Date().toISOString().split('T')[0],
  vigencia_bloqueante: false,
};

// ─── Componente Principal ─────────────────────────────────────────────────────

export const DietForm: React.FC<DietFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  loading = false,
  actionId,
}) => {
  const isEdit = !!initialData;

  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [ingredients, setIngredients] = useState<ConsumptionItem[]>([]);
  const [etapaAtual, setEtapaAtual] = useState<Etapa>(0);
  const [stepError, setStepError] = useState<string | null>(null);

  // ─── Reset ao abrir / mudar registro ──────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    setEtapaAtual(0);
    setStepError(null);

    if (initialData) {
      setForm({
        nome:               initialData.nome        || '',
        tipo:               initialData.tipo        || 'Concentrado',
        descricao:          initialData.descricao   || '',
        custo_por_kg:       initialData.custo_por_kg?.toString()   || '0',
        percentual_ms:      initialData.percentual_ms?.toString()  || '88',
        pb:                 initialData.pb?.toString()             || '',
        ndt:                initialData.ndt?.toString()            || '',
        consumo_esperado:   initialData.consumo_esperado?.toString()|| '',
      status:             initialData.status      || 'active',
        data_vigencia:      initialData.data_vigencia || new Date().toISOString().split('T')[0],
        vigencia_bloqueante: initialData.vigencia_bloqueante ?? false,
      });
      const raw = initialData.ingredientes || [];
      setIngredients(
        raw.map((ing: any) =>
          typeof ing === 'string'
            ? { id: Math.random().toString(36).slice(7), produto_id: '', nome: ing, quantidade: 0, unidade: 'UN', custo_medio: 0, deposito_id: '' }
            : ing
        )
      );
    } else {
      setForm({ ...INITIAL_FORM });
      setIngredients([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, actionId]);

  // ─── Custo automático corrigido ────────────────────────────────────────────
  // Para formulações por % de MN: o custo/kg = soma(custo_i * peso_i) / soma(peso_i)
  // Para Sal Mineral (g/cab): custo total dividido por 1kg equivalente de mistura
  useEffect(() => {
    if (ingredients.length > 0) {
      const totalQty = ingredients.reduce((s, i) => s + (Number(i.quantidade) || 0), 0);
      if (totalQty > 0) {
        // Custo ponderado real: cada ingrediente contribui proporcionalmente ao seu peso na fórmula
        const custoPonderado = ingredients.reduce(
          (s, i) => s + (i.custo_medio || 0) * (Number(i.quantidade) || 0),
          0
        ) / totalQty;
        setForm(p => ({ ...p, custo_por_kg: custoPonderado.toFixed(4) }));
      }
    }
  }, [ingredients]);

  // ─── MS default ao trocar tipo ───────────────────────────────────────────
  useEffect(() => {
    if (!isEdit) {
      setForm(p => ({ ...p, percentual_ms: String(MS_DEFAULTS[p.tipo] ?? 88) }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.tipo]);

  // ─── Engine nutricional ──────────────────────────────────────────────────
  const dietStats = useMemo(() => {
    const custo = parseFloat(form.custo_por_kg) || 0;
    const ms    = parseFloat(form.percentual_ms) || 0;
    const pb    = parseFloat(form.pb) || 0;
    const ndt   = parseFloat(form.ndt) || 0;
    const custoMS = ms > 0 ? custo / (ms / 100) : 0;
    const badges: { icon: React.ElementType; text: string; color: string }[] = [];
    if (pb  > 25) badges.push({ icon: Flame,       text: 'Alto Teor Proteico', color: '#eab308' });
    if (ndt > 75) badges.push({ icon: Zap,         text: 'Super Energética',   color: '#8b5cf6' });
    if (ms  < 35) badges.push({ icon: Droplets,    text: 'Alta Umidade',       color: '#3b82f6' });
    if (ms  > 90) badges.push({ icon: ShieldCheck, text: 'Baixo Teor Hídrico', color: '#10b981' });
    return { custo, custoMS, badges };
  }, [form.custo_por_kg, form.percentual_ms, form.pb, form.ndt]);

  // ─── Validação ───────────────────────────────────────────────────────────
  const validate = (step: Etapa): string | null => {
    if (step === 0 && !form.nome.trim()) return 'O nome da dieta é obrigatório.';
    return null;
  };

  const handleNext = () => {
    const err = validate(etapaAtual);
    if (err) { setStepError(err); return; }
    setStepError(null);
    setEtapaAtual(s => Math.min(s + 1, 2) as Etapa);
  };

  const handlePrev = () => {
    setStepError(null);
    setEtapaAtual(s => Math.max(s - 1, 0) as Etapa);
  };

  const handleSave = () => {
    if (!form.consumo_esperado) {
      setStepError('Preencha o consumo esperado para concluir.');
      return;
    }
    onSubmit({
      nome:               form.nome,
      tipo:               form.tipo,
      ingredientes:       ingredients,
      custo_por_kg:       form.custo_por_kg,
      percentual_ms:      form.percentual_ms,
      descricao:          form.descricao,
      status:             form.status,
      data_vigencia:      form.data_vigencia || null,
      vigencia_bloqueante: form.vigencia_bloqueante,
      pb:                 form.pb,
      ndt:                form.ndt,
      consumo_esperado:   form.consumo_esperado,
    });
  };

  const etapaCompleta = (e: Etapa): boolean => {
    if (e === 0) return !!form.nome.trim();
    if (e === 1) return ingredients.length > 0;
    return false;
  };

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Editar Dieta' : 'Nova Dieta / Formulação'}
      subtitle="Defina os ingredientes e parâmetros nutricionais."
      icon={Utensils}
      size="xlarge"
      onCancel={() => { onClose(); }}
      onSubmit={handleSave}
      loading={loading}
      submitLabel={isEdit ? 'Atualizar Dieta' : 'Salvar Dieta'}
    >
      {/* Dashboard Top */}
      <div style={{ marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <div
          style={{
            flex: 1,
            minWidth: '250px',
            padding: '16px',
            background: 'hsl(var(--bg-main))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <span
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 700,
                color: 'hsl(var(--text-muted))',
                textTransform: 'uppercase',
                marginBottom: '4px',
              }}
            >
              Status Atual
            </span>
            <span
              style={{
                fontSize: '18px',
                fontWeight: 900,
                color: form.status === 'active' ? '#10b981' : '#f59e0b',
              }}
            >
              {form.status === 'active' ? 'Liberada' : 'Bloqueada'}
            </span>
            <div style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginTop: '4px' }}>
              Vigência a partir de {new Date(form.data_vigencia + 'T00:00:00').toLocaleDateString('pt-BR')}
            </div>
          </div>
          <div
            style={{
              background: 'hsl(var(--bg-card))',
              padding: '12px',
              borderRadius: '50%',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            }}
          >
            {form.status === 'active' ? <CheckCircle2 size={24} style={{ color: 'hsl(var(--text-main))' }} /> : <Pencil size={24} style={{ color: 'hsl(var(--text-main))' }} />}
          </div>
        </div>

        {/* Alertas Rápidos no Dashboard */}
        <div
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '16px',
            background: 'hsl(var(--bg-main))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '12px',
          }}
        >
          <span
            style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 700,
              color: 'hsl(var(--text-muted))',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}
          >
            Indicadores da Fórmula
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px',
                fontWeight: 800,
                color: 'hsl(217 91% 50%)',
              }}
            >
              <Layers size={14} /> Tipo: {form.tipo || '—'}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px',
                fontWeight: 800,
                color: 'hsl(var(--text-main))',
              }}
            >
              <Activity size={14} /> Matéria Seca: {form.percentual_ms}% MS
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px',
                fontWeight: 800,
                color: 'hsl(161 64% 39%)',
              }}
            >
              <DollarSign size={14} /> Custo / kg MS: {dietStats.custoMS > 0 ? `R$ ${dietStats.custoMS.toFixed(2)}` : '—'}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px' }}>
        {/* Left Sidebar - Phase Navigation */}
        <div
          style={{
            width: '220px',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {ETAPAS.map((et, idx) => {
            let isCompleted = etapaCompleta(idx as Etapa);
            const isActive = etapaAtual === idx;
            const Icon = et.icon;

            return (
              <button
                key={et.id}
                type="button"
                onClick={() => {
                  // Allow clicking if it's a previous step, or if all previous steps are complete
                  let canClick = true;
                  for (let i = 0; i < idx; i++) {
                    if (!etapaCompleta(i as Etapa)) canClick = false;
                  }
                  if (canClick) {
                    setStepError(null);
                    setEtapaAtual(idx as Etapa);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  background: isActive ? `hsl(217 91% 50% / 0.15)` : 'transparent',
                  color: isActive ? 'hsl(217 91% 50%)' : 'hsl(var(--text-secondary))',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontWeight: isActive ? 700 : 500,
                  transition: 'all 0.2s',
                  boxShadow: isActive ? `inset 3px 0 0 hsl(217 91% 50%)` : 'none',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: isCompleted
                      ? 'hsl(217 91% 50%)'
                      : isActive
                        ? `hsl(217 91% 50% / 0.3)`
                        : 'hsl(var(--bg-main))',
                    color: isCompleted ? '#fff' : isActive ? 'hsl(217 91% 50%)' : 'hsl(var(--text-muted))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isCompleted ? <CheckCircle2 size={16} /> : <Icon size={16} />}
                </div>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '13px' }}>{et.nome}</span>
                  {isActive && <span style={{ fontSize: '10px', color: 'inherit', opacity: 0.8, marginTop: '2px', lineHeight: '1.2' }}>{et.descricao}</span>}
                </div>
                {isActive && <ChevronRight size={16} opacity={0.5} />}
              </button>
            );
          })}
        </div>

        {/* Right Content - Form Fields */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            background: 'hsl(var(--bg-card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '16px',
            padding: '24px',
          }}
        >
          <div
            style={{
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: '1px solid hsl(var(--border))',
            }}
          >
            <h3
              style={{
                margin: '0 0 4px 0',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {ETAPAS[etapaAtual].nome}
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'hsl(var(--text-muted))' }}>
              {ETAPAS[etapaAtual].descricao}
            </p>
          </div>

          <AnimatePresence>
            {stepError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '16px',
                  padding: '10px 14px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  color: '#b91c1c',
                  fontSize: '13px',
                  fontWeight: 600,
                  overflow: 'hidden'
                }}
              >
                <AlertTriangle size={14} /> {stepError}
              </motion.div>
            )}
          </AnimatePresence>

          {etapaAtual === 0 && (
            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="tauze-input-grid grid-col-2">
                <div className="tauze-field-group">
                  <label className="tauze-label">
                    <FileText size={14} /> Nome da Dieta
                  </label>
                  <input
                    className="tauze-input"
                    type="text"
                    placeholder="Ex: Ração Engorda 18%, Suplemento Seca..."
                    value={form.nome}
                    onChange={(e) => setForm(p => ({ ...p, nome: e.target.value.toUpperCase() }))}
                    autoFocus
                  />
                </div>
                <div className="tauze-field-group">
                  <label className="tauze-label">
                    <Activity size={14} /> Status
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    <button type="button"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid',
                        borderColor: form.status === 'active' ? '#10b981' : 'hsl(var(--border))',
                        background: form.status === 'active' ? '#10b98114' : 'hsl(var(--bg-main))',
                        color: form.status === 'active' ? '#10b981' : 'hsl(var(--text-muted))',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 700,
                        transition: 'all 0.18s'
                      }}
                      onClick={() => setForm(p => ({ ...p, status: 'active' }))}
                    >
                      <CheckCircle2 size={16} /> Liberada
                    </button>
                    <button type="button"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid',
                        borderColor: form.status === 'inactive' ? '#ef4444' : 'hsl(var(--border))',
                        background: form.status === 'inactive' ? '#ef444414' : 'hsl(var(--bg-main))',
                        color: form.status === 'inactive' ? '#ef4444' : 'hsl(var(--text-muted))',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 700,
                        transition: 'all 0.18s'
                      }}
                      onClick={() => setForm(p => ({ ...p, status: 'inactive' }))}
                    >
                      <Lock size={16} /> Bloqueada
                    </button>
                  </div>
                </div>
              </div>

              <div className="tauze-field-group">
                <label className="tauze-label">
                  <Stethoscope size={14} /> Tipo de Formulação
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {TIPOS_FORMULACAO.map(({ value, label, Icon }) => (
                    <button key={value} type="button"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '12px 8px',
                        borderRadius: '10px',
                        border: '2px solid',
                        borderColor: form.tipo === value ? 'hsl(217 91% 50%)' : 'hsl(var(--border))',
                        background: form.tipo === value ? 'hsl(217 91% 50% / 0.08)' : 'hsl(var(--bg-main))',
                        color: form.tipo === value ? 'hsl(217 91% 50%)' : 'hsl(var(--text-muted))',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: form.tipo === value ? 800 : 600,
                        transition: 'all 0.18s'
                      }}
                      onClick={() => setForm(p => ({ ...p, tipo: value }))}
                    >
                      <Icon size={20} />{label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="tauze-input-grid grid-col-2">
                <div className="tauze-field-group">
                  <label className="tauze-label">
                    <Calendar size={14} /> Data de Vigência
                  </label>
                  <input
                    className="tauze-input"
                    type="date"
                    value={form.data_vigencia}
                    onChange={(e) => setForm(p => ({ ...p, data_vigencia: e.target.value }))}
                  />
                </div>
                <div className="tauze-field-group">
                  <label className="tauze-label">
                    <Info size={14} /> Comportamento da Vigência
                  </label>
                  <button type="button"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      background: 'none',
                      border: '1px solid',
                      borderColor: form.vigencia_bloqueante ? '#ef4444' : 'hsl(var(--border))',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      color: 'hsl(var(--text-main))'
                    }}
                    onClick={() => setForm(p => ({ ...p, vigencia_bloqueante: !p.vigencia_bloqueante }))}
                  >
                    {form.vigencia_bloqueante ? <ToggleRight size={18} color="#ef4444" /> : <ToggleLeft size={18} color="hsl(var(--text-muted))" />}
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: form.vigencia_bloqueante ? '#ef4444' : 'hsl(var(--text-main))' }}>
                        {form.vigencia_bloqueante ? 'Bloquear uso antes da data' : 'Apenas informativo'}
                      </div>
                      <div style={{ fontSize: '10px', color: 'hsl(var(--text-muted))' }}>
                        {form.vigencia_bloqueante
                          ? 'Indisponível para tratos antes desta data'
                          : 'Data registrada, sem restrição de uso'}
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {etapaAtual === 1 && (
            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="tauze-input-grid grid-col-2">
                <div className="tauze-field-group">
                  <label className="tauze-label" style={{ justifyContent: 'space-between' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><DollarSign size={14} /> Custo MN (R$/kg)</span>
                    {ingredients.length > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: '#10b981', fontWeight: 700 }}><Lock size={10} /> Automático</span>}
                  </label>
                  <input
                    className="tauze-input"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={form.custo_por_kg}
                    onChange={(e) => setForm(p => ({ ...p, custo_por_kg: e.target.value }))}
                    readOnly={ingredients.length > 0}
                    style={ingredients.length > 0 ? { color: '#10b981', fontWeight: 800 } : undefined}
                  />
                </div>
                <div className="tauze-field-group">
                  <label className="tauze-label">
                    <Activity size={14} /> Matéria Seca (% MS)
                  </label>
                  {form.tipo === 'Sal Mineral' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', borderRadius: '8px', background: 'hsl(var(--bg-main))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--text-muted))', fontSize: '13px', fontWeight: 700 }}>
                      <Lock size={13} /> 99% MS — padrão Sal Mineral
                    </div>
                  ) : (
                    <input
                      className="tauze-input"
                      type="number"
                      step="1"
                      min="1"
                      max="100"
                      value={form.percentual_ms}
                      onChange={(e) => setForm(p => ({ ...p, percentual_ms: e.target.value }))}
                    />
                  )}
                </div>
              </div>

              <ConsumptionCart
                items={ingredients}
                onChange={setIngredients}
                mode="formulation"
                title="Composição da Dieta"
                subtitle={`Adicione ingredientes (${form.tipo === 'Sal Mineral' ? 'g/cabeça/dia' : '% na matéria natural'})`}
                filterModule="pecuaria_nutricao"
              />
            </div>
          )}

          {etapaAtual === 2 && (
            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {dietStats.badges.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {dietStats.badges.map((b, i) => {
                    const BIcon = b.icon;
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 11px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: `${b.color}18`, border: `1px solid ${b.color}40`, color: b.color }}>
                        <BIcon size={13} /> {b.text}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="tauze-input-grid grid-col-3">
                <div className="tauze-field-group">
                  <label className="tauze-label">
                    <Flame size={14} /> Proteína Bruta (PB %)
                  </label>
                  <input
                    className="tauze-input"
                    type="number"
                    step="0.1"
                    placeholder="Ex: 18"
                    value={form.pb}
                    onChange={(e) => setForm(p => ({ ...p, pb: e.target.value }))}
                  />
                </div>
                {form.tipo !== 'Sal Mineral' && (
                  <div className="tauze-field-group">
                    <label className="tauze-label">
                      <Zap size={14} /> NDT (Energia %)
                    </label>
                    <input
                      className="tauze-input"
                      type="number"
                      step="0.1"
                      placeholder="Ex: 78"
                      value={form.ndt}
                      onChange={(e) => setForm(p => ({ ...p, ndt: e.target.value }))}
                    />
                  </div>
                )}
                <div className="tauze-field-group">
                  <label className="tauze-label">
                    <Scale size={14} /> Consumo Esperado
                  </label>
                  <input
                    className="tauze-input"
                    type="number"
                    step="0.1"
                    placeholder={form.tipo === 'Sal Mineral' ? 'Ex: 120' : 'Ex: 2.2'}
                    value={form.consumo_esperado}
                    onChange={(e) => setForm(p => ({ ...p, consumo_esperado: e.target.value }))}
                  />
                  <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginTop: '4px', display: 'block' }}>
                    {form.tipo === 'Sal Mineral' ? 'gramas/dia' : '% do Peso Vivo'}
                  </span>
                </div>
              </div>

              <div className="tauze-field-group" style={{ gridColumn: 'span 3' }}>
                <label className="tauze-label">
                  <FileText size={14} /> Descrição / Observações
                </label>
                <textarea
                  className="tauze-input tauze-textarea"
                  rows={3}
                  placeholder="Notas sobre a formulação, período de uso, restrições..."
                  value={form.descricao}
                  onChange={(e) => setForm(p => ({ ...p, descricao: e.target.value }))}
                  style={{ resize: 'vertical', minHeight: '80px', lineHeight: '1.5' }}
                />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid hsl(var(--border))' }}>
            <button
              type="button"
              className="glass-btn secondary"
              onClick={handlePrev}
              disabled={etapaAtual === 0}
              style={{ opacity: etapaAtual === 0 ? 0 : 1, pointerEvents: etapaAtual === 0 ? 'none' : 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <ArrowLeft size={16} /> ANTERIOR
            </button>
            
            {etapaAtual < 2 ? (
              <button
                type="button"
                className="primary-btn"
                onClick={handleNext}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                PRÓXIMO <ArrowRight size={16} />
              </button>
            ) : (
              <div></div>
            )}
          </div>

        </div>
      </div>
    </SidePanel>
  );
};
