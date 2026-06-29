import { showValidationAlert } from '../../utils/validationAlert';
import React, { useState, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import { z } from 'zod';

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
import { BasicInfoSection } from './AnimalFormSections/BasicInfoSection';
import { LocationSection } from './AnimalFormSections/LocationSection';
import { OriginSection } from './AnimalFormSections/OriginSection';
import { ZootecnicaSection } from './AnimalFormSections/ZootecnicaSection';

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

// ─── Zod Schema para Validação de Regras de Negócio ──────────────────────────
const animalSchema = z.object({
  brinco: z.string().min(1, 'A Identificação (Brinco) é obrigatória.'),
  sexo: z.enum(['M', 'F'], { required_error: 'O Sexo é obrigatório.' }),
  peso_inicial: z.coerce.number().min(0, 'O Peso de Entrada não pode ser negativo.').optional(),
  raca: z.string().min(1, 'A Raça é obrigatória.'),
  fazenda_id: z.string().min(1, 'A Fazenda de Destino é obrigatória.'),
  data_nascimento: z.string().optional().refine((val) => {
    if (!val) return true;
    // Evita datas futuras mantendo no timezone local
    const dataNascimento = new Date(val);
    dataNascimento.setHours(23, 59, 59, 999);
    return dataNascimento <= new Date();
  }, { message: 'A Data de Nascimento não pode ser no futuro.' })
});

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
  especie_id: 'bovino',
  aptidao_id: 'corte',
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
        especie_id: initialData.especie_id || 'bovino',
        aptidao_id: initialData.aptidao_id || 'corte',
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
        .select('id, nome, pasto_id')
        .eq('tenant_id', activeTenantId)
        .eq('fazenda_id', fazendaId)
        .eq('tenant_id', activeTenantId)
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
      .eq('modulo', 'bovinocultura')
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
          modulo: 'bovinocultura',
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

    // Validação de Regras de Negócio via Zod
    const parsed = animalSchema.safeParse(formData);
    if (!parsed.success) {
      const issues = parsed.error?.issues || (parsed.error as any)?.errors;
      if (issues && issues.length > 0) {
        toast.error(
          <div>
            <strong style={{ display: 'block', marginBottom: '4px' }}>Verifique os campos obrigatórios:</strong>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', lineHeight: '1.4' }}>
              {issues.map((err: any, idx: number) => (
                <li key={idx}>{err.message}</li>
              ))}
            </ul>
          </div>,
          { duration: 6000 }
        );
      } else {
        showValidationAlert('Preencha todos os campos obrigatórios.');
      }
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

        <BasicInfoSection
          formData={formData}
          setFormData={setFormData}
          duplicateBrinco={duplicateBrinco}
          setDuplicateBrinco={setDuplicateBrinco}
          handleBrincoBlur={handleBrincoBlur}
          formatRFID={formatRFID}
          handleDataNascimentoChange={handleDataNascimentoChange}
          handleIdadeChange={handleIdadeChange}
          racas={racas}
          handleRacaChange={handleRacaChange}
          isEdit={!!initialData}
        />
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          PASSO 02 — LOCALIZAÇÃO DO ANIMAL
      ══════════════════════════════════════════════════════════════════ */}
      <section className="tauze-form-section">
        <SectionBadge step="PASSO 02" label="Localização do Animal" complete={sectionProgress.s2} />

        <LocationSection
          formData={formData}
          setFormData={setFormData}
          fazendas={fazendas}
          lotes={lotes}
          pastos={pastos}
          loadingFazendas={loadingFazendas}
          loadingLotes={loadingLotes}
          loadingPastos={loadingPastos}
        />
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          PASSO 03 — ORIGEM E GENEALOGIA
      ══════════════════════════════════════════════════════════════════ */}
      <section className="tauze-form-section">
        <SectionBadge step="PASSO 03" label="Origem e Genealogia" complete={sectionProgress.s3} />

        <OriginSection formData={formData} setFormData={setFormData} custoArroba={custoArroba} />
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

        <ZootecnicaSection 
          formData={formData} 
          setFormData={setFormData} 
          categorias={categorias} 
          categoriaEditadaManualmente={categoriaEditadaManualmente} 
          handleCategoriaChange={handleCategoriaChange} 
        />
      </section>
    </SidePanel>
  );
};
