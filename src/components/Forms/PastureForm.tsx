import React, { useState, useEffect, useCallback } from 'react';
import { useFormDraft } from '../../hooks/useFormDraft';
import { useTenant } from '../../contexts/TenantContext';
import { useFarmFilter } from '../../hooks/useFarmFilter';

import {
  MapPin,
  Maximize,
  Tag,
  Trees,
  Activity,
  Calendar,
  Sprout,
  Shield,
  Sun,
  Flame,
  AlertTriangle,
  Lightbulb,
  Info,
  Droplets,
  Layers,
  RotateCcw,
  CheckCircle,
  XCircle,
  GitBranch,
  Clock,
} from 'lucide-react';
import { SidePanel } from '../Layout/SidePanel';
import { SearchableSelect } from './SearchableSelect';
import { supabase } from '../../lib/supabase';
import { DateInput } from '../../components/Form/DateInput';
import toast from 'react-hot-toast';
import {
  FORRAGEIRAS_OPTIONS,
  SISTEMAS_PASTEJO,
  TOPOGRAFIA_OPTIONS,
  TIPO_SOLO_OPTIONS,
  AGUA_OPTIONS,
  ESTADO_CERCA_OPTIONS,
  SOMBREAMENTO_OPTIONS,
  PLANTAS_DANINHAS_OPTIONS,
  PASTURE_STATUS,
  CARENCIA_QUIMICA_DIAS,
  CARENCIA_ATENCAO_DIAS,
} from '../../constants/livestock';

// ---------------------------------------------------------------------------
// Regex de validação de coordenadas  Ex: -15.7801, -47.9292
// ---------------------------------------------------------------------------
const COORDS_REGEX = /^-?\d{1,3}(\.\d+)?,\s*-?\d{1,3}(\.\d+)?$/;

interface PastureFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  actionId?: number;
}

export const PastureForm: React.FC<PastureFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const { activeTenantId } = useTenant();
  const { activeFarmId } = useFarmFilter();

  const INITIAL_FORM = {
    nome: '',
    area: '',
    capacidade_ua: '2.5',
    tipo_capim: '',
    status: PASTURE_STATUS.GRAZING,
    data_ultima_fertilizacao: '',
    topografia: 'Plano',
    tipo_solo: 'Latossolo',
    agua: 'Natural (Rios/Nascentes)',
    observacoes: '',
    fazenda_id: '',
    estado_cerca: 'Bom',
    sombreamento: 'Natural (Árvores)',
    plantas_daninhas: 'Baixa Infestação',
    sistema_pastejo: 'Contínuo',
    coordenadas: '',
    // Campos condicionais — Rotacionado
    num_piquetes: '',
    dias_ocupacao: '',
    dias_descanso: '',
    // Campo condicional — Diferido
    data_diferimento: '',
  };

  const { formData, setFormData, clearDraft } = useFormDraft({
    key: `pasture_form_${activeTenantId}`,
    initialState: INITIAL_FORM,
    isOpen,
    isEditMode: !!initialData,
  });

  const [farms, setFarms] = useState<any[]>([]);
  const [coordsError, setCoordsError] = useState('');
  const [loading, setLoading] = useState(false);

  // ── Buscar fazendas ──────────────────────────────────────────────────────
  const fetchFarms = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('fazendas')
        .select('id, nome')
        .eq('tenant_id', activeTenantId);
      if (data) setFarms(data);
    } catch (err) {
      console.error('Error fetching farms:', err);
    }
  }, [activeTenantId]);

  useEffect(() => {
    if (!isOpen) return;
    fetchFarms();
  }, [isOpen, fetchFarms]);

  // ── Pré-selecionar fazenda ativa (P0) ────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !!initialData || !activeFarmId) return;
    setFormData((prev: typeof INITIAL_FORM) => ({
      ...prev,
      fazenda_id: activeFarmId,
    }));
  }, [isOpen, activeFarmId, initialData]);

  // ── Preencher form no modo edição ────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !initialData) return;
    setFormData({
      nome: initialData.nome || '',
      area: initialData.area ? initialData.area.toString().replace(/[^\d.-]/g, '') : '',
      capacidade_ua: initialData.capacidade_ua?.toString() || '2.5',
      tipo_capim: initialData.tipo_capim || '',
      status: initialData.status || PASTURE_STATUS.GRAZING,
      data_ultima_fertilizacao: initialData.data_ultima_fertilizacao || '',
      topografia: initialData.topografia || 'Plano',
      tipo_solo: initialData.tipo_solo || 'Latossolo',
      agua: initialData.agua || 'Natural (Rios/Nascentes)',
      observacoes: initialData.observacoes || '',
      fazenda_id: initialData.fazenda_id || '',
      estado_cerca: initialData.estado_cerca || 'Bom',
      sombreamento: initialData.sombreamento || 'Natural (Árvores)',
      plantas_daninhas: initialData.plantas_daninhas || 'Baixa Infestação',
      sistema_pastejo: initialData.sistema_pastejo || 'Contínuo',
      coordenadas: initialData.coordenadas || '',
      num_piquetes: initialData.num_piquetes?.toString() || '',
      dias_ocupacao: initialData.dias_ocupacao?.toString() || '',
      dias_descanso: initialData.dias_descanso?.toString() || '',
      data_diferimento: initialData.data_diferimento || '',
    });
  }, [isOpen, initialData]);

  // ── Cálculos derivados ───────────────────────────────────────────────────
  const areaNum = parseFloat(formData.area) || 0;
  const capNum = parseFloat(formData.capacidade_ua) || 0;

  const totalCapacity = areaNum > 0 && capNum > 0 ? (areaNum * capNum).toFixed(1) : null;

  // Dias desde a última fertilização
  const daysSinceFertilization = React.useMemo(() => {
    if (!formData.data_ultima_fertilizacao) return null;
    const diff = Date.now() - new Date(formData.data_ultima_fertilizacao).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }, [formData.data_ultima_fertilizacao]);

  // ── Diagnóstico de carência química (P1 — 3 faixas corretas) ────────────
  const carenciaStatus = React.useMemo(() => {
    if (daysSinceFertilization === null) return null;
    if (daysSinceFertilization < 0) return null; // data futura
    if (daysSinceFertilization < CARENCIA_QUIMICA_DIAS) return 'blocked'; // < 30 dias
    if (daysSinceFertilization < CARENCIA_ATENCAO_DIAS) return 'caution'; // 30–89 dias
    return 'ok'; // >= 90 dias
  }, [daysSinceFertilization]);

  // Período de descanso calculado para sistema rotacionado
  const periodoDescansoCalculado = React.useMemo(() => {
    const piquetes = parseInt(formData.num_piquetes) || 0;
    const diasOcup = parseInt(formData.dias_ocupacao) || 0;
    if (piquetes >= 2 && diasOcup > 0) {
      return (piquetes - 1) * diasOcup;
    }
    return null;
  }, [formData.num_piquetes, formData.dias_ocupacao]);

  // Pressão de pastejo (UA atual / capacidade total) — mostrada apenas em edição
  const pressaoPastejo = React.useMemo(() => {
    if (!initialData?.lotacao || !totalCapacity) return null;
    const lotacaoNum = parseFloat((initialData.lotacao || '').toString().replace(/[^\d.-]/g, ''));
    const cap = parseFloat(totalCapacity);
    if (isNaN(lotacaoNum) || cap <= 0) return null;
    return ((lotacaoNum / cap) * 100).toFixed(0);
  }, [initialData, totalCapacity]);

  // Condições que recomendam status não-pastejo
  const needsAttention =
    formData.plantas_daninhas === 'Alta Infestação' ||
    formData.estado_cerca === 'Ruim' ||
    formData.estado_cerca === 'Necessita Reparo' ||
    carenciaStatus === 'blocked';

  // ── Validação de coordenadas ─────────────────────────────────────────────
  const handleCoordsChange = (value: string) => {
    setFormData({ ...formData, coordenadas: value });
    if (value && !COORDS_REGEX.test(value.trim())) {
      setCoordsError('Formato inválido. Use: -15.7801, -47.9292');
    } else {
      setCoordsError('');
    }
  };

  // ── Submit com validações P0 ─────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação: fazenda obrigatória
    if (!formData.fazenda_id) {
      toast.error('Selecione a fazenda / unidade antes de salvar.');
      return;
    }

    // Validação: área > 0
    const area = parseFloat(formData.area);
    if (!formData.area || isNaN(area) || area <= 0) {
      toast.error('A área do pasto deve ser maior que zero.');
      return;
    }

    // Validação: nome obrigatório
    if (!formData.nome?.trim()) {
      toast.error('Informe o nome do pasto.');
      return;
    }

    // Validação: coordenadas (se preenchidas)
    if (formData.coordenadas && !COORDS_REGEX.test(formData.coordenadas.trim())) {
      toast.error('Corrija o formato das coordenadas antes de salvar.');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
      clearDraft();
    } finally {
      setLoading(false);
    }
  };

  const isRotacionado = formData.sistema_pastejo === 'Rotacionado';
  const isDiferido = formData.sistema_pastejo === 'Diferido';

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      onCancel={() => { clearDraft(); onClose(); }}
      onSubmit={handleSubmit}
      title={initialData ? 'Editar Pasto' : 'Novo Pasto'}
      subtitle="Cadastre e gerencie as áreas de pastagem."
      icon={Trees}
      loading={loading}
      submitLabel={initialData ? 'Salvar Alterações' : 'Salvar Pasto'}
      size="large"
    >

      {/* ════════════════════════════════════════════════════════════════
          SEÇÃO 1 — IDENTIFICAÇÃO DA ÁREA
      ════════════════════════════════════════════════════════════════ */}
      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 01</div>
          <h4 className="tauze-section-title">Dados Principais</h4>
        </div>

        <div className="tauze-input-grid grid-col-3">
          {/* Fazenda */}
          <div className="tauze-field-group">
            <label className="tauze-label">
              <Trees size={14} /> Fazenda / Unidade <span style={{ color: 'var(--danger, #ef4444)' }}>*</span>
            </label>
            <SearchableSelect
              value={formData.fazenda_id}
              onChange={(val: any) => setFormData({ ...formData, fazenda_id: val })}
              options={[
                { value: '', label: 'Selecione uma fazenda...' },
                ...farms.map((f) => ({ value: String(f.id), label: f.nome })),
              ]}
            />
          </div>

          {/* Nome do Pasto */}
          <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
            <label className="tauze-label">
              <Tag size={14} /> Nome do Pasto <span style={{ color: 'var(--danger, #ef4444)' }}>*</span>
            </label>
            <input
              className="tauze-input"
              type="text"
              placeholder="Ex: P-01 (Maternidade), Piquete 05..."
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value.toUpperCase() })}
              required
            />
          </div>

          {/* Área (ha) */}
          <div className="tauze-field-group">
            <label className="tauze-label">
              <Maximize size={14} /> Área (ha) <span style={{ color: 'var(--danger, #ef4444)' }}>*</span>
            </label>
            <input
              className="tauze-input"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={formData.area}
              onChange={(e) => setFormData({ ...formData, area: e.target.value })}
              required
            />
          </div>

          {/* Capacidade UA/ha */}
          <div className="tauze-field-group">
            <label
              className="tauze-label"
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span><Activity size={14} /> Capacidade (UA/ha)</span>
              {totalCapacity && (
                <span
                  style={{
                    padding: '2px 8px',
                    fontSize: '10px',
                    background: 'hsl(var(--brand)/0.1)',
                    color: 'hsl(var(--brand))',
                    borderRadius: '4px',
                    fontWeight: 700,
                  }}
                >
                  Suporta {totalCapacity} UA
                </span>
              )}
            </label>
            <input
              className="tauze-input"
              type="number"
              step="0.1"
              min="0.1"
              placeholder="2.5"
              value={formData.capacidade_ua}
              onChange={(e) => setFormData({ ...formData, capacidade_ua: e.target.value })}
              required
            />
          </div>

          {/* Coordenadas com validação */}
          <div className="tauze-field-group">
            <label className="tauze-label">
              <MapPin size={14} /> Coordenadas (Lat, Long)
            </label>
            <input
              className={`tauze-input ${coordsError ? 'input-error' : ''}`}
              type="text"
              placeholder="-15.7801, -47.9292"
              value={formData.coordenadas}
              onChange={(e) => handleCoordsChange(e.target.value)}
              style={coordsError ? { borderColor: '#ef4444' } : undefined}
            />
            {coordsError && (
              <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4 }}>
                <XCircle size={12} /> {coordsError}
              </p>
            )}
            {formData.coordenadas && !coordsError && (
              <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle size={12} /> Coordenadas válidas
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SEÇÃO 2 — PASTEJO E MANEJO FORRAGEIRO
      ════════════════════════════════════════════════════════════════ */}
      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 02</div>
          <h4 className="tauze-section-title">Pastejo e Manejo Forrageiro</h4>
        </div>

        <div className="tauze-input-grid grid-col-3">
          {/* Tipo de Capim — SearchableSelect + creatable */}
          <div className="tauze-field-group">
            <label className="tauze-label">
              <Trees size={14} /> Forrageira / Capim <span style={{ color: 'var(--danger, #ef4444)' }}>*</span>
            </label>
            <SearchableSelect
              value={formData.tipo_capim}
              onChange={(val: any) => setFormData({ ...formData, tipo_capim: val })}
              options={FORRAGEIRAS_OPTIONS}
              placeholder="Selecione ou digite..."
              creatable={true}
            />
          </div>

          {/* Sistema de Pastejo */}
          <div className="tauze-field-group">
            <label className="tauze-label">
              <GitBranch size={14} /> Sistema de Pastejo
            </label>
            <SearchableSelect
              value={formData.sistema_pastejo}
              onChange={(val: any) => setFormData({ ...formData, sistema_pastejo: val })}
              options={SISTEMAS_PASTEJO}
            />
          </div>

          {/* Data da Última Fertilização */}
          <div className="tauze-field-group">
            <label className="tauze-label">
              <Calendar size={14} /> Última Fertilização
            </label>
            <DateInput
              className="tauze-input"
              type="date"
              value={formData.data_ultima_fertilizacao}
              onChange={(e: any) =>
                setFormData({ ...formData, data_ultima_fertilizacao: e.target.value })
              }
            />

            {/* Alerta de carência — 3 faixas (P1) */}
            {carenciaStatus === 'blocked' && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px',
                background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
                borderRadius: 10, fontSize: 12, fontWeight: 600, marginTop: 8,
              }}>
                <XCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>
                  <strong>Carência Ativa ({daysSinceFertilization} dias).</strong> Animais <u>não devem ser inseridos</u> nesta área. Aguardar {CARENCIA_QUIMICA_DIAS - daysSinceFertilization!} dia(s).
                </span>
              </div>
            )}
            {carenciaStatus === 'caution' && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px',
                background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a',
                borderRadius: 10, fontSize: 12, fontWeight: 600, marginTop: 8,
              }}>
                <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>
                  <strong>Verifique laudos ({daysSinceFertilization} dias).</strong> Verifique análises antes do retorno ao pastejo.
                </span>
              </div>
            )}
          </div>

          {/* Campos condicionais: Rotacionado */}
          {isRotacionado && (
            <>
              <div className="tauze-field-group">
                <label className="tauze-label">
                  <RotateCcw size={14} /> Nº de Piquetes
                </label>
                <input
                  className="tauze-input"
                  type="number"
                  min="2"
                  step="1"
                  placeholder="Ex: 8"
                  value={formData.num_piquetes}
                  onChange={(e) => setFormData({ ...formData, num_piquetes: e.target.value })}
                />
              </div>

              <div className="tauze-field-group">
                <label className="tauze-label">
                  <Clock size={14} /> Dias de Ocupação / Piquete
                </label>
                <input
                  className="tauze-input"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Ex: 3"
                  value={formData.dias_ocupacao}
                  onChange={(e) => setFormData({ ...formData, dias_ocupacao: e.target.value })}
                />
              </div>

              <div className="tauze-field-group">
                <label
                  className="tauze-label"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span><Clock size={14} /> Período de Descanso</span>
                  {periodoDescansoCalculado !== null && (
                    <span style={{ fontSize: 10, padding: '2px 8px', background: 'hsl(142 71% 45%/0.1)', color: 'hsl(142 71% 35%)', borderRadius: 4, fontWeight: 700 }}>
                      Calc: {periodoDescansoCalculado} dias
                    </span>
                  )}
                </label>
                <input
                  className="tauze-input"
                  type="number"
                  min="1"
                  step="1"
                  placeholder={periodoDescansoCalculado ? `${periodoDescansoCalculado} (calculado)` : 'Ex: 21'}
                  value={formData.dias_descanso || (periodoDescansoCalculado?.toString() ?? '')}
                  onChange={(e) => setFormData({ ...formData, dias_descanso: e.target.value })}
                />
                {periodoDescansoCalculado !== null && (
                  <p style={{ margin: '4px 0 0', fontSize: 11, color: 'hsl(142 71% 35%)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Info size={11} /> (Nº piquetes - 1) × dias de ocupação
                  </p>
                )}
              </div>
            </>
          )}

          {/* Campo condicional: Diferido */}
          {isDiferido && (
            <div className="tauze-field-group">
              <label className="tauze-label">
                <Calendar size={14} /> Data de Diferimento
              </label>
              <DateInput
                className="tauze-input"
                type="date"
                value={formData.data_diferimento}
                onChange={(e: any) =>
                  setFormData({ ...formData, data_diferimento: e.target.value })
                }
              />
              <p style={{ margin: '4px 0 0', fontSize: 11, color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Info size={11} /> Data em que a área foi vedada para diferimento
              </p>
            </div>
          )}

          {/* Status da Área */}
          <div className="tauze-field-group" style={{ gridColumn: 'span 3' }}>
            <label className="tauze-label">
              <Tag size={14} /> Status da Área
            </label>
            <div
              className="tauze-form-radio-group"
              style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}
            >
              <div
                className={`tauze-form-radio-item ${formData.status === PASTURE_STATUS.GRAZING ? 'active-grazing' : ''}`}
                onClick={() => setFormData({ ...formData, status: PASTURE_STATUS.GRAZING })}
              >
                <Trees size={16} />
                <span>Pastejo</span>
              </div>
              <div
                className={`tauze-form-radio-item ${formData.status === PASTURE_STATUS.RESTING ? 'active-resting' : ''}`}
                onClick={() => setFormData({ ...formData, status: PASTURE_STATUS.RESTING })}
              >
                <Calendar size={16} />
                <span>Descanso</span>
              </div>
              <div
                className={`tauze-form-radio-item ${formData.status === PASTURE_STATUS.DEGRADED ? 'active-degraded' : ''}`}
                onClick={() => setFormData({ ...formData, status: PASTURE_STATUS.DEGRADED })}
              >
                <Activity size={16} />
                <span>Degradado</span>
              </div>
              <div
                className={`tauze-form-radio-item ${formData.status === PASTURE_STATUS.RENOVATION ? 'active-renovation' : ''}`}
                onClick={() => setFormData({ ...formData, status: PASTURE_STATUS.RENOVATION })}
              >
                <Sprout size={16} />
                <span>Reforma</span>
              </div>
            </div>
            {needsAttention && formData.status === PASTURE_STATUS.GRAZING && (
              <div
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px',
                  background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a',
                  borderRadius: 10, fontSize: 12, fontWeight: 600, marginTop: 8,
                }}
              >
                <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>
                  As condições atuais da área (cerca, infestação ou carência química) sugerem alterar o status para <strong>Descanso</strong> ou <strong>Reforma</strong>.
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SEÇÃO 3 — CARACTERÍSTICAS FÍSICAS
      ════════════════════════════════════════════════════════════════ */}
      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 03</div>
          <h4 className="tauze-section-title">Características da Área</h4>
        </div>

        <div className="tauze-input-grid grid-col-3">
          <div className="tauze-field-group">
            <label className="tauze-label"><MapPin size={14} /> Topografia</label>
            <SearchableSelect
              value={formData.topografia}
              onChange={(val: any) => setFormData({ ...formData, topografia: val })}
              options={TOPOGRAFIA_OPTIONS}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Layers size={14} /> Tipo de Solo</label>
            <SearchableSelect
              value={formData.tipo_solo}
              onChange={(val: any) => setFormData({ ...formData, tipo_solo: val })}
              options={TIPO_SOLO_OPTIONS}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Droplets size={14} /> Recurso Hídrico</label>
            <SearchableSelect
              value={formData.agua}
              onChange={(val: any) => setFormData({ ...formData, agua: val })}
              options={AGUA_OPTIONS}
            />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SEÇÃO 4 — INFRAESTRUTURA E SAÚDE
      ════════════════════════════════════════════════════════════════ */}
      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 04</div>
          <h4 className="tauze-section-title">Infraestrutura e Saúde da Área</h4>
        </div>

        <div className="tauze-input-grid grid-col-3">
          <div className="tauze-field-group">
            <label className="tauze-label"><Shield size={14} /> Estado da Cerca</label>
            <SearchableSelect
              value={formData.estado_cerca}
              onChange={(val: any) => setFormData({ ...formData, estado_cerca: val })}
              options={ESTADO_CERCA_OPTIONS}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Sun size={14} /> Sombreamento</label>
            <SearchableSelect
              value={formData.sombreamento}
              onChange={(val: any) => setFormData({ ...formData, sombreamento: val })}
              options={SOMBREAMENTO_OPTIONS}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Flame size={14} /> Plantas Invasoras</label>
            <SearchableSelect
              value={formData.plantas_daninhas}
              onChange={(val: any) => setFormData({ ...formData, plantas_daninhas: val })}
              options={PLANTAS_DANINHAS_OPTIONS}
            />
          </div>

          <div className="tauze-field-group" style={{ gridColumn: 'span 3' }}>
            <label className="tauze-label"><Tag size={14} /> Observações Técnicas</label>
            <textarea
              className="tauze-input tauze-textarea"
              placeholder="Notas sobre degradação, pragas, histórico da área, necessidades de calagem..."
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              rows={3}
            />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SMART CARD — RESUMO AGRONÔMICO (usando CSS tokens)
      ════════════════════════════════════════════════════════════════ */}
      {formData.area && formData.capacidade_ua && (
        <div
          style={{
            marginTop: 8,
            padding: '18px 20px',
            borderRadius: 14,
            background: 'linear-gradient(135deg, hsl(var(--brand)/0.07) 0%, hsl(var(--brand)/0.02) 100%)',
            border: '1px solid hsl(var(--brand)/0.15)',
          }}
        >
          {/* Header do card */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div
              style={{
                background: 'hsl(var(--bg-card))',
                padding: 8,
                borderRadius: 10,
                color: 'hsl(var(--brand))',
                boxShadow: '0 4px 12px hsl(var(--brand)/0.15)',
              }}
            >
              <Lightbulb size={20} />
            </div>
            <h4
              style={{
                margin: 0, fontSize: 12, fontWeight: 800,
                color: 'hsl(var(--brand))', textTransform: 'uppercase', letterSpacing: '0.06em',
              }}
            >
              Resumo Agronômico
            </h4>
          </div>

          {/* Métricas em grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>
            {/* UA Total */}
            <div style={{
              padding: '12px 14px', background: 'hsl(var(--bg-card))',
              borderRadius: 10, border: '1px solid hsl(var(--border))',
            }}>
              <p style={{ margin: 0, fontSize: 10, color: 'hsl(var(--text-muted))', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Capacidade Total
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 900, color: 'hsl(142 71% 40%)' }}>
                {totalCapacity} <span style={{ fontSize: 12, fontWeight: 600 }}>UA</span>
              </p>
            </div>

            {/* Densidade */}
            <div style={{
              padding: '12px 14px', background: 'hsl(var(--bg-card))',
              borderRadius: 10, border: '1px solid hsl(var(--border))',
            }}>
              <p style={{ margin: 0, fontSize: 10, color: 'hsl(var(--text-muted))', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Lotação Máx.
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 900, color: 'hsl(var(--brand))' }}>
                {capNum.toFixed(1)} <span style={{ fontSize: 12, fontWeight: 600 }}>UA/ha</span>
              </p>
            </div>

            {/* Pressão de Pastejo (apenas edição) ou Área */}
            {pressaoPastejo !== null ? (
              <div style={{
                padding: '12px 14px', background: 'hsl(var(--bg-card))',
                borderRadius: 10, border: `1px solid ${
                  parseInt(pressaoPastejo) > 100 ? '#fecaca' :
                  parseInt(pressaoPastejo) > 80 ? '#fde68a' : 'hsl(var(--border))'
                }`,
              }}>
                <p style={{ margin: 0, fontSize: 10, color: 'hsl(var(--text-muted))', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Pressão de Pastejo
                </p>
                <p style={{
                  margin: '4px 0 0', fontSize: 22, fontWeight: 900,
                  color: parseInt(pressaoPastejo) > 100 ? '#dc2626' :
                         parseInt(pressaoPastejo) > 80 ? '#d97706' : '#10b981',
                }}>
                  {pressaoPastejo}<span style={{ fontSize: 12, fontWeight: 600 }}>%</span>
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 10, color: 'hsl(var(--text-muted))' }}>
                  {parseInt(pressaoPastejo) > 100 ? '🔴 Superlotada' :
                   parseInt(pressaoPastejo) > 80 ? '🟡 Limite Ideal' : '✅ Subutilizada'}
                </p>
              </div>
            ) : (
              <div style={{
                padding: '12px 14px', background: 'hsl(var(--bg-card))',
                borderRadius: 10, border: '1px solid hsl(var(--border))',
              }}>
                <p style={{ margin: 0, fontSize: 10, color: 'hsl(var(--text-muted))', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Área Total
                </p>
                <p style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 900, color: 'hsl(217 91% 55%)' }}>
                  {areaNum.toFixed(1)} <span style={{ fontSize: 12, fontWeight: 600 }}>ha</span>
                </p>
              </div>
            )}
          </div>

          {/* Texto narrativo */}
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: 'hsl(var(--text-main))' }}>
            O pasto{' '}
            <strong>{formData.nome || '___'}</strong>{' '}
            possui <strong>{areaNum.toFixed(2)} hectares</strong> com sistema de pastejo{' '}
            <strong>{formData.sistema_pastejo}</strong>.{' '}
            Com lotação de {capNum} UA/ha, a área suporta fisicamente até{' '}
            <strong style={{ color: 'hsl(142 71% 40%)' }}>{totalCapacity} Unidades Animais</strong>.{' '}
            Status atual:{' '}
            <strong style={{ textTransform: 'uppercase' }}>
              {formData.status === PASTURE_STATUS.GRAZING ? 'Em Pastejo' :
               formData.status === PASTURE_STATUS.RESTING ? 'Em Descanso' :
               formData.status === PASTURE_STATUS.DEGRADED ? 'Degradado' : 'Em Reforma'}
            </strong>.
            {isRotacionado && periodoDescansoCalculado && (
              <>{' '}Rotação calculada: <strong>{periodoDescansoCalculado} dias de descanso</strong> por piquete.</>
            )}
          </p>
        </div>
      )}
    </SidePanel>
  );
};
