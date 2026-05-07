import React, { useState } from 'react';
import { 
  Scale, 
  Calendar,
  Layers,
  Search,
  CheckCircle2,
  FileText,
  Hash
} from 'lucide-react';
import { FormModal } from './FormModal';

interface WeightFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

export const WeightForm: React.FC<WeightFormProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    animal_id: '',
    data_pesagem: new Date().toISOString().split('T')[0],
    peso: '',
    lote_id: '',
    observacao: ''
  });

  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (initialData) {
      setFormData({
        animal_id: initialData.animal_id || '',
        data_pesagem: initialData.data_pesagem || new Date().toISOString().split('T')[0],
        peso: initialData.peso?.toString() || '',
        lote_id: initialData.lote_id || '',
        observacao: initialData.observacao || ''
      });
    } else {
      setFormData({
        animal_id: '',
        data_pesagem: new Date().toISOString().split('T')[0],
        peso: '',
        lote_id: '',
        observacao: ''
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={initialData ? "Editar Pesagem" : "Nova Pesagem"}
      subtitle="Registre o peso individual de um animal."
      icon={Scale}
      loading={loading}
      submitLabel={initialData ? "Salvar Alterações" : "Salvar Pesagem"}
    >
      <div className="form-group full-width">
        <label><Hash size={14} /> Animal (Brinco/ID)</label>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Digite o brinco ou ID do animal" 
            style={{ paddingLeft: '32px' }}
            value={formData.animal_id}
            onChange={(e) => setFormData({...formData, animal_id: e.target.value})}
            required 
          />
        </div>
      </div>

      <div className="form-group">
        <label><Scale size={14} /> Peso (kg)</label>
        <input 
          type="number" 
          step="0.1"
          placeholder="0.0" 
          value={formData.peso}
          onChange={(e) => setFormData({...formData, peso: e.target.value})}
          required
        />
      </div>

      <div className="form-group">
        <label><Calendar size={14} /> Data da Pesagem</label>
        <input 
          type="date" 
          value={formData.data_pesagem}
          onChange={(e) => setFormData({...formData, data_pesagem: e.target.value})}
          required
        />
      </div>

      <div className="form-group full-width">
        <label><Layers size={14} /> Lote (Opcional)</label>
        <select 
          value={formData.lote_id}
          onChange={(e) => setFormData({...formData, lote_id: e.target.value})}
        >
          <option value="">Selecione um lote</option>
          {/* Lotes seriam carregados aqui */}
        </select>
      </div>

      <div className="form-group full-width">
        <label><FileText size={14} /> Observações</label>
        <textarea 
          placeholder="Notas sobre a condição do animal, etc." 
          value={formData.observacao}
          onChange={(e) => setFormData({...formData, observacao: e.target.value})}
          rows={3}
        />
      </div>
    </FormModal>
  );
};
