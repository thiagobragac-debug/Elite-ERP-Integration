import React, { useState, useEffect } from 'react';
import { usePersistentState } from '../../hooks/usePersistentState';
import { SidePanel } from '../Layout/SidePanel';
import { ConsumptionCart } from './ConsumptionCart';
import { SearchableSelect } from './SearchableSelect';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { Wheat, Calendar, Layers, Activity, FileText } from 'lucide-react';
import { DateInput } from '../../components/Form/DateInput';


interface FeedFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  actionId?: number;
}

export const FeedForm: React.FC<FeedFormProps> = ({ isOpen, onClose, onSubmit, actionId }) => {
  const { activeFarm } = useTenant();
  const [formData, setFormData] = usePersistentState('FeedForm_formData', {
    lote_id: '',
    dieta_id: '',
    data_trato: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0],
    observacoes: ''
  });
  
  const [cartItems, setCartItems] = usePersistentState<any[]>('FeedForm_cartItems', []);
  const [loading, setLoading] = useState(false);
  const [lotes, setLotes] = useState<any[]>([]);
  const [dietas, setDietas] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && activeFarm) {
      fetchData();
    }
  }, [isOpen, activeFarm]);

  const fetchData = async () => {
    // Buscar lotes
    const { data: lotesData } = await supabase
      .from('lotes')
      .select('id, nome')
      .eq('fazenda_id', activeFarm?.id || '')
      .eq('status', 'ATIVO');
    if (lotesData) setLotes(lotesData);

    // Buscar dietas
    const { data: dietasData } = await supabase
      .from('dietas')
      .select('id, nome')
      .eq('fazenda_id', activeFarm?.id || '')
      .eq('status', 'active');
    if (dietasData) setDietas(dietasData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({ ...formData, insumos: cartItems });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidePanel size="medium"
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Registro de Trato (Fornecimento)"
      subtitle="Lance o consumo diário de ração, sal ou suplementos para os lotes."
      icon={Wheat}
      loading={loading}
      submitLabel="Salvar Trato"
    >
      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 01</div>
          <h4 className="tauze-section-title">Dados do Lote e Dieta</h4>
        </div>
        
        <div className="tauze-input-grid grid-col-2">
          <div className="tauze-field-group">
            <label className="tauze-label"><Layers size={14} /> Lote / Curral</label>
            <SearchableSelect 
              value={formData.lote_id}
              onChange={(val: any) => setFormData({...formData, lote_id: val})}
              options={lotes.map(l => ({ value: l.id, label: l.nome }))}
              placeholder="Selecione o Lote..."
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Activity size={14} /> Dieta / Formulação</label>
            <SearchableSelect 
              value={formData.dieta_id}
              onChange={(val: any) => setFormData({...formData, dieta_id: val})}
              options={dietas.map(d => ({ value: d.id, label: d.nome }))}
              placeholder="Selecione a Dieta..."
            />
          </div>

          <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
            <label className="tauze-label"><Calendar size={14} /> Data do Trato</label>
            <DateInput 
              className="tauze-input"
               
              value={formData.data_trato}
              onChange={(e) => setFormData({...formData, data_trato: e.target.value})}
              required
            />
          </div>
          
          <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
            <label className="tauze-label"><FileText size={14} /> Observações</label>
            <textarea 
              className="tauze-input tauze-textarea"
              placeholder="Notas sobre o fornecimento..." 
              value={formData.observacoes}
              onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
              rows={2}
            />
          </div>
        </div>
      </section>

      <section className="tauze-form-section">
        <ConsumptionCart 
          items={cartItems} 
          onChange={setCartItems} 
          title="Insumos Consumidos"
          subtitle="Informe as quantidades fornecidas e os depósitos de onde sairão os insumos."
          filterCategories={['ração', 'suplemento', 'sal', 'ingrediente', 'volumoso']}
        />
      </section>
    </SidePanel>
  );
};
