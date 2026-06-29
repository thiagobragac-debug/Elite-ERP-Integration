import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Truck,
  Scale,
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Search,
  Building2,
  FileText,
  Package,
  DollarSign,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { useAuth } from '../../contexts/AuthContext';

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
interface ProcessarLoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  lote: {
    id: string;
    nome: string;
    fornecedor?: string;
    nf_numero?: string;
    quantidade_nota?: number;
    custo_total_aquisicao?: number;
    custo_por_cabeca?: number;
    data_limite?: string;
    pasto_id?: string;
  } | null;
  onSuccess: () => void;
}

interface UnassignedAnimal {
  id: string;
  brinco?: string | null;
  brinco_eletronico?: string | null;
  raca?: string | null;
  categoria?: string | null;
  sexo?: string | null;
  peso_atual?: number | null;
}

const STEPS = [
  { id: 1, label: 'Conferência NF',   icon: FileText },
  { id: 2, label: 'Pesagem Entrada',  icon: Scale },
  { id: 3, label: 'Animais',          icon: Users },
  { id: 4, label: 'Confirmação',      icon: CheckCircle2 },
] as const;

const fmtBRL = (v?: number | null) =>
  v != null ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v) : '---';

/* ─────────────────────────────────────────────
   Component
───────────────────────────────────────────── */
export const ProcessarLoteModal: React.FC<ProcessarLoteModalProps> = ({
  isOpen,
  onClose,
  lote,
  onSuccess,
}) => {
  const { activeTenantId, activeFarmId, applyFarmFilter } = useFarmFilter();
  const { user } = useAuth();

  /* ── Stepper ── */
  const [step, setStep] = useState(1);

  /* ── Etapa 1: Conferência ── */
  const [qtdRecebida, setQtdRecebida] = useState<string>('');
  const [dataRecebimento, setDataRecebimento] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [motivo, setMotivo] = useState('Recebimento de NF de Entrada');

  /* ── Etapa 2: Pesagem ── */
  const [pesoMedio, setPesoMedio] = useState<string>('');
  const [skipPesagem, setSkipPesagem] = useState(false);

  /* ── Etapa 3: Animais ── */
  const [animals, setAnimals] = useState<UnassignedAnimal[]>([]);
  const [loadingAnimals, setLoadingAnimals] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  /* ── Submissão ── */
  const [submitting, setSubmitting] = useState(false);

  /* ── Reset ao abrir/fechar ── */
  useEffect(() => {
    if (isOpen && lote) {
      setStep(1);
      setQtdRecebida(String(lote.quantidade_nota ?? ''));
      setDataRecebimento(new Date().toISOString().slice(0, 10));
      setMotivo('Recebimento de NF de Entrada');
      setPesoMedio('');
      setSkipPesagem(false);
      setSelectedIds([]);
      setSearchTerm('');
      setAnimals([]);
    }
  }, [isOpen, lote]);

  /* ── Buscar animais ao entrar na Etapa 3 ── */
  useEffect(() => {
    if (step !== 3 || !isOpen) return;
    const fetch = async () => {
      setLoadingAnimals(true);
      try {
        const { data, error } = await applyFarmFilter(
          supabase
            .from('animais')
            .select('id, brinco, brinco_eletronico, raca, categoria, sexo, peso_atual').eq('tenant_id', activeTenantId)
            .eq('status', 'ATIVO')
            .is('lote_id', null)
        );
        if (!error && data) setAnimals(data as UnassignedAnimal[]);
      } finally {
        setLoadingAnimals(false);
      }
    };
    fetch();
  }, [step, isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Filtro local de animais ── */
  const filteredAnimals = useMemo(() => {
    const q = searchTerm.toLowerCase();
    if (!q) return animals;
    return animals.filter(
      (a) =>
        (a.brinco || '').toLowerCase().includes(q) ||
        (a.raca || '').toLowerCase().includes(q) ||
        (a.categoria || '').toLowerCase().includes(q)
    );
  }, [animals, searchTerm]);

  const toggleAnimal = (id: string) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const handleSelectAll = () => {
    if (selectedIds.length === filteredAnimals.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAnimals.map((a) => a.id));
    }
  };

  /* ── Navegação entre etapas ── */
  const canNext = () => {
    if (step === 1) return qtdRecebida !== '' && Number(qtdRecebida) > 0 && dataRecebimento !== '';
    if (step === 2) return skipPesagem || (pesoMedio !== '' && Number(pesoMedio) > 0);
    if (step === 3) return selectedIds.length > 0;
    return true;
  };

  /* ── Submissão via RPC ── */
  const handleConfirm = async () => {
    if (!lote || !activeTenantId) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('processar_lote_pendente', {
        p_lote_id:            lote.id,
        p_animal_ids:         selectedIds,
        p_peso_medio_entrada: skipPesagem ? null : parseFloat(pesoMedio),
        p_data_recebimento:   dataRecebimento,
        p_motivo:             motivo,
        p_tenant_id:          activeTenantId,
        p_user_id:            user?.id ?? null,
      });

      if (error) throw error;
      const result = data as { success: boolean; error?: string; activated?: number };
      if (!result?.success) throw new Error(result?.error || 'Erro desconhecido');

      toast.success(
        `Lote ativado com sucesso. ${result.activated ?? selectedIds.length} animal(is) vinculado(s).`
      );
      onSuccess();
    } catch (err: any) {
      toast.error(`Erro ao processar lote: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !lote) return null;

  const now = Date.now();
  const limite = lote.data_limite ? new Date(lote.data_limite).getTime() : null;
  const isSlaExpired = limite !== null && limite < now;
  const daysLeft = limite !== null ? Math.ceil((limite - now) / (1000 * 60 * 60 * 24)) : null;

  return createPortal(
    <div
      className="tauze-sidebar-overlay"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ zIndex: 1000 }}
    >
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 26, stiffness: 200 }}
        className="tauze-sidebar-modal"
        style={{ maxWidth: 680, width: '95vw' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="tauze-sidebar-header">
          <div className="header-content" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              className="icon-wrapper"
              style={{
                background: isSlaExpired ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)',
                color: isSlaExpired ? '#ef4444' : '#10b981',
                width: 44, height: 44, borderRadius: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Truck size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>Processar Lote Pendente</h3>
              <p style={{ margin: 0, fontSize: 12, color: 'hsl(var(--text-muted))', fontWeight: 600 }}>
                {lote.nome}
              </p>
            </div>
            {/* SLA chip */}
            {lote.data_limite && (
              <span
                style={{
                  marginLeft: 'auto',
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 8,
                  background: isSlaExpired ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
                  color: isSlaExpired ? '#ef4444' : '#f59e0b',
                  border: `1px solid ${isSlaExpired ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.25)'}`,
                  whiteSpace: 'nowrap',
                }}
              >
                {isSlaExpired ? <AlertTriangle size={11} /> : <Clock size={11} />}
                {isSlaExpired
                  ? `SLA EXPIRADO`
                  : daysLeft !== null ? `${daysLeft}d p/ vencer` : ''}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--text-muted))', display: 'flex', padding: 4 }}
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Stepper ── */}
        <div style={{ padding: '16px 24px 0', borderBottom: '1px solid hsl(var(--border))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            {STEPS.map((s, idx) => {
              const done = step > s.id;
              const active = step === s.id;
              const Icon = s.icon;
              return (
                <React.Fragment key={s.id}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
                    <div
                      style={{
                        width: 34, height: 34, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 900,
                        background: done ? '#10b981' : active ? 'hsl(var(--brand))' : 'hsl(var(--bg-main))',
                        color: (done || active) ? '#fff' : 'hsl(var(--text-muted))',
                        border: `2px solid ${done ? '#10b981' : active ? 'hsl(var(--brand))' : 'hsl(var(--border))'}`,
                        transition: '0.3s',
                      }}
                    >
                      {done ? <CheckCircle2 size={16} /> : <Icon size={15} />}
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 800, color: active ? 'hsl(var(--brand))' : 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                      {s.label}
                    </span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div style={{ height: 2, flex: 1, marginBottom: 20, background: step > s.id ? '#10b981' : 'hsl(var(--border))', transition: '0.3s' }} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* ── Body ── */}
        <div className="tauze-sidebar-body" style={{ flex: 1, overflowY: 'auto' }}>
          <AnimatePresence mode="wait">

            {/* ETAPA 1 — Conferência NF */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                  {/* Dados da NF */}
                  <div
                    style={{
                      background: 'hsl(var(--bg-main)/0.5)',
                      borderRadius: 14,
                      border: '1px solid hsl(var(--border))',
                      padding: '16px 20px',
                      display: 'flex', flexDirection: 'column', gap: 12,
                    }}
                  >
                    <div style={{ fontSize: 10, fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FileText size={13} /> Dados da Nota Fiscal
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      {lote.nf_numero && (
                        <div>
                          <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700 }}>Nº da NF</div>
                          <div style={{ fontSize: 14, fontWeight: 800 }}>{lote.nf_numero}</div>
                        </div>
                      )}
                      {lote.fornecedor && (
                        <div>
                          <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700 }}>Fornecedor</div>
                          <div style={{ fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Building2 size={13} /> {lote.fornecedor}
                          </div>
                        </div>
                      )}
                      {lote.quantidade_nota && (
                        <div>
                          <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700 }}>Qtd. Prevista (NF)</div>
                          <div style={{ fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Package size={13} /> {lote.quantidade_nota} cab.
                          </div>
                        </div>
                      )}
                      {lote.custo_total_aquisicao && (
                        <div>
                          <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700 }}>Valor Total NF</div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <DollarSign size={13} /> {fmtBRL(lote.custo_total_aquisicao)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Campos editáveis */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 800, color: 'hsl(var(--text-muted))' }}>
                        Qtd. Recebida (Cabeças) <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="number"
                        className="tauze-input"
                        value={qtdRecebida}
                        min={1}
                        onChange={(e) => setQtdRecebida(e.target.value)}
                        placeholder="Ex: 60"
                        style={{ marginTop: 6 }}
                      />
                      {lote.quantidade_nota && qtdRecebida && Number(qtdRecebida) !== lote.quantidade_nota && (
                        <p style={{ fontSize: 10, color: '#f59e0b', fontWeight: 700, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <AlertTriangle size={11} /> Divergência: NF prevê {lote.quantidade_nota} cab.
                        </p>
                      )}
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 800, color: 'hsl(var(--text-muted))' }}>
                        Data de Recebimento <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="date"
                        className="tauze-input"
                        value={dataRecebimento}
                        onChange={(e) => setDataRecebimento(e.target.value)}
                        style={{ marginTop: 6 }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: 'hsl(var(--text-muted))' }}>Motivo / Observação</label>
                    <input
                      type="text"
                      className="tauze-input"
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      style={{ marginTop: 6 }}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* ETAPA 2 — Pesagem de Entrada */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div
                    style={{
                      background: 'hsl(var(--bg-main)/0.5)',
                      borderRadius: 14,
                      border: '1px solid hsl(var(--border))',
                      padding: '16px 20px',
                    }}
                  >
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'hsl(var(--text-muted))', lineHeight: 1.6 }}>
                      Informe o <strong>peso médio de entrada</strong> dos animais recebidos.
                      Este valor será aplicado a animais sem pesagem prévia.
                      Você pode <strong>pular</strong> esta etapa se as pesagens serão registradas individualmente depois.
                    </p>
                  </div>

                  {!skipPesagem && (
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 800, color: 'hsl(var(--text-muted))' }}>
                        Peso Médio de Entrada (kg)
                      </label>
                      <input
                        type="number"
                        className="tauze-input"
                        value={pesoMedio}
                        min={1}
                        step={0.1}
                        onChange={(e) => setPesoMedio(e.target.value)}
                        placeholder="Ex: 280,5"
                        style={{ marginTop: 6 }}
                      />
                      {pesoMedio && Number(pesoMedio) > 0 && (
                        <p style={{ fontSize: 11, color: '#10b981', fontWeight: 700, marginTop: 6 }}>
                          GMD estimado: {/* placeholder — pode calcular com peso_alvo e dias_ciclo do lote */}
                          calculado após salvar com base nas metas do lote.
                        </p>
                      )}
                    </div>
                  )}

                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'hsl(var(--text-main))' }}>
                    <input
                      type="checkbox"
                      checked={skipPesagem}
                      onChange={(e) => setSkipPesagem(e.target.checked)}
                      style={{ accentColor: 'hsl(var(--brand))', width: 16, height: 16 }}
                    />
                    Pular pesagem — registrarei os pesos individualmente depois
                  </label>
                </div>
              </motion.div>
            )}

            {/* ETAPA 3 — Seleção de Animais */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                  {/* Header com contadores */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'hsl(var(--text-main))' }}>
                      Animais Sem Lote
                      <span style={{ marginLeft: 8, fontSize: 11, background: 'hsl(var(--brand)/0.1)', color: 'hsl(var(--brand))', padding: '2px 8px', borderRadius: 6, fontWeight: 800 }}>
                        {selectedIds.length}/{Number(qtdRecebida)} cab.
                      </span>
                    </span>
                    <button
                      onClick={handleSelectAll}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 800, color: 'hsl(var(--brand))' }}
                    >
                      {selectedIds.length === filteredAnimals.length ? 'DESMARCAR TODOS' : 'MARCAR TODOS'}
                    </button>
                  </div>

                  {/* Busca */}
                  <div className="search-glass-box small" style={{ marginBottom: 0 }}>
                    <Search size={14} className="s-icon" />
                    <input
                      type="text"
                      placeholder="Buscar por brinco, raça..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  {/* Aviso divergência */}
                  {selectedIds.length > Number(qtdRecebida) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.08)', padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(245,158,11,0.2)' }}>
                      <AlertTriangle size={14} />
                      Você selecionou {selectedIds.length} animais, mas a NF prevê {qtdRecebida} cabeças.
                    </div>
                  )}

                  {/* Lista de animais */}
                  {loadingAnimals ? (
                    <div className="picker-skeleton-grid">
                      {Array.from({ length: 6 }).map((_, i) => <div key={i} className="picker-skeleton-item" />)}
                    </div>
                  ) : filteredAnimals.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 0', color: 'hsl(var(--text-muted))' }}>
                      <Users size={40} style={{ opacity: 0.3, marginBottom: 8 }} />
                      <p style={{ fontWeight: 700 }}>Nenhum animal sem lote encontrado.</p>
                    </div>
                  ) : (
                    <div className="animal-picker-container" style={{ maxHeight: 340, overflowY: 'auto' }}>
                      <div className="animal-picker-grid">
                        {filteredAnimals.map((a) => {
                          const selected = selectedIds.includes(a.id);
                          return (
                            <div
                              key={a.id}
                              className={`animal-picker-card${selected ? ' selected' : ''}`}
                              onClick={() => toggleAnimal(a.id)}
                            >
                              <input type="checkbox" checked={selected} readOnly className="animal-cb" />
                              <span className="brinco-label">#{a.brinco || a.id.slice(0, 6).toUpperCase()}</span>
                              {a.raca && <span className="animal-tag">{a.raca}</span>}
                              {a.categoria && <span className="animal-tag">{a.categoria}</span>}
                              {a.sexo && <span className="animal-tag sexo">{a.sexo}</span>}
                              {a.peso_atual && <span className="animal-weight">⚖ {a.peso_atual}kg</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ETAPA 4 — Confirmação */}
            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                  <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 14, padding: '14px 18px' }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle2 size={16} /> Tudo pronto para confirmar o recebimento.
                    </p>
                  </div>

                  <div style={{ background: 'hsl(var(--bg-main)/0.5)', borderRadius: 14, border: '1px solid hsl(var(--border))', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                      { label: 'Lote', value: lote.nome },
                      { label: 'Fornecedor', value: lote.fornecedor || '---' },
                      { label: 'NF', value: lote.nf_numero || '---' },
                      { label: 'Data de Recebimento', value: new Date(dataRecebimento).toLocaleDateString('pt-BR') },
                      { label: 'Animais a Vincular', value: `${selectedIds.length} cabeças` },
                      { label: 'Peso Médio de Entrada', value: skipPesagem ? 'Não registrado (pular)' : `${pesoMedio} kg` },
                      { label: 'Motivo', value: motivo },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid hsl(var(--border)/0.4)', paddingBottom: 8 }}>
                        <span style={{ fontWeight: 600, color: 'hsl(var(--text-muted))' }}>{label}</span>
                        <span style={{ fontWeight: 800, color: 'hsl(var(--text-main))', textAlign: 'right', maxWidth: '60%' }}>{value}</span>
                      </div>
                    ))}
                  </div>

                  <p style={{ margin: 0, fontSize: 11, color: 'hsl(var(--text-muted))', fontWeight: 600, lineHeight: 1.6 }}>
                    Ao confirmar, o lote será <strong>ativado</strong>, os {selectedIds.length} animais selecionados serão vinculados e a movimentação será registrada no histórico de rastreabilidade.
                  </p>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* ── Footer ── */}
        <div className="tauze-sidebar-footer" style={{ gap: 10 }}>
          {step > 1 && (
            <button
              className="glass-btn secondary"
              style={{ flex: 1 }}
              onClick={() => setStep((s) => s - 1)}
              disabled={submitting}
            >
              <ChevronLeft size={16} /> VOLTAR
            </button>
          )}
          {step < 4 ? (
            <button
              className="primary-btn"
              style={{ flex: 2 }}
              disabled={!canNext()}
              onClick={() => setStep((s) => s + 1)}
            >
              PRÓXIMO <ChevronRight size={16} />
            </button>
          ) : (
            <button
              className="primary-btn"
              style={{ flex: 2, background: 'linear-gradient(135deg, #10b981, #059669)' }}
              onClick={handleConfirm}
              disabled={submitting}
            >
              {submitting ? (
                <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> PROCESSANDO...</>
              ) : (
                <><CheckCircle2 size={16} /> CONFIRMAR RECEBIMENTO</>
              )}
            </button>
          )}
        </div>
      </motion.div>
    </div>,
    document.body
  );
};

export default ProcessarLoteModal;
