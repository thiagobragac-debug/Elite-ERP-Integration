import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Plus, 
  FlaskConical, 
  Clock, 
  Zap, 
  History,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FormModal } from '../../../components/Forms/FormModal';
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
    if (isOpen) {
      fetchProtocols();
    }
  }, [isOpen]);

  const fetchProtocols = async () => {
    try {
      const { data, error } = await supabase
        .from('protocolos')
        .select('*')
        .eq('status', 'ativo')
        .order('nome', { ascending: true });
      
      if (error) throw error;
      
      const defaults = [
        { id: 'def-1', name: 'Vermifugação Estratégica', category: 'SANIDADE', steps: [{ day: 0, product: 'Ivermectina 3.5%', dose: '1ml/50kg', via: 'Subcutânea' }] },
        { id: 'def-2', name: 'Protocolo Reclamatória', category: 'VACINAÇÃO', steps: [{ day: 0, product: 'Clostridiose 10v', dose: '2ml', via: 'Subcutânea' }, { day: 30, product: 'Reforço Clostridiose', dose: '2ml', via: 'Subcutânea' }] },
      ];

      const allProtocols = data && data.length > 0 
        ? [...data.map(p => ({ ...p, name: p.nome, category: p.categoria, steps: p.passos || [] })), ...defaults]
        : defaults;

      setProtocols(allProtocols);
    } catch (err) {
      console.error('Error fetching protocols:', err);
    }
  };

  const handleDeleteProtocol = async (id: string) => {
    if (!confirm('Deseja desativar este protocolo?')) return;
    
    try {
      if (!id.startsWith('def-')) {
        const { error } = await supabase
          .from('protocolos')
          .update({ status: 'inativo' })
          .eq('id', id);

        if (error) throw error;
      }
      
      setProtocols(prev => prev.filter(p => p.id !== id));
      if (selectedProtocol?.id === id) setSelectedProtocol(null);
    } catch (err) {
      console.error('Error deleting protocol:', err);
      alert('Erro ao desativar protocolo');
    }
  };

  const handleAddStep = () => {
    setNewProtocol({
      ...newProtocol,
      steps: [...newProtocol.steps, { day: 0, product: '', dose: '', via: 'Subcutânea' }]
    });
  };

  const handleSaveProtocol = async () => {
    if (!newProtocol.name) return alert('Dê um nome ao protocolo');
    
    try {
      const { data, error } = await supabase
        .from('protocolos')
        .insert([{
          nome: newProtocol.name,
          categoria: newProtocol.category,
          passos: newProtocol.steps,
          fazenda_id: activeFarm?.id,
          tenant_id: activeFarm?.tenantId
        }])
        .select()
        .single();

      if (error) throw error;

      const savedProtocol = { ...data, name: data.nome, category: data.categoria, steps: data.passos };
      setProtocols([savedProtocol, ...protocols]);
      setSelectedProtocol(savedProtocol);
      setIsCreating(false);
      setNewProtocol({
        name: '',
        category: 'VACINAÇÃO',
        description: '',
        steps: [{ day: 0, product: '', dose: '', via: 'Subcutânea' }]
      });
    } catch (err) {
      console.error('Error saving protocol:', err);
      alert('Erro ao salvar protocolo');
    }
  };

  const handleConfirmApplication = () => {
    if (!targetId) return alert('Selecione um animal ou lote');
    onApply({ protocol: selectedProtocol, targetType, targetId, startDate });
    setIsApplying(false);
    onClose();
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={(e) => { e.preventDefault(); if (isApplying) handleConfirmApplication(); else if (isCreating) handleSaveProtocol(); else setIsApplying(true); }}
      title="Central de Protocolos"
      subtitle="Padronização de manejos sanitários e preventivos"
      icon={ShieldCheck}
      submitLabel={isApplying ? "Confirmar Aplicação" : isCreating ? "Salvar Protocolo" : "Aplicar Protocolo"}
      hideSubmit={!selectedProtocol && !isCreating}
      size="large"
    >
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px', height: '500px', gridColumn: 'span 2', overflow: 'hidden' }}>
        <div style={{ borderRight: '1px solid hsl(var(--border))', paddingRight: '20px', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
          <div style={{ padding: '4px 0', borderBottom: '1px solid hsl(var(--border))', marginBottom: '12px' }}>
            <button 
              type="button"
              className="primary-btn" 
              style={{ width: '100%', padding: '10px', fontSize: '11px', justifyContent: 'center' }}
              onClick={() => { setIsCreating(true); setSelectedProtocol(null); setIsApplying(false); }}
            >
              <Plus size={14} /> NOVO PROTOCOLO
            </button>
          </div>
          <div style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', color: 'hsl(var(--text-muted))', marginBottom: '8px' }}>Modelos Ativos</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
            {protocols.map(p => (
              <div key={p.id} style={{ position: 'relative', group: 'true' }}>
                <button 
                  type="button"
                  style={{ 
                    width: '100%',
                    padding: '12px', borderRadius: '12px', border: `1px solid ${selectedProtocol?.id === p.id ? 'hsl(var(--brand))' : 'hsl(var(--border))'}`,
                    background: selectedProtocol?.id === p.id ? 'hsl(var(--brand)/0.05)' : 'white',
                    display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left', cursor: 'pointer',
                    transition: '0.2s', paddingRight: p.id.startsWith('def-') ? '12px' : '40px'
                  }}
                  onClick={() => { setSelectedProtocol(p); setIsCreating(false); setIsApplying(false); }}
                >
                  <div style={{ color: selectedProtocol?.id === p.id ? 'hsl(var(--brand))' : 'hsl(var(--text-muted))' }}>
                    {p.category === 'VACINAÇÃO' ? <Zap size={14} /> : <FlaskConical size={14} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', fontWeight: 800 }}>{p.name || p.nome}</div>
                    <div style={{ fontSize: '9px', fontWeight: 700, opacity: 0.6 }}>{p.category || p.categoria}</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleDeleteProtocol(p.id); }}
                  style={{
                    position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                    background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer',
                    padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                  title="Excluir Protocolo"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div style={{ overflowY: 'auto', paddingRight: '10px' }}>
          <AnimatePresence mode="wait">
            {isApplying ? (
              <motion.div key="apply" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 900, color: 'hsl(var(--brand))', marginBottom: '4px' }}>APLICAÇÃO</div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900 }}>Destino do Manejo</h3>
                  <p style={{ fontSize: '13px', color: 'hsl(var(--text-muted))' }}>Protocolo: <strong>{selectedProtocol?.name}</strong></p>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', background: 'hsl(var(--bg-main))', padding: '4px', borderRadius: '10px', gap: '4px' }}>
                    <button type="button" onClick={() => setTargetType('ANIMAL')} style={{ flex: 1, padding: '8px', fontSize: '11px', fontWeight: 800, borderRadius: '8px', background: targetType === 'ANIMAL' ? 'white' : 'transparent', border: 'none', cursor: 'pointer' }}>ANIMAL INDIVIDUAL</button>
                    <button type="button" onClick={() => setTargetType('LOTE')} style={{ flex: 1, padding: '8px', fontSize: '11px', fontWeight: 800, borderRadius: '8px', background: targetType === 'LOTE' ? 'white' : 'transparent', border: 'none', cursor: 'pointer' }}>LOTE COLETIVO</button>
                  </div>

                  <div className="elite-field-group">
                    <label className="elite-label">{targetType === 'ANIMAL' ? 'Identificação do Animal' : 'Identificação do Lote'}</label>
                    <input type="text" className="elite-input" value={targetId} onChange={e => setTargetId(e.target.value)} />
                  </div>

                  <div className="elite-field-group">
                    <label className="elite-label">Data de Início</label>
                    <input type="date" className="elite-input" value={startDate} onChange={e => setStartDate(e.target.value)} />
                  </div>
                </div>
              </motion.div>
            ) : isCreating ? (
              <motion.div key="create" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 900, color: 'hsl(var(--brand))', marginBottom: '4px' }}>CONSTRUTOR</div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900 }}>Novo Protocolo Sanitário</h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="elite-field-group">
                    <label className="elite-label">Nome do Protocolo</label>
                    <input type="text" className="elite-input" value={newProtocol.name} onChange={e => setNewProtocol({...newProtocol, name: e.target.value})} placeholder="Ex: Vermifugação de Entrada" />
                  </div>
                  <div className="elite-field-group">
                    <label className="elite-label">Categoria</label>
                    <select className="elite-input elite-select" value={newProtocol.category} onChange={e => setNewProtocol({...newProtocol, category: e.target.value})}>
                      <option value="VACINAÇÃO">Vacinação</option>
                      <option value="SANIDADE">Sanidade/Vermifugação</option>
                      <option value="NUTRIÇÃO">Nutrição/Suplementação</option>
                    </select>
                  </div>

                  <div style={{ marginTop: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 900, color: 'hsl(var(--text-muted))' }}>ETAPAS DO CRONOGRAMA</span>
                      <button type="button" onClick={handleAddStep} style={{ fontSize: '10px', fontWeight: 900, color: 'hsl(var(--brand))', background: 'transparent', border: 'none', cursor: 'pointer' }}>+ ADICIONAR DIA</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {newProtocol.steps.map((step, idx) => (
                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: '8px', padding: '12px', background: 'hsl(var(--bg-main)/0.4)', borderRadius: '12px', border: '1px solid hsl(var(--border))' }}>
                          <input type="number" className="elite-input" style={{ padding: '8px' }} value={step.day} onChange={e => {
                            const steps = [...newProtocol.steps];
                            steps[idx].day = parseInt(e.target.value);
                            setNewProtocol({...newProtocol, steps});
                          }} />
                          <input type="text" className="elite-input" style={{ padding: '8px' }} placeholder="Produto" value={step.product} onChange={e => {
                            const steps = [...newProtocol.steps];
                            steps[idx].product = e.target.value;
                            setNewProtocol({...newProtocol, steps});
                          }} />
                          <input type="text" className="elite-input" style={{ padding: '8px' }} placeholder="Dose" value={step.dose} onChange={e => {
                            const steps = [...newProtocol.steps];
                            steps[idx].dose = e.target.value;
                            setNewProtocol({...newProtocol, steps});
                          }} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : selectedProtocol ? (
              <motion.div key="details" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 900, color: 'hsl(var(--brand))', marginBottom: '4px' }}>{selectedProtocol.category}</div>
                    <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 900 }}>{selectedProtocol.name}</h3>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 800, color: 'hsl(var(--text-muted))' }}>
                    <Clock size={12} />
                    <span>{selectedProtocol.steps.length} ETAPAS</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 900, color: 'hsl(var(--text-muted))', textTransform: 'uppercase' }}>Cronograma</span>
                  {selectedProtocol.steps && Array.isArray(selectedProtocol.steps) ? (
                    selectedProtocol.steps.map((step: any, idx: number) => (
                      <div key={idx} style={{ padding: '16px', borderRadius: '16px', background: 'hsl(var(--bg-main)/0.3)', border: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'hsl(var(--text-main))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 900 }}>D{step.day}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '14px', fontWeight: 800 }}>{step.product}</div>
                          <div style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', fontWeight: 600 }}>{step.dose} • {step.via || 'N/A'}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>
                      Nenhuma etapa configurada para este protocolo.
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--text-muted))', opacity: 0.5 }}>
                <ShieldCheck size={48} />
                <p style={{ fontWeight: 700, marginTop: '16px' }}>Selecione um protocolo para detalhamento.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </FormModal>
  );
};
