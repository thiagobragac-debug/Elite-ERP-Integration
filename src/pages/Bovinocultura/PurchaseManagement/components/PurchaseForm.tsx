import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Truck,
  Navigation,
  FileCheck,
  User,
  Calendar,
  FileDigit,
  ShieldCheck,
  DollarSign,
  ListOrdered,
  MapPin,
  Target,
  Layers,
  FileSpreadsheet,
  Keyboard,
  Calculator,
  Upload,
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  ChevronRight,
  AlertCircle,
  AlertTriangle,
  Scale,
  Banknote,
  CreditCard,
  Car,
  FlaskConical,
  Hash,
  FileText,
  Info,
} from 'lucide-react';
import { SidePanel } from '../../../../components/Layout/SidePanel';
import { useTenantFarm } from '../../../../contexts/TenantContext';
import { supabase } from '../../../../lib/supabase';
import { usePersistentState } from '../../../../hooks/usePersistentState';
import toast from 'react-hot-toast';
import { showValidationAlert } from '../../../../utils/validationAlert';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
interface GridAnimal {
  brinco: string;
  rfid: string;
  sexo: string;
  peso: string;
}

type DesmMode = 'media' | 'grid' | 'excel';
type FormaPagamento = 'avista' | 'prazo' | 'entrada_parcelas' | 'troca';
type IntegracaoFinanceira = 'new' | 'existing';

const INITIAL_FORM = {
  // Etapa 1 — Negociação
  fornecedor_id: '' as string,
  fornecedor_nome: '' as string,
  data_compra: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0],
  nota_fiscal: '' as string,
  gta_numero: '' as string,
  gta_serie: '' as string,
  gta_emissao: '' as string,
  gta_validade: '' as string,
  municipio_origem: '' as string,
  uf_origem: '' as string,
  nome_corretor: '' as string,
  comissao_corretor: '' as string,
  observacoes: '' as string,
  // Etapa 2 — Peso, Valores & Financeiro
  quantidade_cabecas: '' as string,
  peso_total_kg: '' as string,
  preco_arroba: '' as string,
  valor_total: '' as string,
  valor_desconto: '' as string,
  integracao_financeira: 'new' as IntegracaoFinanceira,
  forma_pagamento: 'prazo' as FormaPagamento,
  valor_entrada: '' as string,
  num_parcelas: '1' as string,
  intervalo_parcelas_dias: '30' as string,
  data_primeiro_vencimento: '' as string,
  // Etapa 3 — Destino & Logística
  fazenda_destino_id: '' as string,
  fazenda_destino_nome: '' as string,
  lote_destino_id: '' as string,
  lote_destino_nome: '' as string,
  data_chegada: '' as string,
  raca_predominante: '' as string,
  categoria_predominante: '' as string,
  finalidade: '' as string,
  transportadora: '' as string,
  motorista: '' as string,
  placa_veiculo: '' as string,
  valor_frete: '' as string,
  frete_por_conta: 'CIF' as 'CIF' | 'FOB',
  exige_quarentena: false as boolean,
  dias_quarentena: '14' as string,
  // Etapa 4 — Desmembramento
  desm_mode: 'media' as DesmMode,
  animais_grid: [] as GridAnimal[],
};

const ETAPAS = [
  {
    id: 'negociacao',
    label: '1. Documento & Origem',
    icon: FileDigit,
    color: '#3b82f6',
    desc: 'Fornecedor, NF-e, GTA e dados de origem do lote.',
  },
  {
    id: 'financeiro',
    label: '2. Peso & Financeiro',
    icon: Scale,
    color: '#10b981',
    desc: 'Peso balança, preço/arroba e condições de pagamento.',
  },
  {
    id: 'destino',
    label: '3. Destino & Logística',
    icon: Navigation,
    color: '#8b5cf6',
    desc: 'Fazenda, lote, categoria, transportadora e quarentena.',
  },
  {
    id: 'desmembramento',
    label: '4. Entrada dos Animais',
    icon: FileCheck,
    color: '#f59e0b',
    desc: 'Identificação individual ou lote fechado provisório.',
  },
];

const UF_LIST = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS',
  'MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
];

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
interface PurchaseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  loading?: boolean;
  initialData?: any;
}

export const PurchaseForm: React.FC<PurchaseFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading: externalLoading,
  initialData,
}) => {
  const { activeTenantId, activeFarmId } = useTenantFarm();
  const [activeEtapa, setActiveEtapa] = useState('negociacao');
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ ...INITIAL_FORM });

  // ── Sequence generator config — persisted per user/browser ──
  const [seqConfig, setSeqConfig] = usePersistentState('purchase_brinco_seq_config', {
    prefixo: '',
    sufixo: '',
    digitos: 3,
    numInicial: 1,
    sexoPadrao: 'M',
    pesoPadrao: '',
    // RFID Config
    gerarRfid: false,
    rfidPrefixo: '982', // Prefix comum (ex: Brasil)
    rfidNumInicial: 1,
    rfidDigitos: 12,
  });
  const setSeq = useCallback(
    <K extends keyof typeof seqConfig>(field: K, value: (typeof seqConfig)[K]) =>
      setSeqConfig((prev) => ({ ...prev, [field]: value })),
    [setSeqConfig]
  );

  // ── Sequence generation helper ──
  const generateSequence = useCallback(() => {
    const qty = parseInt(formData.quantidade_cabecas);
    if (!qty || qty < 1) {
      toast.error('Defina a quantidade de cabeças (Etapa 2) antes de gerar a sequência.');
      return;
    }
    const { prefixo, sufixo, digitos, numInicial, sexoPadrao, pesoPadrao, gerarRfid, rfidPrefixo, rfidNumInicial, rfidDigitos } = seqConfig;
    const animals: GridAnimal[] = Array.from({ length: qty }, (_, i) => {
      const brinco = `${prefixo}${String(numInicial + i).padStart(digitos, '0')}${sufixo}`;
      const rfid = gerarRfid ? `${rfidPrefixo}${String(rfidNumInicial + i).padStart(rfidDigitos, '0')}` : '';
      return {
        brinco,
        rfid,
        sexo: sexoPadrao,
        peso: pesoPadrao,
      };
    });
    setFormData((prev) => ({ ...prev, animais_grid: animals }));
    toast.success(`✅ ${qty} brincos gerados automaticamente!`);
  }, [formData.quantidade_cabecas, seqConfig]);

  // ── Mass-fill helpers ──
  const massSetSexo = useCallback((sexo: string) => {
    setFormData((prev) => ({
      ...prev,
      animais_grid: prev.animais_grid.map((a) => ({ ...a, sexo })),
    }));
  }, []);

  const massSetPeso = useCallback((peso: string) => {
    setFormData((prev) => ({
      ...prev,
      animais_grid: prev.animais_grid.map((a) => ({ ...a, peso })),
    }));
  }, []);

  const [massWeightInput, setMassWeightInput] = useState('');

  // Derived preview of sequence
  const seqPreview = useMemo(() => {
    const qty = parseInt(formData.quantidade_cabecas) || 0;
    if (!qty) return null;
    const { prefixo, sufixo, digitos, numInicial, gerarRfid, rfidPrefixo, rfidNumInicial, rfidDigitos } = seqConfig;
    
    const getLabel = (offset: number) => {
      const b = `${prefixo}${String(numInicial + offset).padStart(digitos, '0')}${sufixo}`;
      if (gerarRfid) {
        const r = `${rfidPrefixo}${String(rfidNumInicial + offset).padStart(rfidDigitos, '0')}`;
        return `${b} (${r})`;
      }
      return b;
    };

    const first = getLabel(0);
    const second = qty > 1 ? getLabel(1) : null;
    const last = qty > 2 ? getLabel(qty - 1) : null;
    return { first, second, last, qty };
  }, [formData.quantidade_cabecas, seqConfig]);

  // Remote data
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [fazendas, setFazendas] = useState<any[]>([]);
  const [lotes, setLotes] = useState<any[]>([]);
  const [fornSearch, setFornSearch] = useState('');
  const [showFornDrop, setShowFornDrop] = useState(false);
  const [loteSearch, setLoteSearch] = useState('');
  const [showLoteDrop, setShowLoteDrop] = useState(false);

  const set = useCallback(
    <K extends keyof typeof INITIAL_FORM>(field: K, value: (typeof INITIAL_FORM)[K]) =>
      setFormData((prev) => ({ ...prev, [field]: value })),
    []
  );

  // ── Reset on open ──
  useEffect(() => {
    if (!isOpen) return;
    setActiveEtapa('negociacao');
    if (initialData) {
      const d = initialData;
      setFormData({
        ...INITIAL_FORM,
        fornecedor_id: d.fornecedor_id || '',
        fornecedor_nome: d.parceiro?.nome_razao || '',
        data_compra: d.data_compra || INITIAL_FORM.data_compra,
        nota_fiscal: d.nota_fiscal || '',
        gta_numero: d.gta_numero || '',
        gta_serie: d.gta_serie || '',
        gta_emissao: d.gta_emissao || '',
        gta_validade: d.gta_validade || '',
        municipio_origem: d.municipio_origem || '',
        uf_origem: d.uf_origem || '',
        nome_corretor: d.nome_corretor || '',
        comissao_corretor: d.comissao_corretor ? String(d.comissao_corretor) : '',
        observacoes: d.observacoes || '',
        quantidade_cabecas: d.quantidade_cabecas ? String(d.quantidade_cabecas) : '',
        peso_total_kg: d.peso_total_kg ? String(d.peso_total_kg) : '',
        preco_arroba: d.preco_arroba ? String(d.preco_arroba) : '',
        valor_total: d.valor_total ? String(d.valor_total) : '',
        valor_desconto: d.valor_desconto ? String(d.valor_desconto) : '',
        integracao_financeira: d.integracao_financeira || 'new',
        forma_pagamento: d.forma_pagamento || 'prazo',
        valor_entrada: d.valor_entrada ? String(d.valor_entrada) : '',
        num_parcelas: d.num_parcelas ? String(d.num_parcelas) : '1',
        intervalo_parcelas_dias: d.intervalo_parcelas_dias ? String(d.intervalo_parcelas_dias) : '30',
        data_primeiro_vencimento: d.data_primeiro_vencimento || '',
        fazenda_destino_id: d.fazenda_destino_id || '',
        fazenda_destino_nome: '',
        lote_destino_id: '',
        lote_destino_nome: '',
        data_chegada: d.data_chegada || '',
        raca_predominante: d.raca_predominante || '',
        categoria_predominante: d.categoria_predominante || '',
        finalidade: d.finalidade || '',
        transportadora: d.transportadora || '',
        motorista: d.motorista || '',
        placa_veiculo: d.placa_veiculo || '',
        valor_frete: d.valor_frete ? String(d.valor_frete) : '',
        frete_por_conta: d.frete_por_conta || 'CIF',
        exige_quarentena: d.exige_quarentena ?? false,
        dias_quarentena: d.dias_quarentena ? String(d.dias_quarentena) : '14',
        desm_mode: 'media',
        animais_grid: [],
      });
      setFornSearch(d.parceiro?.nome_razao || '');
    } else {
      setFormData({ ...INITIAL_FORM });
      setFornSearch('');
      setLoteSearch('');
    }
  }, [isOpen, initialData]);

  // ── Load remote data ──
  useEffect(() => {
    if (!isOpen || !activeTenantId) return;

    supabase
      .from('parceiros')
      .select('id, nome_razao, fantasia')
      .eq('tenant_id', activeTenantId)
      .eq('is_supplier', true)
      .order('nome_razao')
      .then(({ data }) => setFornecedores(data || []));

    supabase
      .from('fazendas')
      .select('id, nome')
      .eq('tenant_id', activeTenantId)
      .order('nome')
      .then(({ data }) => setFazendas(data || []));

    let q = supabase.from('lotes').select('id, nome, fazenda_id').eq('tenant_id', activeTenantId);
    if (activeFarmId) q = q.eq('fazenda_id', activeFarmId);
    q.order('nome').then(({ data }) => setLotes(data || []));
  }, [isOpen, activeTenantId, activeFarmId]);

  // ── Computed / derived ──
  const filteredForn = useMemo(
    () => fornecedores.filter((f) => `${f.nome_razao} ${f.fantasia || ''}`.toLowerCase().includes(fornSearch.toLowerCase())),
    [fornecedores, fornSearch]
  );

  const filteredLotes = useMemo(
    () => lotes.filter((l) => l.nome?.toLowerCase().includes(loteSearch.toLowerCase())),
    [lotes, loteSearch]
  );

  const totalArrobas = useMemo(() => {
    const kg = parseFloat(formData.peso_total_kg);
    return kg > 0 ? kg / 15 : null;
  }, [formData.peso_total_kg]);

  const custoArroba = useMemo(() => {
    if (!totalArrobas || !formData.valor_total) return null;
    const custo =
      (parseFloat(formData.valor_total) || 0) +
      (parseFloat(formData.valor_frete) || 0) +
      (parseFloat(formData.comissao_corretor) || 0) -
      (parseFloat(formData.valor_desconto) || 0);
    return custo / totalArrobas;
  }, [totalArrobas, formData.valor_total, formData.valor_frete, formData.comissao_corretor, formData.valor_desconto]);

  const custoCabeca = useMemo(() => {
    const cabecas = parseInt(formData.quantidade_cabecas);
    if (!cabecas || !formData.valor_total) return null;
    const custo =
      (parseFloat(formData.valor_total) || 0) +
      (parseFloat(formData.valor_frete) || 0) +
      (parseFloat(formData.comissao_corretor) || 0) -
      (parseFloat(formData.valor_desconto) || 0);
    return custo / cabecas;
  }, [formData.quantidade_cabecas, formData.valor_total, formData.valor_frete, formData.comissao_corretor, formData.valor_desconto]);

  const pesoMedio = useMemo(() => {
    const kg = parseFloat(formData.peso_total_kg);
    const cab = parseInt(formData.quantidade_cabecas);
    if (!kg || !cab) return null;
    return kg / cab;
  }, [formData.peso_total_kg, formData.quantidade_cabecas]);

  // GTA validation
  const gtaVencida = useMemo(() => {
    if (!formData.gta_validade) return false;
    return new Date(formData.gta_validade) < new Date();
  }, [formData.gta_validade]);

  // Completion checks
  const isNegociacaoDone = !!formData.fornecedor_id && !!formData.data_compra;
  const isFinanceiroDone = !!formData.quantidade_cabecas && !!formData.valor_total;
  const isDestinoDone = !!formData.fazenda_destino_id;

  const etapaIndex = ETAPAS.findIndex((e) => e.id === activeEtapa);
  const isLastEtapa = etapaIndex === ETAPAS.length - 1;

  const handleNext = () => {
    if (!isLastEtapa) {
      setActiveEtapa(ETAPAS[etapaIndex + 1].id);
    }
  };

  // ── Submit ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fornecedor_id) {
      showValidationAlert('Selecione um fornecedor antes de continuar.');
      setActiveEtapa('negociacao');
      return;
    }
    if (!formData.quantidade_cabecas || !formData.valor_total) {
      showValidationAlert('Preencha quantidade de cabeças e valor total (Etapa 2).');
      setActiveEtapa('financeiro');
      return;
    }
    if (!formData.fazenda_destino_id) {
      showValidationAlert('Selecione a fazenda de destino (Etapa 3).');
      setActiveEtapa('destino');
      return;
    }

    setSaving(true);
    try {
      const qty = parseInt(formData.quantidade_cabecas) || 0;
      const totalKg = parseFloat(formData.peso_total_kg) || null;
      const arrobas = totalKg ? totalKg / 15 : null;

      const payload: Record<string, any> = {
        tenant_id: activeTenantId,
        fazenda_id: activeFarmId || null,
        fornecedor_id: formData.fornecedor_id || null,
        data_compra: formData.data_compra,
        data_chegada: formData.data_chegada || null,
        nota_fiscal: formData.nota_fiscal || null,
        gta_numero: formData.gta_numero || null,
        gta_serie: formData.gta_serie || null,
        gta_emissao: formData.gta_emissao || null,
        gta_validade: formData.gta_validade || null,
        municipio_origem: formData.municipio_origem || null,
        uf_origem: formData.uf_origem || null,
        nome_corretor: formData.nome_corretor || null,
        comissao_corretor: parseFloat(formData.comissao_corretor) || 0,
        observacoes: formData.observacoes || null,
        quantidade_cabecas: qty,
        valor_total: parseFloat(formData.valor_total) || 0,
        valor_desconto: parseFloat(formData.valor_desconto) || 0,
        peso_total_kg: totalKg,
        peso_medio_kg: pesoMedio,
        preco_arroba: parseFloat(formData.preco_arroba) || null,
        total_arrobas: arrobas,
        integracao_financeira: formData.integracao_financeira,
        forma_pagamento: formData.forma_pagamento,
        valor_entrada: parseFloat(formData.valor_entrada) || null,
        num_parcelas: parseInt(formData.num_parcelas) || 1,
        intervalo_parcelas_dias: parseInt(formData.intervalo_parcelas_dias) || 30,
        data_primeiro_vencimento: formData.data_primeiro_vencimento || null,
        fazenda_destino_id: formData.fazenda_destino_id || null,
        raca_predominante: formData.raca_predominante || null,
        categoria_predominante: formData.categoria_predominante || null,
        finalidade: formData.finalidade || null,
        transportadora: formData.transportadora || null,
        motorista: formData.motorista || null,
        placa_veiculo: formData.placa_veiculo || null,
        valor_frete: parseFloat(formData.valor_frete) || null,
        frete_por_conta: formData.frete_por_conta,
        exige_quarentena: formData.exige_quarentena,
        dias_quarentena: formData.exige_quarentena ? parseInt(formData.dias_quarentena) || 14 : null,
        status: 'PENDENTE',
      };

      let loteCompraId: string | null = null;
      let notaEntradaId: string | null = null;

      // ── MÁGICA: Integração Fiscal ──
      // Se não for edição e tiver NF + fornecedor, injeta NF administrativa primeiro
      if (!initialData && formData.nota_fiscal && formData.fornecedor_id) {
        try {
          const nfPayload = {
            tenant_id: activeTenantId,
            fazenda_id: activeFarmId || null,
            fornecedor_id: formData.fornecedor_id,
            numero_nota: formData.nota_fiscal,
            data_emissao: formData.data_compra,
            data_entrada: formData.data_chegada || formData.data_compra,
            valor_liquido: parseFloat(formData.valor_total) || 0,
            valor_total: parseFloat(formData.valor_total) || 0,
            observacoes: '📦 [Origem: Pecuária / Recepção de Gado]',
          };
          
          const { data: nfData, error: nfError } = await supabase
            .from('notas_entrada')
            .insert([nfPayload])
            .select('id')
            .single();
            
          if (nfError) {
             console.error('Erro ao gerar NF automática:', nfError);
             toast.error('Aviso: Falha ao criar NF no financeiro.');
          } else {
             notaEntradaId = nfData?.id || null;
             payload.nota_entrada_id = notaEntradaId; // Vincula ao lote
          }
        } catch (e) {
          console.error('Erro na NF', e);
        }
      }

      if (initialData?.id) {
        const { error } = await supabase
          .from('lotes_compra')
          .update(payload)
          .eq('id', initialData.id)
          .eq('tenant_id', activeTenantId);
        if (error) throw error;
        loteCompraId = initialData.id;
        toast.success('✅ Compra atualizada com sucesso!');
      } else {
        const { data: inserted, error } = await supabase
          .from('lotes_compra')
          .insert([payload])
          .select('id')
          .single();
        if (error) throw error;
        loteCompraId = inserted?.id || null;
        toast.success('✅ Compra registrada com sucesso!');
      }

      // ── Fase 2: Criar animais na tabela animais (Desmembramento) ──
      if (loteCompraId && !initialData) {
        const fazendaId = formData.fazenda_destino_id || activeFarmId || null;
        const loteId = formData.lote_destino_id || null;
        const valorPorCabeca = custoCabeca || null;

        if (formData.desm_mode === 'media') {
          // Gerar N fichas provisórias com brinco sequencial
          const animaisPayload = Array.from({ length: qty }, (_, i) => ({
            tenant_id: activeTenantId,
            lote_compra_id: loteCompraId,
            fazenda_id: fazendaId,
            lote_id: loteId,
            brinco: `COMPRA-${loteCompraId!.slice(0, 8).toUpperCase()}-${String(i + 1).padStart(3, '0')}`,
            raca: formData.raca_predominante || null,
            categoria: formData.categoria_predominante || null,
            finalidade: formData.finalidade || null,
            peso_inicial: pesoMedio || null,
            peso_atual: pesoMedio || null,
            valor_compra: valorPorCabeca,
            origem: 'COMPRA',
            status: formData.exige_quarentena ? 'QUARENTENA' : 'ATIVO',
          }));
          const { error: animErr } = await supabase.from('animais').insert(animaisPayload);
          if (animErr) {
            toast.error(`⚠️ Lote salvo, mas houve erro ao criar fichas: ${animErr.message}`);
          } else {
            toast.success(`🐄 ${qty} fichas provisórias criadas com sucesso!`);
          }
        } else if (formData.desm_mode === 'grid' && formData.animais_grid.length > 0) {
          const animaisPayload = formData.animais_grid
            .filter((a) => a.brinco)
            .map((a) => ({
              tenant_id: activeTenantId,
              lote_compra_id: loteCompraId,
              fazenda_id: fazendaId,
              lote_id: loteId,
              brinco: a.brinco,
              brinco_eletronico: a.rfid || null,
              sexo: a.sexo || null,
              peso_inicial: parseFloat(a.peso) || null,
              peso_atual: parseFloat(a.peso) || null,
              raca: formData.raca_predominante || null,
              categoria: formData.categoria_predominante || null,
              finalidade: formData.finalidade || null,
              valor_compra: valorPorCabeca,
              origem: 'COMPRA',
              status: formData.exige_quarentena ? 'QUARENTENA' : 'ATIVO',
            }));
          const { error: animErr } = await supabase.from('animais').insert(animaisPayload);
          if (animErr) {
            toast.error(`⚠️ Lote salvo, mas erro ao criar animais: ${animErr.message}`);
          } else {
            toast.success(`🐄 ${animaisPayload.length} animais cadastrados!`);
          }
        }
      }

      onSubmit(payload);
    } catch (err: any) {
      toast.error(`❌ Erro: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const loading = saving || externalLoading;

  // ── Helpers ──
  const fmt = (v: number | null) => v !== null ? v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—';

  return (
    <SidePanel
      size="xlarge"
      isOpen={isOpen}
      onClose={onClose}
      onCancel={onClose}
      onSubmit={isLastEtapa ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}
      title={initialData ? 'Editar Compra de Animais' : 'Nova Compra de Animais'}
      subtitle={
        initialData
          ? `Editando lote — NF: ${initialData.nota_fiscal || 'sem NF'}`
          : 'Entrada de lote com rastreabilidade, financeiro e desmembramento.'
      }
      icon={Truck}
      loading={loading}
      submitLabel={isLastEtapa ? (initialData ? 'Salvar Alterações' : 'Registrar Compra') : 'Avançar →'}
    >
      <div style={{ display: 'flex', gap: '24px' }}>
        {/* ── Stepper Lateral ── */}
        <div style={{ width: '220px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {ETAPAS.map((et) => {
            const isActive = activeEtapa === et.id;
            const isCompleted =
              et.id === 'negociacao' ? isNegociacaoDone :
              et.id === 'financeiro' ? isFinanceiroDone :
              et.id === 'destino' ? isDestinoDone : false;
            const Icon = et.icon;

            return (
              <button
                key={et.id}
                type="button"
                onClick={() => setActiveEtapa(et.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px', borderRadius: '12px', border: 'none',
                  background: isActive ? `${et.color}15` : 'transparent',
                  color: isActive ? et.color : 'hsl(var(--text-muted))',
                  cursor: 'pointer', textAlign: 'left',
                  fontWeight: isActive ? 700 : 500,
                  transition: 'all 0.2s',
                  boxShadow: isActive ? `inset 3px 0 0 ${et.color}` : 'none',
                  width: '100%',
                }}
              >
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                  background: isCompleted ? et.color : isActive ? `${et.color}30` : 'hsl(var(--bg-main))',
                  color: isCompleted ? '#fff' : isActive ? et.color : 'hsl(var(--text-muted))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {isCompleted ? <CheckCircle2 size={16} /> : <Icon size={16} />}
                </div>
                <span style={{ fontSize: '13px', flex: 1, lineHeight: 1.3 }}>{et.label}</span>
                {isActive && <ChevronRight size={14} opacity={0.5} />}
              </button>
            );
          })}

          {/* ── Painel de métricas em tempo real ── */}
          {(custoCabeca || custoArroba) && (
            <div style={{
              marginTop: '12px', padding: '14px', borderRadius: '12px',
              background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border))',
            }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'hsl(var(--text-muted))', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Custo Real do Lote
              </div>
              {custoCabeca && (
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '10px', color: 'hsl(var(--text-muted))' }}>Por cabeça</div>
                  <div style={{ fontWeight: 800, fontSize: '16px', color: 'hsl(var(--brand))' }}>
                    R$ {fmt(custoCabeca)}
                  </div>
                </div>
              )}
              {custoArroba && (
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '10px', color: 'hsl(var(--text-muted))' }}>Por arroba (@)</div>
                  <div style={{ fontWeight: 800, fontSize: '16px', color: 'hsl(131 41% 46%)' }}>
                    R$ {fmt(custoArroba)}
                  </div>
                </div>
              )}
              {pesoMedio && (
                <div>
                  <div style={{ fontSize: '10px', color: 'hsl(var(--text-muted))' }}>Peso médio</div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: 'hsl(var(--text-main))' }}>
                    {pesoMedio.toFixed(1)} kg
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Conteúdo Direito ── */}
        <div style={{
          flex: 1, minWidth: 0,
          background: 'hsl(var(--bg-card))',
          border: '1px solid hsl(var(--border))',
          borderRadius: '16px',
          padding: '24px',
        }}>
          {/* Cabeçalho da seção */}
          <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid hsl(var(--border))' }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '17px', color: 'hsl(var(--text-main))' }}>
              {ETAPAS.find((e) => e.id === activeEtapa)?.label}
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'hsl(var(--text-muted))' }}>
              {ETAPAS.find((e) => e.id === activeEtapa)?.desc}
            </p>
          </div>

          {/* ══════════════════════════════════════════════════
              ETAPA 1 — Documento & Origem
          ══════════════════════════════════════════════════ */}
          {activeEtapa === 'negociacao' && (
            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="tauze-input-grid grid-col-2">

                {/* Fornecedor */}
                <div className="tauze-field-group">
                  <label className="tauze-label"><User size={14} /> Fornecedor (Vendedor)</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="tauze-input"
                      type="text"
                      placeholder="Buscar fornecedor cadastrado..."
                      value={fornSearch}
                      onChange={(e) => { setFornSearch(e.target.value); set('fornecedor_id', ''); setShowFornDrop(true); }}
                      onFocus={() => setShowFornDrop(true)}
                      autoComplete="off"
                      style={{ paddingRight: '36px' }}
                    />
                    <Search size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-muted))', pointerEvents: 'none' }} />
                    {showFornDrop && (
                      <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, width: '100%', maxHeight: '200px', overflowY: 'auto', background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', zIndex: 999, boxShadow: '0 12px 40px rgba(0,0,0,0.2)' }}>
                        {filteredForn.length === 0
                          ? <div style={{ padding: '14px', color: 'hsl(var(--text-muted))', fontSize: '13px', textAlign: 'center' }}>Nenhum fornecedor encontrado</div>
                          : filteredForn.map((f) => (
                              <div key={f.id} className="autocomplete-option" onClick={() => { set('fornecedor_id', f.id); set('fornecedor_nome', f.nome_razao); setFornSearch(f.nome_razao); setShowFornDrop(false); }}
                                style={{ padding: '10px 14px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: 'hsl(var(--text-main))', borderBottom: '1px solid hsl(var(--border) / 0.5)' }}>
                                {f.nome_razao}
                                {f.fantasia && <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginLeft: '8px' }}>({f.fantasia})</span>}
                              </div>
                            ))
                        }
                      </div>
                    )}
                  </div>
                  {formData.fornecedor_id && <span style={{ fontSize: '11px', color: 'hsl(var(--brand))', marginTop: '4px', display: 'block' }}>✓ Fornecedor selecionado</span>}
                </div>

                {/* Data da Compra */}
                <div className="tauze-field-group">
                  <label className="tauze-label"><Calendar size={14} /> Data da Compra</label>
                  <input type="date" className="tauze-input" value={formData.data_compra} onChange={(e) => set('data_compra', e.target.value)} />
                </div>

                {/* NF-e */}
                <div className="tauze-field-group">
                  <label className="tauze-label"><FileDigit size={14} /> Nota Fiscal (NF-e)</label>
                  <input type="text" className="tauze-input" placeholder="Número da NF-e" value={formData.nota_fiscal} onChange={(e) => set('nota_fiscal', e.target.value)} />
                </div>

                {/* Previsão de chegada */}
                <div className="tauze-field-group">
                  <label className="tauze-label"><Calendar size={14} /> Previsão de Chegada</label>
                  <input type="date" className="tauze-input" value={formData.data_chegada} onChange={(e) => set('data_chegada', e.target.value)} />
                </div>
              </div>

              {/* ── GTA Expandida ── */}
              <div style={{ padding: '16px', borderRadius: '12px', background: 'hsl(var(--bg-main))', border: '1px solid hsl(var(--border))' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <ShieldCheck size={16} style={{ color: '#3b82f6' }} />
                  <span style={{ fontWeight: 700, fontSize: '13px', color: 'hsl(var(--text-main))' }}>GTA — Guia de Trânsito Animal</span>
                  {gtaVencida && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#ef4444', fontWeight: 700, marginLeft: 'auto' }}>
                      <AlertTriangle size={12} /> GTA VENCIDA
                    </span>
                  )}
                </div>
                <div className="tauze-input-grid grid-col-3">
                  <div className="tauze-field-group">
                    <label className="tauze-label"><Hash size={14} /> Número</label>
                    <input type="text" className="tauze-input" placeholder="Ex: 0012345" value={formData.gta_numero} onChange={(e) => set('gta_numero', e.target.value)} />
                  </div>
                  <div className="tauze-field-group">
                    <label className="tauze-label"><Hash size={14} /> Série</label>
                    <input type="text" className="tauze-input" placeholder="Ex: A" value={formData.gta_serie} onChange={(e) => set('gta_serie', e.target.value)} />
                  </div>
                  <div className="tauze-field-group">
                    <label className="tauze-label"><Calendar size={14} /> Emissão</label>
                    <input type="date" className="tauze-input" value={formData.gta_emissao} onChange={(e) => set('gta_emissao', e.target.value)} />
                  </div>
                  <div className="tauze-field-group">
                    <label className="tauze-label">
                      <Calendar size={14} /> Validade
                      {gtaVencida && <span style={{ color: '#ef4444', marginLeft: '4px' }}>(!)</span>}
                    </label>
                    <input type="date" className="tauze-input" value={formData.gta_validade}
                      style={{ borderColor: gtaVencida ? '#ef4444' : undefined }}
                      onChange={(e) => set('gta_validade', e.target.value)} />
                  </div>
                  <div className="tauze-field-group">
                    <label className="tauze-label"><MapPin size={14} /> Município de Origem</label>
                    <input type="text" className="tauze-input" placeholder="Ex: Araguaína" value={formData.municipio_origem} onChange={(e) => set('municipio_origem', e.target.value)} />
                  </div>
                  <div className="tauze-field-group">
                    <label className="tauze-label"><MapPin size={14} /> UF de Origem</label>
                    <select className="tauze-input" value={formData.uf_origem} onChange={(e) => set('uf_origem', e.target.value)}>
                      <option value="">Selecione...</option>
                      {UF_LIST.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Corretor */}
              <div className="tauze-input-grid grid-col-2">
                <div className="tauze-field-group">
                  <label className="tauze-label"><User size={14} /> Nome do Corretor / Leiloeiro</label>
                  <input type="text" className="tauze-input" placeholder="Opcional" value={formData.nome_corretor} onChange={(e) => set('nome_corretor', e.target.value)} />
                </div>
                <div className="tauze-field-group">
                  <label className="tauze-label"><DollarSign size={14} /> Comissão do Corretor (R$)</label>
                  <input type="number" className="tauze-input" placeholder="0,00" min="0" step="0.01" value={formData.comissao_corretor} onChange={(e) => set('comissao_corretor', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              ETAPA 2 — Peso & Financeiro
          ══════════════════════════════════════════════════ */}
          {activeEtapa === 'financeiro' && (
            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Peso & Quantidade */}
              <div style={{ padding: '16px', borderRadius: '12px', background: 'hsl(var(--bg-main))', border: '1px solid hsl(var(--border))' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <Scale size={16} style={{ color: '#10b981' }} />
                  <span style={{ fontWeight: 700, fontSize: '13px', color: 'hsl(var(--text-main))' }}>Peso & Quantidade</span>
                </div>
                <div className="tauze-input-grid grid-col-3">
                  <div className="tauze-field-group">
                    <label className="tauze-label"><ListOrdered size={14} /> Quantidade de Cabeças</label>
                    <input type="number" className="tauze-input" placeholder="Ex: 120" min="1" value={formData.quantidade_cabecas} onChange={(e) => set('quantidade_cabecas', e.target.value)} />
                  </div>
                  <div className="tauze-field-group">
                    <label className="tauze-label"><Scale size={14} /> Peso Total Balança (kg)</label>
                    <input type="number" className="tauze-input" placeholder="Ex: 54000" min="0" step="0.001" value={formData.peso_total_kg} onChange={(e) => set('peso_total_kg', e.target.value)} />
                  </div>
                  <div className="tauze-field-group">
                    <label className="tauze-label"><Scale size={14} /> Peso Médio (calculado)</label>
                    <div style={{ padding: '10px 14px', background: 'hsl(var(--bg-card))', borderRadius: '10px', border: '1px solid hsl(var(--border))', fontWeight: 800, fontSize: '18px', color: pesoMedio ? 'hsl(var(--brand))' : 'hsl(var(--text-muted))' }}>
                      {pesoMedio ? `${pesoMedio.toFixed(1)} kg` : '— kg'}
                    </div>
                    {totalArrobas && <p style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginTop: '4px' }}>≈ {totalArrobas.toFixed(1)} @</p>}
                  </div>
                  <div className="tauze-field-group">
                    <label className="tauze-label"><Calendar size={14} /> Data da Pesagem</label>
                    <input type="date" className="tauze-input" value={formData.data_compra} onChange={(e) => set('data_compra', e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Valores */}
              <div style={{ padding: '16px', borderRadius: '12px', background: 'hsl(var(--bg-main))', border: '1px solid hsl(var(--border))' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <Banknote size={16} style={{ color: '#10b981' }} />
                  <span style={{ fontWeight: 700, fontSize: '13px', color: 'hsl(var(--text-main))' }}>Valores do Negócio</span>
                </div>
                <div className="tauze-input-grid grid-col-2">
                  <div className="tauze-field-group">
                    <label className="tauze-label"><DollarSign size={14} /> Valor Total do Lote (R$)</label>
                    <input type="number" className="tauze-input" placeholder="0,00" min="0" step="0.01" value={formData.valor_total} onChange={(e) => set('valor_total', e.target.value)} />
                  </div>
                  <div className="tauze-field-group">
                    <label className="tauze-label"><DollarSign size={14} /> Preço Negociado por @ (R$)</label>
                    <input type="number" className="tauze-input" placeholder="Ex: 295,00" min="0" step="0.01" value={formData.preco_arroba} onChange={(e) => set('preco_arroba', e.target.value)} />
                  </div>
                  <div className="tauze-field-group">
                    <label className="tauze-label"><DollarSign size={14} /> Desconto Negociado (R$)</label>
                    <input type="number" className="tauze-input" placeholder="0,00" min="0" step="0.01" value={formData.valor_desconto} onChange={(e) => set('valor_desconto', e.target.value)} />
                  </div>
                  <div className="tauze-field-group">
                    <label className="tauze-label"><Truck size={14} /> Valor do Frete (R$)</label>
                    <input type="number" className="tauze-input" placeholder="0,00" min="0" step="0.01" value={formData.valor_frete} onChange={(e) => set('valor_frete', e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Financeiro / Pagamento */}
              <div style={{ padding: '16px', borderRadius: '12px', background: 'hsl(var(--bg-main))', border: '1px solid hsl(var(--border))' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <CreditCard size={16} style={{ color: '#10b981' }} />
                  <span style={{ fontWeight: 700, fontSize: '13px', color: 'hsl(var(--text-main))' }}>Integração Financeira</span>
                  <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'hsl(var(--text-muted))' }}>Obrigatório</span>
                </div>

                {/* Integração */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                  {([
                    { value: 'new', label: 'Gerar nova fatura no Contas a Pagar' },
                    { value: 'existing', label: 'NF já lançada — não gerar duplicata' },
                  ] as { value: IntegracaoFinanceira; label: string }[]).map((opt) => {
                    const selected = formData.integracao_financeira === opt.value;
                    return (
                      <label key={opt.value} style={{ display: 'flex', gap: '10px', cursor: 'pointer', fontSize: '13px', alignItems: 'center', padding: '12px 14px', borderRadius: '12px', border: `1.5px solid ${selected ? '#10b981' : 'hsl(var(--border))'}`, background: selected ? 'hsl(141 71% 48% / 0.06)' : 'hsl(var(--bg-card))', transition: 'all 0.2s', fontWeight: selected ? 600 : 400 }}>
                        <input type="radio" name="fin_int" value={opt.value} checked={selected} onChange={() => set('integracao_financeira', opt.value)} style={{ accentColor: '#10b981', width: '15px', height: '15px', flexShrink: 0 }} />
                        <span style={{ lineHeight: 1.4 }}>{opt.label}</span>
                      </label>
                    );
                  })}
                </div>

                {/* Forma de pagamento — condicional */}
                {formData.integracao_financeira === 'new' && (
                  <div className="tauze-input-grid grid-col-2">
                    <div className="tauze-field-group">
                      <label className="tauze-label"><CreditCard size={14} /> Forma de Pagamento</label>
                      <select className="tauze-input" value={formData.forma_pagamento} onChange={(e) => set('forma_pagamento', e.target.value as FormaPagamento)}>
                        <option value="avista">À Vista</option>
                        <option value="prazo">A Prazo (parcela única)</option>
                        <option value="entrada_parcelas">Entrada + Parcelas</option>
                        <option value="troca">Troca de Gado</option>
                      </select>
                    </div>

                    {(formData.forma_pagamento === 'entrada_parcelas' || formData.forma_pagamento === 'prazo') && (
                      <>
                        <div className="tauze-field-group">
                          <label className="tauze-label"><Calendar size={14} /> 1º Vencimento</label>
                          <input type="date" className="tauze-input" value={formData.data_primeiro_vencimento} onChange={(e) => set('data_primeiro_vencimento', e.target.value)} />
                        </div>
                        {formData.forma_pagamento === 'entrada_parcelas' && (
                          <>
                            <div className="tauze-field-group">
                              <label className="tauze-label"><DollarSign size={14} /> Valor da Entrada (R$)</label>
                              <input type="number" className="tauze-input" placeholder="0,00" value={formData.valor_entrada} onChange={(e) => set('valor_entrada', e.target.value)} />
                            </div>
                            <div className="tauze-field-group">
                              <label className="tauze-label"><Hash size={14} /> Nº de Parcelas</label>
                              <input type="number" className="tauze-input" min="1" max="120" value={formData.num_parcelas} onChange={(e) => set('num_parcelas', e.target.value)} />
                            </div>
                            <div className="tauze-field-group">
                              <label className="tauze-label"><Calendar size={14} /> Intervalo (dias)</label>
                              <select className="tauze-input" value={formData.intervalo_parcelas_dias} onChange={(e) => set('intervalo_parcelas_dias', e.target.value)}>
                                <option value="30">30 dias</option>
                                <option value="60">60 dias</option>
                                <option value="90">90 dias</option>
                                <option value="180">180 dias</option>
                              </select>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              ETAPA 3 — Destino & Logística
          ══════════════════════════════════════════════════ */}
          {activeEtapa === 'destino' && (
            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Destino */}
              <div style={{ padding: '16px', borderRadius: '12px', background: 'hsl(var(--bg-main))', border: '1px solid hsl(var(--border))' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <MapPin size={16} style={{ color: '#8b5cf6' }} />
                  <span style={{ fontWeight: 700, fontSize: '13px', color: 'hsl(var(--text-main))' }}>Destino dos Animais</span>
                </div>
                <div className="tauze-input-grid grid-col-2">
                  <div className="tauze-field-group">
                    <label className="tauze-label"><MapPin size={14} /> Fazenda de Destino</label>
                    <select className="tauze-input" value={formData.fazenda_destino_id} onChange={(e) => { const f = fazendas.find((x) => x.id === e.target.value); set('fazenda_destino_id', e.target.value); set('fazenda_destino_nome', f?.nome || ''); }}>
                      <option value="">Selecione a fazenda...</option>
                      {fazendas.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
                    </select>
                  </div>
                  <div className="tauze-field-group">
                    <label className="tauze-label"><Layers size={14} /> Lote / Pasto de Destino</label>
                    <div style={{ position: 'relative' }}>
                      <input className="tauze-input" type="text" placeholder="Buscar lote cadastrado..." value={loteSearch} onChange={(e) => { setLoteSearch(e.target.value); set('lote_destino_id', ''); setShowLoteDrop(true); }} onFocus={() => setShowLoteDrop(true)} autoComplete="off" style={{ paddingRight: '36px' }} />
                      <Search size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-muted))', pointerEvents: 'none' }} />
                      {showLoteDrop && (
                        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, width: '100%', maxHeight: '160px', overflowY: 'auto', background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', zIndex: 999, boxShadow: '0 12px 40px rgba(0,0,0,0.2)' }}>
                          {filteredLotes.length === 0
                            ? <div style={{ padding: '12px', color: 'hsl(var(--text-muted))', fontSize: '13px', textAlign: 'center' }}>Nenhum lote encontrado</div>
                            : filteredLotes.map((l) => <div key={l.id} className="autocomplete-option" onClick={() => { set('lote_destino_id', l.id); set('lote_destino_nome', l.nome); setLoteSearch(l.nome); setShowLoteDrop(false); }} style={{ padding: '10px 14px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: 'hsl(var(--text-main))', borderBottom: '1px solid hsl(var(--border) / 0.5)' }}>{l.nome}</div>)
                          }
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="tauze-field-group">
                    <label className="tauze-label"><Target size={14} /> Categoria Predominante</label>
                    <select className="tauze-input" value={formData.categoria_predominante} onChange={(e) => set('categoria_predominante', e.target.value)}>
                      <option value="">Selecione...</option>
                      <option value="Bezerro">Bezerro (0–12m)</option>
                      <option value="Novilha">Novilha (13–24m)</option>
                      <option value="Garrote">Garrote (13–24m)</option>
                      <option value="Boi">Boi (25–36m)</option>
                      <option value="Vaca">Vaca (&gt; 36m)</option>
                      <option value="Touro">Touro (&gt; 36m)</option>
                      <option value="Misto">Misto</option>
                    </select>
                  </div>
                  <div className="tauze-field-group">
                    <label className="tauze-label"><Layers size={14} /> Raça Predominante</label>
                    <select className="tauze-input" value={formData.raca_predominante} onChange={(e) => set('raca_predominante', e.target.value)}>
                      <option value="">Selecione...</option>
                      <option value="Nelore">Nelore</option>
                      <option value="Angus">Angus</option>
                      <option value="Brahman">Brahman</option>
                      <option value="Gir">Gir</option>
                      <option value="Girolando">Girolando</option>
                      <option value="Cruzamento Industrial">Cruzamento Industrial</option>
                      <option value="Misto">Misto</option>
                    </select>
                  </div>
                  <div className="tauze-field-group">
                    <label className="tauze-label"><Target size={14} /> Finalidade / Aptidão</label>
                    <select className="tauze-input" value={formData.finalidade} onChange={(e) => set('finalidade', e.target.value)}>
                      <option value="">Selecione...</option>
                      <option value="Corte (Engorda)">Corte — Engorda</option>
                      <option value="Corte (Cria)">Corte — Cria</option>
                      <option value="Leite">Leite</option>
                      <option value="Genética">Genética / Melhoramento</option>
                      <option value="Reprodução">Reprodução</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Logística / Transporte */}
              <div style={{ padding: '16px', borderRadius: '12px', background: 'hsl(var(--bg-main))', border: '1px solid hsl(var(--border))' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <Car size={16} style={{ color: '#8b5cf6' }} />
                  <span style={{ fontWeight: 700, fontSize: '13px', color: 'hsl(var(--text-main))' }}>Logística & Transporte</span>
                </div>
                <div className="tauze-input-grid grid-col-2">
                  <div className="tauze-field-group">
                    <label className="tauze-label"><Truck size={14} /> Transportadora</label>
                    <input type="text" className="tauze-input" placeholder="Nome / CNPJ" value={formData.transportadora} onChange={(e) => set('transportadora', e.target.value)} />
                  </div>
                  <div className="tauze-field-group">
                    <label className="tauze-label"><User size={14} /> Motorista</label>
                    <input type="text" className="tauze-input" placeholder="Nome do motorista" value={formData.motorista} onChange={(e) => set('motorista', e.target.value)} />
                  </div>
                  <div className="tauze-field-group">
                    <label className="tauze-label"><Car size={14} /> Placa do Veículo</label>
                    <input type="text" className="tauze-input" placeholder="Ex: ABC-1234" value={formData.placa_veiculo} onChange={(e) => set('placa_veiculo', e.target.value.toUpperCase())} />
                  </div>
                  <div className="tauze-field-group">
                    <label className="tauze-label"><ShieldCheck size={14} /> Frete por Conta</label>
                    <select className="tauze-input" value={formData.frete_por_conta} onChange={(e) => set('frete_por_conta', e.target.value as 'CIF' | 'FOB')}>
                      <option value="CIF">CIF — Vendedor arca com o frete</option>
                      <option value="FOB">FOB — Comprador arca com o frete</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Sanidade / Quarentena */}
              <div style={{ padding: '16px', borderRadius: '12px', background: 'hsl(var(--bg-main))', border: `1px solid ${formData.exige_quarentena ? 'hsl(38 92% 50% / 0.4)' : 'hsl(var(--border))'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <FlaskConical size={16} style={{ color: '#f59e0b' }} />
                  <span style={{ fontWeight: 700, fontSize: '13px', color: 'hsl(var(--text-main))' }}>Protocolo Sanitário de Entrada</span>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>
                  <input type="checkbox" checked={formData.exige_quarentena} onChange={(e) => set('exige_quarentena', e.target.checked)} style={{ accentColor: '#f59e0b', width: '16px', height: '16px' }} />
                  Este lote deve entrar em quarentena sanitária
                </label>
                {formData.exige_quarentena && (
                  <div className="tauze-input-grid grid-col-2">
                    <div className="tauze-field-group">
                      <label className="tauze-label"><Calendar size={14} /> Dias de Quarentena</label>
                      <select className="tauze-input" value={formData.dias_quarentena} onChange={(e) => set('dias_quarentena', e.target.value)}>
                        <option value="7">7 dias</option>
                        <option value="14">14 dias (padrão)</option>
                        <option value="21">21 dias</option>
                        <option value="30">30 dias</option>
                      </select>
                    </div>
                    <div style={{ padding: '12px 14px', background: 'hsl(38 92% 50% / 0.08)', border: '1px solid hsl(38 92% 50% / 0.25)', borderRadius: '10px', fontSize: '12px', color: 'hsl(38 92% 30%)', lineHeight: 1.5 }}>
                      <strong>⚠️ Os animais serão criados com status QUARENTENA</strong> e ficarão inacessíveis para movimentação até liberação pelo veterinário.
                    </div>
                  </div>
                )}
              </div>

              {/* Observações */}
              <div className="tauze-field-group">
                <label className="tauze-label"><FileText size={14} /> Observações Gerais</label>
                <textarea className="tauze-input tauze-textarea" placeholder="Notas adicionais sobre a compra, condições especiais, etc." value={formData.observacoes} onChange={(e) => set('observacoes', e.target.value)} rows={2} />
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              ETAPA 4 — Entrada dos Animais (Desmembramento)
          ══════════════════════════════════════════════════ */}
          {activeEtapa === 'desmembramento' && (
            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Sub-tabs */}
              <div className="tauze-tab-group">
                {([
                  { id: 'media', label: 'Lote Fechado (Média)', icon: Calculator },
                  { id: 'grid', label: 'Digitação Rápida', icon: Keyboard },
                  { id: 'excel', label: 'Importar Planilha', icon: FileSpreadsheet },
                ] as { id: DesmMode; label: string; icon: React.FC<any> }[]).map(({ id, label, icon: Icon }) => (
                  <button key={id} type="button" className={`tauze-tab-item ${formData.desm_mode === id ? 'active' : ''}`} onClick={() => set('desm_mode', id)}>
                    <Icon size={14} style={{ marginRight: '4px' }} />{label}
                  </button>
                ))}
              </div>

              {/* ─── Modo: Lote Fechado ─── */}
              {formData.desm_mode === 'media' && (
                <div>
                  <p style={{ color: 'hsl(var(--text-muted))', fontSize: '13px', marginBottom: '16px' }}>
                    Fichas provisórias serão criadas automaticamente com brincos sequenciais.
                    Ao passarem pelo tronco pela primeira vez, o brinco visual e peso individuais são atualizados.
                  </p>
                  <div style={{ padding: '16px', background: 'hsl(var(--brand) / 0.08)', border: '1.5px solid hsl(var(--brand) / 0.3)', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <Info size={16} style={{ color: 'hsl(var(--brand))' }} />
                      <span style={{ fontWeight: 700, fontSize: '13px', color: 'hsl(var(--brand))' }}>Resumo do Lote que será criado</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                      {[
                        { label: 'Animais', value: formData.quantidade_cabecas || '—' },
                        { label: 'Peso médio', value: pesoMedio ? `${pesoMedio.toFixed(1)} kg` : '—' },
                        { label: 'Status', value: formData.exige_quarentena ? 'QUARENTENA' : 'ATIVO' },
                      ].map((item) => (
                        <div key={item.label} style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginBottom: '2px' }}>{item.label}</div>
                          <div style={{ fontWeight: 800, fontSize: '16px', color: 'hsl(var(--text-main))' }}>{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ─── Modo: Digitação Rápida + Gerador de Sequência ─── */}
              {formData.desm_mode === 'grid' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                  {/* ── Gerador de Sequência ── */}
                  <div style={{
                    padding: '16px', borderRadius: '14px',
                    background: 'linear-gradient(135deg, hsl(220 60% 12%), hsl(220 50% 10%))',
                    border: '1px solid hsl(220 50% 22%)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                      <div style={{ width: '28px', height: '28px', background: 'hsl(var(--brand))', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Hash size={15} color="white" />
                      </div>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: '13px', color: '#fff' }}>Gerador Automático de Brincos</span>
                        <span style={{ fontSize: '11px', color: 'hsl(220 30% 65%)', marginLeft: '8px' }}>Preferências salvas por fazenda</span>
                      </div>
                    </div>

                    {/* Campos do gerador */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 1fr', gap: '10px', marginBottom: '12px' }}>
                      <div className="tauze-field-group">
                        <label style={{ fontSize: '11px', fontWeight: 600, color: 'hsl(220 30% 65%)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '5px', display: 'block' }}>Prefixo</label>
                        <input
                          type="text" className="tauze-input" placeholder="Ex: FAZ- ou GTA-"
                          style={{ fontSize: '13px' }}
                          value={seqConfig.prefixo}
                          onChange={(e) => setSeq('prefixo', e.target.value)}
                          maxLength={10}
                        />
                      </div>
                      <div className="tauze-field-group">
                        <label style={{ fontSize: '11px', fontWeight: 600, color: 'hsl(220 30% 65%)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '5px', display: 'block' }}>Número Inicial</label>
                        <input
                          type="number" className="tauze-input" placeholder="1" min="0"
                          style={{ fontSize: '13px' }}
                          value={seqConfig.numInicial}
                          onChange={(e) => setSeq('numInicial', parseInt(e.target.value) || 1)}
                        />
                      </div>
                      <div className="tauze-field-group">
                        <label style={{ fontSize: '11px', fontWeight: 600, color: 'hsl(220 30% 65%)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '5px', display: 'block' }}>Dígitos</label>
                        <select className="tauze-input" style={{ fontSize: '13px' }} value={seqConfig.digitos} onChange={(e) => setSeq('digitos', parseInt(e.target.value))}>
                          <option value={2}>2</option>
                          <option value={3}>3</option>
                          <option value={4}>4</option>
                          <option value={5}>5</option>
                        </select>
                      </div>
                      <div className="tauze-field-group">
                        <label style={{ fontSize: '11px', fontWeight: 600, color: 'hsl(220 30% 65%)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '5px', display: 'block' }}>Sufixo</label>
                        <input
                          type="text" className="tauze-input" placeholder="Ex: -A ou /26"
                          style={{ fontSize: '13px' }}
                          value={seqConfig.sufixo}
                          onChange={(e) => setSeq('sufixo', e.target.value)}
                          maxLength={10}
                        />
                      </div>
                    </div>

                    {/* Configuração RFID Opcional */}
                    <div style={{ marginTop: '10px', marginBottom: '14px', padding: '10px 14px', background: 'hsl(0 0% 0% / 0.15)', borderRadius: '8px', border: '1px solid hsl(220 50% 18%)' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#fff', marginBottom: seqConfig.gerarRfid ? '12px' : '0' }}>
                        <input type="checkbox" checked={seqConfig.gerarRfid} onChange={(e) => setSeq('gerarRfid', e.target.checked)} style={{ accentColor: 'hsl(var(--brand))', width: '14px', height: '14px' }} />
                        Gerar sequência de RFID (SISBOV)
                      </label>
                      {seqConfig.gerarRfid && (
                        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 80px', gap: '10px' }}>
                          <div className="tauze-field-group">
                            <label style={{ fontSize: '10px', fontWeight: 600, color: 'hsl(220 30% 65%)', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Prefixo (Ex: 982)</label>
                            <input type="text" className="tauze-input" style={{ fontSize: '12px', padding: '6px 8px' }} value={seqConfig.rfidPrefixo} onChange={(e) => setSeq('rfidPrefixo', e.target.value)} />
                          </div>
                          <div className="tauze-field-group">
                            <label style={{ fontSize: '10px', fontWeight: 600, color: 'hsl(220 30% 65%)', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Nº Inicial Sequência</label>
                            <input type="number" className="tauze-input" style={{ fontSize: '12px', padding: '6px 8px' }} value={seqConfig.rfidNumInicial} onChange={(e) => setSeq('rfidNumInicial', parseInt(e.target.value) || 1)} />
                          </div>
                          <div className="tauze-field-group">
                            <label style={{ fontSize: '10px', fontWeight: 600, color: 'hsl(220 30% 65%)', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Zeros</label>
                            <select className="tauze-input" style={{ fontSize: '12px', padding: '6px 8px' }} value={seqConfig.rfidDigitos} onChange={(e) => setSeq('rfidDigitos', parseInt(e.target.value))}>
                              <option value={8}>8</option>
                              <option value={10}>10</option>
                              <option value={12}>12</option>
                              <option value={14}>14</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Preview da sequência */}
                    {seqPreview && (
                      <div style={{
                        padding: '10px 14px', background: 'hsl(220 50% 8%)', borderRadius: '10px',
                        border: '1px solid hsl(220 50% 20%)', marginBottom: '12px',
                        display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap',
                      }}>
                        <span style={{ fontSize: '11px', color: 'hsl(220 30% 55%)', fontWeight: 600 }}>PRÉVIA:</span>
                        {[
                          seqPreview.first,
                          seqPreview.second,
                          seqPreview.qty > 3 ? '...' : null,
                          seqPreview.last,
                        ].filter(Boolean).map((v, i) => (
                          <span key={i} style={{
                            fontFamily: 'monospace', fontWeight: 700, fontSize: '13px',
                            color: v === '...' ? 'hsl(220 30% 55%)' : 'hsl(var(--brand))',
                            background: v === '...' ? 'transparent' : 'hsl(var(--brand) / 0.12)',
                            padding: v === '...' ? '0' : '3px 8px', borderRadius: '6px',
                          }}>{v}</span>
                        ))}
                        <span style={{ fontSize: '11px', color: 'hsl(220 30% 55%)', marginLeft: 'auto' }}>{seqPreview.qty} brincos</span>
                      </div>
                    )}

                    {/* Defaults de sexo e peso */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                      <div className="tauze-field-group">
                        <label style={{ fontSize: '11px', fontWeight: 600, color: 'hsl(220 30% 65%)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '5px', display: 'block' }}>Sexo Padrão</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {[{ v: 'M', l: '♂ Macho' }, { v: 'F', l: '♀ Fêmea' }].map(({ v, l }) => (
                            <button key={v} type="button"
                              onClick={() => setSeq('sexoPadrao', v)}
                              style={{
                                flex: 1, padding: '8px', borderRadius: '8px', border: '1.5px solid',
                                borderColor: seqConfig.sexoPadrao === v ? 'hsl(var(--brand))' : 'hsl(220 40% 22%)',
                                background: seqConfig.sexoPadrao === v ? 'hsl(var(--brand) / 0.15)' : 'transparent',
                                color: seqConfig.sexoPadrao === v ? 'hsl(var(--brand))' : 'hsl(220 30% 60%)',
                                fontWeight: 700, fontSize: '12px', cursor: 'pointer', transition: 'all 0.15s',
                              }}>{l}</button>
                          ))}
                        </div>
                      </div>
                      <div className="tauze-field-group">
                        <label style={{ fontSize: '11px', fontWeight: 600, color: 'hsl(220 30% 65%)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '5px', display: 'block' }}>Peso Padrão (kg)</label>
                        <input
                          type="number" className="tauze-input"
                          placeholder={pesoMedio ? `${pesoMedio.toFixed(1)} (médio calculado)` : 'Ex: 350'}
                          style={{ fontSize: '13px' }}
                          value={seqConfig.pesoPadrao}
                          onChange={(e) => setSeq('pesoPadrao', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Botão gerar */}
                    <button
                      type="button"
                      className="primary-btn"
                      style={{ width: '100%', fontSize: '13px', fontWeight: 800, letterSpacing: '0.04em' }}
                      onClick={generateSequence}
                    >
                      <Hash size={16} />
                      GERAR {formData.quantidade_cabecas || '?'} BRINCOS AUTOMATICAMENTE
                    </button>
                  </div>

                  {/* ── Controles em massa ── */}
                  {formData.animais_grid.length > 0 && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
                      padding: '10px 14px', borderRadius: '10px',
                      background: 'hsl(var(--bg-main))', border: '1px solid hsl(var(--border))',
                    }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'hsl(var(--text-muted))' }}>Preencher todos:</span>
                      <button type="button" className="glass-btn secondary" style={{ fontSize: '12px', padding: '5px 12px' }} onClick={() => massSetSexo('M')}>♂ Todos Machos</button>
                      <button type="button" className="glass-btn secondary" style={{ fontSize: '12px', padding: '5px 12px' }} onClick={() => massSetSexo('F')}>♀ Todas Fêmeas</button>
                      <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto', alignItems: 'center' }}>
                        <input
                          type="number" className="tauze-input" placeholder="Peso único (kg)" min="0"
                          style={{ fontSize: '12px', width: '150px' }}
                          value={massWeightInput}
                          onChange={(e) => setMassWeightInput(e.target.value)}
                        />
                        <button type="button" className="glass-btn secondary" style={{ fontSize: '12px', padding: '5px 12px', whiteSpace: 'nowrap' }}
                          onClick={() => { if (massWeightInput) { massSetPeso(massWeightInput); } }}>
                          Aplicar Peso
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── Cabeçalho da grid ── */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'hsl(var(--text-main))' }}>
                        Animais na grid
                      </span>
                      {formData.quantidade_cabecas && (
                        <span style={{
                          fontWeight: 700, fontSize: '12px', padding: '3px 10px', borderRadius: '20px',
                          background: formData.animais_grid.filter(a => a.brinco).length >= parseInt(formData.quantidade_cabecas)
                            ? 'hsl(141 71% 48% / 0.15)' : 'hsl(38 92% 50% / 0.12)',
                          color: formData.animais_grid.filter(a => a.brinco).length >= parseInt(formData.quantidade_cabecas)
                            ? 'hsl(141 71% 38%)' : 'hsl(38 92% 40%)',
                        }}>
                          {formData.animais_grid.filter(a => a.brinco).length} / {formData.quantidade_cabecas} identificados
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button type="button" className="glass-btn secondary" style={{ fontSize: '12px' }}
                        onClick={() => setFormData((prev) => ({ ...prev, animais_grid: [...prev.animais_grid, ...Array(5).fill(null).map(() => ({ brinco: '', rfid: '', sexo: seqConfig.sexoPadrao, peso: seqConfig.pesoPadrao }))] }))}>
                        <Plus size={13} /> +5 Linhas
                      </button>
                      {formData.animais_grid.length > 0 && (
                        <button type="button" className="glass-btn secondary" style={{ fontSize: '12px', color: '#ef4444' }}
                          onClick={() => { if (window.confirm('Limpar toda a grid?')) setFormData((prev) => ({ ...prev, animais_grid: [] })); }}>
                          <Trash2 size={13} /> Limpar
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ── Grid ── */}
                  {formData.animais_grid.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px', color: 'hsl(var(--text-muted))', fontSize: '13px', background: 'hsl(var(--bg-main))', borderRadius: '12px', border: '1px dashed hsl(var(--border))' }}>
                      Use o Gerador acima para criar os brincos automaticamente,<br />ou clique em <strong>+5 Linhas</strong> para digitar manualmente.
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto', maxHeight: '380px', overflowY: 'auto', borderRadius: '12px', border: '1px solid hsl(var(--border))' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <thead style={{ position: 'sticky', top: 0, background: 'hsl(var(--bg-card))', zIndex: 2 }}>
                          <tr style={{ borderBottom: '2px solid hsl(var(--border))' }}>
                            {['#', 'Brinco Visual *', 'RFID (Eletrônico)', 'Sexo', 'Peso (kg)', ''].map((h) => (
                              <th key={h} style={{ padding: '10px 8px', textAlign: 'left', fontWeight: 700, color: 'hsl(var(--text-muted))', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {formData.animais_grid.map((row, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid hsl(var(--border) / 0.4)', background: idx % 2 === 0 ? 'transparent' : 'hsl(var(--bg-main) / 0.5)' }}>
                              <td style={{ padding: '5px 8px', color: 'hsl(var(--text-muted))', fontSize: '11px', width: '30px', textAlign: 'center', fontWeight: 600 }}>{idx + 1}</td>
                              <td style={{ padding: '4px 4px' }}>
                                <input
                                  type="text" className="tauze-input"
                                  placeholder="Ex: FAZ-001"
                                  style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.02em' }}
                                  value={row.brinco}
                                  onChange={(e) => { const g = [...formData.animais_grid]; g[idx] = { ...g[idx], brinco: e.target.value }; set('animais_grid', g); }}
                                />
                              </td>
                              <td style={{ padding: '4px 4px' }}>
                                <input
                                  type="text" className="tauze-input" placeholder="982000..."
                                  style={{ fontSize: '12px', fontFamily: 'monospace' }}
                                  value={row.rfid}
                                  onChange={(e) => { const g = [...formData.animais_grid]; g[idx] = { ...g[idx], rfid: e.target.value }; set('animais_grid', g); }}
                                />
                              </td>
                              <td style={{ padding: '4px', width: '90px' }}>
                                <select className="tauze-input" style={{ fontSize: '12px' }} value={row.sexo}
                                  onChange={(e) => { const g = [...formData.animais_grid]; g[idx] = { ...g[idx], sexo: e.target.value }; set('animais_grid', g); }}>
                                  <option value="M">♂ M</option>
                                  <option value="F">♀ F</option>
                                </select>
                              </td>
                              <td style={{ padding: '4px', width: '90px' }}>
                                <input type="number" className="tauze-input" placeholder="0.0"
                                  style={{ fontSize: '12px' }}
                                  value={row.peso}
                                  onChange={(e) => { const g = [...formData.animais_grid]; g[idx] = { ...g[idx], peso: e.target.value }; set('animais_grid', g); }}
                                />
                              </td>
                              <td style={{ padding: '4px', textAlign: 'center', width: '36px' }}>
                                <button type="button" className="action-dot delete" style={{ width: '26px', height: '26px' }}
                                  onClick={() => { const g = formData.animais_grid.filter((_, i) => i !== idx); set('animais_grid', g); }}>
                                  <Trash2 size={11} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ─── Modo: Importar Planilha ─── */}
              {formData.desm_mode === 'excel' && (
                <div>
                  <p style={{ color: 'hsl(var(--text-muted))', fontSize: '13px', marginBottom: '16px' }}>
                    Colunas obrigatórias: <strong>Brinco, Sexo, Peso</strong>. Opcionais: RFID, Data Nascimento.
                  </p>
                  <div style={{ border: '2px dashed hsl(var(--border))', borderRadius: '12px', padding: '48px 24px', textAlign: 'center', cursor: 'pointer', background: 'hsl(var(--bg-main))' }}>
                    <Upload size={32} style={{ color: 'hsl(var(--text-muted))', margin: '0 auto 12px' }} />
                    <p style={{ fontWeight: 600, marginBottom: '8px', color: 'hsl(var(--text-main))' }}>Clique para selecionar ou arraste o arquivo aqui</p>
                    <p style={{ fontSize: '13px', color: 'hsl(var(--text-muted))' }}>.xlsx · .xls · .csv</p>
                  </div>
                  <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="button" className="glass-btn secondary" style={{ fontSize: '13px' }}>Baixar Planilha Modelo</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </SidePanel>
  );
};
