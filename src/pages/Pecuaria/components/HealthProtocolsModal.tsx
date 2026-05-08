import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  ShieldCheck, 
  Plus, 
  FlaskConical, 
  Clock, 
  ChevronRight,
  Zap,
  CheckCircle2,
  AlertCircle,
  Activity,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../lib/supabase';
import { useTenant } from '../../../contexts/TenantContext';

interface HealthProtocolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (protocol: any) => void;
}

export const HealthProtocolsModal: React.FC<HealthProtocolsModalProps> = ({ isOpen, onClose, onApply }) => {
  const { activeFarm } = useTenant();
  const [protocols, setProtocols] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProtocol, setSelectedProtocol] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [targetType, setTargetType] = useState<'ANIMAL' | 'LOTE'>('ANIMAL');
  const [targetId, setTargetId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [newProtocol, setNewProtocol] = useState({
    name: '',
    category: 'VACINAÇÃO',
    description: '',
    steps: [{ day: 0, product: '', dose: '', via: 'Subcutânea' }]
  });

  useEffect(() => {
    if (isOpen) fetchProtocols();
  }, [isOpen]);

  const fetchProtocols = async () => {
    setLoading(true);
    // Simulando busca de protocolos pré-definidos
    // Em produção, isso viria de uma tabela 'protocolos_sanitarios'
    setTimeout(() => {
      setProtocols([
        { 
          id: '1', 
          name: 'Protocolo Vacinal - Aftosa', 
          category: 'VACINAÇÃO',
          steps: [
            { day: 0, product: 'Aftosa-Elite', dose: '5ml', via: 'Subcutânea' }
          ],
          description: 'Protocolo padrão para vacinação contra febre aftosa.'
        },
        { 
          id: '2', 
          name: 'Tratamento de Mastite (Intensivo)', 
          category: 'TRATAMENTO',
          steps: [
            { day: 0, product: 'Masti-Kill 1', dose: '1 bisnaga', via: 'Intramamária' },
            { day: 1, product: 'Masti-Kill 1', dose: '1 bisnaga', via: 'Intramamária' },
            { day: 2, product: 'Masti-Kill 1', dose: '1 bisnaga', via: 'Intramamária' }
          ],
          description: 'Protocolo de 3 dias para tratamento de mastite clínica.'
        },
        { 
          id: '3', 
          name: 'Controle de Endoparasitas', 
          category: 'VERMIFUGAÇÃO',
          steps: [
            { day: 0, product: 'Ivermectina 3.5%', dose: '1ml/50kg', via: 'Subcutânea' }
          ],
          description: 'Aplicação de vermífugo de longa ação.'
        }
      ]);
      setLoading(false);
    }, 600);
  };

  const handleAddStep = () => {
    setNewProtocol({
      ...newProtocol,
      steps: [...newProtocol.steps, { day: newProtocol.steps.length, product: '', dose: '', via: 'Subcutânea' }]
    });
  };

  const handleRemoveStep = (index: number) => {
    setNewProtocol({
      ...newProtocol,
      steps: newProtocol.steps.filter((_, i) => i !== index)
    });
  };

  const handleSaveProtocol = () => {
    if (!newProtocol.name) return alert('Dê um nome ao protocolo');
    const protocol = { ...newProtocol, id: Date.now().toString() };
    setProtocols([protocol, ...protocols]);
    setSelectedProtocol(protocol);
    setIsCreating(false);
    setNewProtocol({
      name: '',
      category: 'VACINAÇÃO',
      description: '',
      steps: [{ day: 0, product: '', dose: '', via: 'Subcutânea' }]
    });
  };

  const handleConfirmApplication = () => {
    if (!targetId) return alert('Selecione um animal ou lote');
    onApply({ protocol: selectedProtocol, targetType, targetId, startDate });
    setIsApplying(false);
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="modal-overlay" onClick={onClose}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="protocol-modal-container"
          onClick={e => e.stopPropagation()}
        >
          <header className="protocol-header">
            <div className="title-group">
              <div className="icon-badge">
                <ShieldCheck size={22} className="text-brand" />
              </div>
              <div>
                <h2>Central de Protocolos</h2>
                <p>Padronização de manejos sanitários e preventivos</p>
              </div>
            </div>
            <button className="close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </header>

          <div className="protocol-body">
            <div className="protocol-list">
              <label className="section-label">Protocolos Disponíveis</label>
              <div className="protocol-items">
                {protocols.map(p => (
                  <button 
                    key={p.id} 
                    className={`protocol-item-card ${selectedProtocol?.id === p.id ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedProtocol(p);
                      setIsCreating(false);
                    }}
                  >
                    <div className="p-icon">
                      {p.category === 'VACINAÇÃO' ? <Zap size={18} /> : <FlaskConical size={18} />}
                    </div>
                    <div className="p-info">
                      <span className="p-name">{p.name}</span>
                      <span className="p-category">{p.category}</span>
                    </div>
                    <ChevronRight size={16} className="chevron" />
                  </button>
                ))}
              </div>
              {!isCreating && (
                <button className="add-protocol-btn" onClick={() => setIsCreating(true)}>
                  <Plus size={16} />
                  CRIAR NOVO PROTOCOLO
                </button>
              )}
            </div>

            <div className="protocol-details">
              <AnimatePresence mode="wait">
                {isApplying ? (
                  <motion.div 
                    key="apply-form"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="details-content"
                  >
                    <div className="details-header">
                      <div className="badge">APLICAÇÃO DE PROTOCOLO</div>
                      <h3>Destino do Manejo</h3>
                      <p>Selecione quem receberá o protocolo <strong>{selectedProtocol?.name}</strong>.</p>
                    </div>

                    <div className="apply-form">
                      <div className="target-toggle">
                        <button 
                          className={`toggle-btn ${targetType === 'ANIMAL' ? 'active' : ''}`}
                          onClick={() => setTargetType('ANIMAL')}
                        >
                          <Zap size={16} /> Individual (Animal)
                        </button>
                        <button 
                          className={`toggle-btn ${targetType === 'LOTE' ? 'active' : ''}`}
                          onClick={() => setTargetType('LOTE')}
                        >
                          <Activity size={16} /> Coletivo (Lote)
                        </button>
                      </div>

                      <div className="form-field">
                        <label className="elite-label">{targetType === 'ANIMAL' ? 'Identificação do Animal' : 'Identificação do Lote'}</label>
                        <input 
                          type="text" 
                          className="elite-input" 
                          placeholder={targetType === 'ANIMAL' ? "Ex: Brinco 1024" : "Ex: Lote Engorda 01"} 
                          value={targetId}
                          onChange={e => setTargetId(e.target.value)}
                        />
                      </div>

                      <div className="form-field">
                        <label className="elite-label">Data de Início (D0)</label>
                        <input 
                          type="date" 
                          className="elite-input" 
                          value={startDate}
                          onChange={e => setStartDate(e.target.value)}
                        />
                      </div>

                      <div className="info-box">
                        <AlertCircle size={18} />
                        <p>Ao confirmar, o sistema criará automaticamente <strong>{selectedProtocol?.steps.length} registros</strong> de manejo vinculados a este destino.</p>
                      </div>

                      <div className="protocol-actions">
                        <button className="text-btn" onClick={() => setIsApplying(false)}>VOLTAR</button>
                        <button className="primary-btn" onClick={handleConfirmApplication}>
                          <CheckCircle2 size={18} />
                          CONFIRMAR APLICAÇÃO
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ) : isCreating ? (
                  <motion.div 
                    key="create-form"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="details-content"
                  >
                    <div className="details-header">
                      <div className="badge">NOVO PROTOCOLO</div>
                      <h3>Configurar Protocolo</h3>
                      <p>Defina o nome e as etapas do manejo sanitário.</p>
                    </div>

                    <div className="creation-form">
                      <div className="form-field">
                        <label className="elite-label">Nome do Protocolo</label>
                        <input 
                          type="text" 
                          className="elite-input" 
                          placeholder="Ex: Protocolo de Ivermectina 3.5%" 
                          value={newProtocol.name}
                          onChange={e => setNewProtocol({...newProtocol, name: e.target.value})}
                        />
                      </div>

                      <div className="input-row">
                        <div className="form-field">
                          <label className="elite-label">Categoria</label>
                          <select 
                            className="elite-select"
                            value={newProtocol.category}
                            onChange={e => setNewProtocol({...newProtocol, category: e.target.value})}
                          >
                            <option value="VACINAÇÃO">Vacinação</option>
                            <option value="TRATAMENTO">Tratamento</option>
                            <option value="VERMIFUGAÇÃO">Vermifugação</option>
                          </select>
                        </div>
                      </div>

                      <div className="steps-creator">
                        <div className="steps-header">
                          <label className="section-label">Etapas do Protocolo</label>
                          <button className="text-brand-btn" onClick={handleAddStep}>
                            <Plus size={14} /> ADICIONAR ETAPA
                          </button>
                        </div>

                        <div className="steps-list-creator">
                          {newProtocol.steps.map((step, idx) => (
                            <div key={idx} className="step-edit-card">
                              <div className="step-day-input">
                                <label>Dia</label>
                                <input 
                                  type="number" 
                                  value={step.day} 
                                  onChange={e => {
                                    const steps = [...newProtocol.steps];
                                    steps[idx].day = parseInt(e.target.value);
                                    setNewProtocol({...newProtocol, steps});
                                  }}
                                />
                              </div>
                              <div className="step-main-fields">
                                <input 
                                  type="text" 
                                  placeholder="Nome do Fármaco" 
                                  value={step.product}
                                  onChange={e => {
                                    const steps = [...newProtocol.steps];
                                    steps[idx].product = e.target.value;
                                    setNewProtocol({...newProtocol, steps});
                                  }}
                                />
                                <div className="step-sub-fields">
                                  <input 
                                    type="text" 
                                    placeholder="Dose" 
                                    value={step.dose}
                                    onChange={e => {
                                      const steps = [...newProtocol.steps];
                                      steps[idx].dose = e.target.value;
                                      setNewProtocol({...newProtocol, steps});
                                    }}
                                  />
                                  <select 
                                    value={step.via}
                                    onChange={e => {
                                      const steps = [...newProtocol.steps];
                                      steps[idx].via = e.target.value;
                                      setNewProtocol({...newProtocol, steps});
                                    }}
                                  >
                                    <option value="Subcutânea">Subcutânea</option>
                                    <option value="Intramuscular">Intramuscular</option>
                                    <option value="Intramamária">Intramamária</option>
                                    <option value="Oral">Oral</option>
                                  </select>
                                </div>
                              </div>
                              {newProtocol.steps.length > 1 && (
                                <button className="remove-step-btn" onClick={() => handleRemoveStep(idx)}>
                                  <X size={14} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="protocol-actions">
                        <button className="text-btn" onClick={() => setIsCreating(false)}>CANCELAR</button>
                        <button className="primary-btn" onClick={handleSaveProtocol}>
                          <CheckCircle2 size={18} />
                          SALVAR PROTOCOLO
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ) : selectedProtocol ? (
                  <motion.div 
                    key={selectedProtocol.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="details-content"
                  >
                    <div className="details-header">
                      <div className="badge">{selectedProtocol.category}</div>
                      <h3>{selectedProtocol.name}</h3>
                      <p>{selectedProtocol.description}</p>
                    </div>

                    <div className="steps-section">
                      <label className="section-label">Cronograma de Aplicação</label>
                      <div className="steps-list">
                        {selectedProtocol.steps.map((step: any, idx: number) => (
                          <div key={idx} className="step-card">
                            <div className="step-day">D{step.day}</div>
                            <div className="step-info">
                              <span className="step-product">{step.product}</span>
                              <div className="step-meta">
                                <span><Activity size={12} /> {step.dose}</span>
                                <span><History size={12} /> {step.via}</span>
                              </div>
                            </div>
                            <CheckCircle2 size={16} className="text-slate-300" />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="protocol-actions">
                      <button className="primary-btn full" onClick={() => setIsApplying(true)}>
                        <CheckCircle2 size={18} />
                        APLICAR PROTOCOLO
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="empty-details">
                    <AlertCircle size={48} className="text-slate-200" />
                    <p>Selecione um protocolo ao lado para ver os detalhes e cronograma.</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <style>{`
            .modal-overlay {
              position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6);
              backdrop-filter: blur(8px); z-index: 10000; display: flex;
              align-items: center; justify-content: center; padding: 20px;
            }
            .protocol-modal-container {
              background: hsl(var(--bg-card)); width: 100%; max-width: 900px;
              height: 600px; border-radius: 28px; border: 1px solid hsl(var(--border));
              box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.5); overflow: hidden;
              display: flex; flex-direction: column;
            }
            .protocol-header {
              padding: 24px; border-bottom: 1px solid hsl(var(--border));
              display: flex; justify-content: space-between; align-items: center;
              background: linear-gradient(to bottom, hsl(var(--bg-card)), hsl(var(--bg-main)));
            }
            .protocol-body { flex: 1; display: grid; grid-template-columns: 320px 1fr; overflow: hidden; }
            
            .protocol-list { 
              padding: 24px; border-right: 1px solid hsl(var(--border)); 
              background: hsl(var(--bg-main) / 0.3); display: flex; flex-direction: column; gap: 16px;
            }
            .protocol-items { flex: 1; display: flex; flex-direction: column; gap: 10px; overflow-y: auto; }
            .protocol-item-card {
              padding: 16px; border-radius: 16px; border: 1px solid hsl(var(--border));
              background: white; display: flex; align-items: center; gap: 12px;
              text-align: left; transition: 0.2s;
            }
            .protocol-item-card:hover { border-color: hsl(var(--brand)); transform: translateX(4px); }
            .protocol-item-card.active { background: hsl(var(--brand)); border-color: hsl(var(--brand)); color: white; }
            .p-icon { width: 36px; height: 36px; border-radius: 10px; background: hsl(var(--bg-main)); display: flex; align-items: center; justify-content: center; color: hsl(var(--brand)); }
            .protocol-item-card.active .p-icon { background: rgba(255,255,255,0.2); color: white; }
            .p-info { flex: 1; display: flex; flex-direction: column; }
            .p-name { font-size: 13px; font-weight: 800; }
            .p-category { font-size: 10px; font-weight: 600; text-transform: uppercase; opacity: 0.7; }
            
            .protocol-details { padding: 32px; overflow-y: auto; background: white; }
            .details-header { margin-bottom: 32px; }
            .details-header h3 { font-size: 22px; font-weight: 900; color: #0f172a; margin: 12px 0 8px; }
            .details-header p { font-size: 14px; color: #64748b; line-height: 1.5; }
            .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; background: #f1f5f9; color: #475569; font-size: 10px; font-weight: 800; }
            
            .steps-section { margin-bottom: 32px; }
            .steps-list { display: flex; flex-direction: column; gap: 12px; }
            .step-card {
              padding: 16px; border-radius: 16px; border: 1px solid #f1f5f9;
              display: flex; align-items: center; gap: 16px; background: #f8fafc;
            }
            .step-day { width: 40px; height: 40px; border-radius: 10px; background: #0f172a; color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 900; }
            .step-info { flex: 1; }
            .step-product { display: block; font-size: 14px; font-weight: 800; color: #0f172a; }
            .step-meta { display: flex; gap: 12px; margin-top: 4px; }
            .step-meta span { display: flex; align-items: center; gap: 4px; font-size: 11px; color: #64748b; font-weight: 600; }
            
            .empty-details { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #94a3b8; text-align: center; gap: 16px; }
            .add-protocol-btn { padding: 12px; border-radius: 12px; border: 2px dashed #e2e8f0; color: #64748b; font-size: 11px; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 8px; transition: 0.2s; width: 100%; margin-top: 8px; }
            .add-protocol-btn:hover { border-color: hsl(var(--brand)); color: hsl(var(--brand)); }

            .creation-form, .apply-form { display: flex; flex-direction: column; gap: 28px; }
            .elite-label { display: block; font-size: 11px; font-weight: 800; color: #64748b; margin-bottom: 12px; text-transform: uppercase; }
            .elite-input, .elite-select { width: 100%; padding: 12px 16px; border-radius: 12px; border: 1px solid #e2e8f0; font-size: 14px; background: #f8fafc; transition: 0.2s; margin-bottom: 4px; }
            .elite-input:focus { border-color: hsl(var(--brand)); background: white; outline: none; }
            
            .steps-creator { margin-top: 10px; }
            .steps-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
            .text-brand-btn { font-size: 11px; font-weight: 900; color: hsl(var(--brand)); display: flex; align-items: center; gap: 4px; }
            .steps-list-creator { display: flex; flex-direction: column; gap: 12px; }
            .step-edit-card { 
              display: flex; gap: 12px; padding: 16px; border-radius: 16px; 
              background: #f1f5f9; position: relative; border: 1px solid transparent; transition: 0.2s;
            }
            .step-edit-card:hover { border-color: #e2e8f0; background: #f8fafc; }
            .step-day-input { width: 60px; display: flex; flex-direction: column; gap: 4px; }
            .step-day-input label { font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; }
            .step-day-input input { width: 100%; padding: 8px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 13px; font-weight: 800; text-align: center; }
            .step-main-fields { flex: 1; display: flex; flex-direction: column; gap: 8px; }
            .step-main-fields input { padding: 8px 12px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 13px; font-weight: 700; }
            .step-sub-fields { display: flex; gap: 8px; }
            .step-sub-fields input, .step-sub-fields select { flex: 1; padding: 8px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 12px; font-weight: 600; }
            .remove-step-btn { position: absolute; top: -8px; right: -8px; width: 24px; height: 24px; border-radius: 50%; background: #fee2e2; color: #ef4444; display: flex; align-items: center; justify-content: center; border: 1px solid #fecaca; }

            .protocol-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; padding-top: 24px; border-top: 1px solid #f1f5f9; }
            .info-box { background: #f0f9ff; border: 1px solid #bae6fd; padding: 16px; border-radius: 12px; display: flex; gap: 12px; color: #0369a1; font-size: 13px; line-height: 1.4; margin-top: 10px; }
            .info-box p { margin: 0; }
            
            .target-toggle { display: flex; gap: 12px; margin-bottom: 24px; }
            .toggle-btn { flex: 1; padding: 12px; border-radius: 12px; border: 1px solid #e2e8f0; background: white; font-size: 13px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 8px; transition: 0.2s; }
            .toggle-btn.active { background: #0f172a; color: white; border-color: #0f172a; }

            .full { width: 100%; }
            .text-brand { color: hsl(var(--brand)); }
            .close-btn { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 10px; transition: 0.2s; color: hsl(var(--text-muted)); }
            .close-btn:hover { background: #fee2e2; color: #ef4444; }
          `}</style>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
