import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, 
  Layers, 
  Calendar, 
  CheckCircle2, 
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FormModal } from '../../../components/Forms/FormModal';
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

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={(e) => { e.preventDefault(); if (step === 1) setStep(2); else if (step === 2) handleSubmit(); }}
      title="Lançamento em Lote"
      subtitle="Processamento em massa de eventos reprodutivos"
      icon={ClipboardCheck}
      submitLabel={step === 1 ? `Configurar para ${lotAnimalCount} Animais` : step === 2 ? "Lançar para todo o lote" : "Fechar"}
      hideSubmit={step === 3 || (step === 1 && !selectedLotId)}
      loading={loading}
    >
      <div style={{ gridColumn: 'span 2' }}>
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
              <label className="elite-label" style={{ marginBottom: '16px', display: 'block' }}>Selecione o Lote de Matrizes</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
                {lots.map(lot => (
                  <button 
                    key={lot.id}
                    type="button"
                    style={{ 
                      padding: '16px', borderRadius: '16px', border: `1.5px solid ${selectedLotId === lot.id ? 'hsl(var(--brand))' : 'hsl(var(--border))'}`,
                      background: selectedLotId === lot.id ? 'hsl(var(--brand)/0.05)' : 'white',
                      display: 'flex', alignItems: 'center', gap: '16px', textAlign: 'left', cursor: 'pointer'
                    }}
                    onClick={() => handleLotSelect(lot.id)}
                  >
                    <Layers size={18} style={{ color: selectedLotId === lot.id ? 'hsl(var(--brand))' : 'hsl(var(--text-muted))' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 800 }}>{lot.nome}</div>
                      <div style={{ fontSize: '10px', fontWeight: 600, opacity: 0.6 }}>LOTE OPERACIONAL</div>
                    </div>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid hsl(var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {selectedLotId === lot.id && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'hsl(var(--brand))' }}></div>}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
              <div style={{ padding: '16px', background: 'hsl(var(--text-main))', borderRadius: '16px', color: 'white', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <Users size={18} />
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, opacity: 0.7 }}>LOTE SELECIONADO</div>
                  <div style={{ fontSize: '13px', fontWeight: 800 }}>{lots.find(l => l.id === selectedLotId)?.nome} • {lotAnimalCount} Matrizes</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="elite-field-group" style={{ gridColumn: 'span 2' }}>
                  <label className="elite-label">Tipo de Manejo</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                    {['IATF', 'Palpação', 'Parto', 'Secagem'].map(type => (
                      <button 
                        key={type}
                        type="button"
                        style={{ 
                          padding: '10px', borderRadius: '10px', border: `1px solid ${eventType === type ? 'hsl(var(--brand))' : 'hsl(var(--border))'}`,
                          background: eventType === type ? 'hsl(var(--brand))' : 'white',
                          color: eventType === type ? 'white' : 'hsl(var(--text-muted))',
                          fontSize: '11px', fontWeight: 800, cursor: 'pointer'
                        }}
                        onClick={() => setEventType(type)}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="elite-field-group">
                  <label className="elite-label">Data do Evento</label>
                  <input type="date" className="elite-input" value={eventDate} onChange={e => setEventDate(e.target.value)} />
                </div>

                <div className="elite-field-group">
                  <label className="elite-label">Resultado Geral</label>
                  <select className="elite-input elite-select" value={result} onChange={e => setResult(e.target.value)}>
                    <option value="Pendente">Pendente</option>
                    <option value="Prenha">Prenha</option>
                    <option value="Vazia">Vazia</option>
                    <option value="Aborto">Aborto</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ width: '80px', height: '80px', background: 'hsl(142 71% 45% / 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <CheckCircle2 size={40} style={{ color: 'hsl(142 71% 45%)' }} />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'hsl(142 71% 45%)', marginBottom: '8px' }}>Lançamento Concluído!</h3>
              <p style={{ fontSize: '14px', color: 'hsl(var(--text-muted))' }}>Eventos registrados com sucesso.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </FormModal>
  );
};
