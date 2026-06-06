import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Tag,
  Scale,
  Beef,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  TrendingDown,
  DollarSign,
  X,
} from 'lucide-react';
import { SidePanel } from '../Layout/SidePanel';
import toast from 'react-hot-toast';

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
interface ProcessarLoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  lote: {
    id: string;
    nome: string;
    quantidade_nota: number;
    custo_total_aquisicao: number;
    custo_por_cabeca: number;
    fornecedor?: string;
  } | null;
  onSuccess: () => void;
}

interface AnimalEntry {
  id: string;
  brinco: string;
  brinco_sisbov: string;
  sexo: 'M' | 'F' | 'C';
  peso_inicial: string;
  raca: string;
}

type SexoOption = 'M' | 'F' | 'C';

const RACA_OPTIONS = ['Nelore', 'Angus', 'Brahman', 'Simental', 'Cruzado', 'Outros'] as const;
const SEXO_LABELS: Record<SexoOption, string> = { M: 'Macho', F: 'Fêmea', C: 'Castrado' };

const fmtBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

/* ─────────────────────────────────────────────
   Component
───────────────────────────────────────────── */
export const ProcessarLoteModal: React.FC<ProcessarLoteModalProps> = ({
  isOpen,
  onClose,
  lote,
  onSuccess,
}) => {
  /* ── State ── */
  const [animais, setAnimais] = useState<AnimalEntry[]>([]);
  const [form, setForm] = useState({
    brinco: '',
    brinco_sisbov: '',
    sexo: 'M' as SexoOption,
    peso_inicial: '',
    raca: 'Nelore',
  });
  const [divergenciaConfirmada, setDivergenciaConfirmada] = useState(false);
  const [showDivergenciaWarning, setShowDivergenciaWarning] = useState(false);

  /* ── Refs ── */
  const brincoRef = useRef<HTMLInputElement>(null);
  const sisbovRef = useRef<HTMLInputElement>(null);
  const sexoRef = useRef<HTMLSelectElement>(null);
  const pesoRef = useRef<HTMLInputElement>(null);
  const racaRef = useRef<HTMLSelectElement>(null);
  const addBtnRef = useRef<HTMLButtonElement>(null);

  /* ── Reset on open ── */
  useEffect(() => {
    if (isOpen) {
      setAnimais([]);
      setForm({ brinco: '', brinco_sisbov: '', sexo: 'M', peso_inicial: '', raca: 'Nelore' });
      setDivergenciaConfirmada(false);
      setShowDivergenciaWarning(false);
      setTimeout(() => brincoRef.current?.focus(), 150);
    }
  }, [isOpen]);

  /* ── Derived ── */
  const quantidadeNota = lote?.quantidade_nota ?? 0;
  const processados = animais.length;
  const progressPct = quantidadeNota > 0 ? Math.min((processados / quantidadeNota) * 100, 100) : 0;
  const progressColor =
    processados >= quantidadeNota ? '#10b981' : processados > 0 ? 'hsl(var(--brand))' : '#64748b';

  const canFinalize =
    processados >= quantidadeNota || (divergenciaConfirmada && processados > 0);

  /* ── Handlers ── */
  const handleKeyEnter = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, nextRef: React.RefObject<HTMLElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        nextRef.current?.focus();
      }
    },
    []
  );

  const handleAddAnimal = () => {
    if (!form.brinco.trim()) {
      toast.error('O campo Brinco é obrigatório.');
      brincoRef.current?.focus();
      return;
    }

    const novo: AnimalEntry = {
      id: crypto.randomUUID(),
      brinco: form.brinco.trim(),
      brinco_sisbov: form.brinco_sisbov.trim(),
      sexo: form.sexo,
      peso_inicial: form.peso_inicial,
      raca: form.raca,
    };

    setAnimais((prev) => [...prev, novo]);
    setForm({ brinco: '', brinco_sisbov: '', sexo: 'M', peso_inicial: '', raca: 'Nelore' });
    setTimeout(() => brincoRef.current?.focus(), 50);
  };

  const handleRemoveAnimal = (id: string) => {
    setAnimais((prev) => prev.filter((a) => a.id !== id));
    setDivergenciaConfirmada(false);
    setShowDivergenciaWarning(false);
  };

  const handleFinalizarLote = () => {
    if (processados === 0) {
      toast.error('Adicione pelo menos 1 animal antes de finalizar.');
      return;
    }

    if (processados !== quantidadeNota && !divergenciaConfirmada) {
      setShowDivergenciaWarning(true);
      return;
    }

    const savePromise = new Promise<void>((resolve) =>
      setTimeout(() => resolve(), 2000)
    );

    toast.promise(savePromise, {
      loading: 'Finalizando lote…',
      success: 'Lote processado com sucesso! 🎉',
      error: 'Erro ao finalizar o lote.',
    });

    savePromise.then(() => {
      onClose();
      onSuccess();
    });
  };

  /* ── Early return ── */
  if (!lote) return null;

  /* ── Inline styles ── */
  const styles = {
    progressBar: {
      wrapper: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '18px 24px',
        background: 'hsl(var(--bg-main) / 0.6)',
        borderBottom: '1px solid hsl(var(--border) / 0.5)',
      } as React.CSSProperties,
      label: {
        fontSize: '12px',
        fontWeight: 800,
        color: 'hsl(var(--text-muted))',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.06em',
        whiteSpace: 'nowrap' as const,
      },
      count: {
        fontSize: '16px',
        fontWeight: 900,
        color: progressColor,
        whiteSpace: 'nowrap' as const,
      },
      track: {
        flex: 1,
        height: '8px',
        background: 'hsl(var(--bg-card))',
        borderRadius: '99px',
        overflow: 'hidden',
        border: '1px solid hsl(var(--border) / 0.4)',
      } as React.CSSProperties,
      fill: {
        height: '100%',
        width: `${progressPct}%`,
        background:
          processados >= quantidadeNota
            ? 'linear-gradient(90deg, #10b981, #059669)'
            : processados > 0
            ? 'linear-gradient(90deg, hsl(var(--brand)), hsl(var(--brand) / 0.7))'
            : 'transparent',
        borderRadius: '99px',
        transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      } as React.CSSProperties,
      pct: {
        fontSize: '13px',
        fontWeight: 900,
        color: progressColor,
        whiteSpace: 'nowrap' as const,
        minWidth: '42px',
        textAlign: 'right' as const,
      },
    },
    costCards: {
      wrapper: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
        marginBottom: '8px',
      } as React.CSSProperties,
      card: (highlight: boolean) =>
        ({
          padding: '18px 20px',
          borderRadius: '14px',
          background: highlight
            ? 'linear-gradient(135deg, hsl(142 71% 45% / 0.12), hsl(142 71% 45% / 0.06))'
            : 'hsl(var(--bg-main))',
          border: highlight
            ? '1px solid hsl(142 71% 45% / 0.35)'
            : '1px solid hsl(var(--border))',
          display: 'flex',
          flexDirection: 'column' as const,
          gap: '6px',
        } as React.CSSProperties),
      icon: (highlight: boolean) =>
        ({
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '11px',
          fontWeight: 800,
          color: highlight ? '#10b981' : 'hsl(var(--text-muted))',
          textTransform: 'uppercase' as const,
          letterSpacing: '0.05em',
        } as React.CSSProperties),
      value: (highlight: boolean) =>
        ({
          fontSize: highlight ? '22px' : '18px',
          fontWeight: 900,
          color: highlight ? '#10b981' : 'hsl(var(--text-main))',
          lineHeight: 1.1,
        } as React.CSSProperties),
      sub: {
        fontSize: '11px',
        color: 'hsl(var(--text-muted))',
        fontWeight: 600,
      } as React.CSSProperties,
    },
    form: {
      section: {
        background: 'hsl(var(--bg-card))',
        border: '1px solid hsl(var(--border))',
        borderRadius: '16px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '16px',
      } as React.CSSProperties,
      sectionHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '12px',
        fontWeight: 800,
        color: 'hsl(var(--text-muted))',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.06em',
        marginBottom: '4px',
      } as React.CSSProperties,
      grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px',
      } as React.CSSProperties,
      gridFull: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        marginTop: '4px',
      } as React.CSSProperties,
      label: {
        display: 'block',
        fontSize: '11px',
        fontWeight: 800,
        color: 'hsl(var(--text-muted))',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em',
        marginBottom: '6px',
      } as React.CSSProperties,
      input: {
        width: '100%',
        padding: '10px 14px',
        background: 'hsl(var(--bg-main))',
        border: '1.5px solid hsl(var(--border))',
        borderRadius: '10px',
        color: 'hsl(var(--text-main))',
        fontSize: '13px',
        fontWeight: 600,
        outline: 'none',
        boxSizing: 'border-box' as const,
        transition: 'border-color 0.2s',
      } as React.CSSProperties,
      select: {
        width: '100%',
        padding: '10px 14px',
        background: 'hsl(var(--bg-main))',
        border: '1.5px solid hsl(var(--border))',
        borderRadius: '10px',
        color: 'hsl(var(--text-main))',
        fontSize: '13px',
        fontWeight: 600,
        appearance: 'none' as const,
        cursor: 'pointer',
        outline: 'none',
        boxSizing: 'border-box' as const,
      } as React.CSSProperties,
    },
    addBtn: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      padding: '12px 24px',
      background: 'linear-gradient(135deg, #10b981, #059669)',
      color: '#fff',
      border: 'none',
      borderRadius: '12px',
      fontWeight: 900,
      fontSize: '13px',
      cursor: 'pointer',
      boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
      transition: 'opacity 0.2s, transform 0.15s',
      alignSelf: 'flex-end' as const,
      marginTop: '4px',
    } as React.CSSProperties,
    list: {
      wrapper: {
        background: 'hsl(var(--bg-card))',
        border: '1px solid hsl(var(--border))',
        borderRadius: '16px',
        overflow: 'hidden',
      } as React.CSSProperties,
      header: {
        padding: '14px 20px',
        background: 'hsl(var(--bg-main) / 0.7)',
        borderBottom: '1px solid hsl(var(--border) / 0.5)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '11px',
        fontWeight: 800,
        color: 'hsl(var(--text-muted))',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.06em',
      } as React.CSSProperties,
      badge: {
        marginLeft: 'auto',
        fontSize: '11px',
        fontWeight: 900,
        color: '#10b981',
        background: 'rgba(16,185,129,0.12)',
        padding: '2px 8px',
        borderRadius: '99px',
        border: '1px solid rgba(16,185,129,0.3)',
      } as React.CSSProperties,
      item: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 20px',
        borderBottom: '1px solid hsl(var(--border) / 0.4)',
        fontSize: '13px',
        transition: 'background 0.15s',
      } as React.CSSProperties,
      brinco: {
        fontWeight: 900,
        color: 'hsl(var(--brand))',
        minWidth: '80px',
      } as React.CSSProperties,
      chip: (color: string, bg: string) =>
        ({
          fontSize: '10.5px',
          fontWeight: 800,
          color,
          background: bg,
          padding: '2px 8px',
          borderRadius: '6px',
          whiteSpace: 'nowrap' as const,
        } as React.CSSProperties),
      removeBtn: {
        marginLeft: 'auto',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        color: '#ef4444',
        display: 'flex',
        alignItems: 'center',
        padding: '4px',
        borderRadius: '6px',
        opacity: 0.7,
        transition: 'opacity 0.2s',
      } as React.CSSProperties,
    },
    warning: {
      wrapper: {
        padding: '16px',
        borderRadius: '14px',
        background: 'hsl(38 92% 50% / 0.08)',
        border: '1.5px solid hsl(38 92% 50% / 0.35)',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '12px',
      } as React.CSSProperties,
      title: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '12px',
        fontWeight: 900,
        color: 'hsl(38 92% 45%)',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em',
      } as React.CSSProperties,
      msg: {
        fontSize: '13px',
        color: 'hsl(var(--text-muted))',
        lineHeight: '1.5',
        fontWeight: 600,
        margin: 0,
      } as React.CSSProperties,
      actions: {
        display: 'flex',
        gap: '10px',
      } as React.CSSProperties,
    },
    footer: {
      wrapper: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        gap: '12px',
      } as React.CSSProperties,
      counter: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '13px',
        fontWeight: 700,
        color: 'hsl(var(--text-muted))',
      } as React.CSSProperties,
      finalizeBtn: (enabled: boolean) =>
        ({
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 28px',
          background: enabled
            ? 'linear-gradient(135deg, #10b981, #059669)'
            : 'hsl(var(--border))',
          color: enabled ? '#fff' : 'hsl(var(--text-muted))',
          border: 'none',
          borderRadius: '12px',
          fontWeight: 900,
          fontSize: '14px',
          cursor: enabled ? 'pointer' : 'not-allowed',
          boxShadow: enabled ? '0 6px 20px rgba(16, 185, 129, 0.35)' : 'none',
          transition: 'all 0.2s',
          opacity: enabled ? 1 : 0.6,
        } as React.CSSProperties),
    },
  };

  /* ── Render ── */
  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={(e) => e.preventDefault()}
      title={`Processar Lote — ${lote.nome}`}
      subtitle={lote.fornecedor ? `Fornecedor: ${lote.fornecedor}` : 'Cadastro de brincos na chegada'}
      icon={Beef}
      size="xlarge"
      hideSubmit
      contentPadding={0}
      customFooter={
        <div style={styles.footer.wrapper}>
          {/* Left: counter */}
          <div style={styles.footer.counter}>
            <Beef size={15} />
            <span>
              <strong style={{ color: progressColor }}>{processados}</strong>
              {' '}de{' '}
              <strong>{quantidadeNota}</strong>
              {' '}animais cadastrados
            </span>
          </div>

          {/* Right: actions */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              type="button"
              className="glass-btn secondary"
              onClick={onClose}
              style={{ padding: '11px 20px', borderRadius: '12px', fontSize: '13px', fontWeight: 700 }}
            >
              Cancelar
            </button>
            <button
              type="button"
              style={styles.footer.finalizeBtn(canFinalize)}
              disabled={!canFinalize}
              onClick={handleFinalizarLote}
            >
              <CheckCircle2 size={16} />
              Finalizar Lote
            </button>
          </div>
        </div>
      }
    >
      {/* ── Inline styles (scoped via data-attr) ── */}
      <style>{`
        [data-procl] input:focus,
        [data-procl] select:focus {
          border-color: hsl(var(--brand)) !important;
          box-shadow: 0 0 0 3px hsl(var(--brand) / 0.12);
        }
        [data-procl] .procl-list-item:hover {
          background: hsl(var(--bg-main) / 0.5);
        }
        [data-procl] .procl-remove-btn:hover {
          opacity: 1 !important;
          background: rgba(239,68,68,0.08);
        }
        [data-procl] .procl-add-btn:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-1px);
        }
      `}</style>

      <div data-procl style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

        {/* ── Progress bar strip ── */}
        <div style={styles.progressBar.wrapper}>
          <span style={styles.progressBar.label}>Progresso</span>
          <span style={styles.progressBar.count}>
            {processados}/{quantidadeNota}
          </span>
          <div style={styles.progressBar.track}>
            <div style={styles.progressBar.fill} />
          </div>
          <span style={styles.progressBar.pct}>{progressPct.toFixed(0)}%</span>
          {processados >= quantidadeNota && processados > 0 && (
            <CheckCircle2 size={18} style={{ color: '#10b981', flexShrink: 0 }} />
          )}
        </div>

        {/* ── Main content ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* ── Cost cards ── */}
          <div style={styles.costCards.wrapper}>
            <div style={styles.costCards.card(false)}>
              <div style={styles.costCards.icon(false)}>
                <DollarSign size={13} />
                Custo Total da NF
              </div>
              <div style={styles.costCards.value(false)}>
                {fmtBRL(lote.custo_total_aquisicao)}
              </div>
              <div style={styles.costCards.sub}>
                {quantidadeNota} cabeças na nota fiscal
              </div>
            </div>

            <div style={styles.costCards.card(true)}>
              <div style={styles.costCards.icon(true)}>
                <TrendingDown size={13} />
                Custo / Cabeça Calculado
              </div>
              <div style={styles.costCards.value(true)}>
                {fmtBRL(lote.custo_por_cabeca)}
              </div>
              <div style={{ ...styles.costCards.sub, color: '#10b981' }}>
                por cabeça adquirida
              </div>
            </div>
          </div>

          {/* ── Quick entry form ── */}
          <div style={styles.form.section}>
            <div style={styles.form.sectionHeader}>
              <Tag size={13} />
              Entrada Rápida de Animal
            </div>

            {/* Row 1: Brinco + SISBOV */}
            <div style={styles.form.gridFull}>
              <div>
                <label style={styles.form.label} htmlFor="procl-brinco">
                  Brinco *
                </label>
                <input
                  id="procl-brinco"
                  ref={brincoRef}
                  type="text"
                  placeholder="Ex: 1234"
                  value={form.brinco}
                  onChange={(e) => setForm((f) => ({ ...f, brinco: e.target.value }))}
                  onKeyDown={(e) => handleKeyEnter(e, sisbovRef)}
                  style={styles.form.input}
                  autoComplete="off"
                />
              </div>
              <div>
                <label style={styles.form.label} htmlFor="procl-sisbov">
                  Brinco SISBOV <span style={{ textTransform: 'none', fontWeight: 500, fontSize: '10px' }}>(opcional)</span>
                </label>
                <input
                  id="procl-sisbov"
                  ref={sisbovRef}
                  type="text"
                  placeholder="Ex: 982000000000001"
                  value={form.brinco_sisbov}
                  onChange={(e) => setForm((f) => ({ ...f, brinco_sisbov: e.target.value }))}
                  onKeyDown={(e) => handleKeyEnter(e, sexoRef)}
                  style={styles.form.input}
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Row 2: Sexo + Peso + Raça */}
            <div style={styles.form.grid}>
              <div>
                <label style={styles.form.label} htmlFor="procl-sexo">
                  Sexo
                </label>
                <select
                  id="procl-sexo"
                  ref={sexoRef}
                  value={form.sexo}
                  onChange={(e) => setForm((f) => ({ ...f, sexo: e.target.value as SexoOption }))}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); pesoRef.current?.focus(); } }}
                  style={styles.form.select}
                >
                  <option value="M">Macho</option>
                  <option value="F">Fêmea</option>
                  <option value="C">Castrado</option>
                </select>
              </div>

              <div>
                <label style={styles.form.label} htmlFor="procl-peso">
                  <Scale size={11} style={{ display: 'inline', marginRight: '4px' }} />
                  Peso Inicial (kg)
                </label>
                <input
                  id="procl-peso"
                  ref={pesoRef}
                  type="number"
                  placeholder="Ex: 320"
                  min={0}
                  step={0.1}
                  value={form.peso_inicial}
                  onChange={(e) => setForm((f) => ({ ...f, peso_inicial: e.target.value }))}
                  onKeyDown={(e) => handleKeyEnter(e, racaRef)}
                  style={styles.form.input}
                />
              </div>

              <div>
                <label style={styles.form.label} htmlFor="procl-raca">
                  Raça
                </label>
                <select
                  id="procl-raca"
                  ref={racaRef}
                  value={form.raca}
                  onChange={(e) => setForm((f) => ({ ...f, raca: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddAnimal(); } }}
                  style={styles.form.select}
                >
                  {RACA_OPTIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Add button */}
            <button
              ref={addBtnRef}
              type="button"
              className="procl-add-btn"
              style={styles.addBtn}
              onClick={handleAddAnimal}
            >
              <Plus size={16} />
              Adicionar Animal
            </button>
          </div>

          {/* ── Divergência warning ── */}
          {showDivergenciaWarning && (
            <div style={styles.warning.wrapper}>
              <div style={styles.warning.title}>
                <AlertCircle size={15} />
                Atenção: Divergência de Quantidade
              </div>
              <p style={styles.warning.msg}>
                A nota fiscal indica <strong>{quantidadeNota} animais</strong>, mas foram cadastrados{' '}
                <strong>{processados} animais</strong>.
                {processados < quantidadeNota
                  ? ` Faltam ${quantidadeNota - processados} animais para fechar a NF.`
                  : ` Foram cadastrados ${processados - quantidadeNota} animais a mais que a NF.`}
                {' '}Deseja confirmar mesmo assim?
              </p>
              <div style={styles.warning.actions}>
                <button
                  type="button"
                  className="glass-btn secondary"
                  onClick={() => setShowDivergenciaWarning(false)}
                  style={{ padding: '9px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: 700 }}
                >
                  Voltar e corrigir
                </button>
                <button
                  type="button"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '9px 18px',
                    background: 'linear-gradient(135deg, hsl(38 92% 45%), hsl(38 92% 55%))',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 900,
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px hsl(38 92% 50% / 0.3)',
                  }}
                  onClick={() => {
                    setDivergenciaConfirmada(true);
                    setShowDivergenciaWarning(false);
                    handleFinalizarLote();
                  }}
                >
                  <CheckCircle2 size={14} />
                  Confirmar com divergência
                </button>
              </div>
            </div>
          )}

          {/* ── Animal list ── */}
          {animais.length > 0 && (
            <div style={styles.list.wrapper}>
              <div style={styles.list.header}>
                <Beef size={13} />
                Animais Cadastrados nesta Sessão
                <span style={styles.list.badge}>{animais.length} animal(is)</span>
              </div>

              <div>
                {animais.map((animal, idx) => (
                  <div
                    key={animal.id}
                    className="procl-list-item"
                    style={{
                      ...styles.list.item,
                      borderBottom:
                        idx < animais.length - 1
                          ? '1px solid hsl(var(--border) / 0.4)'
                          : 'none',
                    }}
                  >
                    {/* Index */}
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      color: 'hsl(var(--text-muted))',
                      minWidth: '24px',
                    }}>
                      #{idx + 1}
                    </span>

                    {/* Brinco */}
                    <span style={styles.list.brinco}>
                      <Tag size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                      {animal.brinco}
                    </span>

                    {/* SISBOV */}
                    {animal.brinco_sisbov && (
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: 'hsl(var(--text-muted))',
                        maxWidth: '140px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        SISBOV: {animal.brinco_sisbov}
                      </span>
                    )}

                    {/* Sexo chip */}
                    <span style={styles.list.chip(
                      animal.sexo === 'F' ? '#ec4899' : animal.sexo === 'C' ? 'hsl(var(--brand))' : '#60a5fa',
                      animal.sexo === 'F' ? 'rgba(236,72,153,0.1)' : animal.sexo === 'C' ? 'hsl(var(--brand)/0.1)' : 'rgba(96,165,250,0.1)'
                    )}>
                      {SEXO_LABELS[animal.sexo]}
                    </span>

                    {/* Raça chip */}
                    <span style={styles.list.chip('hsl(var(--text-muted))', 'hsl(var(--bg-main))')}>
                      {animal.raca}
                    </span>

                    {/* Peso */}
                    {animal.peso_inicial && (
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'hsl(var(--text-main))' }}>
                        <Scale size={11} style={{ display: 'inline', marginRight: '3px', verticalAlign: 'middle' }} />
                        {animal.peso_inicial} kg
                      </span>
                    )}

                    {/* Remove */}
                    <button
                      type="button"
                      className="procl-remove-btn"
                      style={styles.list.removeBtn}
                      onClick={() => handleRemoveAnimal(animal.id)}
                      title="Remover animal"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {animais.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '32px 24px',
              borderRadius: '14px',
              border: '2px dashed hsl(var(--border))',
              color: 'hsl(var(--text-muted))',
            }}>
              <Beef size={36} style={{ opacity: 0.2, marginBottom: '12px' }} />
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>
                Nenhum animal cadastrado ainda.
              </p>
              <p style={{ margin: '4px 0 0', fontSize: '12px', opacity: 0.7 }}>
                Preencha o formulário acima e clique em "Adicionar Animal".
              </p>
            </div>
          )}
        </div>
      </div>
    </SidePanel>
  );
};

export default ProcessarLoteModal;
