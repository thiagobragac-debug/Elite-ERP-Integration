import React, { useState, useEffect } from 'react';
import {
  Beef, CheckCircle2, ArrowRightCircle, AlertTriangle,
  Target, Scale, Calendar, TrendingUp, DollarSign, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SidePanel } from '../../../components/Layout/SidePanel';

interface CheckOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePens: any[];
  onCheckOut: (data: any) => void;
}

export const CheckOutModal: React.FC<CheckOutModalProps> = ({ isOpen, onClose, activePens, onCheckOut }) => {
  const [selectedPenId, setSelectedPenId] = useState('');
  const [checkOutDate, setCheckOutDate] = useState(new Date().toISOString().split('T')[0]);
  const [finalWeight, setFinalWeight] = useState('');
  const [destination, setDestination] = useState('ABATE');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (isOpen) { setStep(1); setSelectedPenId(''); setFinalWeight(''); }
  }, [isOpen]);

  const selectedPen = activePens.find(p => p.id === selectedPenId);
  const getDOF = (pen: any) => Math.floor((Date.now() - new Date(pen.data_inicio).getTime()) / 86400000);

  const handleSubmit = async () => {
    if (!selectedPenId) return;
    setLoading(true);
    try {
      await onCheckOut({ id: selectedPenId, data_fim: checkOutDate, peso_final: parseFloat(finalWeight), destino: destination, status: 'archived' });
      setStep(3);
      setTimeout(() => { onClose(); }, 2000);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const stats = selectedPen ? [
    { Icon: Beef,       label: 'Cabeças',   value: `${selectedPen.capacidade_animais ?? '—'}` },
    { Icon: Clock,      label: 'DOF',       value: `${getDOF(selectedPen)} dias` },
    { Icon: Scale,      label: 'Peso Ent.', value: selectedPen.peso_medio_entrada ? `${selectedPen.peso_medio_entrada} kg` : '—' },
    { Icon: TrendingUp, label: 'GMD',       value: selectedPen.gmd_atual ? `${selectedPen.gmd_atual} kg/d` : '—' },
    { Icon: Calendar,   label: 'Entrada',   value: new Date(selectedPen.data_inicio).toLocaleDateString('pt-BR') },
    { Icon: DollarSign, label: 'CPD',       value: selectedPen.custo_por_dia ? `R$ ${Number(selectedPen.custo_por_dia).toFixed(2)}` : '—' },
  ] : [];

  return (
    <SidePanel size="large"
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={(e) => { e.preventDefault(); if (step === 1) setStep(2); else if (step === 2) handleSubmit(); }}
      title="Check-out de Lote"
      subtitle="Finalização de ciclo e movimentação de saída"
      icon={ArrowRightCircle}
      submitLabel={step === 1 ? 'Continuar para Dados de Saída' : step === 2 ? 'Confirmar Check-out' : 'Fechar'}
      hideSubmit={step === 3 || (step === 1 && !selectedPenId)}
      loading={loading}
    >
      {/* wrapper ocupa as 4 colunas do tauze-input-grid */}
      <div style={{ gridColumn: 'span 4' }}>
        <AnimatePresence mode="wait">

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              style={{ display: 'flex', gap: 16, width: '100%' }}
            >
              {/* ──── COLUNA ESQUERDA — lista de currais ──── */}
              <div style={{ width: 240, flexShrink: 0 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                  Curral / Lote Ativo
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 380, overflowY: 'auto' }}>
                  {activePens.length === 0 ? (
                    <p style={{ textAlign: 'center', padding: 20, color: 'hsl(var(--text-muted))', fontSize: 12 }}>
                      Nenhum curral ativo.
                    </p>
                  ) : activePens.map(pen => {
                    const sel = selectedPenId === pen.id;
                    return (
                      <button
                        key={pen.id}
                        type="button"
                        onClick={() => setSelectedPenId(pen.id)}
                        style={{
                          padding: '10px 12px', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                          border: `2px solid ${sel ? 'hsl(var(--brand))' : 'hsl(var(--border))'}`,
                          background: sel ? 'hsl(var(--brand)/0.07)' : 'hsl(var(--bg-card))',
                          transition: 'all 0.15s ease',
                          boxShadow: sel ? '0 0 0 3px hsl(var(--brand)/0.12)' : 'none',
                          display: 'flex', flexDirection: 'column', gap: 5
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: 'hsl(var(--text-main))' }}>{pen.nome_curral}</span>
                          {sel && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'hsl(var(--brand))' }} />}
                        </div>
                        <div style={{ fontSize: 11, color: 'hsl(var(--text-muted))', fontWeight: 600 }}>{pen.lotes?.nome || '—'}</div>
                        <div style={{ display: 'flex', gap: 5 }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 700, padding: '2px 6px', background: 'hsl(var(--bg-main))', borderRadius: 5 }}>
                            <Beef size={9} /> {pen.capacidade_animais} cab.
                          </span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 700, padding: '2px 6px', background: 'hsl(var(--bg-main))', borderRadius: 5 }}>
                            <Clock size={9} /> {getDOF(pen)}d
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ──── COLUNA DIREITA — detalhes (ocupa o restante) ──── */}
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                  Resumo do Lote
                </p>
                {!selectedPen ? (
                  <div style={{
                    height: 260, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 10,
                    border: '2px dashed hsl(var(--border))', borderRadius: 14,
                    background: 'hsl(var(--bg-main))'
                  }}>
                    <Target size={28} style={{ opacity: 0.2 }} />
                    <p style={{ fontSize: 12, fontWeight: 600, color: 'hsl(var(--text-muted))', textAlign: 'center', maxWidth: 160, lineHeight: 1.5 }}>
                      Selecione um curral ao lado para ver os detalhes
                    </p>
                  </div>
                ) : (
                  <motion.div
                    key={selectedPen.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      borderRadius: 14,
                      border: '1.5px solid hsl(var(--brand)/0.25)',
                      background: 'hsl(var(--bg-card))',
                      overflow: 'hidden',
                      width: '100%'
                    }}
                  >
                    {/* Header */}
                    <div style={{ padding: '12px 16px', background: 'hsl(var(--brand))', color: 'white' }}>
                      <div style={{ fontSize: 9, fontWeight: 800, opacity: 0.75, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Curral Selecionado</div>
                      <div style={{ fontSize: 17, fontWeight: 900, marginTop: 2 }}>{selectedPen.nome_curral}</div>
                      <div style={{ fontSize: 11, opacity: 0.8, marginTop: 1 }}>Lote: {selectedPen.lotes?.nome || '—'}</div>
                    </div>
                    {/* Stats grid */}
                    <div style={{ padding: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {stats.map(({ Icon, label, value }) => (
                        <div key={label} style={{ background: 'hsl(var(--bg-main))', borderRadius: 10, padding: '8px 10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>
                            <Icon size={10} style={{ flexShrink: 0 }} />
                            <span>{label}</span>
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: 'hsl(var(--text-main))' }}>{value}</div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
              <div style={{ padding: '12px 16px', background: 'hsl(var(--text-main))', borderRadius: 14, color: 'white', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <Target size={18} />
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.65 }}>FINALIZANDO CICLO</div>
                  <div style={{ fontSize: 13, fontWeight: 800 }}>{selectedPen?.nome_curral} • {selectedPen?.lotes?.nome}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
                  <label className="tauze-label">Data de Saída</label>
                  <input type="date" className="tauze-input" value={checkOutDate} onChange={e => setCheckOutDate(e.target.value)} />
                </div>
                <div className="tauze-field-group">
                  <label className="tauze-label">Peso Médio Final (kg)</label>
                  <input type="number" className="tauze-input" placeholder="0.0" value={finalWeight} onChange={e => setFinalWeight(e.target.value)} />
                </div>
                <div className="tauze-field-group">
                  <label className="tauze-label">Destino</label>
                  <select className="tauze-input tauze-select" value={destination} onChange={e => setDestination(e.target.value)}>
                    <option value="ABATE">Frigorífico (Abate)</option>
                    <option value="PASTO">Recria/Pasto</option>
                    <option value="VENDA">Venda Direta</option>
                    <option value="OUTRO">Outro Destino</option>
                  </select>
                </div>
                <div style={{ gridColumn: 'span 2', display: 'flex', gap: 10, padding: '12px 14px', background: 'hsl(38 92% 50% / 0.05)', border: '1px solid hsl(38 92% 50% / 0.2)', borderRadius: 12, color: 'hsl(38 92% 50%)', fontSize: 12, fontWeight: 600 }}>
                  <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                  <p>Ao confirmar, o lote será arquivado e o curral ficará disponível para um novo ciclo.</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── STEP 3 ── */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ width: 72, height: 72, background: 'hsl(142 71% 45% / 0.12)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                <CheckCircle2 size={36} style={{ color: 'hsl(142 71% 45%)' }} />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 900, color: 'hsl(142 71% 45%)', marginBottom: 6 }}>Check-out Realizado!</h3>
              <p style={{ fontSize: 13, color: 'hsl(var(--text-muted))' }}>Ciclo finalizado com sucesso.</p>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </SidePanel>
  );
};
