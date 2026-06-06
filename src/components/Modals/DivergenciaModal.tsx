import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import {
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Clock,
  FileText,
  Baby,
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
interface DivergenciaModalProps {
  isOpen: boolean;
  onClose: () => void;
  quantidadeNota: number;
  quantidadeLote: number;
  loteNome: string;
  onResolved: (motivo: string, acao: string) => void;
}

interface OpcaoResolucao {
  id: string;
  emoji: string;
  icon: React.ReactNode;
  titulo: string;
  descricao: string;
  acao: string;
  motivo: string;
  variante: 'danger' | 'warning' | 'success' | 'neutral';
}

/* ─────────────────────────────────────────────
   Styles (inline, dark-mode compatible via CSS vars)
───────────────────────────────────────────── */
const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    background: 'rgba(0, 0, 0, 0.65)',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
    animation: 'divModal-fadeIn 0.2s ease',
  },
  modal: {
    width: '100%',
    maxWidth: '480px',
    borderRadius: '20px',
    background: 'hsl(var(--bg-card))',
    border: '1px solid hsl(var(--border))',
    boxShadow: '0 24px 64px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.25)',
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
    overflow: 'hidden',
    animation: 'divModal-slideUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 24px 16px',
    borderBottom: '1px solid hsl(var(--border))',
    background:
      'linear-gradient(135deg, hsl(var(--bg-card)) 0%, hsl(45 100% 12% / 0.3) 100%)',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  iconWrap: {
    width: '42px',
    height: '42px',
    borderRadius: '12px',
    background: 'hsl(45 100% 50% / 0.15)',
    border: '1px solid hsl(45 100% 50% / 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerTitle: {
    margin: 0,
    fontSize: '17px',
    fontWeight: 700,
    color: 'hsl(var(--text-primary))',
    letterSpacing: '-0.3px',
  },
  headerSubtitle: {
    margin: '2px 0 0',
    fontSize: '12px',
    color: 'hsl(var(--text-muted))',
    fontWeight: 400,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'hsl(var(--text-muted))',
    padding: '6px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.15s, color 0.15s',
  },
  body: {
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    overflowY: 'auto',
    maxHeight: 'calc(90vh - 160px)',
  },
  summaryBox: {
    borderRadius: '12px',
    background: 'hsl(var(--bg-secondary, var(--bg-card)))',
    border: '1px solid hsl(var(--border))',
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  summaryRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '13px',
    color: 'hsl(var(--text-secondary))',
  },
  summaryValue: {
    fontWeight: 600,
    color: 'hsl(var(--text-primary))',
    fontSize: '14px',
  },
  summaryDivider: {
    height: '1px',
    background: 'hsl(var(--border))',
    margin: '2px 0',
  },
  sectionTitle: {
    margin: 0,
    fontSize: '13px',
    fontWeight: 600,
    color: 'hsl(var(--text-secondary))',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.6px',
  },
  optionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  textarea: {
    width: '100%',
    minHeight: '76px',
    borderRadius: '10px',
    border: '1px solid hsl(var(--border))',
    background: 'hsl(var(--bg-secondary, var(--bg-card)))',
    color: 'hsl(var(--text-primary))',
    fontSize: '13px',
    padding: '10px 12px',
    resize: 'vertical' as const,
    outline: 'none',
    transition: 'border-color 0.15s',
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const,
  },
  footer: {
    display: 'flex',
    gap: '10px',
    padding: '16px 24px 20px',
    borderTop: '1px solid hsl(var(--border))',
  },
  btnCancel: {
    flex: 1,
    padding: '10px 16px',
    borderRadius: '10px',
    border: '1px solid hsl(var(--border))',
    background: 'transparent',
    color: 'hsl(var(--text-secondary))',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background 0.15s, color 0.15s',
    fontFamily: 'inherit',
  },
  btnConfirm: {
    flex: 2,
    padding: '10px 16px',
    borderRadius: '10px',
    border: 'none',
    background: 'hsl(var(--primary, 220 90% 56%))',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.15s, transform 0.1s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    fontFamily: 'inherit',
  },
  btnConfirmDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
};

/* ─────────────────────────────────────────────
   Option Card
───────────────────────────────────────────── */
const variantColors: Record<
  string,
  { bg: string; border: string; selectedBg: string; selectedBorder: string; iconColor: string }
> = {
  danger: {
    bg: 'hsl(0 80% 50% / 0.06)',
    border: 'hsl(0 80% 50% / 0.2)',
    selectedBg: 'hsl(0 80% 50% / 0.14)',
    selectedBorder: 'hsl(0 80% 50% / 0.5)',
    iconColor: 'hsl(0 80% 60%)',
  },
  warning: {
    bg: 'hsl(45 100% 50% / 0.06)',
    border: 'hsl(45 100% 50% / 0.2)',
    selectedBg: 'hsl(45 100% 50% / 0.14)',
    selectedBorder: 'hsl(45 100% 50% / 0.5)',
    iconColor: 'hsl(45 100% 55%)',
  },
  success: {
    bg: 'hsl(142 70% 45% / 0.06)',
    border: 'hsl(142 70% 45% / 0.2)',
    selectedBg: 'hsl(142 70% 45% / 0.14)',
    selectedBorder: 'hsl(142 70% 45% / 0.5)',
    iconColor: 'hsl(142 70% 50%)',
  },
  neutral: {
    bg: 'hsl(220 20% 50% / 0.06)',
    border: 'hsl(220 20% 50% / 0.2)',
    selectedBg: 'hsl(220 20% 50% / 0.14)',
    selectedBorder: 'hsl(220 20% 50% / 0.4)',
    iconColor: 'hsl(220 20% 65%)',
  },
};

interface OptionCardProps {
  opcao: OpcaoResolucao;
  selected: boolean;
  onSelect: () => void;
}

function OptionCard({ opcao, selected, onSelect }: OptionCardProps) {
  const colors = variantColors[opcao.variante];
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '12px 14px',
        borderRadius: '12px',
        border: `1.5px solid ${selected ? colors.selectedBorder : colors.border}`,
        background: selected ? colors.selectedBg : colors.bg,
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
        transition: 'all 0.18s ease',
        outline: 'none',
        transform: selected ? 'scale(1.005)' : 'scale(1)',
        boxShadow: selected ? '0 4px 16px rgba(0,0,0,0.12)' : 'none',
      }}
      aria-pressed={selected}
    >
      {/* Radio dot */}
      <div
        style={{
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          border: `2px solid ${selected ? colors.selectedBorder : colors.border}`,
          background: selected ? colors.selectedBorder : 'transparent',
          flexShrink: 0,
          marginTop: '1px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.18s ease',
        }}
      >
        {selected && (
          <div
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: '#fff',
            }}
          />
        )}
      </div>

      {/* Icon */}
      <div
        style={{
          fontSize: '22px',
          flexShrink: 0,
          lineHeight: 1,
          marginTop: '0px',
        }}
      >
        {opcao.emoji}
      </div>

      {/* Text */}
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: 'hsl(var(--text-primary))',
            marginBottom: '3px',
          }}
        >
          {opcao.titulo}
        </div>
        <div
          style={{
            fontSize: '12px',
            color: 'hsl(var(--text-muted))',
            lineHeight: 1.5,
          }}
        >
          {opcao.descricao}
        </div>
      </div>
    </button>
  );
}

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
export function DivergenciaModal({
  isOpen,
  onClose,
  quantidadeNota,
  quantidadeLote,
  loteNome,
  onResolved,
}: DivergenciaModalProps) {
  const [opcaoSelecionada, setOpcaoSelecionada] = useState<string | null>(null);
  const [observacao, setObservacao] = useState('');

  if (!isOpen) return null;

  const diferenca = quantidadeLote - quantidadeNota;
  const faltam = diferenca < 0; // lote < nota → animais faltando
  const sobram = diferenca > 0; // lote > nota → animais sobrando

  /* Build options according to scenario */
  const opcoes: OpcaoResolucao[] = [];

  if (faltam) {
    opcoes.push({
      id: 'mortalidade',
      emoji: '💀',
      icon: null,
      titulo: 'Mortalidade em Trânsito',
      descricao: `Registrar baixa de ${Math.abs(diferenca)} ${Math.abs(diferenca) === 1 ? 'animal' : 'animais'} com causa "Transporte".`,
      acao: 'REGISTRAR_BAIXA',
      motivo: 'Mortalidade em trânsito',
      variante: 'danger',
    });
  }

  opcoes.push({
    id: 'erro_nota',
    emoji: '📄',
    icon: null,
    titulo: 'Erro na Nota Fiscal',
    descricao: 'Registrar discrepância para emissão de Carta de Correção junto à emitente.',
    acao: 'REGISTRAR_DISCREPANCIA',
    motivo: 'Erro na Nota Fiscal',
    variante: 'warning',
  });

  if (sobram) {
    opcoes.push({
      id: 'nascimento',
      emoji: '🐄',
      icon: null,
      titulo: 'Nascimento em Trânsito',
      descricao: `Adicionar ${diferenca} ${diferenca === 1 ? 'animal extra' : 'animais extras'} ao lote "${loteNome}".`,
      acao: 'ADICIONAR_ANIMAIS',
      motivo: 'Nascimento em trânsito',
      variante: 'success',
    });
  }

  opcoes.push({
    id: 'aguardar',
    emoji: '⏳',
    icon: null,
    titulo: 'Aguardar Confirmação',
    descricao: 'Salvar lote como "divergente" e resolver a inconsistência posteriormente.',
    acao: 'AGUARDAR',
    motivo: 'Pendente de confirmação',
    variante: 'neutral',
  });

  const handleConfirm = () => {
    if (!opcaoSelecionada) return;
    const opcao = opcoes.find((o) => o.id === opcaoSelecionada);
    if (!opcao) return;

    const motivo = observacao.trim()
      ? `${opcao.motivo} — ${observacao.trim()}`
      : opcao.motivo;

    onResolved(motivo, opcao.acao);
    toast.success('Divergência registrada com sucesso!');
    // reset
    setOpcaoSelecionada(null);
    setObservacao('');
    onClose();
  };

  const handleClose = () => {
    setOpcaoSelecionada(null);
    setObservacao('');
    onClose();
  };

  const diferencaLabel =
    diferenca === 0
      ? '0'
      : diferenca > 0
      ? `+${diferenca}`
      : `${diferenca}`;

  const diferencaColor =
    diferenca < 0
      ? 'hsl(0 75% 60%)'
      : diferenca > 0
      ? 'hsl(142 65% 52%)'
      : 'hsl(var(--text-primary))';

  const modalContent = (
    <>
      {/* Keyframe injection */}
      <style>{`
        @keyframes divModal-fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes divModal-slideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        .divModal-closeBtn:hover {
          background: hsl(var(--bg-secondary, 0 0% 20%)) !important;
          color: hsl(var(--text-primary)) !important;
        }
        .divModal-cancelBtn:hover {
          background: hsl(var(--bg-secondary, 0 0% 20%)) !important;
          color: hsl(var(--text-primary)) !important;
        }
        .divModal-confirmBtn:not(:disabled):hover {
          opacity: 0.88;
          transform: translateY(-1px);
        }
        .divModal-confirmBtn:not(:disabled):active {
          transform: translateY(0);
        }
        .divModal-textarea:focus {
          border-color: hsl(var(--primary, 220 90% 56%)) !important;
          box-shadow: 0 0 0 3px hsl(var(--primary, 220 90% 56%) / 0.15);
        }
      `}</style>

      {/* Backdrop */}
      <div style={styles.backdrop} onClick={handleClose} role="dialog" aria-modal="true">
        {/* Modal panel */}
        <div
          style={styles.modal}
          onClick={(e) => e.stopPropagation()}
          role="document"
        >
          {/* ── Header ── */}
          <div style={styles.header}>
            <div style={styles.headerLeft}>
              <div style={styles.iconWrap}>
                <AlertTriangle size={20} color="hsl(45 100% 55%)" strokeWidth={2.2} />
              </div>
              <div>
                <h2 style={styles.headerTitle}>Divergência Detectada</h2>
                <p style={styles.headerSubtitle}>Lote: {loteNome}</p>
              </div>
            </div>
            <button
              className="divModal-closeBtn"
              style={styles.closeBtn}
              onClick={handleClose}
              aria-label="Fechar modal"
            >
              <XCircle size={20} />
            </button>
          </div>

          {/* ── Body ── */}
          <div style={styles.body}>
            {/* Summary box */}
            <div style={styles.summaryBox}>
              <div style={styles.summaryRow}>
                <span>📋 Nota Fiscal informa:</span>
                <span style={styles.summaryValue}>{quantidadeNota} cabeças</span>
              </div>
              <div style={styles.summaryRow}>
                <span>🏷️ Cadastradas no sistema:</span>
                <span style={styles.summaryValue}>{quantidadeLote} cabeças</span>
              </div>
              <div style={styles.summaryDivider} />
              <div style={styles.summaryRow}>
                <span style={{ fontWeight: 600, color: 'hsl(var(--text-primary))' }}>
                  Diferença:
                </span>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: '15px',
                    color: diferencaColor,
                  }}
                >
                  {diferencaLabel} cabeça{Math.abs(diferenca) !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Options */}
            <div>
              <p style={{ ...styles.sectionTitle, marginBottom: '10px' }}>
                Como deseja resolver?
              </p>
              <div style={styles.optionsList}>
                {opcoes.map((opcao) => (
                  <OptionCard
                    key={opcao.id}
                    opcao={opcao}
                    selected={opcaoSelecionada === opcao.id}
                    onSelect={() => setOpcaoSelecionada(opcao.id)}
                  />
                ))}
              </div>
            </div>

            {/* Observações */}
            <div>
              <p style={{ ...styles.sectionTitle, marginBottom: '8px' }}>
                Observações{' '}
                <span
                  style={{
                    fontWeight: 400,
                    textTransform: 'none',
                    letterSpacing: 0,
                    color: 'hsl(var(--text-muted))',
                  }}
                >
                  (opcional)
                </span>
              </p>
              <textarea
                className="divModal-textarea"
                style={styles.textarea}
                placeholder="Adicione informações adicionais sobre a divergência..."
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* ── Footer ── */}
          <div style={styles.footer}>
            <button
              className="divModal-cancelBtn"
              style={styles.btnCancel}
              onClick={handleClose}
              type="button"
            >
              Cancelar
            </button>
            <button
              className="divModal-confirmBtn"
              style={{
                ...styles.btnConfirm,
                ...(opcaoSelecionada ? {} : styles.btnConfirmDisabled),
              }}
              onClick={handleConfirm}
              disabled={!opcaoSelecionada}
              type="button"
            >
              <CheckCircle2 size={16} />
              Confirmar Resolução
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}

export default DivergenciaModal;
