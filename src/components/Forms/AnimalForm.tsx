import React, { useState, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';

import {
  Beef,
  Hash,
  Calendar,
  Tag,
  Info,
  Users,
  DollarSign,
  Building2,
  MapPin,
  Award,
  CircleDot,
  Scale,
  Activity,
  Home,
  ShoppingCart,
  Gift,
  FileText,
  User2,
} from 'lucide-react';
import { SidePanel } from '../Layout/SidePanel';
import { SearchableSelect } from './SearchableSelect';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { DateInput } from '../../components/Form/DateInput';

// ─── RFID Formatter ──────────────────────────────────────────────────────────
const formatRFID = (value: string) => {
  if (!value) return '';
  const digits = value.replace(/\D/g, '');
  const limited = digits.slice(0, 15);
  let formatted = '';
  if (limited.length > 0) formatted += limited.substring(0, 3);
  if (limited.length > 3) formatted += ` ${limited.substring(3, 7)}`;
  if (limited.length > 7) formatted += ` ${limited.substring(7, 11)}`;
  if (limited.length > 11) formatted += ` ${limited.substring(11, 15)}`;
  return formatted;
};

// ─── Initial State ────────────────────────────────────────────────────────────
// FIX #1 — moved to a constant so the form is always cleanly reset on open
const INITIAL_FORM = {
  brinco: '',
  brinco_eletronico: '076',
  nome: '',                 // Nome/apelido do animal (opcional)
  raca: '',
  sexo: 'M',
  data_nascimento: '',
  idade_meses: '',
  fazenda_id: '',
  lote_id: '',
  pasto_id: '',
  status: 'Ativo',
  peso_inicial: '',
  pelagem: '',
  origem: 'Nascido',
  // Nascido na Fazenda
  mae_brinco: '',
  pai_brinco: '',
  // Comprado
  fornecedor: '',
  nota_fiscal: '',
  valor_compra: '',
  // Doação
  doador: '',
  // Zootécnica
  categoria: '',
  finalidade: 'Corte',
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface AnimalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  loading?: boolean;
  /** @deprecated — mantido por compatibilidade com chamadores existentes */
  actionId?: number;
}

// ─── Section Badge with progress indicator ───────────────────────────────────
const SectionBadge = ({
  step,
  label,
  complete,
}: {
  step: string;
  label: string;
  complete: boolean;
}) => (
  <div className="tauze-section-header">
    <div
      className="tauze-section-badge"
      style={
        complete
          ? { background: 'rgba(16,185,129,0.15)', color: '#10b981', transition: 'all 0.3s' }
          : { transition: 'all 0.3s' }
      }
    >
      {complete ? '✓' : step}
    </div>
    <h4 className="tauze-section-title">{label}</h4>
  </div>
);

// ─── Component ────────────────────────────────────────────────────────────────
export const AnimalForm: React.FC<AnimalFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  loading: externalLoading,
}) => {
  // FIX #1 — useState simples (sem persistência entre sessões)
  const [formData, setFormData] = useState(INITIAL_FORM);

  // FIX #4 — flag que protege a categoria de ser sobrescrita pelo auto-suggest
  const [categoriaEditadaManualmente, setCategoriaEditadaManualmente] = useState(false);

  // FIX #5 — estado de validação de brinco duplicado
  const [duplicateBrinco, setDuplicateBrinco] = useState(false);

  const { activeTenantId } = useTenant();
  const [fazendas, setFazendas] = useState<any[]>([]);
  const [pastos, setPastos] = useState<any[]>([]);
  const [lotes, setLotes] = useState<any[]>([]);
  const [racas, setRacas] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingFazendas, setLoadingFazendas] = useState(false);
  const [loadingPastos, setLoadingPastos] = useState(false);
  const [loadingLotes, setLoadingLotes] = useState(false);

  // ── Sistema de Draft — chave dinâmica por tenant + contexto ─────────────────
  // Garante que cada contexto (novo cadastro vs edição de animal específico)
  // tenha seu próprio rascunho isolado, sem vazamento entre registros ou tenants.
  const draftKey = useMemo(() => {
    if (!activeTenantId) return null;
    return initialData?.id
      ? `draft_animal_${activeTenantId}_edit_${initialData.id}`
      : `draft_animal_${activeTenantId}_new`;
  }, [activeTenantId, initialData?.id]);

  const clearDraft = useCallback(() => {
    if (draftKey) sessionStorage.removeItem(draftKey);
  }, [draftKey]);

  // Auto-save: persiste o rascunho no sessionStorage com debounce de 800ms
  // Isso garante que navegar para outra tela e voltar restaura o progresso
  React.useEffect(() => {
    if (!draftKey || !isOpen) return;
    const timeout = setTimeout(() => {
      const hasData = formData.brinco || formData.raca || formData.peso_inicial ||
        formData.nome || formData.fazenda_id || formData.mae_brinco ||
        formData.fornecedor || formData.valor_compra || formData.doador;
      if (hasData) {
        sessionStorage.setItem(
          draftKey,
          JSON.stringify({ data: formData, savedAt: new Date().toISOString() }),
        );
      }
    }, 800);
    return () => clearTimeout(timeout);
  }, [formData, draftKey, isOpen]);

  // ── Reset + Draft Restore baseado em isOpen ───────────────────────────────
  React.useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      // ── EDICAO: sempre carregar dados do banco, nunca do draft
      setFormData({
        brinco: initialData.brinco || '',
        brinco_eletronico: initialData.brinco_eletronico
          ? formatRFID(initialData.brinco_eletronico)
          : '076',
        nome: initialData.nome || '',
        raca: initialData.raca || '',
        sexo: initialData.sexo || 'M',
        data_nascimento: initialData.data_nascimento || '',
        idade_meses: initialData.idade_meses || '',
        fazenda_id: initialData.fazenda_id || '',
        lote_id: initialData.lote_id || '',
        pasto_id: initialData.pasto_id || '',
        status: initialData.status || 'Ativo',
        peso_inicial: initialData.peso_inicial
          ? initialData.peso_inicial.toString().replace(/[^\d.-]/g, '')
          : '',
        pelagem: initialData.pelagem || '',
        origem: initialData.origem || 'Nascido',
        mae_brinco: initialData.mae_brinco || '',
        pai_brinco: initialData.pai_brinco || '',
        fornecedor: initialData.fornecedor || '',
        nota_fiscal: initialData.nota_fiscal || '',
        valor_compra: initialData.valor_compra
          ? initialData.valor_compra.toString().replace(/[^\d.-]/g, '')
          : '',
        doador: initialData.doador || '',
        categoria: initialData.categoria || '',
        finalidade: initialData.finalidade || 'Corte',
      });
      setCategoriaEditadaManualmente(true);
      setDuplicateBrinco(false);
      return;
    }

    // ── NOVO CADASTRO: verificar se existe rascunho salvo ────────────────────
    if (draftKey) {
      try {
        const raw = sessionStorage.getItem(draftKey);
        if (raw) {
          const { data: draftData, savedAt } = JSON.parse(raw);
          const minutesAgo = Math.round(
            (Date.now() - new Date(savedAt).getTime()) / 60_000,
          );
          const hasData =
            draftData.brinco || draftData.raca || draftData.peso_inicial ||
            draftData.nome || draftData.fazenda_id;

          if (hasData) {
            // Restaurar o rascunho imediatamente e mostrar toast de controle
            setFormData(draftData);
            setCategoriaEditadaManualmente(false);
            setDuplicateBrinco(false);

            const label = minutesAgo < 1
              ? 'agora mesmo'
              : minutesAgo === 1
                ? 'há 1 minuto'
                : `há ${minutesAgo} minutos`;

            toast(
              (t) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>📋</span>
                    <div>
                      <p style={{ fontWeight: 800, fontSize: '13px', margin: 0, color: '#1e293b' }}>
                        Rascunho restaurado
                      </p>
                      <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>
                        Você tinha campos preenchidos ({label})
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => toast.dismiss(t.id)}
                      style={{
                        flex: 1, padding: '6px 0', borderRadius: '8px', border: 'none',
                        background: '#10b981', color: 'white', fontWeight: 800,
                        fontSize: '12px', cursor: 'pointer',
                      }}
                    >
                      Manter
                    </button>
                    <button
                      onClick={() => {
                        clearDraft();
                        setFormData(INITIAL_FORM);
                        setCategoriaEditadaManualmente(false);
                        toast.dismiss(t.id);
                      }}
                      style={{
                        flex: 1, padding: '6px 0', borderRadius: '8px',
                        border: '1px solid #e2e8f0', background: 'white',
                        color: '#64748b', fontWeight: 700, fontSize: '12px', cursor: 'pointer',
                      }}
                    >
                      Descartar
                    </button>
                  </div>
                </div>
              ),
              {
                id: 'draft-restore-animal',
                duration: 8000,
                style: {
                  maxWidth: '320px',
                  padding: '16px',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
                },
              },
            );
            return;
          }
        }
      } catch {
        // sessionStorage corrompido — continuar com form limpo
      }
    }

    // Sem rascunho: iniciar form limpo
    setFormData(INITIAL_FORM);
    setCategoriaEditadaManualmente(false);
    setDuplicateBrinco(false);
  }, [isOpen, initialData, draftKey]);

  // ── Carregar dados ao abrir ────────────────────────────────────────────────
  React.useEffect(() => {
    if (isOpen && activeTenantId) {
      fetchFazendas();
      fetchRacas();
      fetchCategorias();
    }
  }, [isOpen, activeTenantId]);

  // ── Carregar pastos/lotes ao selecionar fazenda ───────────────────────────
  React.useEffect(() => {
    if (formData.fazenda_id) {
      fetchPastos(formData.fazenda_id);
      fetchLotes(formData.fazenda_id);
    } else {
      setPastos([]);
      setLotes([]);
    }
  }, [formData.fazenda_id]);

  // ── Data Fetchers ─────────────────────────────────────────────────────────
  const fetchFazendas = async () => {
    if (!activeTenantId) return;
    setLoadingFazendas(true);
    try {
      const { data, error } = await supabase
        .from('fazendas')
        .select('id, nome')
        .eq('tenant_id', activeTenantId)
        .order('nome');
      if (error) throw error;
      setFazendas(data || []);
    } catch (err) {
      console.error('[AnimalForm] Erro ao buscar fazendas:', err);
    } finally {
      setLoadingFazendas(false);
    }
  };

  const fetchPastos = async (fazendaId: string) => {
    setLoadingPastos(true);
    try {
      // FIX #7 — adicionar filtro tenant_id para evitar vazamento multi-tenant
      const { data } = await supabase
        .from('pastos')
        .select('id, nome')
        .eq('tenant_id', activeTenantId)
        .eq('fazenda_id', fazendaId)
        .order('nome');
      setPastos(data || []);
    } finally {
      setLoadingPastos(false);
    }
  };

  const fetchLotes = async (fazendaId: string) => {
    setLoadingLotes(true);
    try {
      const { data } = await supabase
        .from('lotes')
        .select('id, nome')
        .eq('fazenda_id', fazendaId)
        .order('nome');
      setLotes(data || []);
    } catch {
      setLotes([]);
    } finally {
      setLoadingLotes(false);
    }
  };

  const fetchRacas = async () => {
    if (!activeTenantId) return;
    const { data } = await supabase
      .from('categorias_sistema')
      .select('id, nome')
      .eq('tenant_id', activeTenantId)
      .eq('modulo', 'racas')
      .eq('is_active', true)
      .order('nome');
    if (data) setRacas(data);
  };

  const fetchCategorias = async () => {
    if (!activeTenantId) return;
    const { data } = await supabase
      .from('categorias_sistema')
      .select('id, nome')
      .eq('tenant_id', activeTenantId)
      .eq('modulo', 'pecuaria')
      .eq('is_active', true)
      .order('nome');
    if (data) setCategorias(data);
  };

  // ── UX: Sincronizar Data de Nascimento <-> Idade em Meses ────────────────
  const handleIdadeChange = (meses: string) => {
    setFormData((prev) => {
      if (!meses) return { ...prev, idade_meses: '', data_nascimento: '' };
      const m = parseInt(meses);
      if (isNaN(m)) return prev;
      const date = new Date();
      date.setMonth(date.getMonth() - m);
      return { ...prev, idade_meses: meses, data_nascimento: date.toISOString().split('T')[0] };
    });
  };

  const handleDataNascimentoChange = (dataStr: string) => {
    setFormData((prev) => {
      if (!dataStr) return { ...prev, data_nascimento: '', idade_meses: '' };
      const birth = new Date(dataStr);
      const now = new Date();
      let months = (now.getFullYear() - birth.getFullYear()) * 12;
      months -= birth.getMonth();
      months += now.getMonth();
      if (months < 0) months = 0;
      return { ...prev, data_nascimento: dataStr, idade_meses: months.toString() };
    });
  };

  // ── FIX #4: Auto-suggest de categoria — SOMENTE se não editado manualmente ─
  React.useEffect(() => {
    if (categoriaEditadaManualmente) return;
    if (!formData.data_nascimento && !formData.idade_meses) return;

    const months = parseInt(formData.idade_meses) || 0;
    let suggestedCat = '';

    if (formData.sexo === 'M') {
      if (months <= 12) suggestedCat = 'Bezerro';
      else if (months <= 24) suggestedCat = 'Garrote';
      else if (months <= 36) suggestedCat = 'Boi Magro';
      else suggestedCat = 'Boi Gordo';
    } else {
      if (months <= 12) suggestedCat = 'Bezerra';
      else if (months <= 24) suggestedCat = 'Novilha';
      else suggestedCat = 'Vaca';
    }

    if (suggestedCat && suggestedCat !== formData.categoria) {
      setFormData((prev) => ({ ...prev, categoria: suggestedCat }));
    }
  }, [formData.idade_meses, formData.sexo, categoriaEditadaManualmente]);

  // ── FIX #16: Criação de raça com toast informativo ────────────────────────
  const handleRacaChange = async (val: string) => {
    setFormData({ ...formData, raca: val });
    if (val && !racas.find((r) => r.nome === val)) {
      try {
        await supabase.from('categorias_sistema').insert({
          tenant_id: activeTenantId,
          modulo: 'racas',
          nome: val,
          is_active: true,
        });
        toast.success(`Raça "${val}" criada com sucesso.`);
        fetchRacas();
      } catch (e) {
        console.error('[AnimalForm] Erro ao criar raça:', e);
        toast.error('Erro ao salvar nova raça.');
      }
    }
  };

  // ── FIX #16: Criação de categoria com toast informativo + flag manual ──────
  const handleCategoriaChange = async (val: string) => {
    setCategoriaEditadaManualmente(true);
    setFormData({ ...formData, categoria: val });
    if (val && !categorias.find((c) => c.nome === val)) {
      try {
        await supabase.from('categorias_sistema').insert({
          tenant_id: activeTenantId,
          modulo: 'pecuaria',
          nome: val,
          is_active: true,
        });
        toast.success(`Categoria "${val}" criada com sucesso.`);
        fetchCategorias();
      } catch (e) {
        console.error('[AnimalForm] Erro ao criar categoria:', e);
        toast.error('Erro ao salvar nova categoria.');
      }
    }
  };

  // ── FIX #5: Validação de brinco duplicado no onBlur ──────────────────────
  const handleBrincoBlur = async () => {
    if (!formData.brinco?.trim() || !activeTenantId) return;
    try {
      let query = supabase
        .from('animais')
        .select('id')
        .eq('tenant_id', activeTenantId)
        .eq('brinco', formData.brinco.trim());

      // Em edição: excluir o próprio animal da verificação
      if (initialData?.id) {
        query = query.neq('id', initialData.id);
      }

      const { data } = await query.limit(1);
      setDuplicateBrinco(!!(data && data.length > 0));
    } catch {
      // Silently fail — não bloquear o usuário por erro de rede
    }
  };

  // ── Submit — limpa o draft ao salvar com sucesso ──────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (duplicateBrinco) {
      toast.error('Este brinco já está cadastrado. Verifique o número antes de continuar.');
      return;
    }
    setLoading(true);
    try {
      await onSubmit(formData);
      clearDraft(); // draft limpo apenas após sucesso
      toast.dismiss('draft-restore-animal');
    } finally {
      setLoading(false);
    }
  };

  // ── FIX #6: Cálculo correto — 1 arroba bovina = 15kg (peso vivo) ─────────
  const custoArroba = useMemo(() => {
    const valor = parseFloat(formData.valor_compra);
    const peso = parseFloat(formData.peso_inicial);
    if (!isNaN(valor) && !isNaN(peso) && peso > 0) {
      const arrobas = peso / 30; // Padrão CEPEA: 1@ = 30 kg (peso vivo comercial boi gordo)
      return (valor / arrobas).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
    return null;
  }, [formData.valor_compra, formData.peso_inicial]);

  // ── FIX #14: Progresso das seções ────────────────────────────────────────
  // CORREÇÃO: s3 não pode usar `origem` como critério — ela sempre tem valor default.
  // s3 é considerada completa apenas se o usuário preencheu algum campo relevante da origem.
  const sectionProgress = useMemo(() => {
    const s3Nascido =
      formData.origem === 'Nascido' && !!(formData.mae_brinco || formData.pai_brinco);
    const s3Comprado =
      formData.origem === 'Comprado' && !!(formData.fornecedor || formData.valor_compra);
    const s3Doacao = formData.origem === 'Doação' && !!formData.doador;

    return {
      s1: !!(formData.brinco && formData.sexo && formData.peso_inicial),
      s2: !!(formData.fazenda_id),
      s3: s3Nascido || s3Comprado || s3Doacao,
      s4: !!(formData.categoria && formData.finalidade),
    };
  }, [formData]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      onCancel={() => { clearDraft(); toast.dismiss('draft-restore-animal'); onClose(); }}
      onSubmit={handleSubmit}
      title={initialData ? 'Editar Animal' : 'Cadastrar Novo Animal'}
      subtitle="Insira as informações básicas para rastreabilidade."
      icon={Beef}
      loading={loading || externalLoading}
      submitLabel={initialData ? 'Salvar Alterações' : 'Salvar Animal'}
      size="large"
    >
      {/* ══════════════════════════════════════════════════════════════════
          PASSO 01 — IDENTIFICAÇÃO BÁSICA
      ══════════════════════════════════════════════════════════════════ */}
      <section className="tauze-form-section">
        <SectionBadge step="PASSO 01" label="Identificação Básica" complete={sectionProgress.s1} />

        {/* Row 1 — Brinco Visual (1 col) | Nome (1 col) | RFID (1 col) */}
        <div className="tauze-input-grid grid-col-3">
          <div className="tauze-field-group">
            <label className="tauze-label">
              <Hash size={14} /> Brinco Visual (Manejo)
            </label>
            <input
              className={`tauze-input${duplicateBrinco ? ' tauze-input-error' : ''}`}
              type="text"
              placeholder="Ex: 1234-A"
              value={formData.brinco}
              onChange={(e) => {
                setFormData({ ...formData, brinco: e.target.value.toUpperCase() });
                if (duplicateBrinco) setDuplicateBrinco(false);
              }}
              onBlur={handleBrincoBlur}
              required
            />
            {duplicateBrinco && (
              <span className="tauze-field-error">
                ⚠ Brinco já cadastrado — verifique o número
              </span>
            )}
          </div>

          {/* Nome/apelido do animal — opcional, muito útil para matrizes e reprodutores */}
          <div className="tauze-field-group">
            <label className="tauze-label">
              <Info size={14} /> Nome do Animal
              <span style={{ fontSize: '10px', color: 'hsl(var(--text-muted))', fontWeight: 500 }}>
                (Opcional)
              </span>
            </label>
            <input
              className="tauze-input"
              type="text"
              placeholder="Ex: Maverick, Estrela..."
              value={formData.nome}
              onChange={(e) =>
                setFormData({ ...formData, nome: e.target.value })
              }
            />
          </div>

          {/* RFID — 1 coluna igual às demais */}
          <div className="tauze-field-group">
            <label className="tauze-label">
              <CircleDot size={14} /> Brinco Eletrônico (RFID)
            </label>
            <div
              className="tauze-input"
              style={{ display: 'flex', alignItems: 'center', padding: '0 14px', position: 'relative' }}
            >
              {formData.brinco_eletronico.length <= 3 && (
                <span
                  style={{
                    color:
                      formData.brinco_eletronico.length > 0
                        ? 'inherit'
                        : 'hsl(var(--text-muted))',
                    opacity: formData.brinco_eletronico.length > 0 ? 1 : 0.6,
                    marginRight: '4px',
                    transition: 'all 0.2s',
                  }}
                >
                  Ex:
                </span>
              )}
              <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                <input
                  type="text"
                  value={formData.brinco_eletronico}
                  onChange={(e) =>
                    setFormData({ ...formData, brinco_eletronico: formatRFID(e.target.value) })
                  }
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    width: '100%',
                    position: 'relative',
                    zIndex: 2,
                    color: 'inherit',
                    padding: '9px 0',
                    fontSize: 'inherit',
                    fontFamily: 'inherit',
                    fontWeight: 'inherit',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 1,
                    color: 'hsl(var(--text-muted))',
                    pointerEvents: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    whiteSpace: 'pre',
                    opacity: 0.6,
                    fontWeight: 'inherit',
                  }}
                >
                  <span style={{ color: 'transparent' }}>{formData.brinco_eletronico}</span>
                  <span>{'076 0000 1234 5678'.substring(formData.brinco_eletronico.length)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Sexo | Nascimento+Idade | Status de Entrada */}
        <div className="tauze-input-grid grid-col-3">
          {/* FIX #9: Ícones ♂/♀ distintos */}
          <div
            className="tauze-field-group"
            style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}
          >
            <label className="tauze-label">
              <User2 size={14} /> Sexo
            </label>
            <div className="tauze-form-radio-group" style={{ height: '48px', marginTop: 0 }}>
              <div
                className={`tauze-form-radio-item ${formData.sexo === 'M' ? 'active-macho' : ''}`}
                style={{
                  height: '48px',
                  padding: 0,
                  boxSizing: 'border-box',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
                onClick={() => setFormData({ ...formData, sexo: 'M' })}
              >
                {/* FIX #9: símbolo ♂ distinto */}
                <span style={{ fontSize: '15px', lineHeight: 1 }}>♂</span>
                <span>Macho</span>
              </div>
              <div
                className={`tauze-form-radio-item ${formData.sexo === 'F' ? 'active-femea' : ''}`}
                style={{
                  height: '48px',
                  padding: 0,
                  boxSizing: 'border-box',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
                onClick={() => setFormData({ ...formData, sexo: 'F' })}
              >
                {/* FIX #9: símbolo ♀ distinto */}
                <span style={{ fontSize: '15px', lineHeight: 1 }}>♀</span>
                <span>Fêmea</span>
              </div>
            </div>
          </div>

          {/* FIX #10: sufixo "meses" explícito no campo de idade */}
          <div className="tauze-field-group">
            <label className="tauze-label">
              <Calendar size={14} /> Nascimento / Idade
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <DateInput
                className="tauze-input"
                style={{ flex: '2', minWidth: 0 }}
                type="date"
                title="Data de Nascimento"
                value={formData.data_nascimento}
                onChange={(e) => handleDataNascimentoChange(e.target.value)}
              />
              <div style={{ position: 'relative', flex: '0.8', minWidth: 0 }}>
                <input
                  className="tauze-input"
                  style={{ width: '100%', paddingRight: '52px' }}
                  type="number"
                  min="0"
                  placeholder="0"
                  title="Idade em Meses"
                  value={formData.idade_meses}
                  onChange={(e) => handleIdadeChange(e.target.value)}
                />
                <span
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '10px',
                    fontWeight: 700,
                    color: 'hsl(var(--text-muted))',
                    pointerEvents: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  meses
                </span>
              </div>
            </div>
          </div>

          {/* FIX #12: Campo Status de Entrada */}
          <div
            className="tauze-field-group"
            style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}
          >
            <label className="tauze-label">
              <Activity size={14} /> Status de Entrada
            </label>
            <div className="tauze-form-radio-group" style={{ height: '48px', marginTop: 0 }}>
              {(
                [
                  { value: 'Ativo', cls: 'active' },
                  { value: 'Quarentena', cls: 'active-manutencao' },
                ] as const
              ).map(({ value, cls }) => (
                <div
                  key={value}
                  className={`tauze-form-radio-item ${formData.status === value ? cls : ''}`}
                  style={{
                    height: '48px',
                    padding: 0,
                    boxSizing: 'border-box',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                  }}
                  onClick={() => setFormData({ ...formData, status: value })}
                >
                  {value}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Row 3: Raça | Pelagem | Peso de Entrada — FIX #11: peso movido para Passo 01 */}
        <div className="tauze-input-grid grid-col-3">
          <div className="tauze-field-group">
            <label className="tauze-label">
              <Tag size={14} /> Raça
            </label>
            <SearchableSelect
              value={formData.raca}
              onChange={handleRacaChange}
              options={[
                { value: '', label: 'Selecionar Raça...' },
                ...racas.map((r) => ({ value: r.nome, label: r.nome })),
              ]}
              creatable={true}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label">
              <Info size={14} /> Pelagem
            </label>
            <input
              className="tauze-input"
              type="text"
              placeholder="Ex: Branco, Manchado"
              value={formData.pelagem}
              onChange={(e) => setFormData({ ...formData, pelagem: e.target.value })}
            />
          </div>

          {/* FIX #11: Peso de Entrada aqui, no Passo 01 */}
          <div className="tauze-field-group">
            <label className="tauze-label">
              <Scale size={14} /> Peso de Entrada (kg)
            </label>
            <input
              className="tauze-input"
              type="number"
              min="0"
              step="0.1"
              placeholder="0.0"
              value={formData.peso_inicial}
              onChange={(e) => setFormData({ ...formData, peso_inicial: e.target.value })}
            />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          PASSO 02 — LOCALIZAÇÃO DO ANIMAL
      ══════════════════════════════════════════════════════════════════ */}
      <section className="tauze-form-section">
        <SectionBadge step="PASSO 02" label="Localização do Animal" complete={sectionProgress.s2} />

        <div className="tauze-input-grid grid-col-3">
          <div className="tauze-field-group">
            <label className="tauze-label">
              <Building2 size={14} /> Fazenda de Destino
            </label>
            <SearchableSelect
              value={formData.fazenda_id}
              onChange={(val: any) =>
                setFormData({ ...formData, fazenda_id: val, pasto_id: '', lote_id: '' })
              }
              disabled={loadingFazendas}
              options={[
                {
                  value: '',
                  label: loadingFazendas ? 'Carregando fazendas...' : 'Selecionar Fazenda...',
                },
                ...fazendas.map((f) => ({ value: String(f.id), label: f.nome })),
              ]}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label">
              <Award size={14} /> Lote de Destino (Opcional)
            </label>
            <SearchableSelect
              value={formData.lote_id}
              onChange={(val: any) => setFormData({ ...formData, lote_id: val })}
              disabled={!formData.fazenda_id || loadingLotes}
              options={[
                {
                  value: '',
                  label: !formData.fazenda_id
                    ? 'Selecione a fazenda'
                    : loadingLotes
                      ? 'Carregando lotes...'
                      : 'Sem lote definido',
                },
                ...lotes.map((l) => ({ value: String(l.id), label: l.nome })),
              ]}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label">
              <MapPin size={14} /> Pasto (Opcional)
            </label>
            <SearchableSelect
              value={formData.pasto_id}
              onChange={(val: any) => setFormData({ ...formData, pasto_id: val })}
              disabled={!formData.fazenda_id || loadingPastos}
              options={[
                {
                  value: '',
                  label: !formData.fazenda_id
                    ? 'Selecione a fazenda'
                    : loadingPastos
                      ? 'Carregando pastos...'
                      : 'Sem pasto definido',
                },
                ...pastos.map((p) => ({ value: String(p.id), label: p.nome })),
              ]}
            />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          PASSO 03 — ORIGEM E GENEALOGIA
      ══════════════════════════════════════════════════════════════════ */}
      <section className="tauze-form-section">
        <SectionBadge step="PASSO 03" label="Origem e Genealogia" complete={sectionProgress.s3} />

        {/* Seletor de origem */}
        <div className="tauze-field-group">
          <label className="tauze-label">
            <Users size={14} /> Origem do Animal
          </label>
          <div
            className="tauze-form-radio-group"
            style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}
          >
            <div
              className={`tauze-form-radio-item ${formData.origem === 'Nascido' ? 'active' : ''}`}
              onClick={() => setFormData({ ...formData, origem: 'Nascido' })}
            >
              <Home size={14} />
              <span>Nascido na Fazenda</span>
            </div>
            <div
              className={`tauze-form-radio-item ${formData.origem === 'Comprado' ? 'active-comprado' : ''}`}
              onClick={() => setFormData({ ...formData, origem: 'Comprado' })}
            >
              <ShoppingCart size={14} />
              <span>Comprado (Entrada)</span>
            </div>
            <div
              className={`tauze-form-radio-item ${formData.origem === 'Doação' ? 'active-doacao' : ''}`}
              onClick={() => setFormData({ ...formData, origem: 'Doação' })}
            >
              <Gift size={14} />
              <span>Doação</span>
            </div>
          </div>
        </div>

        {/* FIX #8: Campos condicionais por origem */}

        {/* Nascido na Fazenda → Genealogia */}
        {formData.origem === 'Nascido' && (
          <div className="tauze-input-grid grid-col-2">
            <div className="tauze-field-group">
              <label className="tauze-label">
                <Users size={14} /> Brinco da Mãe
              </label>
              <input
                className="tauze-input"
                type="text"
                placeholder="Brinco da Matriz"
                value={formData.mae_brinco}
                onChange={(e) =>
                  setFormData({ ...formData, mae_brinco: e.target.value.toUpperCase() })
                }
              />
            </div>
            <div className="tauze-field-group">
              <label className="tauze-label">
                <Users size={14} /> Brinco do Pai
              </label>
              <input
                className="tauze-input"
                type="text"
                placeholder="Brinco do Reprodutor"
                value={formData.pai_brinco}
                onChange={(e) =>
                  setFormData({ ...formData, pai_brinco: e.target.value.toUpperCase() })
                }
              />
            </div>
          </div>
        )}

        {/* Comprado → Dados da Compra */}
        {formData.origem === 'Comprado' && (
          <div className="tauze-input-grid grid-col-3">
            <div className="tauze-field-group">
              <label className="tauze-label">
                <FileText size={14} /> Fornecedor / Vendedor
              </label>
              <input
                className="tauze-input"
                type="text"
                placeholder="Nome do fornecedor"
                value={formData.fornecedor}
                onChange={(e) => setFormData({ ...formData, fornecedor: e.target.value })}
              />
            </div>
            <div className="tauze-field-group">
              <label className="tauze-label">
                <FileText size={14} /> Nota Fiscal (NF)
              </label>
              <input
                className="tauze-input"
                type="text"
                placeholder="Nº da Nota Fiscal"
                value={formData.nota_fiscal}
                onChange={(e) => setFormData({ ...formData, nota_fiscal: e.target.value })}
              />
            </div>
            <div className="tauze-field-group">
              {/* FIX #6: custo/arroba corrigido + exibição apenas em contexto de compra */}
              <label
                className="tauze-label"
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>
                  <DollarSign size={14} /> Valor de Compra (R$)
                </span>
                {custoArroba && (
                  <span
                    style={{
                      padding: '2px 8px',
                      fontSize: '10px',
                      background: 'hsl(var(--brand)/0.1)',
                      color: 'hsl(var(--brand))',
                      borderRadius: '4px',
                      fontWeight: 800,
                    }}
                  >
                    {custoArroba} / @
                  </span>
                )}
              </label>
              <input
                className="tauze-input"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.valor_compra}
                onChange={(e) => setFormData({ ...formData, valor_compra: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* Doação → Dados do Doador */}
        {formData.origem === 'Doação' && (
          <div className="tauze-input-grid grid-col-2">
            <div className="tauze-field-group">
              <label className="tauze-label">
                <Gift size={14} /> Doador
              </label>
              <input
                className="tauze-input"
                type="text"
                placeholder="Nome do doador"
                value={formData.doador}
                onChange={(e) => setFormData({ ...formData, doador: e.target.value })}
              />
            </div>
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          PASSO 04 — CLASSIFICAÇÃO ZOOTÉCNICA
      ══════════════════════════════════════════════════════════════════ */}
      <section className="tauze-form-section">
        <SectionBadge
          step="PASSO 04"
          label="Classificação Zootécnica"
          complete={sectionProgress.s4}
        />

        <div className="tauze-input-grid grid-col-2">
          <div className="tauze-field-group">
            <label className="tauze-label" style={{ gap: '6px' }}>
              <Beef size={14} /> Categoria
              {/* FIX #4: indica o estado da categoria ao usuário */}
              {!categoriaEditadaManualmente && formData.idade_meses ? (
                <span
                  style={{
                    fontSize: '10px',
                    color: 'hsl(var(--brand))',
                    background: 'hsl(var(--brand)/0.1)',
                    padding: '1px 6px',
                    borderRadius: '10px',
                  }}
                >
                  Auto-Sugerida
                </span>
              ) : categoriaEditadaManualmente ? (
                <span
                  style={{
                    fontSize: '10px',
                    color: '#10b981',
                    background: 'rgba(16,185,129,0.1)',
                    padding: '1px 6px',
                    borderRadius: '10px',
                  }}
                >
                  Manual
                </span>
              ) : null}
            </label>
            <SearchableSelect
              value={formData.categoria}
              onChange={handleCategoriaChange}
              options={[
                { value: '', label: 'Selecionar Categoria...' },
                ...categorias.map((c) => ({ value: c.nome, label: c.nome })),
              ]}
              creatable={true}
            />
          </div>

          {/* FIX #15: opções expandidas de Finalidade */}
          <div className="tauze-field-group">
            <label className="tauze-label">
              <Beef size={14} /> Finalidade
            </label>
            <SearchableSelect
              value={formData.finalidade}
              onChange={(val: any) => setFormData({ ...formData, finalidade: val })}
              options={[
                { value: '', label: 'Selecionar...' },
                { value: 'Corte', label: 'Corte' },
                { value: 'Leite', label: 'Leite' },
                { value: 'Reprodução', label: 'Reprodução' },
                { value: 'Trabalho', label: 'Trabalho / Tração' },
                { value: 'Exposição', label: 'Exposição / Show' },
                { value: 'Descarte', label: 'Descarte' },
              ]}
            />
          </div>
        </div>
      </section>
    </SidePanel>
  );
};
