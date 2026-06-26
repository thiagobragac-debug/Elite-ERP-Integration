import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, AlertCircle, X } from 'lucide-react';

interface AssignConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  submitting: boolean;
  /** Rótulo da entidade de destino (ex: "Lote", "Pasto") */
  entityLabel: string;
  destName: string;
  motivo: string;
  date: string;
  selectedCount: number;
  /** Valor de UA selecionado — apenas para modo pasto */
  selectedUa?: number;
  destCapacity: { current: number; max: number } | null;
  /** Labels dos animais para preview */
  animalLabels: string[];
  /** Se a unidade de capacidade é UA (pasto) ou Cab. (lote) */
  isPasto?: boolean;
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
      <span style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(var(--text-muted))' }}>{label}</span>
      <span style={{ fontSize: '12px', fontWeight: 800, color: color || 'hsl(var(--text-main))', textAlign: 'right' }}>{value}</span>
    </div>
  );
}

export const AssignConfirmModal: React.FC<AssignConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  submitting,
  entityLabel,
  destName,
  motivo,
  date,
  selectedCount,
  selectedUa,
  destCapacity,
  animalLabels,
  isPasto = false,
}) => {
  const addingValue = isPasto && selectedUa != null ? selectedUa : selectedCount;
  const afterValue = (destCapacity?.current || 0) + addingValue;
  const afterPct = destCapacity?.max ? Math.round((afterValue / destCapacity.max) * 100) : null;
  const isOverCapacity = afterPct !== null && afterPct > 100;
  const isNearCapacity = afterPct !== null && afterPct > 85 && !isOverCapacity;
  const capacityColor = isOverCapacity ? '#ef4444' : isNearCapacity ? '#f59e0b' : '#10b981';
  const unit = isPasto ? 'UA' : 'Cab.';
  const formatVal = (n: number) => isPasto ? n.toFixed(1) : Math.round(n).toString();
  const formattedDate = new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR');

  const animalCountLabel = isPasto && selectedUa != null
    ? `${selectedCount} animais (${selectedUa.toFixed(1)} UA)`
    : `${selectedCount} ${selectedCount === 1 ? 'animal' : 'animais'}`;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(6px)',
            zIndex: 99999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px',
          }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 14 }}
            transition={{ type: 'spring', damping: 22, stiffness: 260 }}
            style={{
              background: 'hsl(var(--bg-card))',
              borderRadius: '20px',
              padding: '28px',
              maxWidth: '480px', width: '100%',
              boxShadow: '0 24px 80px rgba(0,0,0,0.35)',
              border: '1px solid hsl(var(--border))',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '12px',
                  background: 'hsl(var(--brand) / 0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'hsl(var(--brand))', flexShrink: 0,
                }}>
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'hsl(var(--text-main))' }}>
                    Confirmar Associação
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'hsl(var(--text-muted))' }}>
                    Revise os dados antes de confirmar
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--text-muted))', padding: '4px', borderRadius: '6px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Resumo */}
            <div style={{
              background: 'hsl(var(--bg-main))', borderRadius: '12px',
              padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px',
              marginBottom: '16px', border: '1px solid hsl(var(--border))',
            }}>
              <Row label={entityLabel} value={destName} />
              <Row label="Animais" value={animalCountLabel} color="hsl(var(--brand))" />
              <Row label="Motivo" value={motivo} />
              <Row label="Data" value={formattedDate} />
              {afterPct !== null && (
                <Row
                  label={`Ocupação após associação`}
                  value={`${formatVal(afterValue)} / ${formatVal(destCapacity?.max || 0)} ${unit} (${afterPct}%)`}
                  color={capacityColor}
                />
              )}
            </div>

            {/* Aviso de superlotação */}
            {isOverCapacity && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 12px',
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '10px', marginBottom: '16px',
                fontSize: '12px', fontWeight: 700, color: '#ef4444',
              }}>
                <AlertTriangle size={16} />
                Atenção: esta associação causará superlotação no destino.
              </div>
            )}

            {/* Preview de animais */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '20px', maxHeight: '80px', overflowY: 'auto' }}>
              {animalLabels.slice(0, 20).map((label, i) => (
                <span key={i} style={{
                  background: 'hsl(var(--brand) / 0.08)', color: 'hsl(var(--brand))',
                  borderRadius: '6px', padding: '2px 8px', fontSize: '11px', fontWeight: 700,
                }}>
                  {label}
                </span>
              ))}
              {animalLabels.length > 20 && (
                <span style={{ color: 'hsl(var(--text-muted))', fontSize: '11px', alignSelf: 'center' }}>
                  +{animalLabels.length - 20} mais
                </span>
              )}
            </div>

            {/* Aviso de irreversibilidade */}
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 12px',
              background: 'hsl(var(--brand) / 0.06)', border: '1px solid hsl(var(--brand) / 0.15)',
              borderRadius: '8px', marginBottom: '20px',
              fontSize: '11px', fontWeight: 600, color: 'hsl(var(--text-muted))',
            }}>
              <AlertCircle size={14} style={{ color: 'hsl(var(--brand))', flexShrink: 0, marginTop: '1px' }} />
              A associação será registrada no histórico de rastreabilidade do animal com data e usuário.
            </div>

            {/* Botões */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={onClose}
                disabled={submitting}
                style={{
                  flex: 1, padding: '12px',
                  border: '1px solid hsl(var(--border))', borderRadius: '10px',
                  background: 'hsl(var(--bg-card))', fontWeight: 700, fontSize: '13px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  color: 'hsl(var(--text-muted))', opacity: submitting ? 0.5 : 1,
                }}
              >
                Voltar
              </button>
              <button
                onClick={onConfirm}
                disabled={submitting}
                style={{
                  flex: 2, padding: '12px',
                  background: isOverCapacity ? '#ef4444' : 'hsl(var(--brand))',
                  border: 'none', borderRadius: '10px',
                  color: 'white', fontWeight: 800, fontSize: '13px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.75 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  transition: 'opacity 0.15s',
                }}
              >
                <CheckCircle2 size={16} />
                {submitting ? 'Associando...' : `Confirmar ${selectedCount} ${selectedCount === 1 ? 'Animal' : 'Animais'}`}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
