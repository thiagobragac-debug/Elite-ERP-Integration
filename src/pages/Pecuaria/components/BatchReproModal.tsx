import React, { useState, useEffect, useMemo } from 'react';
import { 
  ClipboardCheck, 
  Layers, 
  Calendar, 
  CheckCircle2, 
  Users,
  Activity,
  Hash,
  AlertTriangle,
  CalendarDays,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SidePanel } from '../../../components/Layout/SidePanel';
import { supabase } from '../../../lib/supabase';
import { SearchableSelect } from '../../../components/Forms/SearchableSelect';

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
  
  // Mutantes
  const [result, setResult] = useState('Pendente');
  const [protocolo, setProtocolo] = useState('Ovsynch');
  const [touro, setTouro] = useState('');
  const [inseminador, setInseminador] = useState('');
  const [diasGestacao, setDiasGestacao] = useState('');
  
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
          touro: touro,
          observacoes: protocolo ? `Protocolo: ${protocolo} | Insem: ${inseminador}` : '',
          status: 'completed',
          fazenda_id: activeFarmId,
          tenant_id: tenantId
        }));

        await onBatchSubmit(batchData);
        setStep(3);
        setTimeout(() => {
          onClose();
        }, 3000); // Dar tempo para ler
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const batchStats = useMemo(() => {
    let summary = '';
    let predictedDate = '';
    const lotName = lots.find(l => l.id === selectedLotId)?.nome || 'Lote';

    if (eventType === 'IATF') {
      summary = `Você está prestes a aplicar IATF${protocolo ? ` (${protocolo})` : ''} em ${lotAnimalCount} matrizes do ${lotName}${touro ? ` usando sêmen ${touro}` : ''}.`;
      const prev = new Date(eventDate);
      prev.setDate(prev.getDate() + 30);
      predictedDate = `Previsão de Toque coletivo: ${prev.toLocaleDateString('pt-BR')}`;
    } else if (eventType === 'Palpação') {
      summary = `Lançamento em massa de toque para ${lotAnimalCount} matrizes do ${lotName}. Diagnóstico: ${result}.`;
      if (result === 'Prenha' && diasGestacao) {
        const prev = new Date();
        prev.setDate(prev.getDate() + (285 - parseInt(diasGestacao)));
        predictedDate = `Previsão de Parto coletivo: ${prev.toLocaleDateString('pt-BR')}`;
      }
    } else {
      summary = `Você vai registrar ${eventType} em massa para ${lotAnimalCount} matrizes do ${lotName}.`;
    }

    return { summary, predictedDate };
  }, [eventType, eventDate, protocolo, touro, inseminador, lotAnimalCount, selectedLotId, lots, result, diasGestacao]);

  return (
    <SidePanel size="large"
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
              <label className="tauze-label" style={{ marginBottom: '16px', display: 'block' }}>Selecione o Lote de Matrizes</label>
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

              <div className="form-grid">
                <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
                  <label className="tauze-label">Tipo de Manejo Coletivo</label>
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

                <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
                  <label className="tauze-label"><Calendar size={14} /> Data do Evento</label>
                  <input type="date" className="tauze-input" value={eventDate} onChange={e => setEventDate(e.target.value)} />
                </div>

                {/* Mutantes IATF */}
                {eventType === 'IATF' && (
                  <>
                    <div className="tauze-field-group">
                      <label className="tauze-label"><Activity size={14} /> Protocolo Hormonal</label>
                      <SearchableSelect 
                        value={protocolo}
                        onChange={setProtocolo}
                        options={[
                          { value: `Ovsynch`, label: `Ovsynch` },
                          { value: `J-Synch`, label: `J-Synch` },
                          { value: `Presynch`, label: `Presynch` },
                          { value: `Outro`, label: `Outro Protocolo` }
                        ]}
                      />
                    </div>
                    <div className="tauze-field-group">
                      <label className="tauze-label"><Hash size={14} /> Partida de Sêmen / Touro</label>
                      <input className="tauze-input" placeholder="Ex: Angus 123" value={touro} onChange={e => setTouro(e.target.value)} />
                    </div>
                    <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
                      <label className="tauze-label"><Users size={14} /> Inseminador / Técnico</label>
                      <input className="tauze-input" placeholder="Nome do responsável pelo procedimento..." value={inseminador} onChange={e => setInseminador(e.target.value)} />
                    </div>
                  </>
                )}

                {/* Mutantes TOQUE */}
                {eventType === 'Palpação' && (
                  <>
                    <div className="tauze-field-group">
                      <label className="tauze-label"><Target size={14} /> Diagnóstico Geral do Lote</label>
                      <SearchableSelect
                        value={result}
                        onChange={setResult}
                        options={[
                          { value: 'Pendente', label: 'Pendente (Ainda a verificar)' },
                          { value: 'Prenha', label: 'Lote Prenhe (Positivo)' },
                          { value: 'Vazia', label: 'Lote Vazio (Negativo)' }
                        ]}
                      />
                    </div>
                    {result === 'Prenha' && (
                      <div className="tauze-field-group">
                        <label className="tauze-label"><CalendarDays size={14} /> Dias de Gestação (Média)</label>
                        <input type="number" className="tauze-input" placeholder="Ex: 45" value={diasGestacao} onChange={e => setDiasGestacao(e.target.value)} />
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* CARD DE SEGURANÇA E PREDIÇÃO */}
              <div style={{ marginTop: '24px', padding: '16px', background: 'hsl(38 92% 50% / 0.1)', border: '1.5px dashed hsl(38 92% 50% / 0.4)', borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'hsl(38 92% 40%)', fontWeight: 800, fontSize: '13px', marginBottom: '8px' }}>
                  <AlertTriangle size={18} /> CONFIRMAÇÃO DE IMPACTO EM MASSA
                </div>
                <div style={{ fontSize: '14px', color: 'hsl(var(--text-main))', lineHeight: '1.5' }}>
                  {batchStats.summary}
                </div>
                {batchStats.predictedDate && (
                  <div style={{ marginTop: '12px', display: 'inline-block', padding: '6px 12px', background: 'hsl(var(--brand)/0.1)', color: 'hsl(var(--brand))', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>
                    <CalendarDays size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} />
                    {batchStats.predictedDate}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ width: '80px', height: '80px', background: 'hsl(142 71% 45% / 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <CheckCircle2 size={40} style={{ color: 'hsl(142 71% 45%)' }} />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'hsl(142 71% 45%)', marginBottom: '8px' }}>Lançamento Concluído!</h3>
              <p style={{ fontSize: '14px', color: 'hsl(var(--text-muted))' }}>
                O protocolo de {eventType} foi gravado com sucesso no histórico de <strong>{lotAnimalCount} matrizes</strong>.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SidePanel>
  );
};
