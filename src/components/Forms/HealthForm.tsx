import React, { useState } from 'react';
import { 
  HeartPulse, 
  Calendar,
  Search,
  FlaskConical,
  Stethoscope,
  Clock,
  Layers,
  Activity,
  FileText,
  Hash,
  AlertCircle
} from 'lucide-react';
import { FormModal } from './FormModal';

interface HealthFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

export const HealthForm: React.FC<HealthFormProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    tipo: 'vacina',
    titulo: '',
    animal_id: '',
    lote_id: '',
    data_manejo: new Date().toISOString().split('T')[0],
    produto: '',
    dose: '',
    via_aplicacao: 'IM',
    local_aplicacao: '',
    carencia_dias: '',
    observacao: '',
    status: 'REALIZADO'
  });

  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (initialData) {
      setFormData({
        tipo: initialData.tipo || 'vacina',
        titulo: initialData.titulo || '',
        animal_id: initialData.animal_id || '',
        lote_id: initialData.lote_id || '',
        data_manejo: initialData.data_manejo || new Date().toISOString().split('T')[0],
        produto: initialData.produto || '',
        dose: initialData.dose || '',
        via_aplicacao: initialData.via_aplicacao || 'IM',
        local_aplicacao: initialData.local_aplicacao || '',
        carencia_dias: initialData.carencia_dias?.toString() || '',
        observacao: initialData.observacao || '',
        status: initialData.status || 'REALIZADO'
      });
    } else {
      setFormData({
        tipo: 'vacina',
        titulo: '',
        animal_id: '',
        lote_id: '',
        data_manejo: new Date().toISOString().split('T')[0],
        produto: '',
        dose: '',
        via_aplicacao: 'IM',
        local_aplicacao: '',
        carencia_dias: '',
        observacao: '',
        status: 'REALIZADO'
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
      title={initialData ? "Editar Registro Sanitário" : "Novo Registro Sanitário"}
      subtitle="Registre vacinas, medicamentos ou tratamentos."
      icon={HeartPulse}
      loading={loading}
      submitLabel={initialData ? "Salvar Alterações" : "Salvar Registro"}
    >
      <div className="form-group">
        <label><Stethoscope size={14} /> Tipo de Manejo</label>
        <select 
          value={formData.tipo}
          onChange={(e) => setFormData({...formData, tipo: e.target.value})}
          required
        >
          <option value="vacina">Vacina</option>
          <option value="medicamento">Medicamento / Vermífugo</option>
          <option value="cirurgia">Cirurgia / Procedimento</option>
        </select>
      </div>

      <div className="form-group">
        <label><Clock size={14} /> Data do Manejo</label>
        <input 
          type="date" 
          value={formData.data_manejo}
          onChange={(e) => setFormData({...formData, data_manejo: e.target.value})}
          required
        />
      </div>

      <div className="form-group full-width">
        <label><FileText size={14} /> Título / Descrição</label>
        <input 
          type="text" 
          placeholder="Ex: Vacinação contra Aftosa" 
          value={formData.titulo}
          onChange={(e) => setFormData({...formData, titulo: e.target.value})}
          required 
        />
      </div>

      <div className="form-group">
        <label><Search size={14} /> Animal (Opcional)</label>
        <input 
          type="text" 
          placeholder="ID do animal" 
          value={formData.animal_id}
          onChange={(e) => setFormData({...formData, animal_id: e.target.value})}
        />
      </div>

      <div className="form-group">
        <label><Layers size={14} /> Lote (Opcional)</label>
        <input 
          type="text" 
          placeholder="ID do lote" 
          value={formData.lote_id}
          onChange={(e) => setFormData({...formData, lote_id: e.target.value})}
        />
      </div>

      <div className="form-group">
        <label><FlaskConical size={14} /> Produto</label>
        <input 
          type="text" 
          placeholder="Ex: Aftovax 2ml" 
          value={formData.produto}
          onChange={(e) => setFormData({...formData, produto: e.target.value})}
        />
      </div>

      <div className="form-group">
        <label><Hash size={14} /> Dose / Quantidade</label>
        <input 
          type="text" 
          placeholder="Ex: 2ml" 
          value={formData.dose}
          onChange={(e) => setFormData({...formData, dose: e.target.value})}
        />
      </div>

      <div className="form-group">
        <label><Activity size={14} /> Via de Aplicação</label>
        <select 
          value={formData.via_aplicacao}
          onChange={(e) => setFormData({...formData, via_aplicacao: e.target.value})}
        >
          <option value="IM">Intramuscular (IM)</option>
          <option value="SC">Subcutânea (SC)</option>
          <option value="ORAL">Oral</option>
          <option value="TOPICO">Tópico</option>
          <option value="IV">Intravenosa (IV)</option>
        </select>
      </div>

      <div className="form-group">
        <label><Hash size={14} /> Local de Aplicação</label>
        <input 
          type="text" 
          placeholder="Ex: Tábua do Pescoço, Garupa..." 
          value={formData.local_aplicacao}
          onChange={(e) => setFormData({...formData, local_aplicacao: e.target.value})}
        />
      </div>

      <div className="form-group">
        <label><AlertCircle size={14} /> Carência (Dias)</label>
        <input 
          type="number" 
          placeholder="0" 
          value={formData.carencia_dias}
          onChange={(e) => setFormData({...formData, carencia_dias: e.target.value})}
        />
      </div>

      <div className="form-group">
        <label><Activity size={14} /> Status</label>
        <select 
          value={formData.status}
          onChange={(e) => setFormData({...formData, status: e.target.value})}
        >
          <option value="REALIZADO">Realizado</option>
          <option value="PENDENTE">Pendente</option>
        </select>
      </div>

      <div className="form-group full-width">
        <label><FileText size={14} /> Observações</label>
        <textarea 
          placeholder="Notas adicionais..." 
          value={formData.observacao}
          onChange={(e) => setFormData({...formData, observacao: e.target.value})}
          rows={3}
        />
      </div>
    </FormModal>
  );
};
