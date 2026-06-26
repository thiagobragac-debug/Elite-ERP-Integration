import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
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
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { Breadcrumb } from '../../components/Navigation/Breadcrumb';
import { ConsumptionCart } from '../../components/Forms/ConsumptionCart';
import type { ConsumptionItem } from '../../components/Forms/ConsumptionCart';
import './NovaDietaPage.css';

// ─── Etapas ──────────────────────────────────────────────────────────────────
const ETAPAS = [
  {
    id: 0,
    icon: Tag,
    nome: 'Identificação',
    descricao: 'Nome, tipo e vigência da dieta',
  },
  {
    id: 1,
    icon: Layers,
    nome: 'Composição & Custos',
    descricao: 'Ingredientes e cálculo automático',
  },
  {
    id: 2,
    icon: CheckCircle2,
    nome: 'Parâmetros & Revisão',
    descricao: 'Bromatologia e dados nutricionais',
  },
];

// ─── MS default por tipo ──────────────────────────────────────────────────────
const MS_DEFAULTS: Record<string, number> = {
  Concentrado: 88,
  'Sal Mineral': 99,
  'Total Mix': 45,
  Volumoso: 30,
};

// ─── Tipos de formulação ──────────────────────────────────────────────────────
const TIPOS_FORMULACAO = [
  { value: 'Concentrado', label: 'Concentrado', Icon: Layers },
  { value: 'Sal Mineral', label: 'Sal Mineral', Icon: Droplets },
  { value: 'Total Mix', label: 'Total Mix', Icon: Shuffle },
  { value: 'Volumoso', label: 'Volumoso', Icon: Wheat },
];

// ─── KPI Card ─────────────────────────────────────────────────────────────────
interface KpiCardProps {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
  highlight?: boolean;
}
const KpiCard: React.FC<KpiCardProps> = ({ label, value, icon: Icon, color, highlight }) => (
  <div className={`ndp-kpi-card ${highlight ? 'ndp-kpi-highlight' : ''}`}
    style={{ borderColor: highlight ? color : undefined, background: highlight ? `${color}10` : undefined }}>
    <div className="ndp-kpi-icon" style={{ background: `${color}22`, color }}>
      <Icon size={16} />
    </div>
    <div>
      <div className="ndp-kpi-label">{label}</div>
      <div className="ndp-kpi-value" style={{ color: highlight ? color : undefined }}>{value}</div>
    </div>
  </div>
);

// ─── Formulário de estado inicial ─────────────────────────────────────────────
const INITIAL_FORM = {
  nome: '',
  tipo: 'Concentrado',
  descricao: '',
  custo_por_kg: '0',
  percentual_ms: '88',
  pb: '',
  ndt: '',
  consumo_esperado: '',
  status: 'active' as 'active' | 'draft',
  data_vigencia: new Date().toISOString().split('T')[0],
  vigencia_bloqueante: false,
};

// ─── Componente Principal ─────────────────────────────────────────────────────
const NovaDietaPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { activeFarmId, activeTenantId, insertPayload } = useFarmFilter();

  const isEdit = !!id;

  // Dados passados via navigate state (evita fetch extra quando vem da listagem)
  const dietFromState = (location.state as any)?.diet ?? null;

  // ─── Fetch fallback quando acessa URL direta ─────────────────────────────
  const { data: dietFromQuery } = useQuery({
    queryKey: ['diet', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('dietas')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: isEdit && !dietFromState,
  });

  const dietData = dietFromState ?? dietFromQuery ?? null;

  // ─── Estado do formulário ────────────────────────────────────────────────
  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [ingredients, setIngredients] = useState<ConsumptionItem[]>([]);
  const [etapaAtual, setEtapaAtual] = useState(0);
  const [stepError, setStepError] = useState<string | null>(null);

  // ─── Popula form ao editar ───────────────────────────────────────────────
  useEffect(() => {
    if (dietData) {
      setForm({
        nome: dietData.nome || '',
        tipo: dietData.tipo || 'Concentrado',
        descricao: dietData.descricao || '',
        custo_por_kg: dietData.custo_por_kg?.toString() || '0',
        percentual_ms: dietData.percentual_ms?.toString() || '88',
        pb: dietData.pb?.toString() || '',
        ndt: dietData.ndt?.toString() || '',
        consumo_esperado: dietData.consumo_esperado?.toString() || '',
        status: dietData.status || 'active',
        data_vigencia: dietData.data_vigencia || dietData.data_registro || new Date().toISOString().split('T')[0],
        vigencia_bloqueante: dietData.vigencia_bloqueante ?? false,
      });
      const raw = dietData.ingredientes || [];
      setIngredients(
        raw.map((ing: any) =>
          typeof ing === 'string'
            ? { id: Math.random().toString(36).substring(7), produto_id: '', nome: ing, quantidade: 0, unidade: 'UN', custo_medio: 0, deposito_id: '' }
            : ing
        )
      );
    }
  }, [dietData]);

  // ─── Custo automático ────────────────────────────────────────────────────
  useEffect(() => {
    if (ingredients.length > 0) {
      const totalCost = ingredients.reduce((s, i) => s + (i.custo_medio || 0) * (i.quantidade || 0), 0);
      const totalQty  = ingredients.reduce((s, i) => s + (Number(i.quantidade) || 0), 0);
      if (totalQty > 0) setForm(p => ({ ...p, custo_por_kg: (totalCost / totalQty).toFixed(2) }));
    }
  }, [ingredients]);

  // ─── MS default ao trocar tipo (somente criação) ─────────────────────────
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

  // ─── Validação por step ──────────────────────────────────────────────────
  const validate = (step: number): string | null => {
    if (step === 0 && !form.nome.trim()) return 'O nome da dieta é obrigatório.';
    return null;
  };

  const handleNext = () => {
    const err = validate(etapaAtual);
    if (err) { setStepError(err); return; }
    setStepError(null);
    setEtapaAtual(s => Math.min(s + 1, 2));
  };

  const handlePrev = () => {
    setStepError(null);
    setEtapaAtual(s => Math.max(s - 1, 0));
  };

  const handleStepClick = (idx: number) => {
    if (idx < etapaAtual) { setStepError(null); setEtapaAtual(idx); }
  };

  // ─── Mutation save ───────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        nome:               form.nome,
        tipo:               form.tipo,
        ingredientes:       ingredients,
        custo_por_kg:       parseFloat(form.custo_por_kg),
        percentual_ms:      parseFloat(form.percentual_ms),
        descricao:          form.descricao,
        status:             form.status,
        data_vigencia:      form.data_vigencia || null,
        vigencia_bloqueante: form.vigencia_bloqueante,
        pb:                 form.pb  ? parseFloat(form.pb)  : null,
        ndt:                form.ndt ? parseFloat(form.ndt) : null,
        consumo_esperado:   form.consumo_esperado ? parseFloat(form.consumo_esperado) : null,
      };
      if (isEdit && id) {
        const { error } = await supabase.from('dietas').update(payload).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('dietas').insert([{ ...payload, ...insertPayload }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report'] });
      toast.success(isEdit ? '✅ Dieta atualizada!' : '✅ Dieta formulada com sucesso!');
      navigate('/pecuaria/nutricao');
    },
    onError: (err: any) => {
      toast.error(`❌ Erro ao salvar: ${err.message}`);
    },
  });

  const handleSubmit = () => {
    if (!form.consumo_esperado) {
      setStepError('Preencha o consumo esperado para concluir a formulação.');
      return;
    }
    saveMutation.mutate();
  };

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="ndp-root">

      {/* ── Cabeçalho ── */}
      <div className="ndp-page-header">
        <Breadcrumb
          paths={[
            { label: 'Pecuária', href: '/pecuaria/dashboard' },
            { label: 'Nutrição',  href: '/pecuaria/nutricao' },
            { label: isEdit ? 'Editar Dieta' : 'Nova Dieta' },
          ]}
        />
        <div className="ndp-header-content">
          <div className="ndp-header-text">
            <div className="ndp-header-icon-wrap">
              <Utensils size={22} />
            </div>
            <div>
              <h1 className="ndp-page-title">
                {isEdit ? 'Editar Dieta' : 'Nova Dieta / Formulação'}
              </h1>
              <p className="ndp-page-subtitle">
                Defina os ingredientes e parâmetros nutricionais da formulação.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Context cards ── */}
      <div className="ndp-context-cards">
        <div className="ndp-context-card">
          <div className="ndp-context-card-icon ndp-ctx-green">
            {form.status === 'active' ? <CheckCircle2 size={15} /> : <Pencil size={15} />}
          </div>
          <div className="ndp-context-card-body">
            <span className="ndp-context-card-label">Status</span>
            <span className="ndp-context-card-value">
              {form.status === 'active' ? 'Liberada' : 'Rascunho'}
            </span>
          </div>
        </div>

        <div className="ndp-context-card">
          <div className="ndp-context-card-icon ndp-ctx-blue">
            <Layers size={15} />
          </div>
          <div className="ndp-context-card-body">
            <span className="ndp-context-card-label">Tipo</span>
            <span className="ndp-context-card-value">{form.tipo || '—'}</span>
          </div>
        </div>

        <div className="ndp-context-card">
          <div className="ndp-context-card-icon ndp-ctx-amber">
            <Activity size={15} />
          </div>
          <div className="ndp-context-card-body">
            <span className="ndp-context-card-label">Matéria Seca</span>
            <span className="ndp-context-card-value">{form.percentual_ms}% MS</span>
          </div>
        </div>

        <div className="ndp-context-card">
          <div className="ndp-context-card-icon ndp-ctx-violet">
            <DollarSign size={15} />
          </div>
          <div className="ndp-context-card-body">
            <span className="ndp-context-card-label">Custo / kg MS</span>
            <span className="ndp-context-card-value">
              {dietStats.custoMS > 0
                ? `R$ ${dietStats.custoMS.toFixed(2)}`
                : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Alerta de validação ── */}
      <AnimatePresence>
        {stepError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="ndp-step-error"
          >
            <AlertTriangle size={15} />
            {stepError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Layout principal ── */}
      <div className="ndp-main-layout">

        {/* Stepper lateral */}
        <aside className="ndp-stepper">
          <div className="ndp-stepper-inner">
            <p className="ndp-stepper-label">Progresso</p>

            {ETAPAS.map((etapa, idx) => {
              const isActive = etapaAtual === idx;
              const isPast   = etapaAtual > idx;
              const EtapaIcon = etapa.icon;

              return (
                <React.Fragment key={etapa.id}>
                  <button
                    type="button"
                    className={`ndp-step-item ${isActive ? 'ndp-step-active' : ''} ${isPast ? 'ndp-step-done' : ''}`}
                    onClick={() => handleStepClick(idx)}
                  >
                    <div className="ndp-step-icon-wrap">
                      {isPast ? <CheckCircle2 size={16} /> : <EtapaIcon size={16} />}
                    </div>
                    <div className="ndp-step-text">
                      <span className="ndp-step-name">{idx + 1}. {etapa.nome}</span>
                      <span className="ndp-step-desc">{etapa.descricao}</span>
                    </div>
                    {isActive && <ChevronRight size={14} className="ndp-step-chevron" />}
                  </button>

                  {idx < ETAPAS.length - 1 && (
                    <div className={`ndp-step-connector ${isPast ? 'ndp-connector-done' : ''}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Barra de progresso */}
          <div className="ndp-progress-bar-wrap">
            <div className="ndp-progress-info">
              <span>Etapa {etapaAtual + 1} de {ETAPAS.length}</span>
              <span>{Math.round((etapaAtual / (ETAPAS.length - 1)) * 100)}%</span>
            </div>
            <div className="ndp-progress-track">
              <motion.div
                className="ndp-progress-fill"
                animate={{ width: `${(etapaAtual / (ETAPAS.length - 1)) * 100}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
          </div>
        </aside>

        {/* Área de conteúdo */}
        <main className="ndp-main-area">
          <AnimatePresence mode="wait">

            {/* ── ETAPA 0: IDENTIFICAÇÃO ── */}
            {etapaAtual === 0 && (
              <motion.div
                key="etapa-0"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="ndp-step-content"
              >
                <div className="ndp-step-header">
                  <h2 className="ndp-step-title">Identificação</h2>
                  <p className="ndp-step-subtitle">
                    Defina o nome, tipo e vigência desta formulação.
                  </p>
                </div>

                {/* Nome + Status */}
                <div className="ndp-row-name-status">
                  <div className="ndp-field">
                    <label className="ndp-label">
                      <Utensils size={13} /> Nome da Dieta <span className="ndp-required">*</span>
                    </label>
                    <input
                      className="ndp-input"
                      type="text"
                      placeholder="Ex: Ração Engorda 18%, Suplemento Seca..."
                      value={form.nome}
                      onChange={e => setForm(p => ({ ...p, nome: e.target.value.toUpperCase() }))}
                      autoFocus
                    />
                  </div>

                  <div className="ndp-field">
                    <label className="ndp-label">
                      <CheckSquare size={13} /> Status
                    </label>
                    <button
                      type="button"
                      className={`ndp-status-btn ${form.status === 'active' ? 'ndp-status-active' : 'ndp-status-draft'}`}
                      onClick={() => setForm(p => ({ ...p, status: p.status === 'active' ? 'draft' : 'active' }))}
                    >
                      {form.status === 'active'
                        ? <><CheckCircle2 size={14} /> Liberada</>
                        : <><Pencil size={14} /> Rascunho</>}
                    </button>
                  </div>
                </div>

                {/* Tipo de Formulação */}
                <div className="ndp-field">
                  <label className="ndp-label">
                    <Wheat size={13} /> Tipo de Formulação
                  </label>
                  <div className="ndp-tipo-grid">
                    {TIPOS_FORMULACAO.map(({ value, label, Icon }) => (
                      <button
                        key={value}
                        type="button"
                        className={`ndp-tipo-btn ${form.tipo === value ? 'ndp-tipo-active' : ''}`}
                        onClick={() => setForm(p => ({ ...p, tipo: value }))}
                      >
                        <Icon size={20} />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Data de Vigência */}
                <div className="ndp-vigencia-box">
                  <div className="ndp-form-grid-2">
                    <div className="ndp-field">
                      <label className="ndp-label">
                        <Calendar size={13} /> Data de Vigência
                      </label>
                      <input
                        type="date"
                        className="ndp-input"
                        value={form.data_vigencia}
                        onChange={e => setForm(p => ({ ...p, data_vigencia: e.target.value }))}
                      />
                    </div>

                    <div className="ndp-field">
                      <label className="ndp-label">
                        <Info size={13} /> Comportamento da vigência
                      </label>
                      <button
                        type="button"
                        className={`ndp-vigencia-toggle ${form.vigencia_bloqueante ? 'ndp-vigencia-block' : ''}`}
                        onClick={() => setForm(p => ({ ...p, vigencia_bloqueante: !p.vigencia_bloqueante }))}
                      >
                        {form.vigencia_bloqueante
                          ? <ToggleRight size={18} />
                          : <ToggleLeft size={18} />}
                        <div>
                          <div className="ndp-vigencia-title">
                            {form.vigencia_bloqueante ? 'Bloquear uso antes da data' : 'Apenas informativo'}
                          </div>
                          <div className="ndp-vigencia-desc">
                            {form.vigencia_bloqueante
                              ? 'Indisponível para tratos antes desta data'
                              : 'Data registrada, sem restrição de uso'}
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── ETAPA 1: COMPOSIÇÃO & CUSTOS ── */}
            {etapaAtual === 1 && (
              <motion.div
                key="etapa-1"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="ndp-step-content"
              >
                <div className="ndp-step-header">
                  <h2 className="ndp-step-title">Composição & Custos</h2>
                  <p className="ndp-step-subtitle">
                    Adicione os ingredientes — o custo é calculado automaticamente.
                  </p>
                </div>

                {/* KPI Cards */}
                <div className="ndp-kpi-grid">
                  <KpiCard label="Custo / kg MN"  value={`R$ ${Number(form.custo_por_kg || 0).toFixed(2)}`} icon={DollarSign} color="#10b981" highlight={Number(form.custo_por_kg) > 0} />
                  <KpiCard label="Custo / kg MS"  value={`R$ ${dietStats.custoMS.toFixed(2)}`}               icon={Scale}      color="#6366f1" highlight={dietStats.custoMS > 0} />
                  <KpiCard label="Matéria Seca"   value={`${form.percentual_ms}% MS`}                        icon={Activity}   color="#f59e0b" />
                </div>

                {/* Custo + %MS */}
                <div className="ndp-form-grid-2">
                  <div className="ndp-field">
                    <label className="ndp-label" style={{ justifyContent: 'space-between' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <DollarSign size={13} /> Custo MN (R$/kg)
                      </span>
                      {ingredients.length > 0 && (
                        <span className="ndp-auto-badge">
                          <Lock size={10} /> Automático
                        </span>
                      )}
                    </label>
                    <input
                      className="ndp-input"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={form.custo_por_kg}
                      onChange={e => setForm(p => ({ ...p, custo_por_kg: e.target.value }))}
                      readOnly={ingredients.length > 0}
                      style={ingredients.length > 0 ? { color: '#10b981', fontWeight: 800, cursor: 'not-allowed' } : undefined}
                    />
                  </div>

                  <div className="ndp-field">
                    <label className="ndp-label">
                      <Activity size={13} /> Matéria Seca (% MS)
                    </label>
                    {form.tipo === 'Sal Mineral' ? (
                      <div className="ndp-ms-readonly">
                        <Lock size={13} /> 99% MS — padrão Sal Mineral
                      </div>
                    ) : (
                      <input
                        className="ndp-input"
                        type="number"
                        step="1"
                        min="1"
                        max="100"
                        value={form.percentual_ms}
                        onChange={e => setForm(p => ({ ...p, percentual_ms: e.target.value }))}
                      />
                    )}
                  </div>
                </div>

                {/* ConsumptionCart */}
                <ConsumptionCart
                  items={ingredients}
                  onChange={setIngredients}
                  mode="formulation"
                  title="Composição da Dieta"
                  subtitle={`Adicione ingredientes e proporções (${form.tipo === 'Sal Mineral' ? 'g/cabeça/dia' : '% na matéria natural'})`}
                />
              </motion.div>
            )}

            {/* ── ETAPA 2: PARÂMETROS & REVISÃO ── */}
            {etapaAtual === 2 && (
              <motion.div
                key="etapa-2"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="ndp-step-content"
              >
                <div className="ndp-step-header">
                  <h2 className="ndp-step-title">Parâmetros & Revisão</h2>
                  <p className="ndp-step-subtitle">
                    Bromatologia e análise nutricional. Ativa o simulador de desempenho.
                  </p>
                </div>

                {/* Smart Badges */}
                {dietStats.badges.length > 0 && (
                  <div className="ndp-badges-row">
                    {dietStats.badges.map((b, i) => {
                      const BIcon = b.icon;
                      return (
                        <div key={i} className="ndp-badge" style={{ background: `${b.color}18`, border: `1px solid ${b.color}40`, color: b.color }}>
                          <BIcon size={13} /> {b.text}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Bromatologia */}
                <div className="ndp-form-grid-3">
                  <div className="ndp-field">
                    <label className="ndp-label">
                      <Flame size={13} /> Proteína Bruta (PB %)
                    </label>
                    <input className="ndp-input" type="number" step="0.1" placeholder="Ex: 18"
                      value={form.pb} onChange={e => setForm(p => ({ ...p, pb: e.target.value }))} />
                  </div>

                  {form.tipo !== 'Sal Mineral' && (
                    <div className="ndp-field">
                      <label className="ndp-label">
                        <Zap size={13} /> NDT (Energia %)
                      </label>
                      <input className="ndp-input" type="number" step="0.1" placeholder="Ex: 78"
                        value={form.ndt} onChange={e => setForm(p => ({ ...p, ndt: e.target.value }))} />
                    </div>
                  )}

                  <div className="ndp-field">
                    <label className="ndp-label">
                      <Scale size={13} /> Consumo Esperado <span className="ndp-required">*</span>
                      {' '}({form.tipo === 'Sal Mineral' ? 'g/dia' : '% PV'})
                    </label>
                    <input className="ndp-input" type="number" step="0.1"
                      placeholder={form.tipo === 'Sal Mineral' ? 'Ex: 120' : 'Ex: 2.2'}
                      value={form.consumo_esperado}
                      onChange={e => setForm(p => ({ ...p, consumo_esperado: e.target.value }))} />
                  </div>
                </div>

                {/* Observações */}
                <div className="ndp-field">
                  <label className="ndp-label"><FileText size={13} /> Descrição / Observações</label>
                  <textarea className="ndp-input ndp-textarea" rows={3}
                    placeholder="Notas sobre a formulação, período de uso, restrições..."
                    value={form.descricao}
                    onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} />
                </div>

                {/* Resumo */}
                <div className="ndp-review-card">
                  <p className="ndp-stepper-label" style={{ borderBottom: '1px solid hsl(var(--border))', paddingBottom: '12px', marginBottom: '12px' }}>
                    Resumo da Formulação
                  </p>
                  <div className="ndp-form-grid-3">
                    {[
                      { label: 'Nome',         value: form.nome || '—' },
                      { label: 'Tipo',         value: form.tipo },
                      { label: 'Custo/kg MS',  value: `R$ ${dietStats.custoMS.toFixed(2)}`, color: '#10b981' },
                      { label: 'Vigência',     value: form.data_vigencia ? new Date(`${form.data_vigencia}T12:00:00`).toLocaleDateString('pt-BR') : '—' },
                      { label: 'Status',       value: form.status === 'active' ? 'Liberada' : 'Rascunho' },
                      { label: 'Ingredientes', value: ingredients.length > 0 ? `${ingredients.length} insumo(s)` : 'Nenhum' },
                    ].map(({ label, value, color }) => (
                      <div key={label}>
                        <div className="ndp-label" style={{ marginBottom: '3px' }}>{label}</div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: color || 'hsl(var(--text-main))' }}>{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </div>

      {/* ── Footer fixo ── */}
      <footer className="ndp-footer">
        <div className="ndp-footer-inner">
          <button
            type="button"
            className="ndp-btn ndp-btn-ghost"
            onClick={() => navigate('/pecuaria/nutricao')}
          >
            Cancelar
          </button>

          <div className="ndp-footer-nav">
            <button
              type="button"
              className="ndp-btn ndp-btn-secondary"
              onClick={handlePrev}
              disabled={etapaAtual === 0}
            >
              <ArrowLeft size={15} /> Anterior
            </button>

            {etapaAtual < 2 ? (
              <button type="button" className="ndp-btn ndp-btn-primary" onClick={handleNext}>
                Próximo <ArrowRight size={15} />
              </button>
            ) : (
              <button
                type="button"
                className="ndp-btn ndp-btn-success"
                onClick={handleSubmit}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending
                  ? <><span className="ndp-spinner" /> Salvando...</>
                  : <><Save size={15} /> {isEdit ? 'Atualizar Dieta' : 'Salvar Dieta'}</>}
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default NovaDietaPage;
