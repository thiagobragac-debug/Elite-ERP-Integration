import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
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

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="modal-overlay" onClick={onClose}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="checkout-modal-container"
          onClick={e => e.stopPropagation()}
        >
          <header className="checkout-modal-header">
            <div className="title-group">
              <div className="icon-badge">
                <ArrowRightCircle size={22} className="text-brand" />
              </div>
              <div>
                <h2>Check-out de Lote</h2>
                <p>Finalização de ciclo e movimentação de saída</p>
              </div>
            </div>
            <button className="close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </header>

          <div className="checkout-modal-body">
            {step === 1 && (
              <div className="step-content animate-fade-in">
                <label className="section-label">Selecione o Curral/Lote Ativo</label>
                <div className="pen-selection-list">
                  {activePens.length === 0 ? (
                    <div className="empty-state">Nenhum curral com lote ativo disponível.</div>
                  ) : activePens.map(pen => (
                    <button 
                      key={pen.id}
                      className={`pen-card ${selectedPenId === pen.id ? 'active' : ''}`}
                      onClick={() => setSelectedPenId(pen.id)}
                    >
                      <div className="pen-info">
                        <span className="pen-name">{pen.nome_curral}</span>
                        <span className="lot-name">Lote: {pen.lotes?.nome || 'Sem Nome'}</span>
                      </div>
                      <div className="pen-meta">
                        <div className="meta-tag">
                          <Beef size={12} />
                          <span>{pen.capacidade_animais} cab.</span>
                        </div>
                        <div className="meta-tag">
                          <History size={12} />
                          <span>DOF: {Math.floor((new Date().getTime() - new Date(pen.data_inicio).getTime()) / (1000 * 60 * 60 * 24))}d</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                
                <button 
                  className="primary-btn-full" 
                  disabled={!selectedPenId}
                  onClick={() => setStep(2)}
                >
                  CONTINUAR PARA DADOS DE SAÍDA
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="step-content animate-fade-in">
                <div className="summary-banner">
                  <Target size={20} />
                  <div>
                    <span className="label">Finalizando Ciclo:</span>
                    <span className="value">{selectedPen?.nome_curral} - {selectedPen?.lotes?.nome}</span>
                  </div>
                </div>

                <div className="checkout-form">
                  <div className="form-field">
                    <label className="elite-label"><Calendar size={14} /> Data de Saída</label>
                    <input 
                      type="date" 
                      className="elite-input" 
                      value={checkOutDate}
                      onChange={e => setCheckOutDate(e.target.value)}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-field">
                      <label className="elite-label"><Scale size={14} /> Peso Médio Final (kg)</label>
                      <input 
                        type="number" 
                        className="elite-input" 
                        placeholder="Ex: 580.5"
                        value={finalWeight}
                        onChange={e => setFinalWeight(e.target.value)}
                      />
                    </div>
                    <div className="form-field">
                      <label className="elite-label"><ArrowRightCircle size={14} /> Destino</label>
                      <select 
                        className="elite-select"
                        value={destination}
                        onChange={e => setDestination(e.target.value)}
                      >
                        <option value="ABATE">Frigorífico (Abate)</option>
                        <option value="PASTO">Recria/Pasto (Manejo)</option>
                        <option value="VENDA">Venda Direta (Carga)</option>
                        <option value="OUTRO">Outro Destino</option>
                      </select>
                    </div>
                  </div>

                  <div className="warning-box">
                    <AlertTriangle size={18} />
                    <p>Ao confirmar o check-out, o lote será arquivado e o curral ficará disponível para um novo ciclo.</p>
                  </div>
                </div>

                <div className="actions-footer">
                  <button className="text-btn" onClick={() => setStep(1)}>VOLTAR</button>
                  <button className="primary-btn checkout" onClick={handleSubmit} disabled={loading || !finalWeight}>
                    {loading ? 'PROCESSANDO...' : 'CONFIRMAR CHECK-OUT'}
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="success-state py-12 text-center animate-fade-in">
                <div className="success-icon-wrapper">
                  <CheckCircle2 size={64} className="text-success" />
                </div>
                <h3 className="text-success">Check-out Realizado!</h3>
                <p>Ciclo finalizado com sucesso. O curral está agora disponível.</p>
              </div>
            )}
          </div>

          <style>{`
            .modal-overlay {
              position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6);
              backdrop-filter: blur(8px); z-index: 10000; display: flex;
              align-items: center; justify-content: center; padding: 20px;
            }
            .checkout-modal-container {
              background: hsl(var(--bg-card)); width: 100%; max-width: 550px;
              border-radius: 28px; border: 1px solid hsl(var(--border));
              box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.5); overflow: hidden;
            }
            .checkout-modal-header {
              padding: 24px; border-bottom: 1px solid hsl(var(--border));
              display: flex; justify-content: space-between; align-items: center;
              background: linear-gradient(to bottom, hsl(var(--bg-card)), hsl(var(--bg-main)));
            }
            .checkout-modal-body { padding: 24px; }
            .section-label { display: block; font-size: 11px; font-weight: 900; color: hsl(var(--text-muted)); letter-spacing: 0.1em; margin-bottom: 16px; }
            
            .pen-selection-list { display: flex; flex-direction: column; gap: 8px; max-height: 300px; overflow-y: auto; padding-right: 4px; }
            .pen-card {
              display: flex; align-items: center; justify-content: space-between; padding: 16px;
              background: hsl(var(--bg-main) / 0.5); border: 1px solid hsl(var(--border));
              border-radius: 16px; cursor: pointer; transition: 0.2s; text-align: left;
            }
            .pen-card:hover { border-color: hsl(var(--brand) / 0.5); background: hsl(var(--bg-main)); }
            .pen-card.active { border-color: hsl(var(--brand)); background: hsl(var(--brand) / 0.05); }
            
            .pen-info { display: flex; flex-direction: column; }
            .pen-name { font-weight: 800; font-size: 15px; color: hsl(var(--text-main)); }
            .lot-name { font-size: 12px; color: hsl(var(--text-muted)); font-weight: 600; }
            
            .pen-meta { display: flex; gap: 12px; }
            .meta-tag { display: flex; align-items: center; gap: 4px; padding: 4px 8px; background: hsl(var(--bg-card)); border-radius: 6px; font-size: 10px; font-weight: 800; color: hsl(var(--text-muted)); }
            
            .primary-btn-full { width: 100%; height: 50px; background: hsl(var(--brand)); color: white; border: none; border-radius: 14px; font-weight: 900; margin-top: 24px; cursor: pointer; transition: 0.2s; }
            .primary-btn-full:disabled { opacity: 0.5; cursor: not-allowed; }
            
            .summary-banner { display: flex; align-items: center; gap: 16px; padding: 16px; background: #0f172a; color: white; border-radius: 16px; margin-bottom: 24px; }
            .summary-banner .label { display: block; font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; }
            .summary-banner .value { font-size: 15px; font-weight: 800; }
            
            .checkout-form { display: flex; flex-direction: column; gap: 20px; }
            .warning-box { display: flex; gap: 12px; padding: 16px; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 16px; color: #9a3412; font-size: 12px; font-weight: 600; }
            
            .actions-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 32px; }
            .primary-btn.checkout { background: #ef4444; }
            .primary-btn.checkout:hover { background: #dc2626; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3); }

            .text-brand { color: hsl(var(--brand)); }
            .text-success { color: #10b981; }
            .success-icon-wrapper { width: 100px; height: 100px; background: #f0fdf4; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; }
          `}</style>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
