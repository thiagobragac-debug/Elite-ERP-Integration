import React, { useState, useEffect } from 'react';
import { 
  Scale, 
  Calendar, 
  Beef, 
  CheckCircle2, 
  ArrowRightCircle,
  AlertTriangle,
  History,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FormModal } from '../../../components/Forms/FormModal';
import { supabase } from '../../../lib/supabase';

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
    if (isOpen) {
      setStep(1);
      setSelectedPenId('');
      setFinalWeight('');
    }
  }, [isOpen]);

  const selectedPen = activePens.find(p => p.id === selectedPenId);

  const handleSubmit = async () => {
    if (!selectedPenId) return;
    setLoading(true);
    
    try {
      const payload = {
        id: selectedPenId,
        data_fim: checkOutDate,
        peso_final: parseFloat(finalWeight),
        destino: destination,
        status: 'archived'
      };
      
      await onCheckOut(payload);
      setStep(3);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={(e) => { e.preventDefault(); if (step === 1) setStep(2); else if (step === 2) handleSubmit(); }}
      title="Check-out de Lote"
      subtitle="Finalização de ciclo e movimentação de saída"
      icon={ArrowRightCircle}
      submitLabel={step === 1 ? "Continuar para Dados de Saída" : step === 2 ? "Confirmar Check-out" : "Fechar"}
      hideSubmit={step === 3 || (step === 1 && !selectedPenId)}
      loading={loading}
    >
      <div style={{ gridColumn: 'span 2' }}>
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
              <label className="elite-label" style={{ marginBottom: '16px', display: 'block' }}>Selecione o Curral/Lote Ativo</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
                {activePens.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px', color: 'hsl(var(--text-muted))', fontSize: '12px' }}>Nenhum curral com lote ativo disponível.</div>
                ) : activePens.map(pen => (
                  <button 
                    key={pen.id}
                    type="button"
                    style={{ 
                      padding: '16px', borderRadius: '16px', border: `1.5px solid ${selectedPenId === pen.id ? 'hsl(var(--brand))' : 'hsl(var(--border))'}`,
                      background: selectedPenId === pen.id ? 'hsl(var(--brand)/0.05)' : 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left', cursor: 'pointer'
                    }}
                    onClick={() => setSelectedPenId(pen.id)}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ fontSize: '14px', fontWeight: 800 }}>{pen.nome_curral}</div>
                      <div style={{ fontSize: '11px', fontWeight: 600, opacity: 0.7 }}>Lote: {pen.lotes?.nome || 'Sem Nome'}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', background: 'hsl(var(--bg-main))', borderRadius: '6px', fontSize: '10px', fontWeight: 800 }}>
                        <Beef size={10} />
                        <span>{pen.capacidade_animais} cab.</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', background: 'hsl(var(--bg-main))', borderRadius: '6px', fontSize: '10px', fontWeight: 800 }}>
                        <History size={10} />
                        <span>DOF: {Math.floor((new Date().getTime() - new Date(pen.data_inicio).getTime()) / (1000 * 60 * 60 * 24))}d</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
              <div style={{ padding: '16px', background: 'hsl(var(--text-main))', borderRadius: '16px', color: 'white', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <Target size={18} />
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, opacity: 0.7 }}>FINALIZANDO CICLO</div>
                  <div style={{ fontSize: '13px', fontWeight: 800 }}>{selectedPen?.nome_curral} • {selectedPen?.lotes?.nome}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="elite-field-group" style={{ gridColumn: 'span 2' }}>
                  <label className="elite-label">Data de Saída</label>
                  <input type="date" className="elite-input" value={checkOutDate} onChange={e => setCheckOutDate(e.target.value)} />
                </div>

                <div className="elite-field-group">
                  <label className="elite-label">Peso Médio Final (kg)</label>
                  <input type="number" className="elite-input" placeholder="0.0" value={finalWeight} onChange={e => setFinalWeight(e.target.value)} />
                </div>

                <div className="elite-field-group">
                  <label className="elite-label">Destino</label>
                  <select className="elite-input elite-select" value={destination} onChange={e => setDestination(e.target.value)}>
                    <option value="ABATE">Frigorífico (Abate)</option>
                    <option value="PASTO">Recria/Pasto (Manejo)</option>
                    <option value="VENDA">Venda Direta (Carga)</option>
                    <option value="OUTRO">Outro Destino</option>
                  </select>
                </div>

                <div style={{ gridColumn: 'span 2', display: 'flex', gap: '12px', padding: '16px', background: 'hsl(38 92% 50% / 0.05)', border: '1px solid hsl(38 92% 50% / 0.2)', borderRadius: '16px', color: 'hsl(38 92% 50%)', fontSize: '12px', fontWeight: 600 }}>
                  <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                  <p>Ao confirmar o check-out, o lote será arquivado e o curral ficará disponível para um novo ciclo.</p>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ width: '80px', height: '80px', background: 'hsl(142 71% 45% / 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <CheckCircle2 size={40} style={{ color: 'hsl(142 71% 45%)' }} />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'hsl(142 71% 45%)', marginBottom: '8px' }}>Check-out Realizado!</h3>
              <p style={{ fontSize: '14px', color: 'hsl(var(--text-muted))' }}>Ciclo finalizado com sucesso.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </FormModal>
  );
};
