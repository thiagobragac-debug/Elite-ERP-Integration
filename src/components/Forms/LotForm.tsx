import { showValidationAlert } from '../../utils/validationAlert';
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import { z } from 'zod';

import {
  Layers,
  Tag,
  Users,
  Building2,
  TrendingUp,
  Activity,
  CheckCircle2,
  MapPin,
  Clock,
  Calendar,
  ShieldCheck,
  Scale,
  DollarSign,
  Fingerprint,
  Lightbulb,
  Truck,
  AlertTriangle,
  Package,
  FileText,
} from 'lucide-react';
import { SidePanel } from '../Layout/SidePanel';
import { SearchableSelect } from './SearchableSelect';
import { ColorPicker } from './ColorPicker';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { DateInput } from '../../components/Form/DateInput';

const getToday = () => new Date().toLocaleDateString('en-CA');

// ─── Zod Schema para Validação de Regras de Negócio ──────────────────────────
const lotSchema = z.object({
  nome: z.string().min(1, 'Nome do lote é obrigatório.'),
  fazenda_id: z.string().min(1, 'Fazenda de destino é obrigatória.'),
  data_inicio: z.string().min(1, 'Data de início é obrigatória.'),
  peso_entrada: z.union([z.coerce.number().min(0, 'Peso não pode ser negativo.'), z.literal('')]).optional(),
  capacidade: z.union([z.coerce.number().min(0, 'Capacidade não pode ser negativa.'), z.literal('')]).optional(),
  dias_ciclo: z.union([z.coerce.number().min(1, 'Dias de ciclo deve ser maior que 0.'), z.literal('')]).optional(),
});

const INITIAL_FORM = {
  nome: '',
  finalidade: '',
  descricao: '',
  status: 'ATIVO',
  capacidade: '',
  data_inicio: getToday(),
  data_fim_prevista: '',
  dias_ciclo: '',
  peso_entrada: '',
  gmd_alvo: '',
  peso_alvo: '',
  fazenda_id: '',
  pasto_id: '',
  sexo_permitido: 'MISTO',
  regime_alimentar: '',
  custo_diario: '',
  exige_rastreabilidade: false,
  cor: '#6366f1',
  programa_bonificacao: '',
  meta_rendimento_carcaca: '',
  peso_carcaca_alvo: '',
  // Campos NF / SLA (status PENDENTE)
  data_limite: '',
  fornecedor: '',
  nf_numero: '',
  quantidade_nota: '',
  custo_total_aquisicao: '',
  custo_por_cabeca: '',
};

const SectionBadge = ({ step, label, complete }: { step: string; label: string; complete: boolean }) => (
  <div className="tauze-section-header">
    <div className="tauze-section-badge" style={complete ? { background: 'rgba(16,185,129,0.15)', color: '#10b981', transition: 'all 0.3s' } : { transition: 'all 0.3s' }}>
      {complete ? '✓' : step}
    </div>
    <h4 className="tauze-section-title">{label}</h4>
  </div>
);

interface LotFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  loading?: boolean;
  actionId?: number;
}

export const LotForm: React.FC<LotFormProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [pesoAlvoEditadoManualmente, setPesoAlvoEditadoManualmente] = useState(false);
  const [pesoCarcacaEditadoManualmente, setPesoCarcacaEditadoManualmente] = useState(false);
  const [duplicateNome, setDuplicateNome] = useState(false);
  const [animaisAtuais, setAnimaisAtuais] = useState<number | null>(null);
  const { activeTenantId } = useTenant();
  const [fazendas, setFazendas] = useState<any[]>([]);
  const [pastos, setPastos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingFazendas, setLoadingFazendas] = useState(false);
  const [loadingPastos, setLoadingPastos] = useState(false);

  const draftKey = useMemo(() => {
    if (!activeTenantId) return null;
    return initialData?.id ? `draft_lot_${activeTenantId}_edit_${initialData.id}` : `draft_lot_${activeTenantId}_new`;
  }, [activeTenantId, initialData?.id]);

  const clearDraft = useCallback(() => { if (draftKey) sessionStorage.removeItem(draftKey); }, [draftKey]);

  useEffect(() => {
    if (!draftKey || !isOpen) return;
    const timeout = setTimeout(() => {
      const hasData = formData.nome || formData.finalidade || formData.fazenda_id || formData.peso_entrada;
      if (hasData) sessionStorage.setItem(draftKey, JSON.stringify({ data: formData, savedAt: new Date().toISOString() }));
    }, 800);
    return () => clearTimeout(timeout);
  }, [formData, draftKey, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (initialData) {
      setFormData({
        nome: initialData.nome || '',
        finalidade: initialData.finalidade || '',
        descricao: initialData.descricao || '',
        status: initialData.status || 'ATIVO',
        capacidade: initialData.capacidade ? initialData.capacidade.toString().replace(/[^\d.-]/g, '') : '',
        data_inicio: initialData.data_inicio || getToday(),
        data_fim_prevista: initialData.data_fim_prevista || '',
        dias_ciclo: initialData.dias_ciclo ? initialData.dias_ciclo.toString().replace(/[^\d.-]/g, '') : '',
        peso_entrada: initialData.peso_entrada ? initialData.peso_entrada.toString().replace(/[^\d.-]/g, '') : '',
        gmd_alvo: initialData.gmd_alvo ? initialData.gmd_alvo.toString().replace(/[^\d.-]/g, '') : '',
        peso_alvo: initialData.peso_alvo ? initialData.peso_alvo.toString().replace(/[^\d.-]/g, '') : '',
        fazenda_id: initialData.fazenda_id || '',
        pasto_id: initialData.pasto_id || '',
        sexo_permitido: initialData.sexo_permitido || 'MISTO',
        regime_alimentar: initialData.regime_alimentar || '',
        custo_diario: initialData.custo_diario ? initialData.custo_diario.toString().replace(/[^\d.-]/g, '') : '',
        exige_rastreabilidade: initialData.exige_rastreabilidade || false,
        cor: initialData.cor || '#6366f1',
        programa_bonificacao: initialData.programa_bonificacao || '',
        meta_rendimento_carcaca: initialData.meta_rendimento_carcaca ? initialData.meta_rendimento_carcaca.toString().replace(/[^\d.-]/g, '') : '',
        peso_carcaca_alvo: initialData.peso_carcaca_alvo ? initialData.peso_carcaca_alvo.toString().replace(/[^\d.-]/g, '') : '',
        // Campos NF/SLA
        data_limite: initialData.data_limite || '',
        fornecedor: initialData.fornecedor || '',
        nf_numero: initialData.nf_numero || '',
        quantidade_nota: initialData.quantidade_nota ? String(initialData.quantidade_nota) : '',
        custo_total_aquisicao: initialData.custo_total_aquisicao ? initialData.custo_total_aquisicao.toString().replace(/[^\d.-]/g, '') : '',
        custo_por_cabeca: initialData.custo_por_cabeca ? initialData.custo_por_cabeca.toString().replace(/[^\d.-]/g, '') : '',
      });
      setPesoAlvoEditadoManualmente(true);
      setPesoCarcacaEditadoManualmente(true);
      setDuplicateNome(false);
      fetchAnimaisCount(initialData.id);
      return;
    }
    if (draftKey) {
      try {
        const raw = sessionStorage.getItem(draftKey);
        if (raw) {
          const { data: draftData, savedAt } = JSON.parse(raw);
          const minutesAgo = Math.round((Date.now() - new Date(savedAt).getTime()) / 60_000);
          const hasData = draftData.nome || draftData.finalidade || draftData.fazenda_id || draftData.peso_entrada;
          if (hasData) {
            setFormData(draftData);
            setPesoAlvoEditadoManualmente(false);
            setPesoCarcacaEditadoManualmente(false);
            setDuplicateNome(false);
            const label = minutesAgo < 1 ? 'agora mesmo' : minutesAgo === 1 ? 'há 1 minuto' : `há ${minutesAgo} minutos`;
            toast((t) => (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px' }}>📋</span>
                  <div>
                    <p style={{ fontWeight: 800, fontSize: '13px', margin: 0, color: '#1e293b' }}>Rascunho restaurado</p>
                    <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>Você tinha campos preenchidos ({label})</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => toast.dismiss(t.id)} style={{ flex: 1, padding: '6px 0', borderRadius: '8px', border: 'none', background: '#10b981', color: 'white', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}>Manter</button>
                  <button onClick={() => { clearDraft(); setFormData(INITIAL_FORM); setPesoAlvoEditadoManualmente(false); setPesoCarcacaEditadoManualmente(false); toast.dismiss(t.id); }} style={{ flex: 1, padding: '6px 0', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>Descartar</button>
                </div>
              </div>
            ), { id: 'draft-restore-lot', duration: 8000, style: { maxWidth: '320px', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 20px 40px rgba(0,0,0,0.12)' } });
            return;
          }
        }
      } catch { /* corrompido */ }
    }
    setFormData(INITIAL_FORM);
    setPesoAlvoEditadoManualmente(false);
    setPesoCarcacaEditadoManualmente(false);
    setDuplicateNome(false);
    setAnimaisAtuais(null);
  }, [isOpen, initialData, draftKey]);

  useEffect(() => { if (isOpen && activeTenantId) fetchFazendas(); }, [isOpen, activeTenantId]);
  useEffect(() => { if (formData.fazenda_id) fetchPastos(formData.fazenda_id); else setPastos([]); }, [formData.fazenda_id]);

  const fetchFazendas = async () => {
    if (!activeTenantId) return;
    setLoadingFazendas(true);
    try {
      const { data, error } = await supabase.from('fazendas').select('id, nome').eq('tenant_id', activeTenantId).order('nome');
      if (error) throw error;
      setFazendas(data || []);
    } catch (err) { console.error('[LotForm] Erro ao buscar fazendas:', err); }
    finally { setLoadingFazendas(false); }
  };

  const fetchPastos = async (fazendaId: string) => {
    setLoadingPastos(true);
    try {
      const { data } = await supabase.from('pastos').select('id, nome').eq('tenant_id', activeTenantId).eq('fazenda_id', fazendaId).order('nome');
      setPastos(data || []);
    } finally { setLoadingPastos(false); }
  };

  const fetchAnimaisCount = async (loteId: string) => {
    if (!activeTenantId) return;
    try {
      const { count } = await supabase.from('animais').select('id', { count: 'exact', head: true }).eq('tenant_id', activeTenantId).eq('lote_id', loteId);
      setAnimaisAtuais(count ?? 0);
    } catch { setAnimaisAtuais(null); }
  };

  const handleDiasCicloChange = (dias: string) => {
    setFormData((prev) => {
      if (!dias) return { ...prev, dias_ciclo: '', data_fim_prevista: '' };
      const d = parseInt(dias);
      if (isNaN(d) || d <= 0) return prev;
      const dataInicio = new Date(prev.data_inicio);
      dataInicio.setDate(dataInicio.getDate() + d);
      return { ...prev, dias_ciclo: dias, data_fim_prevista: dataInicio.toLocaleDateString('en-CA') };
    });
  };

  const handleDataFimChange = (dataStr: string) => {
    setFormData((prev) => {
      if (!dataStr) return { ...prev, data_fim_prevista: '', dias_ciclo: '' };
      const diffDays = Math.ceil((new Date(dataStr).getTime() - new Date(prev.data_inicio).getTime()) / (1000 * 60 * 60 * 24));
      return { ...prev, data_fim_prevista: dataStr, dias_ciclo: diffDays > 0 ? diffDays.toString() : '' };
    });
  };

  useEffect(() => {
    if (pesoAlvoEditadoManualmente) return;
    const d = parseInt(formData.dias_ciclo), gmd = parseFloat(formData.gmd_alvo), pe = parseFloat(formData.peso_entrada);
    if (!isNaN(d) && !isNaN(gmd) && !isNaN(pe) && d > 0 && gmd > 0 && pe > 0) {
      const p = (pe + d * gmd).toFixed(0);
      if (p !== formData.peso_alvo) setFormData((prev) => ({ ...prev, peso_alvo: p }));
    }
  }, [formData.dias_ciclo, formData.gmd_alvo, formData.peso_entrada, pesoAlvoEditadoManualmente]);

  useEffect(() => {
    if (pesoCarcacaEditadoManualmente) return;
    const pa = parseFloat(formData.peso_alvo), rend = parseFloat(formData.meta_rendimento_carcaca);
    if (!isNaN(pa) && !isNaN(rend) && pa > 0 && rend > 0) {
      const arr = ((pa * rend) / 100 / 15).toFixed(1);
      if (arr !== formData.peso_carcaca_alvo) setFormData((prev) => ({ ...prev, peso_carcaca_alvo: arr }));
    }
  }, [formData.peso_alvo, formData.meta_rendimento_carcaca, pesoCarcacaEditadoManualmente]);

  const handleNomeBlur = async () => {
    if (!formData.nome?.trim() || !activeTenantId) return;
    try {
      let q = supabase.from('lotes').select('id').eq('tenant_id', activeTenantId).ilike('nome', formData.nome.trim());
      if (initialData?.id) q = q.neq('id', initialData.id);
      const { data } = await q.limit(1);
      setDuplicateNome(!!(data && data.length > 0));
    } catch { /* silent */ }
  };

  const custoTotal = useMemo(() => {
    const d = parseFloat(formData.dias_ciclo), c = parseFloat(formData.custo_diario);
    return (!isNaN(d) && !isNaN(c) && d > 0 && c > 0) ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(d * c) : null;
  }, [formData.dias_ciclo, formData.custo_diario]);

  const capacidadeWarning = useMemo(() => {
    if (animaisAtuais === null || !formData.capacidade) return null;
    const cap = parseInt(formData.capacidade);
    return (!isNaN(cap) && cap < animaisAtuais) ? `⚠ Capacidade menor que os ${animaisAtuais} animais atuais no lote` : null;
  }, [formData.capacidade, animaisAtuais]);

  // Auto-calcular custo_por_cabeca a partir do total e quantidade
  useEffect(() => {
    const total = parseFloat(formData.custo_total_aquisicao);
    const qtd   = parseInt(formData.quantidade_nota);
    if (!isNaN(total) && !isNaN(qtd) && total > 0 && qtd > 0) {
      const ppc = (total / qtd).toFixed(2);
      if (ppc !== formData.custo_por_cabeca) setFormData((prev) => ({ ...prev, custo_por_cabeca: ppc }));
    }
  }, [formData.custo_total_aquisicao, formData.quantidade_nota]); // eslint-disable-line react-hooks/exhaustive-deps

  const sectionProgress = useMemo(() => ({
    s1: !!(formData.nome && formData.finalidade),
    s2: !!(formData.fazenda_id && formData.data_inicio),
    s3: !!(formData.regime_alimentar || formData.programa_bonificacao),
    s4: !!(formData.peso_entrada && formData.gmd_alvo),
    s5: formData.status !== 'PENDENTE' || !!(formData.data_limite && formData.quantidade_nota),
  }), [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (duplicateNome) { toast.error('Já existe um lote com este nome. Escolha um nome diferente.'); return; }
    if (formData.status === 'PENDENTE' && !formData.data_limite) {
      showValidationAlert('Informe o prazo limite (SLA) para o lote pendente.');
      return;
    }

    // Validação de Regras de Negócio via Zod
    const parsed = lotSchema.safeParse(formData);
    if (!parsed.success) {
      showValidationAlert(parsed.error); // Evita toast duplicado
      return;
    }

    setLoading(true);
    try { await onSubmit(formData); clearDraft(); toast.dismiss('draft-restore-lot'); }
    finally { setLoading(false); }
  };

  const autoBadge = (show: boolean, manual: boolean, onReset: () => void) =>
    show && !manual ? (
      <span style={{ padding: '2px 8px', fontSize: '10px', background: 'hsl(var(--brand)/0.1)', color: 'hsl(var(--brand))', borderRadius: '4px', fontWeight: 800 }}>Auto-Calculado</span>
    ) : manual ? (
      <span style={{ padding: '2px 8px', fontSize: '10px', background: 'rgba(16,185,129,0.1)', color: '#10b981', borderRadius: '4px', fontWeight: 800, cursor: 'pointer' }} onClick={onReset} title="Clique para voltar ao automático">Manual ↺</span>
    ) : null;

  return (
    <SidePanel isOpen={isOpen} onClose={onClose} onCancel={() => { clearDraft(); toast.dismiss('draft-restore-lot'); onClose(); }} onSubmit={handleSubmit} title={initialData ? 'Editar Lote' : 'Novo Lote'} subtitle="Organize seus animais em lotes para melhor gestão." icon={Layers} loading={loading} submitLabel={initialData ? 'Salvar Alterações' : 'Criar Lote'} size="large">

      {/* PASSO 01 — INFORMAÇÕES BÁSICAS */}
      <section className="tauze-form-section">
        <SectionBadge step="PASSO 01" label="Informações Básicas" complete={sectionProgress.s1} />
        <div className="tauze-input-grid grid-col-3">
          <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
            <label className="tauze-label"><Layers size={14} /> Nome do Lote</label>
            <input className={`tauze-input${duplicateNome ? ' tauze-input-error' : ''}`} type="text" placeholder="Ex: LOTE-ENGORDA-01" value={formData.nome} onChange={(e) => { setFormData({ ...formData, nome: e.target.value.toUpperCase() }); if (duplicateNome) setDuplicateNome(false); }} onBlur={handleNomeBlur} required />
            {duplicateNome && <span className="tauze-field-error">⚠ Nome já existe — escolha um nome diferente</span>}
          </div>
          <ColorPicker value={formData.cor} onChange={(val) => setFormData({ ...formData, cor: val })} />
        </div>
        <div className="tauze-input-grid grid-col-3">
          <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
            <label className="tauze-label"><Tag size={14} /> Finalidade do Lote</label>
            <SearchableSelect value={formData.finalidade} onChange={(val: any) => setFormData({ ...formData, finalidade: val })} options={[{ value: '', label: 'Selecione a finalidade...' }, { value: 'Recria', label: 'Recria' }, { value: 'Engorda', label: 'Engorda' }, { value: 'Cria', label: 'Cria' }, { value: 'Cria e Recria', label: 'Cria e Recria' }, { value: 'Confinamento', label: 'Confinamento' }, { value: 'Pastejo Rotacionado', label: 'Pastejo Rotacionado' }, { value: 'Reprodução', label: 'Reprodução' }, { value: 'Descarte', label: 'Descarte' }, { value: 'Manejo Geral', label: 'Manejo Geral' }]} />
          </div>
          <div className="tauze-field-group">
            <label className="tauze-label"><Activity size={14} /> Status</label>
            <div className="tauze-form-radio-group" style={{ gridTemplateColumns: '1fr', gap: '6px' }}>
              {[
                { value: 'ATIVO',      label: '● Ativo' },
                { value: 'PENDENTE',   label: '⏳ Pendente (Aguardando NF)' },
                { value: 'FINALIZADO', label: '■ Finalizado' },
              ].map(({ value, label }) => (
                <div
                  key={value}
                  className={`tauze-form-radio-item${formData.status === value ? ' active' : ''}`}
                  style={{
                    padding: '10px 12px',
                    justifyContent: 'flex-start',
                    fontSize: '12px',
                    ...(value === 'PENDENTE' && formData.status === 'PENDENTE'
                      ? { borderColor: '#f59e0b', background: 'rgba(245,158,11,0.08)', color: '#f59e0b' }
                      : {}),
                  }}
                  onClick={() => setFormData({ ...formData, status: value })}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PASSO 02 — PLANEJAMENTO & DESTINO */}
      <section className="tauze-form-section">
        <SectionBadge step="PASSO 02" label="Planejamento & Destino" complete={sectionProgress.s2} />
        <div className="tauze-input-grid grid-col-3">
          <div className="tauze-field-group">
            <label className="tauze-label"><Building2 size={14} /> Fazenda de Destino</label>
            <SearchableSelect value={formData.fazenda_id} onChange={(val: any) => setFormData({ ...formData, fazenda_id: val, pasto_id: '' })} disabled={loadingFazendas} options={[{ value: '', label: loadingFazendas ? 'Carregando fazendas...' : 'Selecionar Fazenda...' }, ...fazendas.map((f) => ({ value: String(f.id), label: f.nome }))]} />
          </div>
          <div className="tauze-field-group">
            <label className="tauze-label"><MapPin size={14} /> Pasto Inicial (Opcional)</label>
            <SearchableSelect value={formData.pasto_id} onChange={(val: any) => setFormData({ ...formData, pasto_id: val })} disabled={!formData.fazenda_id || loadingPastos} options={[{ value: '', label: !formData.fazenda_id ? 'Selecione a fazenda' : loadingPastos ? 'Carregando pastos...' : 'Lote de Confinamento / Sem Pasto' }, ...pastos.map((p) => ({ value: String(p.id), label: p.nome }))]} />
          </div>
          <div className="tauze-field-group">
            <label className="tauze-label"><Calendar size={14} /> Data de Início</label>
            <DateInput className="tauze-input" type="date" value={formData.data_inicio} onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })} required />
          </div>
        </div>
        <div className="tauze-input-grid grid-col-2">
          <div className="tauze-field-group">
            <label className="tauze-label"><Clock size={14} /> Ciclo Estimado</label>
            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '8px' }}>
              <div style={{ position: 'relative' }}>
                <input className="tauze-input" type="number" min="1" placeholder="0" title="Duração em Dias" value={formData.dias_ciclo} onChange={(e) => handleDiasCicloChange(e.target.value)} style={{ paddingRight: '38px' }} />
                <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '10px', fontWeight: 700, color: 'hsl(var(--text-muted))', pointerEvents: 'none' }}>dias</span>
              </div>
              <DateInput className="tauze-input" type="date" title="Data de Término" value={formData.data_fim_prevista} onChange={(e) => handleDataFimChange(e.target.value)} />
            </div>
          </div>
        </div>
      </section>

      {/* PASSO 03 — REGRAS E RESTRIÇÕES */}
      <section className="tauze-form-section">
        <SectionBadge step="PASSO 03" label="Regras e Restrições" complete={sectionProgress.s3} />
        <div className="tauze-input-grid grid-col-3">
          <div className="tauze-field-group">
            <label className="tauze-label"><ShieldCheck size={14} /> Sexo Permitido</label>
            <SearchableSelect value={formData.sexo_permitido} onChange={(val: any) => setFormData({ ...formData, sexo_permitido: val })} options={[{ value: 'MISTO', label: 'Misto (Qualquer Sexo)' }, { value: 'MACHO', label: 'Apenas Machos' }, { value: 'FEMEA', label: 'Apenas Fêmeas' }]} />
          </div>
          <div className="tauze-field-group">
            <label className="tauze-label"><Activity size={14} /> Regime Alimentar</label>
            <SearchableSelect value={formData.regime_alimentar} onChange={(val: any) => setFormData({ ...formData, regime_alimentar: val })} options={[{ value: '', label: 'Não especificado' }, { value: 'PASTO', label: 'A Pasto' }, { value: 'SEMI-CONFINAMENTO', label: 'Semi-confinamento / Suplementado' }, { value: 'CONFINAMENTO', label: 'Confinamento (Intensivo)' }, { value: 'CREEP-FEEDING', label: 'Creep-feeding (Bezerros)' }]} />
          </div>
          <div className="tauze-field-group">
            <label className="tauze-label"><CheckCircle2 size={14} /> Programa de Qualidade</label>
            <SearchableSelect value={formData.programa_bonificacao} onChange={(val: any) => setFormData({ ...formData, programa_bonificacao: val })} options={[{ value: '', label: 'Nenhum / Padrão' }, { value: 'COTA_HILTON', label: 'Cota Hilton' }, { value: 'ANGUS_CERTIFICADO', label: 'Carne Angus Certificada' }, { value: 'PRECOCE_MS', label: 'Precoce MS' }, { value: 'BOI_EUROPA', label: 'Boi Europa (Trace)' }]} />
          </div>
        </div>
        <div className="tauze-field-group">
          <label className="tauze-label"><Fingerprint size={14} /> Rastreabilidade</label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: formData.exige_rastreabilidade ? 'hsl(var(--brand)/0.08)' : 'hsl(var(--bg-main))', border: `1px solid ${formData.exige_rastreabilidade ? 'hsl(var(--brand)/0.3)' : 'hsl(var(--border))'}`, borderRadius: '14px', cursor: 'pointer', transition: 'all 0.2s' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: formData.exige_rastreabilidade ? 'hsl(var(--brand))' : 'hsl(var(--text-main))' }}>Exigir SISBOV / Eletrônico</span>
              <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>Bloqueia a entrada de animais sem brinco eletrônico neste lote</span>
            </div>
            <div style={{ width: '36px', height: '20px', borderRadius: '20px', background: formData.exige_rastreabilidade ? 'hsl(var(--brand))' : 'hsl(var(--border))', position: 'relative', transition: 'all 0.2s', flexShrink: 0 }}>
              <div style={{ width: '16px', height: '16px', background: 'white', borderRadius: '50%', position: 'absolute', top: '2px', left: formData.exige_rastreabilidade ? '18px' : '2px', transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }} />
            </div>
            <input type="checkbox" style={{ display: 'none' }} checked={formData.exige_rastreabilidade} onChange={(e) => setFormData({ ...formData, exige_rastreabilidade: e.target.checked })} />
          </label>
        </div>
      </section>

      {/* PASSO 04 — METAS ZOOTÉCNICAS & CAPACIDADE */}
      <section className="tauze-form-section">
        <SectionBadge step="PASSO 04" label="Metas Zootécnicas & Capacidade" complete={sectionProgress.s4} />
        <div className="tauze-input-grid grid-col-3">
          <div className="tauze-field-group">
            <label className="tauze-label"><Scale size={14} /> Peso de Entrada (kg)</label>
            <input className="tauze-input" type="number" placeholder="Ex: 300" value={formData.peso_entrada} onChange={(e) => setFormData({ ...formData, peso_entrada: e.target.value })} />
          </div>
          <div className="tauze-field-group">
            <label className="tauze-label"><TrendingUp size={14} /> GMD Alvo (kg/dia)</label>
            <input className="tauze-input" type="number" step="0.001" placeholder="Ex: 1.200" value={formData.gmd_alvo} onChange={(e) => setFormData({ ...formData, gmd_alvo: e.target.value })} />
          </div>
          <div className="tauze-field-group">
            <label className="tauze-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span><TrendingUp size={14} /> Peso Saída Alvo (kg)</span>
              {autoBadge(!!(formData.dias_ciclo && formData.gmd_alvo && formData.peso_entrada), pesoAlvoEditadoManualmente, () => setPesoAlvoEditadoManualmente(false))}
            </label>
            <input className="tauze-input" type="number" placeholder="Ex: 420" value={formData.peso_alvo} onChange={(e) => { setPesoAlvoEditadoManualmente(true); setFormData({ ...formData, peso_alvo: e.target.value }); }} />
          </div>
        </div>
        <div className="tauze-input-grid grid-col-3">
          <div className="tauze-field-group">
            <label className="tauze-label"><TrendingUp size={14} /> Meta de Rendimento (%)</label>
            <input className="tauze-input" type="number" step="0.1" placeholder="Ex: 54.5" value={formData.meta_rendimento_carcaca} onChange={(e) => setFormData({ ...formData, meta_rendimento_carcaca: e.target.value })} />
          </div>
          <div className="tauze-field-group">
            <label className="tauze-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span><Scale size={14} /> Peso de Carcaça (@)</span>
              {autoBadge(!!(formData.peso_alvo && formData.meta_rendimento_carcaca), pesoCarcacaEditadoManualmente, () => setPesoCarcacaEditadoManualmente(false))}
            </label>
            <input className="tauze-input" type="number" step="0.1" placeholder="Ex: 15.0" value={formData.peso_carcaca_alvo} onChange={(e) => { setPesoCarcacaEditadoManualmente(true); setFormData({ ...formData, peso_carcaca_alvo: e.target.value }); }} />
          </div>
          <div className="tauze-field-group">
            <label className="tauze-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span><Users size={14} /> Capacidade (Cab.)</span>
              {animaisAtuais !== null && <span style={{ fontSize: '10px', color: 'hsl(var(--text-muted))', fontWeight: 600 }}>{animaisAtuais} no lote</span>}
            </label>
            <input className={`tauze-input${capacidadeWarning ? ' tauze-input-error' : ''}`} type="number" placeholder="Qtd. máxima" value={formData.capacidade} onChange={(e) => setFormData({ ...formData, capacidade: e.target.value })} />
            {capacidadeWarning && <span className="tauze-field-error">{capacidadeWarning}</span>}
          </div>
        </div>
        <div className="tauze-input-grid grid-col-3">
          <div className="tauze-field-group">
            <label className="tauze-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span><DollarSign size={14} /> Custo Diário Est. (R$/cab)</span>
              {custoTotal && <span style={{ padding: '2px 8px', fontSize: '10px', background: 'rgba(16,185,129,0.1)', color: '#10b981', borderRadius: '4px', fontWeight: 800 }}>Total: {custoTotal}</span>}
            </label>
            <input className="tauze-input" type="number" step="0.01" placeholder="Ex: 15.50" value={formData.custo_diario} onChange={(e) => setFormData({ ...formData, custo_diario: e.target.value })} />
          </div>
        </div>
      </section>

      {/* Smart Card */}
      {(formData.peso_entrada || formData.dias_ciclo || formData.custo_diario) && (
        <div style={{ marginTop: '24px', padding: '20px', borderRadius: '16px', background: 'linear-gradient(135deg, hsl(var(--brand)/0.08) 0%, hsl(var(--brand)/0.02) 100%)', border: '1px solid hsl(var(--brand)/0.15)', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <div style={{ background: 'white', padding: '10px', borderRadius: '12px', color: 'hsl(var(--brand))', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', flexShrink: 0 }}><Lightbulb size={22} /></div>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: 800, color: 'hsl(var(--brand))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estratégia do Lote</h4>
            <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.6, color: 'hsl(var(--text-main))' }}>
              O animal entrará com <strong>{formData.peso_entrada ? `${formData.peso_entrada}kg` : '___kg'}</strong>, ficará <strong>{formData.dias_ciclo ? `${formData.dias_ciclo} dias` : '___ dias'}</strong>{formData.gmd_alvo ? ` ganhando ${formData.gmd_alvo}kg/dia` : ''}, e sairá com <strong style={{ color: 'hsl(var(--brand))' }}>{formData.peso_alvo ? `${formData.peso_alvo}kg` : '___kg'}</strong>{formData.peso_carcaca_alvo ? ` (≈ ${formData.peso_carcaca_alvo}@)` : ''}.{formData.dias_ciclo && formData.custo_diario ? <> Ao custo projetado de <strong style={{ color: '#10b981' }}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(formData.dias_ciclo) * parseFloat(formData.custo_diario))} por animal</strong>.</> : ''}
            </p>
          </div>
        </div>
      )}

      {/* PASSO 05 — NOTA FISCAL (apenas para PENDENTE) */}
      {formData.status === 'PENDENTE' && (
        <section className="tauze-form-section" style={{ borderTop: '2px solid rgba(245,158,11,0.3)', paddingTop: 20, marginTop: 8 }}>
          <SectionBadge step="PASSO 05" label="Nota Fiscal de Entrada" complete={sectionProgress.s5} />

          {/* Banner informativo */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 12, marginBottom: 20 }}>
            <AlertTriangle size={18} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: 'hsl(var(--text-muted))', lineHeight: 1.6 }}>
              Este lote ficará <strong style={{ color: '#f59e0b' }}>PENDENTE</strong> até ser processado via <strong>Processar Lote</strong>.
              Preencha os dados da NF para facilitar a conferência no recebimento.
            </p>
          </div>

          <div className="tauze-input-grid grid-col-3">
            <div className="tauze-field-group">
              <label className="tauze-label"><FileText size={14} /> Número da NF</label>
              <input
                className="tauze-input"
                type="text"
                placeholder="Ex: NF-4589"
                value={formData.nf_numero}
                onChange={(e) => setFormData({ ...formData, nf_numero: e.target.value })}
              />
            </div>
            <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
              <label className="tauze-label"><Building2 size={14} /> Fornecedor / Origem</label>
              <input
                className="tauze-input"
                type="text"
                placeholder="Ex: Fazenda Santa Rita"
                value={formData.fornecedor}
                onChange={(e) => setFormData({ ...formData, fornecedor: e.target.value })}
              />
            </div>
          </div>

          <div className="tauze-input-grid grid-col-3">
            <div className="tauze-field-group">
              <label className="tauze-label"><Calendar size={14} /> Prazo Limite (SLA) <span style={{ color: '#ef4444' }}>*</span></label>
              <DateInput
                className={`tauze-input${formData.status === 'PENDENTE' && !formData.data_limite ? ' tauze-input-error' : ''}`}
                type="date"
                value={formData.data_limite}
                onChange={(e) => setFormData({ ...formData, data_limite: e.target.value })}
              />
              {formData.status === 'PENDENTE' && !formData.data_limite && (
                <span className="tauze-field-error">Prazo obrigatório para lotes PENDENTE</span>
              )}
            </div>
            <div className="tauze-field-group">
              <label className="tauze-label"><Package size={14} /> Qtd. de Animais (NF)</label>
              <input
                className="tauze-input"
                type="number"
                min="1"
                placeholder="Ex: 60"
                value={formData.quantidade_nota}
                onChange={(e) => setFormData({ ...formData, quantidade_nota: e.target.value })}
              />
            </div>
            <div className="tauze-field-group">
              <label className="tauze-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span><DollarSign size={14} /> Valor Total NF (R$)</span>
              </label>
              <input
                className="tauze-input"
                type="number"
                step="0.01"
                placeholder="Ex: 90000.00"
                value={formData.custo_total_aquisicao}
                onChange={(e) => setFormData({ ...formData, custo_total_aquisicao: e.target.value })}
              />
            </div>
          </div>

          {/* Custo/cabça auto-calculado */}
          {formData.custo_por_cabeca && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10 }}>
              <Truck size={15} style={{ color: '#10b981', flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'hsl(var(--text-main))' }}>
                Custo por Cabeça (auto):{' '}
                <strong style={{ color: '#10b981' }}>
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(formData.custo_por_cabeca))}
                </strong>
              </span>
            </div>
          )}
        </section>
      )}
    </SidePanel>
  );
};
