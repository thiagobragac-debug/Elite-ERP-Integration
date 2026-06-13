import React, { useState, useEffect } from 'react';
import { usePersistentState } from '../../hooks/usePersistentState';
import { SidePanel } from '../Layout/SidePanel';
import { SearchableSelect } from './SearchableSelect';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { Wheat, Calendar, FileText, Plus, Trash2, CheckCircle, ChevronRight, LayoutList } from 'lucide-react';
import { motion } from 'framer-motion';
import { DateInput } from '../../components/Form/DateInput';


interface BatchFeedFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any[]) => void;
}

export const BatchFeedForm: React.FC<BatchFeedFormProps> = ({ isOpen, onClose, onSubmit }) => {
  const { activeFarm } = useTenant();
  
  const [dataTrato, setDataTrato] = usePersistentState('BatchFeedForm_data', 
    new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]
  );
  const [dietaId, setDietaId] = usePersistentState('BatchFeedForm_dieta', '');
  
  const [items, setItems] = usePersistentState<any[]>('BatchFeedForm_items', []);

  const [loading, setLoading] = useState(false);
  const [lotes, setLotes] = useState<any[]>([]);
  const [dietas, setDietas] = useState<any[]>([]);

  const [activeEtapa, setActiveEtapa] = useState('dados');

  const isDadosDone = !!dataTrato && !!dietaId;
  const isLotesDone = items.length > 0 && items.every(i => !!i.lote_id && !!i.quantidade_kg);

  const ETAPAS_CONFIG = [
    { id: 'dados', label: '1. Dados do Trato', icon: FileText, color: '#3b82f6' },
    { id: 'lotes', label: '2. Lotes Tratados', icon: LayoutList, color: '#f59e0b' },
  ];

  useEffect(() => {
    if (isOpen && activeFarm) {
      fetchData();
    }
  }, [isOpen, activeFarm]);

  const fetchData = async () => {
    const { data: lotesData } = await supabase.from('lotes').select('id, nome').eq('fazenda_id', activeFarm?.id || '').eq('status', 'ATIVO');
    if (lotesData) setLotes(lotesData);

    const { data: dietasData } = await supabase.from('dietas').select('id, nome, composicao').eq('fazenda_id', activeFarm?.id || '').eq('status', 'active');
    if (dietasData) setDietas(dietasData);
  };

  const handleAddItem = () => {
    setItems([...items, { id: Date.now().toString(), lote_id: '', quantidade_kg: '' }]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: string, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const selectedDiet = dietas.find(d => String(d.id) === String(dietaId));
      if (!selectedDiet) throw new Error('Dieta não encontrada.');

      const payloads = items.filter(i => i.lote_id && i.quantidade_kg).map(item => {
        // Expand the diet composition based on total KG consumed
        const insumos = selectedDiet.composicao.map((comp: any) => {
          // comp.inclusao is percentage (0-100)
          const qtdInsumo = (Number(item.quantidade_kg) * Number(comp.inclusao)) / 100;
          return {
            produto_id: comp.produto_id,
            quantidade: qtdInsumo,
            deposito_id: comp.deposito_id || null, // Assuming composicao might have deposito_id, if not backend handles it or we set default.
            custo_medio: comp.custo_medio || 0
          };
        });

        return {
          lote_id: item.lote_id,
          dieta_id: dietaId,
          data_trato: dataTrato,
          observacoes: 'Lançamento via Planilha de Trato',
          insumos: insumos
        };
      });

      if (payloads.length === 0) throw new Error('Nenhum lote preenchido corretamente.');

      await onSubmit(payloads);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidePanel size="850px"
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Planilha de Trato (Lote)"
      subtitle="Lance o consumo de trato para múltiplos lotes de uma vez."
      icon={Wheat}
      loading={loading}
      submitLabel="Salvar Planilha"
      hideSubmit={!isDadosDone || !isLotesDone}
    >
      <div style={{ display: 'flex', gap: '24px' }}>
        {/* Left Sidebar */}
        <div style={{ width: '220px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {ETAPAS_CONFIG.map((et) => {
            let isCompleted = false;
            if (et.id === 'dados') isCompleted = isDadosDone;
            if (et.id === 'lotes') isCompleted = isLotesDone;

            const isActive = activeEtapa === et.id;
            const Icon = et.icon;
            
            return (
              <button
                key={et.id}
                type="button"
                onClick={() => setActiveEtapa(et.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                  borderRadius: '12px', border: 'none',
                  background: isActive ? `${et.color}15` : 'transparent',
                  color: isActive ? et.color : 'hsl(var(--text-secondary))',
                  cursor: 'pointer', textAlign: 'left', fontWeight: isActive ? 700 : 500,
                  transition: 'all 0.2s',
                  boxShadow: isActive ? `inset 3px 0 0 ${et.color}` : 'none'
                }}
              >
                <div style={{ 
                  width: '32px', height: '32px', borderRadius: '8px', 
                  background: isCompleted ? et.color : isActive ? `${et.color}30` : 'hsl(var(--bg-main))',
                  color: isCompleted ? '#fff' : isActive ? et.color : 'hsl(var(--text-muted))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {isCompleted && !isActive ? <CheckCircle size={16} /> : <Icon size={16} />}
                </div>
                <span style={{ fontSize: '13px', flex: 1 }}>{et.label}</span>
                {isActive && <ChevronRight size={16} opacity={0.5} />}
              </button>
            )
          })}
        </div>

        {/* Right Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border))', borderRadius: '16px', padding: '24px' }}>
            <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid hsl(var(--border))' }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {ETAPAS_CONFIG.find(e => e.id === activeEtapa)?.label}
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: 'hsl(var(--text-muted))' }}>
                {activeEtapa === 'dados' && "Informações sobre data e dieta fornecida."}
                {activeEtapa === 'lotes' && "Tabela de distribuição do trato para os lotes (baseado na dieta)."}
              </p>
            </div>

            {activeEtapa === 'dados' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="tauze-input-grid grid-col-2">
                  <div className="tauze-field-group">
                    <label className="tauze-label">Data do Trato</label>
                    <DateInput 
                      className="tauze-input"
                      value={dataTrato}
                      onChange={(e) => setDataTrato(e.target.value)}
                      required
                    />
                  </div>
                  <div className="tauze-field-group">
                    <label className="tauze-label">Dieta Fornecida</label>
                    <SearchableSelect 
                      value={dietaId}
                      onChange={(val: any) => setDietaId(val)}
                      options={dietas.map(d => ({ value: d.id, label: d.nome }))}
                      placeholder="Selecione a Dieta..."
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {activeEtapa === 'lotes' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4 className="tauze-section-title" style={{ margin: 0 }}>Distribuição</h4>
                  <button 
                    type="button" 
                    onClick={handleAddItem}
                    className="secondary-btn"
                    style={{ fontSize: '11px', padding: '6px 12px' }}
                  >
                    <Plus size={14} /> Adicionar Linha
                  </button>
                </div>

                <div style={{ overflowX: 'auto', border: '1px solid hsl(var(--border))', borderRadius: '12px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
                    <thead>
                      <tr style={{ background: 'hsl(var(--bg-main))' }}>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '11px', color: 'hsl(var(--text-muted))' }}>Lote / Curral</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '11px', color: 'hsl(var(--text-muted))', width: '150px' }}>Total Tratado (KG)</th>
                        <th style={{ padding: '12px', width: '50px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, idx) => (
                        <tr key={item.id} style={{ borderTop: '1px solid hsl(var(--border))' }}>
                          <td style={{ padding: '8px 12px' }}>
                            <SearchableSelect 
                              value={item.lote_id}
                              onChange={(val: any) => updateItem(item.id, 'lote_id', val)}
                              options={lotes.map(l => ({ value: l.id, label: l.nome }))}
                              placeholder="Selecione o lote..."
                              height="36px"
                            />
                          </td>
                          <td style={{ padding: '8px 12px' }}>
                            <input 
                              type="number"
                              step="0.01"
                              className="tauze-input"
                              style={{ height: '36px', textAlign: 'center' }}
                              value={item.quantidade_kg}
                              onChange={(e) => updateItem(item.id, 'quantidade_kg', e.target.value)}
                              placeholder="0.0"
                            />
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                            <button 
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {items.length === 0 && (
                        <tr>
                          <td colSpan={3} style={{ padding: '24px', textAlign: 'center', color: 'hsl(var(--text-muted))', fontSize: '12px' }}>
                            Nenhum lote adicionado. Clique em "Adicionar Linha".
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

          </div>
        </div>
      </div>
    </SidePanel>
  );
};
