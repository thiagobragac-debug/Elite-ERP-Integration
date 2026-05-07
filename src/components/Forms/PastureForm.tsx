import React, { useState } from 'react';
import { 
  Map, 
  Maximize,
  Tag,
  Trees,
  Activity,
  Calendar
} from 'lucide-react';
import { FormModal } from './FormModal';

interface PastureFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

export const PastureForm: React.FC<PastureFormProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    nome: '',
    area: '',
    capacidade_ua: '2.5',
    tipo_capim: 'Brachiaria',
    status: 'grazing',
    data_ultima_fertilizacao: '',
    topografia: 'Plano',
    tipo_solo: 'Argiloso',
    agua: 'Natural',
    observacoes: ''
  });

  React.useEffect(() => {
    if (initialData) {
      setFormData({
        nome: initialData.nome || '',
        area: initialData.area?.toString() || '',
        capacidade_ua: initialData.capacidade_ua?.toString() || '2.5',
        tipo_capim: initialData.tipo_capim || 'Brachiaria',
        status: initialData.status || 'grazing',
        data_ultima_fertilizacao: initialData.data_ultima_fertilizacao || '',
        topografia: initialData.topografia || 'Plano',
        tipo_solo: initialData.tipo_solo || 'Argiloso',
        agua: initialData.agua || 'Natural',
        observacoes: initialData.observacoes || ''
      });
    } else {
      setFormData({
        nome: '',
        area: '',
        capacidade_ua: '2.5',
        tipo_capim: 'Brachiaria',
        status: 'grazing',
        data_ultima_fertilizacao: '',
        topografia: 'Plano',
        tipo_solo: 'Argiloso',
        agua: 'Natural',
        observacoes: ''
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
      title={initialData ? "Editar Pasto / Piquete" : "Novo Pasto / Piquete"}
      subtitle={initialData ? "Atualize os dados da área de pastagem." : "Cadastre uma nova área de pastagem."}
      icon={Map}
      loading={loading}
      submitLabel={initialData ? "Salvar Alterações" : "Salvar Pasto"}
    >
      <div className="form-group full-width">
        <label><Map size={14} /> Nome do Pasto</label>
        <input 
          type="text" 
          placeholder="Ex: P-01 (Maternidade), Piquete 05..." 
          value={formData.nome}
          onChange={(e) => setFormData({...formData, nome: e.target.value})}
          required 
        />
      </div>

      <div className="form-group">
        <label><Maximize size={14} /> Área (ha)</label>
        <input 
          type="number" 
          step="0.01"
          placeholder="0.00" 
          value={formData.area}
          onChange={(e) => setFormData({...formData, area: e.target.value})}
          required
        />
      </div>

      <div className="form-group">
        <label><Activity size={14} /> Capacidade (UA/ha)</label>
        <input 
          type="number" 
          step="0.1"
          placeholder="2.5" 
          value={formData.capacidade_ua}
          onChange={(e) => setFormData({...formData, capacidade_ua: e.target.value})}
          required
        />
      </div>

      <div className="form-group">
        <label><Trees size={14} /> Tipo de Capim</label>
        <input 
          type="text" 
          placeholder="Ex: Brachiaria, Mombaça..." 
          value={formData.tipo_capim}
          onChange={(e) => setFormData({...formData, tipo_capim: e.target.value})}
          required
        />
      </div>

      <div className="form-group full-width">
        <label><Tag size={14} /> Status da Área</label>
        <div className="elite-form-radio-group">
          <div 
            className={`elite-form-radio-item ${formData.status === 'grazing' ? 'active' : ''}`}
            onClick={() => setFormData({...formData, status: 'grazing'})}
          >
            <Trees size={16} />
            <span>Pastejo</span>
          </div>
          <div 
            className={`elite-form-radio-item ${formData.status === 'resting' ? 'active' : ''}`}
            onClick={() => setFormData({...formData, status: 'resting'})}
          >
            <Calendar size={16} />
            <span>Descanso</span>
          </div>
          <div 
            className={`elite-form-radio-item ${formData.status === 'degraded' ? 'active' : ''}`}
            onClick={() => setFormData({...formData, status: 'degraded'})}
          >
            <Activity size={16} />
            <span>Degradado</span>
          </div>
        </div>
      </div>

      <div className="form-group">
        <label><Map size={14} /> Topografia</label>
        <select 
          value={formData.topografia}
          onChange={(e) => setFormData({...formData, topografia: e.target.value})}
        >
          <option>Plano</option>
          <option>Levemente Ondulado</option>
          <option>Ondulado</option>
          <option>Montanhoso</option>
        </select>
      </div>

      <div className="form-group">
        <label><Trees size={14} /> Tipo de Solo</label>
        <select 
          value={formData.tipo_solo}
          onChange={(e) => setFormData({...formData, tipo_solo: e.target.value})}
        >
          <option>Argiloso</option>
          <option>Arenoso</option>
          <option>Misto</option>
          <option>Latossolo</option>
        </select>
      </div>

      <div className="form-group">
        <label><Activity size={14} /> Recurso Hídrico</label>
        <select 
          value={formData.agua}
          onChange={(e) => setFormData({...formData, agua: e.target.value})}
        >
          <option>Natural (Rios/Nascentes)</option>
          <option>Bebedouro Australiano</option>
          <option>Represa</option>
          <option>Poço Artesiano</option>
        </select>
      </div>

      <div className="form-group">
        <label><Calendar size={14} /> Data da Última Fertilização</label>
        <input 
          type="date" 
          value={formData.data_ultima_fertilizacao}
          onChange={(e) => setFormData({...formData, data_ultima_fertilizacao: e.target.value})}
        />
      </div>

      <div className="form-group full-width">
        <label><Tag size={14} /> Observações Técnicas</label>
        <textarea 
          placeholder="Notas sobre degradação, pragas, ou histórico da área..." 
          value={formData.observacoes}
          onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
          style={{ width: '100%', minHeight: '80px', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-input)' }}
        />
      </div>
    </FormModal>
  );
};
