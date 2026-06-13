import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, 
  Plus, 
  FlaskConical, 
  Clock, 
  Zap, 
  History,
  Trash2,
  CalendarCheck,
  Info,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SidePanel } from '../../../components/Layout/SidePanel';
import { supabase } from '../../../lib/supabase';
import { SearchableSelect } from '../../../components/Forms/SearchableSelect';
import { useTenant } from '../../../contexts/TenantContext';
import toast from 'react-hot-toast';
import { DateInput } from '../../../components/Form/DateInput';
import { useConfirm } from '../../../contexts/ConfirmContext';


interface HealthProtocolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (protocol: any) => void;
}

export const HealthProtocolsModal: React.FC<HealthProtocolsModalProps> = ({ isOpen, onClose, onApply }) => {
  const { confirm } = useConfirm();
  const { activeFarm, activeTenantId } = useTenant();
  const [protocols, setProtocols] = useState<any[]>([]);
  const [selectedProtocol, setSelectedProtocol] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isEditingId, setIsEditingId] = useState<string | null>(null);
  const [targetType, setTargetType] = useState<'ANIMAL' | 'LOTE'>('ANIMAL');
  const [targetId, setTargetId] = useState('');
  const [startDate, setStartDate] = useState(new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]);

  const [newProtocol, setNewProtocol] = useState({
    name: '',
    category: 'VACINAÇÃO',
    description: '',
    steps: [{ day: 0, product: '', dose: '', via: 'Subcutânea' }]
  });

  const [availableProducts, setAvailableProducts] = useState<{ value: string; label: string }[]>([]);

  const fetchProducts = async () => {
    try {
      const tenantId = activeTenantId || activeFarm?.tenantId;
      if (!tenantId) return;

      const { data: catData } = await supabase
        .from('categorias_sistema')
        .select('id, nome')
        .eq('modulo', 'estoque');

      const targetCatIds = catData
        ? catData
            .filter((c: any) => {
              const name = c.nome?.toLowerCase() || '';
              return name.includes('medicamento');
            })
            .map((c: any) => c.id)
        : [];

      let query = supabase
        .from('produtos')
        .select('nome')
        .eq('tenant_id', tenantId)
        .eq('is_active', true);

      if (targetCatIds.length > 0) {
        query = query.in('categoria_id', targetCatIds);
      }

      if (activeFarm?.id) {
        query = query.or(`fazenda_id.eq.${activeFarm.id},fazenda_id.is.null`);
      }

      const { data: prodData } = await query;

      if (prodData && prodData.length > 0) {
        const uniqueNames = Array.from(new Set(prodData.map((p: any) => p.nome).filter(Boolean)));
        const mapped = uniqueNames.map((name: any) => ({ value: name, label: name }));

        console.log('[HealthProtocolsModal] Insumos de Medicamentos carregados:', mapped);
        setAvailableProducts(mapped);
      } else {
        console.log('[HealthProtocolsModal] Nenhum produto do banco retornado. Lista de insumos vazia.');
        setAvailableProducts([]);
      }
    } catch (err) {
      console.error('Error fetching products for protocols:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchProtocols();
      fetchProducts();
    }
  }, [isOpen, activeFarm, activeTenantId]);

  const fetchProtocols = async () => {
    try {
      const { data, error } = await supabase
        .from('protocolos')
        .select('*').limit(500)
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
    const isConfirmed = await confirm({ title: 'Atenção', description: 'Deseja desativar este protocolo?', confirmText: 'Confirmar', cancelText: 'Cancelar', variant: 'danger' });
    if (!isConfirmed) return;
    
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
      toast.error('Erro ao desativar protocolo');
    }
  };

  const handleAddStep = () => {
    setNewProtocol({
      ...newProtocol,
      steps: [...newProtocol.steps, { day: 0, product: '', dose: '', via: 'Subcutânea' }]
    });
  };

  const handleSaveProtocol = async () => {
    if (!newProtocol.name) return toast.error('Dê um nome ao protocolo');

    try {
      const isDefault = isEditingId && isEditingId.startsWith('def-');
      if (isEditingId && !isDefault) {
        // Update existing protocol
        const { data, error } = await supabase
          .from('protocolos')
          .update({
            nome: newProtocol.name,
            categoria: newProtocol.category,
            passos: newProtocol.steps,
          })
          .eq('id', isEditingId)
          .select()
          .single();

        if (error) throw error;

        const updatedProtocol = { ...data, name: data.nome, category: data.categoria, steps: data.passos };
        setProtocols(prev => prev.map(p => p.id === isEditingId ? updatedProtocol : p));
        setSelectedProtocol(updatedProtocol);
        toast.success('Protocolo atualizado com sucesso!');
      } else {
        // Insert new protocol
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
        toast.success('Protocolo criado com sucesso!');
      }
      setIsCreating(false);
      setIsEditingId(null);
      setNewProtocol({
        name: '',
        category: 'VACINAÇÃO',
        description: '',
        steps: [{ day: 0, product: '', dose: '', via: 'Subcutânea' }]
      });
    } catch (err) {
      console.error('Error saving protocol:', err);
      toast.error('Erro ao salvar protocolo');
    }
  };

  const handleConfirmApplication = () => {
    if (!targetId) return toast.error('Selecione um animal ou lote');
    onApply({ protocol: selectedProtocol, targetType, targetId, startDate });
    setIsApplying(false);
    onClose();
  };

  // --- ENGINE PREDITIVA DE CALENDÁRIO ---
  const smartSchedule = useMemo(() => {
    if (!selectedProtocol || !startDate) return [];
    
    const baseDate = new Date(startDate);
    if (isNaN(baseDate.getTime())) return [];

    return selectedProtocol.steps.map((step: any) => {
      const scheduledDate = new Date(baseDate);
      scheduledDate.setDate(scheduledDate.getDate() + (parseInt(step.day) || 0));
      return {
        ...step,
        scheduledDateStr: scheduledDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        isToday: step.day === 0
      };
    });
  }, [selectedProtocol, startDate]);

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={(e) => { e.preventDefault(); if (isApplying) handleConfirmApplication(); else if (isCreating) handleSaveProtocol(); else setIsApplying(true); }}
      title="Central de Protocolos"
      subtitle="Padronização de manejos sanitários e preventivos"
      icon={ShieldCheck}
      submitLabel={isApplying ? "Confirmar Aplicação" : isCreating ? "Salvar Protocolo" : "Aplicar Protocolo"}
      hideSubmit={!selectedProtocol && !isCreating}
      size="950px"
    >
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px', height: '500px', gridColumn: 'span 4', overflow: 'hidden' }}>
        <div style={{ borderRight: '1px solid hsl(var(--border))', paddingRight: '20px', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
          <div style={{ padding: '4px 0', borderBottom: '1px solid hsl(var(--border))', marginBottom: '12px' }}>
            <button 
              type="button"
              className="primary-btn" 
              style={{ width: '100%', padding: '10px', fontSize: '11px', justifyContent: 'center' }}
              onClick={() => { setIsCreating(true); setSelectedProtocol(null); setIsApplying(false); setIsEditingId(null); }}
            >
              <Plus size={14} /> NOVO PROTOCOLO
            </button>
          </div>
          <div style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', color: 'hsl(var(--text-muted))', marginBottom: '8px' }}>Modelos Ativos</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {protocols.map(p => {
              const isActive = selectedProtocol?.id === p.id && !isCreating;
              return (
                <div key={p.id} style={{ position: 'relative' }} className="group">
                  <button 
                    type="button"
                    style={{ 
                      width: '100%',
                      padding: '12px', borderRadius: '12px', border: 'none',
                      background: isActive ? 'hsl(var(--brand)/0.15)' : 'transparent',
                      color: isActive ? 'hsl(var(--brand))' : 'hsl(var(--text-secondary))',
                      display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left', cursor: 'pointer',
                      transition: 'all 0.2s', paddingRight: p.id.startsWith('def-') ? '12px' : '40px',
                      boxShadow: isActive ? 'inset 3px 0 0 hsl(var(--brand))' : 'none'
                    }}
                    onClick={() => { setSelectedProtocol(p); setIsCreating(false); setIsApplying(false); setIsEditingId(null); }}
                  >
                    <div style={{ color: isActive ? 'hsl(var(--brand))' : 'hsl(var(--text-muted))' }}>
                      {p.category === 'VACINAÇÃO' ? <Zap size={14} /> : <FlaskConical size={14} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', fontWeight: isActive ? 800 : 600, color: isActive ? 'hsl(var(--brand))' : 'hsl(var(--text-main))' }}>{p.name || p.nome}</div>
                      <div style={{ fontSize: '9px', fontWeight: 700, opacity: 0.6, color: 'hsl(var(--text-muted))' }}>{p.category || p.categoria}</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleDeleteProtocol(p.id); }}
                    style={{
                      position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                      background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer',
                      padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      opacity: isActive ? 1 : 0.4
                    }}
                    title="Excluir Protocolo"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
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

                  <div className="tauze-input-grid grid-col-1 animate-slide-up">
                    <div className="tauze-field-group">
                      <label className="tauze-label">{targetType === 'ANIMAL' ? 'Identificação do Animal' : 'Identificação do Lote'}</label>
                      <input type="text" className="tauze-input" value={targetId} onChange={e => setTargetId(e.target.value)} />
                    </div>

                    <div className="tauze-field-group">
                      <label className="tauze-label">Data de Início (D0)</label>
                      <DateInput type="date" className="tauze-input" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </div>
                  </div>

                  {smartSchedule.length > 0 && (
                    <div style={{ marginTop: '16px' }}>
                      <div style={{ fontSize: '10px', fontWeight: 900, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', marginBottom: '16px' }}>Projeção do Calendário Zootécnico</div>
                      
                      <div style={{ position: 'relative', paddingLeft: '16px' }}>
                        {/* Linha da Timeline */}
                        <div style={{ position: 'absolute', left: '27px', top: '24px', bottom: '24px', width: '2px', background: 'hsl(var(--border))', zIndex: 0 }} />
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative', zIndex: 1 }}>
                          {smartSchedule.map((step: any, idx: number) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                              <div style={{ 
                                width: '24px', height: '24px', borderRadius: '50%', background: step.isToday ? 'hsl(var(--brand))' : 'hsl(var(--bg-main))', 
                                border: step.isToday ? 'none' : '2px solid hsl(var(--border))', 
                                display: 'flex', alignItems: 'center', justifyContent: 'center', color: step.isToday ? 'white' : 'transparent', marginTop: '4px' 
                              }}>
                                {step.isToday && <CheckCircle2 size={14} />}
                              </div>
                              <div style={{ flex: 1, padding: '12px 16px', background: step.isToday ? 'hsl(var(--brand)/0.05)' : 'white', border: `1px solid ${step.isToday ? 'hsl(var(--brand)/0.3)' : 'hsl(var(--border))'}`, borderRadius: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                  <span style={{ fontSize: '11px', fontWeight: 900, color: step.isToday ? 'hsl(var(--brand))' : 'hsl(var(--text-muted))' }}>D{step.day}</span>
                                  <span style={{ fontSize: '13px', fontWeight: 800, color: 'hsl(var(--text-main))' }}>{step.scheduledDateStr}</span>
                                </div>
                                <div style={{ fontSize: '13px', fontWeight: 700 }}>{step.product}</div>
                                <div style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginTop: '4px' }}>{step.dose} • {step.via}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {smartSchedule.length > 0 && (
                    <div style={{ padding: '16px', background: 'hsl(var(--brand)/0.1)', border: '1px dashed hsl(var(--brand)/0.4)', borderRadius: '12px', display: 'flex', gap: '12px', marginTop: '8px' }}>
                      <CalendarCheck size={20} style={{ color: 'hsl(var(--brand))' }} />
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 800, color: 'hsl(var(--text-main))' }}>Impacto na Agenda</div>
                        <div style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', marginTop: '2px', lineHeight: '1.4' }}>
                          Ao confirmar, <strong>{smartSchedule.length} eventos sanitários</strong> serão adicionados ao calendário oficial da fazenda para este {targetType.toLowerCase()}.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : isCreating ? (
              <motion.div key="create" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 900, color: 'hsl(var(--brand))', marginBottom: '4px' }}>CONSTRUTOR</div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900 }}>Novo Protocolo Sanitário</h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="tauze-input-grid grid-col-2 animate-slide-up">
                    <div className="tauze-field-group">
                      <label className="tauze-label">Nome do Protocolo</label>
                      <input type="text" className="tauze-input" value={newProtocol.name} onChange={e => setNewProtocol({...newProtocol, name: e.target.value})} placeholder="Ex: Vermifugação de Entrada" />
                    </div>
                    <div className="tauze-field-group">
                      <label className="tauze-label">Categoria</label>
                      <SearchableSelect
                        value={newProtocol.category}
                        onChange={val => setNewProtocol({...newProtocol, category: val})}
                        options={[
                          { value: 'VACINAÇÃO', label: 'Vacinação' },
                          { value: 'SANIDADE', label: 'Sanidade/Vermifugação' },
                          { value: 'NUTRIÇÃO', label: 'Nutrição/Suplementação' }
                        ]}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 900, color: 'hsl(var(--text-muted))' }}>ETAPAS DO CRONOGRAMA</span>
                      <button type="button" onClick={handleAddStep} style={{ fontSize: '10px', fontWeight: 900, color: 'hsl(var(--brand))', background: 'transparent', border: 'none', cursor: 'pointer' }}>+ ADICIONAR DIA</button>
                    </div>

                    <div style={{ overflowX: 'auto', background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: '550px' }}>
                        <thead>
                          <tr>
                            <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: '10px', fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', borderBottom: '1px solid hsl(var(--border))', width: '70px' }}>Dia</th>
                            <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '10px', fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', borderBottom: '1px solid hsl(var(--border))', width: '220px' }}>Medicamento</th>
                            <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '10px', fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', borderBottom: '1px solid hsl(var(--border))', width: '100px' }}>Dose</th>
                            <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '10px', fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', borderBottom: '1px solid hsl(var(--border))', width: '130px' }}>Via</th>
                            <th style={{ borderBottom: '1px solid hsl(var(--border))', width: 'auto' }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {newProtocol.steps.map((step, idx) => (
                            <tr key={idx}>
                              <td style={{ padding: '8px', borderBottom: '1px solid hsl(var(--border)/0.5)' }}>
                                <input type="number" className="tauze-input" style={{ padding: '0 8px', height: '36px', textAlign: 'center' }} value={step.day} onChange={e => {
                                  const steps = [...newProtocol.steps];
                                  steps[idx].day = parseInt(e.target.value) || 0;
                                  setNewProtocol({...newProtocol, steps});
                                }} />
                              </td>
                              <td style={{ padding: '8px', borderBottom: '1px solid hsl(var(--border)/0.5)' }}>
                                <SearchableSelect
                                  value={step.product}
                                  onChange={val => {
                                    const steps = [...newProtocol.steps];
                                    steps[idx].product = val;
                                    setNewProtocol({...newProtocol, steps});
                                  }}
                                  options={availableProducts}
                                  creatable={true}
                                  placeholder="Produto"
                                  height="36px"
                                />
                              </td>
                              <td style={{ padding: '8px', borderBottom: '1px solid hsl(var(--border)/0.5)' }}>
                                <input type="text" className="tauze-input" style={{ padding: '0 8px', height: '36px' }} placeholder="Ex: 2ml" value={step.dose} onChange={e => {
                                  const steps = [...newProtocol.steps];
                                  steps[idx].dose = e.target.value;
                                  setNewProtocol({...newProtocol, steps});
                                }} />
                              </td>
                              <td style={{ padding: '8px', borderBottom: '1px solid hsl(var(--border)/0.5)' }}>
                                <select className="tauze-input" style={{ height: '36px' }} value={step.via} onChange={e => {
                                  const steps = [...newProtocol.steps];
                                  steps[idx].via = e.target.value;
                                  setNewProtocol({...newProtocol, steps});
                                }}>
                                  <option value="Subcutânea">Subcutânea</option>
                                  <option value="Intramuscular">Intramuscular</option>
                                  <option value="Oral">Oral</option>
                                  <option value="Intravenosa">Intravenosa</option>
                                  <option value="Tópico">Tópico</option>
                                </select>
                              </td>
                              <td style={{ padding: '8px', borderBottom: '1px solid hsl(var(--border)/0.5)', textAlign: 'center' }}>
                                <button type="button" onClick={() => {
                                  const steps = newProtocol.steps.filter((_, i) => i !== idx);
                                  setNewProtocol({...newProtocol, steps});
                                }} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}>
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
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
                    <button
                      type="button"
                      onClick={() => {
                        setNewProtocol({
                          name: selectedProtocol.name || selectedProtocol.nome,
                          category: selectedProtocol.category || selectedProtocol.categoria,
                          description: selectedProtocol.description || '',
                          steps: selectedProtocol.steps || []
                        });
                        setIsEditingId(selectedProtocol.id);
                        setIsCreating(true);
                      }}
                      className="glass-btn secondary"
                      style={{ padding: '6px 12px', fontSize: '11px', marginTop: '8px', cursor: 'pointer' }}
                    >
                      {selectedProtocol.id.startsWith('def-') ? 'Copiar & Customizar' : 'Editar Protocolo'}
                    </button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 800, color: 'hsl(var(--text-muted))' }}>
                    <Clock size={12} />
                    <span>{selectedProtocol.steps.length} ETAPAS</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0px', marginTop: '16px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 900, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', marginBottom: '16px' }}>Cronograma Padrão</span>
                  
                  <div style={{ position: 'relative', paddingLeft: '8px' }}>
                    {/* Linha da Timeline */}
                    {selectedProtocol.steps && selectedProtocol.steps.length > 0 && (
                      <div style={{ position: 'absolute', left: '26px', top: '16px', bottom: '24px', width: '2px', background: 'hsl(var(--border))', zIndex: 0 }} />
                    )}

                    {selectedProtocol.steps && Array.isArray(selectedProtocol.steps) ? (
                      selectedProtocol.steps.map((step: any, idx: number) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', position: 'relative', zIndex: 1, marginBottom: idx === selectedProtocol.steps.length - 1 ? 0 : '16px' }}>
                          <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'white', border: '2px solid hsl(var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 900, color: 'hsl(var(--text-main))' }}>
                            D{step.day}
                          </div>
                          <div style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', background: 'hsl(var(--bg-main)/0.3)', border: '1px solid hsl(var(--border))' }}>
                            <div style={{ fontSize: '14px', fontWeight: 800 }}>{step.product}</div>
                            <div style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', fontWeight: 600, marginTop: '2px' }}>{step.dose} • {step.via || 'N/A'}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '20px', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>
                        Nenhuma etapa configurada para este protocolo.
                      </div>
                    )}
                  </div>
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
    </SidePanel>
  );
};
