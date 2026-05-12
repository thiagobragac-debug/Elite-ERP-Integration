import React, { useState } from 'react';
import { 
  Heart, 
  Baby,
  Thermometer,
  Activity,
  Calendar,
  Layers,
  Beef,
  FileText,
  Hash
} from 'lucide-react';
import { FormModal } from './FormModal';

interface ReproductionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

export const ReproductionForm: React.FC<ReproductionFormProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    animal_id: '',
    tipo_evento: 'IATF',
    data_evento: new Date().toISOString().split('T')[0],
    resultado: '',
    touro: '',
    ecc: '',
    observacoes: '',
    status: 'pending'
  });

  React.useEffect(() => {
    if (initialData) {
      setFormData({
        animal_id: initialData.animal_id || '',
        tipo_evento: initialData.tipo_evento || 'IATF',
        data_evento: initialData.data_evento || new Date().toISOString().split('T')[0],
        resultado: initialData.resultado || '',
        touro: initialData.touro || '',
        ecc: initialData.ecc?.toString() || '',
        observacoes: initialData.observacoes || '',
        status: initialData.status || 'pending'
      });
    } else {
      setFormData({
        animal_id: '',
        tipo_evento: 'IATF',
        data_evento: new Date().toISOString().split('T')[0],
        resultado: '',
        touro: '',
        ecc: '',
        observacoes: '',
        status: 'pending'
      });
    }
  }, [initialData, isOpen]);

  const [loading, setLoading] = useState(false);

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
      title={initialData ? "Editar Evento Reprodutivo" : "Novo Evento Reprodutivo"}
      subtitle={initialData ? "Atualize as informações do evento." : "Lance inseminações, toques ou partos."}
      icon={Heart}
      loading={loading}
      submitLabel={initialData ? "Atualizar Evento" : "Salvar Evento"}
    >
      <div className="form-group full-width">
        <label><Beef size={14} /> Animal / Matriz</label>
        <div style={{ position: 'relative' }}>
          <Hash size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Brinco ou ID da Matriz..." 
            style={{ paddingLeft: '32px' }}
            value={formData.animal_id}
            onChange={(e) => setFormData({...formData, animal_id: e.target.value})}
            required 
          />
        </div>
      </div>

      <div className="form-group">
        <label><Activity size={14} /> Tipo de Evento</label>
        <select 
          value={formData.tipo_evento}
          onChange={(e) => setFormData({...formData, tipo_evento: e.target.value})}
          required
        >
          <option value="IATF">IATF / Inseminação</option>
          <option value="Palpação">Toque / Palpação</option>
          <option value="Parto">Parto</option>
          <option value="Monta">Monta Natural</option>
          <option value="Secagem">Secagem</option>
        </select>
      </div>

      <div className="form-group">
        <label><Calendar size={14} /> Data do Evento</label>
        <input 
          type="date" 
          value={formData.data_evento}
          onChange={(e) => setFormData({...formData, data_evento: e.target.value})}
          required
        />
      </div>

      <div className="form-group full-width">
        <label><Activity size={14} /> Status</label>
        <div className="elite-form-radio-group">
          <div 
            className={`elite-form-radio-item ${formData.status === 'pending' ? 'active' : ''}`}
            onClick={() => setFormData({...formData, status: 'pending'})}
          >
            <Calendar size={16} />
            <span>Agendado</span>
          </div>
          <div 
            className={`elite-form-radio-item ${formData.status === 'completed' ? 'active' : ''}`}
            onClick={() => setFormData({...formData, status: 'completed'})}
          >
            <Activity size={16} />
            <span>Concluído</span>
          </div>
        </div>
      </div>

      <div className="form-group">
        <label><Baby size={14} /> Resultado / Diagnóstico</label>
        <input 
          type="text" 
          placeholder="Ex: Prenha (45d), Vazia, Macho..." 
          value={formData.resultado}
          onChange={(e) => setFormData({...formData, resultado: e.target.value})}
        />
      </div>

      <div className="form-group">
        <label><Activity size={14} /> ECC (Escore 1-5)</label>
        <input 
          type="number" 
          step="0.1"
          placeholder="Ex: 3.5" 
          value={formData.ecc}
          onChange={(e) => setFormData({...formData, ecc: e.target.value})}
        />
      </div>

      <div className="form-group full-width">
        <label><Hash size={14} /> Touro / Partida de Sêmen</label>
        <input 
          type="text" 
          placeholder="Identificação do Reprodutor..." 
          value={formData.touro}
          onChange={(e) => setFormData({...formData, touro: e.target.value})}
        />
      </div>

      <div className="form-group full-width">
        <label><FileText size={14} /> Observações</label>
        <textarea 
          placeholder="Notas adicionais sobre o procedimento..." 
          value={formData.observacoes}
          onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
          rows={3}
        />
      </div>
    </FormModal>
  );
};
