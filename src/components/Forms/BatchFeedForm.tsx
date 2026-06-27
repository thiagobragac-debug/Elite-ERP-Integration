import React, { useState, useEffect, useMemo } from 'react';
import { SidePanel } from '../Layout/SidePanel';
import { SearchableSelect } from './SearchableSelect';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Wheat,
  FileText,
  Plus,
  Trash2,
  Tag,
  Layers,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  Info,
  Package,
  Users,
  Scale,
  TrendingUp,
  TrendingDown,
  Minus,
  ListChecks,
  Loader2,
  Download,
} from 'lucide-react';
import { DateInput } from '../../components/Form/DateInput';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BatchFeedFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any[]) => void;
}

interface LoteData {
  id: string;
  nome: string;
  num_animais?: number;
  peso_medio?: number;
}

interface FeedLine {
  id: string;
  lote_id: string;
  animal_id: string;
  quantidade_kg: string;
  sugerido_kg: number | null;
}

interface Dieta {
  id: string;
  nome: string;
  tipo: string;
  consumo_esperado?: number;
  percentual_ms?: number;
  custo_por_kg?: number;
  ingredientes?: any[];
}

interface Produto {
  id: string;
  nome: string;
  estoque_atual: number;
  unidade_medida: string;
}

type Etapa = 0 | 1 | 2;

// ─── Etapas ──────────────────────────────────────────────────────────────────

const ETAPAS = [
  { id: 0, icon: Tag,        nome: '1. Dados do Trato',       descricao: 'Data, dieta e depósito de origem' },
  { id: 1, icon: Layers,     nome: '2. Distribuição por Lote', descricao: 'Quantidade consumida por lote/curral' },
  { id: 2, icon: CheckCircle2, nome: '3. Revisão & Confirmação', descricao: 'Resumo de estoque e custo antes de confirmar' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmtKg = (v: number) => `${v.toFixed(1)} kg`;
const fmtBrl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function calcSugerido(lote: LoteData, dieta: Dieta | null): number | null {
  if (!dieta || !dieta.consumo_esperado || !lote.num_animais) return null;
  const isSalMineral = dieta.tipo === 'Sal Mineral';
  if (isSalMineral) {
    // consumo_esperado em g/cabeça/dia → converter para kg
    return (dieta.consumo_esperado * lote.num_animais) / 1000;
  }
  // consumo_esperado em % do PV
  const pesoMedio = lote.peso_medio || 0;
  return (dieta.consumo_esperado / 100) * pesoMedio * lote.num_animais;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export const BatchFeedForm: React.FC<BatchFeedFormProps> = ({ isOpen, onClose, onSubmit }) => {
  const { activeTenantId } = useTenant();
  const { applyFarmFilter } = useFarmFilter();

  // ─── Step state ────────────────────────────────────────────────────────────
  const [etapa, setEtapa] = useState<Etapa>(0);
  const [stepError, setStepError] = useState<string | null>(null);

  // ─── Form data ─────────────────────────────────────────────────────────────
  const [dataTrato, setDataTrato] = useState(
    new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]
  );
  const [dietaId, setDietaId] = useState('');
  const [depositoId, setDepositoId] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [mode, setMode] = useState<'LOTE' | 'ANIMAL'>('LOTE');
  const [items, setItems] = useState<FeedLine[]>([]);

  // ─── Reference data ────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [loadingLotes, setLoadingLotes] = useState(false);
  const [lotes, setLotes] = useState<LoteData[]>([]);
  const [animais, setAnimais] = useState<any[]>([]);
  const [dietas, setDietas] = useState<Dieta[]>([]);
  const [depositos, setDepositos] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);

  // ─── Derived ───────────────────────────────────────────────────────────────
  const selectedDieta = useMemo(() => dietas.find(d => String(d.id) === String(dietaId)) || null, [dietas, dietaId]);
  const selectedDeposito = useMemo(() => depositos.find(d => String(d.id) === String(depositoId)) || null, [depositos, depositoId]);

  // ─── Reset on open ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    setEtapa(0);
    setStepError(null);
    setDietaId('');
    setDepositoId('');
    setObservacoes('');
    setItems([]);
    setMode('LOTE');
    setDataTrato(
      new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]
    );
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // ─── Re-calculate suggestions when diet changes ────────────────────────────
  useEffect(() => {
    if (items.length === 0) return;
    setItems(prev => prev.map(item => {
      const lote = lotes.find(l => String(l.id) === String(item.lote_id));
      const sugerido = lote ? calcSugerido(lote, selectedDieta) : null;
      return { ...item, sugerido_kg: sugerido };
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dietaId, selectedDieta]);

  // ─── Fetch all reference data ──────────────────────────────────────────────
  const fetchData = async () => {
    setLoadingLotes(true);
    try {
      const [lotesRes, animaisRes, dietasRes, depRes, prodRes] = await Promise.all([
        applyFarmFilter(
          supabase.from('lotes').select('id, nome, capacidade').eq('status', 'ATIVO')
        ),
        applyFarmFilter(
          supabase.from('animais').select('id, brinco, brinco_eletronico, raca, categoria, lote_id, peso_atual').eq('status', 'Ativo')
        ),
        applyFarmFilter(
          supabase.from('dietas').select('id, nome, tipo, consumo_esperado, percentual_ms, custo_por_kg, ingredientes').eq('status', 'active')
        ),
        applyFarmFilter(
          supabase.from('depositos').select('id, nome').eq('status', 'ativo')
        ),
        applyFarmFilter(
          supabase.from('produtos').select('id, nome, estoque_atual, unidade_medida')
        ),
      ]);

      const animaisData: any[] = animaisRes.data || [];

      // Enrich lots with actual animal count and average weight from animais table
      const enrichedLotes: LoteData[] = (lotesRes.data || []).map((l: any) => {
        const lotAnimais = animaisData.filter(a => String(a.lote_id) === String(l.id));
        const weights = lotAnimais.map(a => Number(a.peso_atual || 0)).filter(w => w > 0);
        return {
          id: l.id,
          nome: l.nome,
          num_animais: lotAnimais.length,
          peso_medio: weights.length > 0 ? weights.reduce((s, w) => s + w, 0) / weights.length : 0,
        };
      });

      setLotes(enrichedLotes);
      setAnimais(animaisData);
      setDietas(dietasRes.data || []);
      setDepositos(depRes.data || []);
      setProdutos(prodRes.data || []);
    } finally {
      setLoadingLotes(false);
    }
  };

  // ─── CRUD lines ────────────────────────────────────────────────────────────
  const handleAddItem = () => {
    setItems(prev => [
      ...prev,
      { id: Date.now().toString(), lote_id: '', animal_id: '', quantidade_kg: '', sugerido_kg: null },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: string, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      if (field === 'lote_id') {
        const lote = lotes.find(l => String(l.id) === String(value));
        updated.sugerido_kg = lote ? calcSugerido(lote, selectedDieta) : null;
      }
      return updated;
    }));
  };

  // ─── Load all active lots ─────────────────────────────────────────────────
  const handleLoadAllLotes = () => {
    const existing = new Set(items.map(i => i.lote_id));
    const toAdd = lotes.filter(l => !existing.has(String(l.id)));
    const newLines: FeedLine[] = toAdd.map(l => ({
      id: `${l.id}-${Date.now()}`,
      lote_id: String(l.id),
      animal_id: '',
      quantidade_kg: '',
      sugerido_kg: calcSugerido(l, selectedDieta),
    }));
    setItems(prev => [...prev, ...newLines]);
  };

  const handleFillAllSuggested = () => {
    setItems(prev => prev.map(item => ({
      ...item,
      quantidade_kg: item.sugerido_kg != null ? item.sugerido_kg.toFixed(1) : item.quantidade_kg,
    })));
  };

  // ─── Stock breakdown for review ────────────────────────────────────────────
  const stockBreakdown = useMemo(() => {
    if (!selectedDieta || items.length === 0) return [];

    const ingredientes = selectedDieta.ingredientes || [];
    const totalProporcao = ingredientes.reduce((s: number, c: any) => s + Number(c.quantidade || 0), 0);
    if (totalProporcao <= 0) return [];

    const totalKg = items.reduce((s, i) => s + (parseFloat(i.quantidade_kg) || 0), 0);

    return ingredientes.map((comp: any) => {
      const pctNormalizado = Number(comp.quantidade || 0) / totalProporcao;
      const qtdBaixar = pctNormalizado * totalKg;
      const produto = produtos.find(p => String(p.id) === String(comp.produto_id));
      const saldoAtual = Number(produto?.estoque_atual || 0);
      const saldoApos = saldoAtual - qtdBaixar;
      return {
        nome: comp.nome || produto?.nome || 'Ingrediente',
        qtdBaixar,
        saldoAtual,
        saldoApos,
        unidade: produto?.unidade_medida || 'kg',
        insufficiente: saldoApos < 0,
      };
    });
  }, [selectedDieta, items, produtos]);

  const totalKg = useMemo(() => items.reduce((s, i) => s + (parseFloat(i.quantidade_kg) || 0), 0), [items]);
  const custoTotal = useMemo(() => {
    if (!selectedDieta?.custo_por_kg) return 0;
    return totalKg * Number(selectedDieta.custo_por_kg);
  }, [totalKg, selectedDieta]);

  const hasStockIssue = useMemo(() => stockBreakdown.some(b => b.insufficiente), [stockBreakdown]);

  // ─── Stepper validation ────────────────────────────────────────────────────
  const validateStep = (step: Etapa): string | null => {
    if (step === 0) {
      if (!dataTrato) return 'A data do trato é obrigatória.';
      if (!dietaId) return 'Selecione a dieta fornecida.';
      if (!depositoId) return 'Selecione o depósito de origem.';
    }
    if (step === 1) {
      if (items.length === 0) return 'Adicione pelo menos um lote/animal.';
      const incomplete = items.some(i =>
        (mode === 'LOTE' ? !i.lote_id : !i.animal_id) || !i.quantidade_kg || parseFloat(i.quantidade_kg) <= 0
      );
      if (incomplete) return 'Preencha lote e quantidade em todas as linhas.';
    }
    return null;
  };

  const handleNext = () => {
    const err = validateStep(etapa);
    if (err) { setStepError(err); return; }
    setStepError(null);
    setEtapa(s => Math.min(s + 1, 2) as Etapa);
  };

  const handlePrev = () => {
    setStepError(null);
    setEtapa(s => Math.max(s - 1, 0) as Etapa);
  };

  // ─── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (hasStockIssue) {
      toast.error('Saldo insuficiente em um ou mais ingredientes. Revise as quantidades.');
      return;
    }

    setLoading(true);
    try {
      const ingredientes = selectedDieta?.ingredientes || [];
      const totalProporcao = ingredientes.reduce((s: number, c: any) => s + Number(c.quantidade || 0), 0);

      const payloads = items
        .filter(i => (mode === 'LOTE' ? i.lote_id : i.animal_id) && parseFloat(i.quantidade_kg) > 0)
        .map(item => {
          const insumos = ingredientes.map((comp: any) => {
            const pctNorm = totalProporcao > 0 ? Number(comp.quantidade) / totalProporcao : 0;
            const qtdInsumo = pctNorm * parseFloat(item.quantidade_kg);
            return {
              produto_id: comp.produto_id,
              quantidade: isNaN(qtdInsumo) ? 0 : qtdInsumo,
              deposito_id: depositoId || comp.deposito_id || null,
              custo_medio: comp.custo_medio || 0,
            };
          });

          return {
            lote_id: mode === 'LOTE' ? item.lote_id : null,
            animal_id: mode === 'ANIMAL' ? item.animal_id : null,
            dieta_id: dietaId,
            data_trato: dataTrato,
            deposito_id: depositoId,
            observacoes: observacoes || 'Lançamento via Planilha de Trato',
            insumos,
          };
        });

      if (payloads.length === 0) throw new Error('Nenhum lote preenchido corretamente.');
      await onSubmit(payloads);
    } finally {
      setLoading(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────
  const etapaCompleta = (e: Etapa) => validateStep(e) === null;

  return (
    <SidePanel
      size="xlarge"
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Planilha de Trato (Nutrição)"
      subtitle="Lance o consumo de trato para múltiplos lotes de uma vez."
      icon={Wheat}
      loading={loading}
      submitLabel="Lançar Trato e Baixar Estoque"
      submitDisabled={etapa < 2}
    >
      <div style={{ display: 'flex', gap: '24px' }}>

        {/* ── Stepper Lateral ─────────────────────────────────────────────── */}
        <div style={{ width: '210px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {ETAPAS.map((et, idx) => {
            const isActive = etapa === idx;
            const isCompleted = etapaCompleta(idx as Etapa);
            const Icon = et.icon;
            return (
              <button
                key={et.id}
                type="button"
                onClick={() => {
                  let canGo = true;
                  for (let i = 0; i < idx; i++) {
                    if (!etapaCompleta(i as Etapa)) canGo = false;
                  }
                  if (canGo) { setStepError(null); setEtapa(idx as Etapa); }
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px', borderRadius: '12px', border: 'none',
                  background: isActive ? 'hsl(217 91% 50% / 0.15)' : 'transparent',
                  color: isActive ? 'hsl(217 91% 50%)' : 'hsl(var(--text-secondary))',
                  cursor: 'pointer', textAlign: 'left',
                  fontWeight: isActive ? 700 : 500, transition: 'all 0.2s',
                  boxShadow: isActive ? 'inset 3px 0 0 hsl(217 91% 50%)' : 'none',
                }}
              >
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  background: isCompleted ? 'hsl(217 91% 50%)' : isActive ? 'hsl(217 91% 50% / 0.3)' : 'hsl(var(--bg-main))',
                  color: isCompleted ? '#fff' : isActive ? 'hsl(217 91% 50%)' : 'hsl(var(--text-muted))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {isCompleted ? <CheckCircle2 size={16} /> : <Icon size={16} />}
                </div>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '13px' }}>{et.nome}</span>
                  {isActive && <span style={{ fontSize: '10px', opacity: 0.8, marginTop: '2px', lineHeight: '1.2' }}>{et.descricao}</span>}
                </div>
                {isActive && <ChevronRight size={16} opacity={0.5} />}
              </button>
            );
          })}
        </div>

        {/* ── Conteúdo da Etapa ───────────────────────────────────────────── */}
        <div style={{ flex: 1, minWidth: 0, background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border))', borderRadius: '16px', padding: '24px' }}>

          {/* Cabeçalho da etapa */}
          <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid hsl(var(--border))' }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {ETAPAS[etapa].nome}
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'hsl(var(--text-muted))' }}>
              {ETAPAS[etapa].descricao}
            </p>
          </div>

          {/* Alerta de validação */}
          <AnimatePresence>
            {stepError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', fontSize: '13px', fontWeight: 600, overflow: 'hidden' }}
              >
                <AlertTriangle size={14} /> {stepError}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── ETAPA 1: Dados do Trato ─────────────────────────────────── */}
          {etapa === 0 && (
            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="tauze-input-grid grid-col-3">
                <div className="tauze-field-group">
                  <label className="tauze-label"><Wheat size={14} /> Data do Trato</label>
                  <DateInput className="tauze-input" value={dataTrato} onChange={e => setDataTrato(e.target.value)} required />
                </div>
                <div className="tauze-field-group">
                  <label className="tauze-label"><Layers size={14} /> Dieta Fornecida</label>
                  <SearchableSelect
                    value={dietaId}
                    onChange={(val: any) => setDietaId(val)}
                    options={dietas.map(d => ({ value: d.id, label: d.nome }))}
                    placeholder="Selecione a Dieta..."
                  />
                  {selectedDieta && (
                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: 'hsl(217 91% 50% / 0.12)', color: 'hsl(217 91% 50%)' }}>
                        {selectedDieta.tipo}
                      </span>
                      {selectedDieta.custo_por_kg && (
                        <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: 'hsl(161 64% 39% / 0.12)', color: 'hsl(161 64% 39%)' }}>
                          R$ {Number(selectedDieta.custo_por_kg).toFixed(2)}/kg
                        </span>
                      )}
                      {selectedDieta.consumo_esperado && (
                        <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: 'hsl(38 92% 50% / 0.12)', color: 'hsl(38 92% 40%)' }}>
                          {selectedDieta.tipo === 'Sal Mineral' ? `${selectedDieta.consumo_esperado}g/cab` : `${selectedDieta.consumo_esperado}% PV`}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="tauze-field-group">
                  <label className="tauze-label"><Package size={14} /> Depósito de Origem (Baixa de Estoque)</label>
                  <SearchableSelect
                    value={depositoId}
                    onChange={(val: any) => setDepositoId(val)}
                    options={depositos.map(d => ({ value: d.id, label: d.nome }))}
                    placeholder="Buscar depósito..."
                  />
                  {selectedDeposito && (
                    <span style={{ fontSize: '10px', color: 'hsl(var(--text-muted))', marginTop: '4px', display: 'block' }}>
                      A baixa de estoque será realizada neste depósito.
                    </span>
                  )}
                </div>
              </div>

              <div className="tauze-field-group">
                <label className="tauze-label"><FileText size={14} /> Observações (opcional)</label>
                <textarea
                  className="tauze-input tauze-textarea"
                  rows={2}
                  placeholder="Ex: Troca de dieta por orientação veterinária, animais com baixo consumo voluntário..."
                  value={observacoes}
                  onChange={e => setObservacoes(e.target.value)}
                  style={{ resize: 'vertical', minHeight: '64px', lineHeight: '1.5' }}
                />
              </div>
            </div>
          )}

          {/* ── ETAPA 2: Distribuição por Lote ──────────────────────────── */}
          {etapa === 1 && (
            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Controles */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '4px', background: 'hsl(var(--bg-main))', padding: '4px', borderRadius: '8px' }}>
                  {(['LOTE', 'ANIMAL'] as const).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        if (m === mode) return;
                        if (items.length > 0 && !window.confirm('Ao trocar o modo, os itens adicionados serão removidos. Continuar?')) return;
                        setMode(m);
                        setItems([]);
                      }}
                      style={{
                        padding: '6px 12px', fontSize: '12px', borderRadius: '6px', border: 'none',
                        background: mode === m ? '#fff' : 'transparent',
                        color: mode === m ? '#000' : 'hsl(var(--text-muted))',
                        fontWeight: mode === m ? 600 : 400,
                        boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {m === 'LOTE' ? 'Por Lote / Curral' : 'Por Animal Individual'}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {mode === 'LOTE' && selectedDieta?.consumo_esperado && items.length > 0 && (
                    <button type="button" className="glass-btn secondary" style={{ fontSize: '11px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={handleFillAllSuggested}>
                      <Download size={13} /> Preencher Sugeridos
                    </button>
                  )}
                  {mode === 'LOTE' && (
                    <button type="button" className="glass-btn secondary" style={{ fontSize: '11px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={handleLoadAllLotes} disabled={loadingLotes}>
                      {loadingLotes ? <Loader2 size={13} className="spin" /> : <ListChecks size={13} />}
                      Carregar Todos os Lotes
                    </button>
                  )}
                  <button type="button" className="secondary-btn" style={{ fontSize: '11px', padding: '6px 12px' }} onClick={handleAddItem}>
                    <Plus size={14} /> Adicionar Linha
                  </button>
                </div>
              </div>

              {/* Tabela */}
              <div style={{ overflowX: 'auto', border: '1px solid hsl(var(--border))', borderRadius: '12px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
                  <thead>
                    <tr style={{ background: 'hsl(var(--bg-main))' }}>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase' }}>
                        {mode === 'LOTE' ? 'Lote / Curral' : 'Animal'}
                      </th>
                      {mode === 'LOTE' && (
                        <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '11px', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', width: '90px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><Users size={12} /> Cabeças</div>
                        </th>
                      )}
                      {mode === 'LOTE' && selectedDieta?.consumo_esperado && (
                        <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '11px', fontWeight: 700, color: 'hsl(217 91% 50%)', textTransform: 'uppercase', width: '110px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><Scale size={12} /> Sugerido</div>
                        </th>
                      )}
                      <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '11px', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', width: '140px' }}>
                        Realizado (kg)
                      </th>
                      {mode === 'LOTE' && selectedDieta?.consumo_esperado && (
                        <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '11px', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', width: '90px' }}>
                          Variação
                        </th>
                      )}
                      <th style={{ padding: '10px 12px', width: '40px' }} />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => {
                      const loteData = lotes.find(l => String(l.id) === String(item.lote_id));
                      const realizado = parseFloat(item.quantidade_kg) || 0;
                      const sugerido = item.sugerido_kg;
                      const variacao = sugerido && sugerido > 0 ? ((realizado - sugerido) / sugerido) * 100 : null;
                      const variacaoAlta = variacao !== null && Math.abs(variacao) > 15;

                      return (
                        <tr key={item.id} style={{ borderTop: '1px solid hsl(var(--border))' }}>
                          <td style={{ padding: '8px 12px' }}>
                            {mode === 'LOTE' ? (
                              <SearchableSelect
                                value={item.lote_id}
                                onChange={(val: any) => updateItem(item.id, 'lote_id', val)}
                                options={lotes.map(l => ({ value: l.id, label: l.nome }))}
                                placeholder="Selecione o lote..."
                                height="36px"
                              />
                            ) : (
                              <SearchableSelect
                                value={item.animal_id}
                                onChange={(val: any) => updateItem(item.id, 'animal_id', val)}
                                options={animais.map(a => ({
                                  value: a.id,
                                  label: `Brinco: ${a.brinco}${a.brinco_eletronico ? ` (E: ${a.brinco_eletronico})` : ''} — ${a.raca || ''} ${a.categoria || ''}`.trim(),
                                }))}
                                placeholder="Busque por brinco, raça..."
                                height="36px"
                              />
                            )}
                          </td>
                          {mode === 'LOTE' && (
                            <td style={{ padding: '8px 12px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: 'hsl(var(--text-muted))' }}>
                              {loteData?.num_animais ?? '—'}
                            </td>
                          )}
                          {mode === 'LOTE' && selectedDieta?.consumo_esperado && (
                            <td style={{ padding: '8px 12px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: 'hsl(217 91% 50%)' }}>
                              {sugerido != null ? fmtKg(sugerido) : '—'}
                            </td>
                          )}
                          <td style={{ padding: '8px 12px' }}>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              className="tauze-input"
                              style={{ height: '36px', textAlign: 'center' }}
                              value={item.quantidade_kg}
                              onChange={e => updateItem(item.id, 'quantidade_kg', e.target.value)}
                              placeholder="0.0"
                            />
                          </td>
                          {mode === 'LOTE' && selectedDieta?.consumo_esperado && (
                            <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                              {variacao !== null && realizado > 0 ? (
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '3px',
                                  fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '20px',
                                  background: variacaoAlta ? '#fef2f2' : '#f0fdf4',
                                  color: variacaoAlta ? '#b91c1c' : '#15803d',
                                }}>
                                  {variacao > 0 ? <TrendingUp size={11} /> : variacao < 0 ? <TrendingDown size={11} /> : <Minus size={11} />}
                                  {variacao > 0 ? '+' : ''}{variacao.toFixed(0)}%
                                </span>
                              ) : '—'}
                            </td>
                          )}
                          <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                            <button type="button" onClick={() => handleRemoveItem(item.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {items.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ padding: '32px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'hsl(var(--text-muted))' }}>
                            <Wheat size={28} opacity={0.4} />
                            <span style={{ fontSize: '13px', fontWeight: 600 }}>Nenhum lote adicionado</span>
                            <span style={{ fontSize: '12px' }}>Clique em "Carregar Todos os Lotes" ou "Adicionar Linha"</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {items.length > 0 && (
                    <tfoot>
                      <tr style={{ borderTop: '2px solid hsl(var(--border))', background: 'hsl(var(--bg-main))' }}>
                        <td colSpan={mode === 'LOTE' && selectedDieta?.consumo_esperado ? 3 : mode === 'LOTE' ? 2 : 1} style={{ padding: '10px 12px', fontSize: '12px', fontWeight: 800, color: 'hsl(var(--text-muted))' }}>
                          TOTAL ({items.length} {items.length === 1 ? 'lote' : 'lotes'})
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: '14px', fontWeight: 900, color: 'hsl(var(--text-main))' }}>
                          {fmtKg(totalKg)}
                        </td>
                        {mode === 'LOTE' && selectedDieta?.consumo_esperado && <td />}
                        <td />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {/* Custo estimado */}
              {totalKg > 0 && selectedDieta?.custo_por_kg && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'hsl(161 64% 39% / 0.08)', border: '1px solid hsl(161 64% 39% / 0.25)', borderRadius: '8px', fontSize: '13px', fontWeight: 700, color: 'hsl(161 64% 35%)' }}>
                  <Info size={14} />
                  Custo estimado deste trato: <strong>{fmtBrl(custoTotal)}</strong>
                  &nbsp;&mdash;&nbsp;{fmtKg(totalKg)} × R$ {Number(selectedDieta.custo_por_kg).toFixed(2)}/kg
                </div>
              )}
            </div>
          )}

          {/* ── ETAPA 3: Revisão & Confirmação ──────────────────────────── */}
          {etapa === 2 && (
            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* KPIs de resumo */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {[
                  { label: 'Lotes Impactados', value: items.length, color: 'hsl(217 91% 50%)' },
                  { label: 'Total Tratado', value: fmtKg(totalKg), color: 'hsl(var(--text-main))' },
                  { label: 'Custo Estimado', value: fmtBrl(custoTotal), color: 'hsl(161 64% 35%)' },
                ].map((kpi, i) => (
                  <div key={i} style={{ padding: '14px', background: 'hsl(var(--bg-main))', border: '1px solid hsl(var(--border))', borderRadius: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', marginBottom: '4px' }}>{kpi.label}</div>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: kpi.color }}>{kpi.value}</div>
                  </div>
                ))}
              </div>

              {/* Alerta de saldo insuficiente */}
              {hasStockIssue && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px', background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: '10px' }}>
                  <AlertTriangle size={18} color="#b91c1c" style={{ flexShrink: 0, marginTop: '1px' }} />
                  <div>
                    <div style={{ fontWeight: 800, color: '#b91c1c', fontSize: '13px', marginBottom: '4px' }}>Saldo Insuficiente — Operação Bloqueada</div>
                    <div style={{ fontSize: '12px', color: '#991b1b' }}>Um ou mais ingredientes não têm saldo suficiente no depósito selecionado. Ajuste as quantidades ou selecione outro depósito.</div>
                  </div>
                </div>
              )}

              {/* Breakdown de ingredientes */}
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Baixa de Estoque por Ingrediente
                </div>
                <div style={{ border: '1px solid hsl(var(--border))', borderRadius: '10px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'hsl(var(--bg-main))' }}>
                        {['Ingrediente', 'Baixa (kg)', 'Saldo Atual', 'Saldo Após'].map((h, i) => (
                          <th key={i} style={{ padding: '10px 12px', textAlign: i === 0 ? 'left' : 'center', fontSize: '11px', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {stockBreakdown.length === 0 ? (
                        <tr>
                          <td colSpan={4} style={{ padding: '20px', textAlign: 'center', fontSize: '12px', color: 'hsl(var(--text-muted))' }}>
                            A dieta selecionada não possui ingredientes cadastrados.
                          </td>
                        </tr>
                      ) : stockBreakdown.map((b, i) => (
                        <tr key={i} style={{ borderTop: '1px solid hsl(var(--border))', background: b.insufficiente ? '#fef2f2' : 'transparent' }}>
                          <td style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 700 }}>{b.nome}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: '13px', fontWeight: 700, color: '#ef4444' }}>−{fmtKg(b.qtdBaixar)}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: '13px', color: 'hsl(var(--text-muted))' }}>{fmtKg(b.saldoAtual)}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: '13px', fontWeight: 900, color: b.insufficiente ? '#b91c1c' : 'hsl(161 64% 35%)' }}>
                            {b.insufficiente ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <AlertTriangle size={13} /> {fmtKg(b.saldoApos)} (negativo)
                              </span>
                            ) : fmtKg(b.saldoApos)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Dieta e depósito */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
                <div style={{ padding: '12px', background: 'hsl(var(--bg-main))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}>
                  <div style={{ fontWeight: 700, color: 'hsl(var(--text-muted))', marginBottom: '4px', textTransform: 'uppercase', fontSize: '10px' }}>Dieta</div>
                  <div style={{ fontWeight: 800 }}>{selectedDieta?.nome || '—'}</div>
                </div>
                <div style={{ padding: '12px', background: 'hsl(var(--bg-main))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}>
                  <div style={{ fontWeight: 700, color: 'hsl(var(--text-muted))', marginBottom: '4px', textTransform: 'uppercase', fontSize: '10px' }}>Depósito de Origem</div>
                  <div style={{ fontWeight: 800 }}>{selectedDeposito?.nome || '—'}</div>
                </div>
              </div>

              {!hasStockIssue && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'hsl(161 64% 39% / 0.08)', border: '1px solid hsl(161 64% 39% / 0.25)', borderRadius: '8px', fontSize: '13px', fontWeight: 700, color: 'hsl(161 64% 35%)' }}>
                  <CheckCircle2 size={14} />
                  Tudo certo! Clique em "Lançar Trato" para confirmar a operação e baixar o estoque.
                </div>
              )}
            </div>
          )}

          {/* ── Rodapé de Navegação ─────────────────────────────────────── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid hsl(var(--border))' }}>
            <button
              type="button"
              className="glass-btn secondary"
              onClick={handlePrev}
              style={{ opacity: etapa === 0 ? 0 : 1, pointerEvents: etapa === 0 ? 'none' : 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <ArrowLeft size={16} /> ANTERIOR
            </button>

            {etapa < 2 ? (
              <button type="button" className="primary-btn" onClick={handleNext} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                PRÓXIMO <ArrowRight size={16} />
              </button>
            ) : <div />}
          </div>

        </div>
      </div>
    </SidePanel>
  );
};
