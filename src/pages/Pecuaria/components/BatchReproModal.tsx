import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  ClipboardCheck, 
  Layers, 
  Calendar, 
  Heart, 
  CheckCircle2, 
  Zap,
  Activity,
  Users,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../lib/supabase';

interface BatchReproModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBatchSubmit: (data: any) => void;
  activeFarmId: string;
  tenantId: string;
}

export const BatchReproModal: React.FC<BatchReproModalProps> = ({ 
  isOpen, 
  onClose, 
  onBatchSubmit, 
  activeFarmId,
  tenantId
}) => {
  const [lots, setLots] = useState<any[]>([]);
  const [selectedLotId, setSelectedLotId] = useState('');
  const [eventType, setEventType] = useState('IATF');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [result, setResult] = useState('Pendente');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [lotAnimalCount, setLotAnimalCount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      fetchLots();
      setStep(1);
      setSelectedLotId('');
    }
  }, [isOpen]);

  const fetchLots = async () => {
    const { data } = await supabase
      .from('lotes')
      .select('id, nome')
      .eq('fazenda_id', activeFarmId);
    if (data) setLots(data);
  };

  const handleLotSelect = async (lotId: string) => {
    setSelectedLotId(lotId);
    // Buscar contagem de animais no lote
    const { count } = await supabase
      .from('animais')
      .select('*', { count: 'exact', head: true })
      .eq('lote_id', lotId);
    setLotAnimalCount(count || 0);
  };

  const handleSubmit = async () => {
    if (!selectedLotId) return;
    setLoading(true);
    
    try {
      // Buscar todos os IDs de animais no lote
      const { data: animals } = await supabase
        .from('animais')
        .select('id')
        .eq('lote_id', selectedLotId);

      if (animals && animals.length > 0) {
        const batchData = animals.map(animal => ({
          animal_id: animal.id,
          tipo_evento: eventType,
          data_evento: eventDate,
          resultado: result,
          status: 'completed',
          fazenda_id: activeFarmId,
          tenant_id: tenantId
        }));

        await onBatchSubmit(batchData);
        setStep(3);
        setTimeout(() => {
          onClose();
        }, 2000);
      }
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
          className="batch-modal-container"
          onClick={e => e.stopPropagation()}
        >
          <header className="batch-modal-header">
            <div className="title-group">
              <div className="icon-badge">
                <ClipboardCheck size={22} className="text-brand" />
              </div>
              <div>
                <h2>Lançamento em Lote</h2>
                <p>Processamento em massa de eventos reprodutivos</p>
              </div>
            </div>
            <button className="close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </header>

          <div className="batch-modal-body">
            {step === 1 && (
              <div className="step-content animate-fade-in">
                <label className="section-label">Selecione o Lote de Matrizes</label>
                <div className="lot-selection-grid">
                  {lots.length === 0 ? (
                    <div className="empty-state">Nenhum lote encontrado.</div>
                  ) : lots.map(lot => (
                    <button 
                      key={lot.id}
                      className={`lot-card ${selectedLotId === lot.id ? 'active' : ''}`}
                      onClick={() => handleLotSelect(lot.id)}
                    >
                      <Layers size={20} />
                      <div className="text-left">
                        <span className="lot-name">{lot.nome}</span>
                        <span className="lot-meta">Lote Operacional</span>
                      </div>
                      <div className="radio-circle">
                        {selectedLotId === lot.id && <div className="inner"></div>}
                      </div>
                    </button>
                  ))}
                </div>

                <button 
                  className="primary-btn-full" 
                  disabled={!selectedLotId}
                  onClick={() => setStep(2)}
                >
                  CONFIGURAR EVENTO PARA {lotAnimalCount} ANIMAIS
                  <Zap size={16} />
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="step-content animate-fade-in">
                <div className="summary-banner">
                  <Users size={20} />
                  <div>
                    <span className="label">Lote Selecionado:</span>
                    <span className="value">{lots.find(l => l.id === selectedLotId)?.nome} ({lotAnimalCount} Matrizes)</span>
                  </div>
                </div>

                <div className="batch-form">
                  <div className="form-field">
                    <label className="elite-label">Tipo de Manejo Reprodutivo</label>
                    <div className="repro-type-grid">
                      {['IATF', 'Palpação', 'Parto', 'Secagem'].map(type => (
                        <button 
                          key={type}
                          className={`type-btn ${eventType === type ? 'active' : ''}`}
                          onClick={() => setEventType(type)}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-field">
                      <label className="elite-label"><Calendar size={14} /> Data do Evento</label>
                      <input 
                        type="date" 
                        className="elite-input" 
                        value={eventDate}
                        onChange={e => setEventDate(e.target.value)}
                      />
                    </div>
                    <div className="form-field">
                      <label className="elite-label"><Activity size={14} /> Resultado Geral</label>
                      <select 
                        className="elite-select"
                        value={result}
                        onChange={e => setResult(e.target.value)}
                      >
                        <option value="Pendente">Pendente (Diagnóstico Futuro)</option>
                        <option value="Prenha">Confirmado: Prenha</option>
                        <option value="Vazia">Confirmado: Vazia</option>
                        <option value="Aborto">Ocorrência: Aborto</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="actions-footer">
                  <button className="text-btn" onClick={() => setStep(1)}>VOLTAR</button>
                  <button className="primary-btn launch" onClick={handleSubmit} disabled={loading}>
                    {loading ? 'PROCESSANDO...' : 'LANÇAR PARA TODO O LOTE'}
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="success-state py-12 text-center animate-fade-in">
                <div className="success-icon-wrapper">
                  <CheckCircle2 size={64} className="text-success" />
                </div>
                <h3 className="text-success">Lançamento Concluído!</h3>
                <p>Os eventos foram registrados para todos os animais do lote.</p>
              </div>
            )}
          </div>

          <style>{`
            .modal-overlay {
              position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6);
              backdrop-filter: blur(8px); z-index: 10000; display: flex;
              align-items: center; justify-content: center; padding: 20px;
            }
            .batch-modal-container {
              background: hsl(var(--bg-card)); width: 100%; max-width: 500px;
              border-radius: 28px; border: 1px solid hsl(var(--border));
              box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.5); overflow: hidden;
            }
            .batch-modal-header {
              padding: 24px; border-bottom: 1px solid hsl(var(--border));
              display: flex; justify-content: space-between; align-items: center;
              background: linear-gradient(to bottom, hsl(var(--bg-card)), hsl(var(--bg-main)));
            }
            .batch-modal-body { padding: 24px 24px 32px 24px; }
            .section-label { display: block; font-size: 11px; font-weight: 900; color: hsl(var(--text-muted)); letter-spacing: 0.1em; margin-bottom: 16px; }
            
            .lot-selection-grid { display: flex; flex-direction: column; gap: 10px; max-height: 250px; overflow-y: auto; padding-right: 4px; }
            .lot-card {
              display: flex; align-items: center; gap: 16px; padding: 16px;
              background: hsl(var(--bg-main) / 0.5); border: 1px solid hsl(var(--border));
              border-radius: 16px; cursor: pointer; transition: 0.2s; color: hsl(var(--text-muted));
            }
            .lot-card:hover { border-color: hsl(var(--brand) / 0.5); background: hsl(var(--bg-main)); }
            .lot-card.active { border-color: hsl(var(--brand)); background: hsl(var(--brand) / 0.05); color: hsl(var(--text-main)); }
            .lot-name { display: block; font-weight: 800; font-size: 14px; }
            .lot-meta { display: block; font-size: 11px; opacity: 0.7; }
            
            .primary-btn-full { width: 100%; height: 50px; background: hsl(var(--brand)); color: white; border: none; border-radius: 14px; font-weight: 900; font-size: 13px; display: flex; align-items: center; justify-content: center; gap: 10px; margin-top: 24px; cursor: pointer; transition: 0.2s; }
            .primary-btn-full:disabled { opacity: 0.5; cursor: not-allowed; }
            
            .summary-banner { display: flex; align-items: center; gap: 16px; padding: 16px; background: #0f172a; color: white; border-radius: 16px; margin-bottom: 24px; }
            .summary-banner .label { display: block; font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; }
            .summary-banner .value { font-size: 14px; font-weight: 800; }
            
            .batch-form { display: flex; flex-direction: column; gap: 28px; }
            .repro-type-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
            .form-field { display: flex; flex-direction: column; gap: 10px; }
            .form-row { display: flex; flex-direction: column; gap: 24px; }
            .type-btn { padding: 12px; border-radius: 12px; border: 1px solid hsl(var(--border)); background: hsl(var(--bg-main)); font-size: 12px; font-weight: 800; cursor: pointer; transition: 0.2s; color: hsl(var(--text-muted)); }
            .type-btn:hover { border-color: hsl(var(--brand) / 0.5); }
            .type-btn.active { background: hsl(var(--brand)); color: white; border-color: hsl(var(--brand)); }
            
            .actions-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid hsl(var(--border) / 0.5); }
            .primary-btn.launch { background: #10b981; height: 46px; padding: 0 32px; border-radius: 12px; font-size: 13px; }
            .primary-btn.launch:hover { background: #059669; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); }
            .text-btn { font-size: 12px; font-weight: 800; color: hsl(var(--text-muted)); cursor: pointer; text-transform: uppercase; letter-spacing: 0.05em; }
            .text-btn:hover { color: hsl(var(--text-main)); }

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
