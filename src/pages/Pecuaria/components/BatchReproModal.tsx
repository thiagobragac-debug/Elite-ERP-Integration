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
  Target,
  X,
  Plus,
  Check,
  Baby,
  Syringe,
  ClipboardList
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SidePanel } from '../../../components/Layout/SidePanel';
import { supabase } from '../../../lib/supabase';
import { SearchableSelect } from '../../../components/Forms/SearchableSelect';
import { AsyncSearchableSelect, type Option } from '../../../components/Forms/AsyncSearchableSelect';
import { DateInput } from '../../../components/Form/DateInput';
import toast from 'react-hot-toast';
import { useFarmFilter } from '../../../hooks/useFarmFilter';
import { ModernTable } from '../../../components/DataTable/ModernTable';

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
  tenantId,
}) => {
  const { applyFarmFilter } = useFarmFilter();
  const [lots, setLots] = useState<any[]>([]);
  const [selectedLotId, setSelectedLotId] = useState('');
  const [eventType, setEventType] = useState('IATF');
  const [eventDate, setEventDate] = useState(
    new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]
  );

  // Mutantes
  const [protocolo, setProtocolo] = useState('Ovsynch');
  const [touro, setTouro] = useState('');
  const [inseminador, setInseminador] = useState('');

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
    // Buscar todos os lotes da fazenda e filtrar no frontend para evitar problemas com nulos no Supabase
    const { data } = await applyFarmFilter(
      supabase
        .from('lotes')
        .select('id, nome, sexo_permitido, status')
    );
      
    if (data) {
      const activeLots = data.filter(lot => 
        (lot.status === 'ATIVO' || !lot.status) && 
        ['Fêmea', 'MISTO', 'Misto', 'Ambos'].includes(lot.sexo_permitido)
      );
      setLots(activeLots);
    }
  };

  const [lotAnimals, setLotAnimals] = useState<any[]>([]);

  const loadProtocolos = async (inputValue: string): Promise<Option[]> => {
    if (!tenantId) return [];
    let q = supabase
      .from('protocolos_reprodutivos')
      .select('id, nome')
      .eq('tenant_id', tenantId)
      .eq('status', 'ativo')
      .order('nome')
      .limit(20);
    if (inputValue) q = q.ilike('nome', `%${inputValue}%`);
    const { data } = await q;
    return (data || []).map((p) => ({ value: p.nome, label: p.nome }));
  };

  const handleLotSelect = async (lotId: string) => {
    setSelectedLotId(lotId);
    setLotAnimals([]);
    const { data, count } = await supabase
      .from('animais')
      .select('id, brinco, raca, categoria, idade_meses', { count: 'exact' })
      .eq('lote_id', lotId)
      .eq('status', 'ativo')
      .eq('sexo', 'Fêmea')
      .order('brinco');
    setLotAnimalCount(count || 0);
    if (data) {
      setLotAnimals(data.map(animal => ({ 
        ...animal, 
        selected: true,
        diagnostico: 'Prenha', 
        dias_gestacao: '',
        condicao_parto: 'Normal'
      })));
    }
  };

  const handleSubmit = async () => {
    if (!selectedLotId) {
      return;
    }
    
    const selectedAnimals = lotAnimals.filter(a => a.selected);
    if (selectedAnimals.length === 0) {
      toast.error('Nenhuma matriz selecionada para o lote.');
      return;
    }
    
    setLoading(true);

    try {
      let batchData: any[] = [];
      if (eventType === 'Palpação') {
        batchData = selectedAnimals.map((animal) => ({
          animal_id: animal.id,
          tipo_evento: eventType,
          data_evento: eventDate,
          resultado_diagnostico: animal.diagnostico,
          dias_gestacao: animal.dias_gestacao,
          tecnico: inseminador,
          status: 'completed',
          fazenda_id: activeFarmId,
          tenant_id: tenantId,
        }));
      } else if (eventType === 'Parto') {
        batchData = selectedAnimals.map((animal) => ({
          animal_id: animal.id,
          tipo_evento: eventType,
          data_evento: eventDate,
          resultado: animal.condicao_parto,
          tecnico: inseminador,
          status: 'completed',
          fazenda_id: activeFarmId,
          tenant_id: tenantId,
        }));
      } else {
        batchData = selectedAnimals.map((animal) => ({
          animal_id: animal.id,
          tipo_evento: eventType,
          data_evento: eventDate,
          resultado: eventType === 'IATF' ? protocolo : '',
          touro: eventType === 'IATF' ? touro : '',
          tecnico: inseminador,
          status: 'completed',
          fazenda_id: activeFarmId,
          tenant_id: tenantId,
        }));
      }

      if (batchData.length > 0) {
        await onBatchSubmit(batchData);
        setStep(3);
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Erro ao registrar eventos em lote.');
    } finally {
      setLoading(false);
    }
  };

  const batchStats = useMemo(() => {
    let summary = '';
    let predictedDate = '';
    const lotName = lots.find((l) => l.id === selectedLotId)?.nome || 'Lote';

    const selectedCount = lotAnimals.filter(a => a.selected).length;

    if (eventType === 'IATF') {
      summary = `Você está prestes a aplicar IATF${protocolo ? ` (${protocolo})` : ''} em ${selectedCount} matrizes selecionadas do ${lotName}${touro ? ` usando sêmen ${touro}` : ''}.`;
      const prev = new Date(eventDate);
      prev.setDate(prev.getDate() + 30);
      predictedDate = `Previsão de Toque coletivo: ${prev.toLocaleDateString('pt-BR')}`;
    } else if (eventType === 'Palpação') {
      summary = `Lançamento de diagnóstico individualizado para ${selectedCount} matrizes selecionadas do ${lotName}.`;
    } else {
      summary = `Você vai registrar ${eventType} em lote para ${selectedCount} matrizes selecionadas do ${lotName}.`;
    }

    return { summary, predictedDate };
  }, [
    eventType,
    eventDate,
    protocolo,
    touro,
    inseminador,
    lots,
    lotAnimals,
  ]);

  return (
    <SidePanel
      size="large"
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={(e) => {
        e.preventDefault();
        if (step === 1) {
          setStep(2);
        } else if (step === 2) {
          handleSubmit();
        } else {
          onClose();
        }
      }}
      title="Lançamento em Lote"
      subtitle="Processamento em massa de eventos reprodutivos"
      icon={ClipboardCheck}
      submitLabel={
        step === 1
          ? selectedLotId ? `Configurar para ${lotAnimalCount} Animais` : 'Selecione um lote'
          : step === 2
            ? `Lançar para ${lotAnimals.filter(a => a.selected).length} matrizes selecionadas`
            : 'Concluir e Fechar'
      }
      hideSubmit={step === 1 && !selectedLotId}
      loading={loading}
    >
      <div style={{ gridColumn: 'span 2' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              style={{
                flex: 1,
                height: '4px',
                borderRadius: '2px',
                background: s === step ? 'hsl(var(--brand))' : s < step ? 'hsl(var(--brand)/0.4)' : 'hsl(var(--border))',
                transition: 'all 0.3s'
              }}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
            >
              <label className="tauze-label" style={{ marginBottom: '16px', display: 'block' }}>
                Selecione o Lote de Matrizes
              </label>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  maxHeight: '300px',
                  overflowY: 'auto',
                  paddingRight: '4px',
                }}
              >
                {lots.map((lot) => {
                  // Como já filtramos na query, isEligible sempre será true,
                  // mas vamos manter a lógica visual caso decidam mostrar os inelegíveis depois
                  const isEligible = ['Fêmea', 'MISTO', 'Misto', 'Ambos'].includes(lot.sexo_permitido);
                  const isSelected = selectedLotId === lot.id;
                  return (
                    <button
                      key={lot.id}
                      type="button"
                      disabled={!isEligible}
                      style={{
                        padding: '16px',
                        borderRadius: '16px',
                        border: `1.5px solid ${isSelected ? 'hsl(var(--brand))' : 'hsl(var(--border))'}`,
                        background: isSelected ? 'hsl(var(--brand)/0.05)' : 'white',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        textAlign: 'left',
                        cursor: isEligible ? 'pointer' : 'not-allowed',
                        opacity: isEligible ? 1 : 0.5,
                      }}
                      onClick={() => isEligible && handleLotSelect(lot.id)}
                    >
                      <Layers
                        size={18}
                        style={{
                          color: isSelected ? 'hsl(var(--brand))' : 'hsl(var(--text-muted))',
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: 800 }}>{lot.nome}</div>
                        <div style={{ fontSize: '10px', fontWeight: 600, opacity: 0.6 }}>
                          {lot.sexo_permitido === 'Macho' ? 'LOTE DE MACHOS (INELEGÍVEL)' : 'LOTE DE MATRIZES'}
                        </div>
                      </div>
                    <div
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        border: '2px solid hsl(var(--border))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {selectedLotId === lot.id && (
                        <div
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: 'hsl(var(--brand))',
                          }}
                        />
                      )}
                    </div>
                  </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
            >
              <div
                style={{
                  padding: '16px',
                  background: 'hsl(var(--text-main))',
                  borderRadius: '16px',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '24px',
                }}
              >
                <Users size={18} />
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, opacity: 0.7 }}>
                    LOTE SELECIONADO
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 800 }}>
                    {lots.find((l) => l.id === selectedLotId)?.nome} • {lotAnimalCount} Matrizes
                  </div>
                </div>
              </div>

              <div className="form-grid">
                <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
                  <label className="tauze-label">Tipo de Manejo Coletivo</label>
                  <div
                    style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}
                  >
                    {['IATF', 'Palpação', 'Parto', 'Secagem'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        style={{
                          padding: '10px',
                          borderRadius: '10px',
                          border: `1px solid ${eventType === type ? 'hsl(var(--brand))' : 'hsl(var(--border))'}`,
                          background: eventType === type ? 'hsl(var(--brand))' : 'white',
                          color: eventType === type ? 'white' : 'hsl(var(--text-muted))',
                          fontSize: '11px',
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                        onClick={() => setEventType(type)}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
                  <label className="tauze-label">
                    <Calendar size={14} /> Data do Evento
                  </label>
                  <DateInput
                    type="date"
                    className="tauze-input"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                  />
                </div>

                {/* Mutantes IATF */}
                {eventType === 'IATF' && (
                  <>
                    <div className="tauze-field-group">
                      <label className="tauze-label">
                        <Activity size={14} /> Protocolo Hormonal
                      </label>
                      <AsyncSearchableSelect
                        value={protocolo}
                        onChange={setProtocolo}
                        loadOptions={loadProtocolos}
                        defaultOptions={true}
                        placeholder="Busque o protocolo..."
                      />
                    </div>
                    <div className="tauze-field-group">
                      <label className="tauze-label">
                        <Hash size={14} /> Partida de Sêmen / Touro
                      </label>
                      <input
                        className="tauze-input"
                        placeholder="Ex: Angus 123"
                        value={touro}
                        onChange={(e) => setTouro(e.target.value)}
                      />
                    </div>
                    <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
                      <label className="tauze-label">
                        <Users size={14} /> Inseminador / Técnico
                      </label>
                      <input
                        className="tauze-input"
                        placeholder="Nome do responsável pelo procedimento..."
                        value={inseminador}
                        onChange={(e) => setInseminador(e.target.value)}
                      />
                    </div>
                  </>
                )}

                {/* TÉCNICO PARA PALPAÇÃO/PARTO/SECAGEM */}
                {eventType !== 'IATF' && (
                  <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
                    <label className="tauze-label">
                      <Users size={14} /> Técnico / Responsável
                    </label>
                    <input
                      className="tauze-input"
                      placeholder="Nome do responsável pelo procedimento..."
                      value={inseminador}
                      onChange={(e) => setInseminador(e.target.value)}
                    />
                  </div>
                )}

                {/* TABELA DE CHECKLIST INDIVIDUAL */}
                {lotAnimals.length > 0 && (
                  <div style={{ gridColumn: 'span 2', marginTop: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <label className="tauze-label">
                        <Target size={14} /> Lista de Matrizes ({lotAnimals.filter(a => a.selected).length} de {lotAnimals.length} selecionadas)
                      </label>
                      <button 
                        type="button"
                        onClick={() => {
                          const allSelected = lotAnimals.every(a => a.selected);
                          setLotAnimals(lotAnimals.map(a => ({ ...a, selected: !allSelected })));
                        }}
                        style={{
                          background: 'none', border: 'none', color: 'hsl(var(--primary))', fontSize: '13px', fontWeight: 600, cursor: 'pointer'
                        }}
                      >
                        {lotAnimals.every(a => a.selected) ? 'Desmarcar Todas' : 'Selecionar Todas'}
                      </button>
                    </div>
                    
                    <div style={{ 
                      maxHeight: '300px', 
                      overflowY: 'auto', 
                      borderRadius: '8px',
                    }}>
                      <ModernTable
                        data={lotAnimals}
                        hideHeader={false}
                        emptyState={<></>}
                        columns={[
                          {
                            header: '',
                            width: '40px',
                            accessor: (item: any) => {
                              const idx = lotAnimals.findIndex(a => a.id === item.id);
                              return (
                                <input 
                                  type="checkbox" 
                                  checked={item.selected}
                                  onChange={(e) => {
                                    const newAnimals = [...lotAnimals];
                                    newAnimals[idx].selected = e.target.checked;
                                    setLotAnimals(newAnimals);
                                  }}
                                  style={{ cursor: 'pointer' }}
                                />
                              )
                            }
                          },
                          {
                            header: 'Animal',
                            accessor: (item: any) => (
                              <span style={{ fontWeight: 600 }}>{item.brinco} <span style={{fontWeight: 400, color: 'hsl(var(--text-muted))'}}>({item.categoria || '-'})</span></span>
                            )
                          },
                          ...(eventType === 'Palpação' ? [
                            {
                              header: 'Resultado',
                              width: '130px',
                              accessor: (item: any) => {
                                const idx = lotAnimals.findIndex(a => a.id === item.id);
                                return (
                                  <select 
                                    className="tauze-input"
                                    style={{ padding: '4px', height: '30px', fontSize: '12px' }}
                                    value={item.diagnostico}
                                    disabled={!item.selected}
                                    onChange={(e) => {
                                      const newAnimals = [...lotAnimals];
                                      newAnimals[idx].diagnostico = e.target.value;
                                      setLotAnimals(newAnimals);
                                    }}
                                  >
                                    <option value="Prenha">Prenha</option>
                                    <option value="Vazia">Vazia</option>
                                    <option value="Pendente">Pendente</option>
                                  </select>
                                )
                              }
                            },
                            {
                              header: 'Gestação',
                              width: '100px',
                              accessor: (item: any) => {
                                const idx = lotAnimals.findIndex(a => a.id === item.id);
                                return (
                                  <input 
                                    type="number"
                                    className="tauze-input"
                                    style={{ padding: '4px', height: '30px', fontSize: '12px' }}
                                    placeholder="Dias"
                                    disabled={item.diagnostico !== 'Prenha' || !item.selected}
                                    value={item.diagnostico === 'Prenha' ? item.dias_gestacao : ''}
                                    onChange={(e) => {
                                      const newAnimals = [...lotAnimals];
                                      newAnimals[idx].dias_gestacao = e.target.value;
                                      setLotAnimals(newAnimals);
                                    }}
                                  />
                                )
                              }
                            }
                          ] : []),
                          ...(eventType === 'Parto' ? [
                            {
                              header: 'Condição do Parto',
                              width: '160px',
                              accessor: (item: any) => {
                                const idx = lotAnimals.findIndex(a => a.id === item.id);
                                return (
                                  <select 
                                    className="tauze-input"
                                    style={{ padding: '4px', height: '30px', fontSize: '12px' }}
                                    value={item.condicao_parto}
                                    disabled={!item.selected}
                                    onChange={(e) => {
                                      const newAnimals = [...lotAnimals];
                                      newAnimals[idx].condicao_parto = e.target.value;
                                      setLotAnimals(newAnimals);
                                    }}
                                  >
                                    <option value="Normal">Normal</option>
                                    <option value="Distocia">Distocia (Difícil)</option>
                                    <option value="Aborto">Aborto</option>
                                  </select>
                                )
                              }
                            }
                          ] : [])
                        ]}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* CARD DE SEGURANÇA E PREDIÇÃO */}
              <div
                style={{
                  marginTop: '24px',
                  padding: '16px',
                  background: 'hsl(38 92% 50% / 0.1)',
                  border: '1.5px dashed hsl(38 92% 50% / 0.4)',
                  borderRadius: '12px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: 'hsl(38 92% 40%)',
                    fontWeight: 800,
                    fontSize: '13px',
                    marginBottom: '8px',
                  }}
                >
                  <AlertTriangle size={18} /> CONFIRMAÇÃO DE IMPACTO EM MASSA
                </div>
                <div
                  style={{ fontSize: '14px', color: 'hsl(var(--text-main))', lineHeight: '1.5' }}
                >
                  {batchStats.summary}
                </div>
                {batchStats.predictedDate && (
                  <div
                    style={{
                      marginTop: '12px',
                      display: 'inline-block',
                      padding: '6px 12px',
                      background: 'hsl(var(--brand)/0.1)',
                      color: 'hsl(var(--brand))',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 700,
                    }}
                  >
                    <CalendarDays
                      size={14}
                      style={{
                        display: 'inline',
                        verticalAlign: 'text-bottom',
                        marginRight: '4px',
                      }}
                    />
                    {batchStats.predictedDate}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ textAlign: 'center', padding: '40px 0' }}
            >
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  background: 'hsl(142 71% 45% / 0.1)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                }}
              >
                <CheckCircle2 size={40} style={{ color: 'hsl(142 71% 45%)' }} />
              </div>
              <h3
                style={{
                  fontSize: '20px',
                  fontWeight: 900,
                  color: 'hsl(142 71% 45%)',
                  marginBottom: '8px',
                }}
              >
                Lançamento Concluído!
              </h3>
              <p style={{ fontSize: '14px', color: 'hsl(var(--text-muted))' }}>
                O protocolo de {eventType} foi gravado com sucesso no histórico de{' '}
                <strong>{lotAnimalCount} matrizes</strong>.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SidePanel>
  );
};
