import React, { useState, useEffect } from 'react';
import { usePersistentState } from '../../hooks/usePersistentState';
import { SidePanel } from '../Layout/SidePanel';
import { SearchableSelect } from './SearchableSelect';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { Wheat, Calendar, FileText, Plus, Trash2 } from 'lucide-react';
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
    <SidePanel size="large"
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Planilha de Trato (Lote)"
      subtitle="Lance o consumo de trato para múltiplos lotes de uma vez (Baseado na composição da dieta)."
      icon={Wheat}
      loading={loading}
      submitLabel="Salvar Planilha"
    >
      <section className="tauze-form-section">
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

        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h4 className="tauze-section-title" style={{ margin: 0 }}>Lotes Tratados</h4>
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
      </section>
    </SidePanel>
  );
};
