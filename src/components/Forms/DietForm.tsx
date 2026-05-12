import React, { useState } from 'react';
import { 
  Wheat, 
  Tag,
  DollarSign,
  Layers,
  Utensils,
  Plus,
  Trash2,
  FileText,
  Activity
} from 'lucide-react';
import { FormModal } from './FormModal';

interface DietFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

export const DietForm: React.FC<DietFormProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'Concentrado',
    descricao: '',
    custo_por_kg: '0',
    percentual_ms: '88',
    status: 'active'
  });

  const [ingredients, setIngredients] = useState<string[]>([]);
  const [newIngredient, setNewIngredient] = useState('');

  React.useEffect(() => {
    if (initialData) {
      setFormData({
        nome: initialData.nome || '',
        tipo: initialData.tipo || 'Concentrado',
        descricao: initialData.descricao || '',
        custo_por_kg: initialData.custo_por_kg?.toString() || '0',
        percentual_ms: initialData.percentual_ms?.toString() || '88',
        status: initialData.status || 'active'
      });
      setIngredients(initialData.ingredientes || []);
    } else {
      setFormData({
        nome: '',
        tipo: 'Concentrado',
        descricao: '',
        custo_por_kg: '0',
        percentual_ms: '88',
        status: 'active'
      });
      setIngredients([]);
    }
  }, [initialData, isOpen]);

  const [loading, setLoading] = useState(false);

  const addIngredient = () => {
    if (newIngredient.trim()) {
      setIngredients([...ingredients, newIngredient.trim()]);
      setNewIngredient('');
    }
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({ ...formData, ingredientes: ingredients });
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={initialData ? "Editar Dieta" : "Nova Dieta / Formulação"}
      subtitle={initialData ? "Atualize as informações da dieta." : "Defina os ingredientes e custos da nutrição."}
      icon={Utensils}
      loading={loading}
      submitLabel={initialData ? "Atualizar Dieta" : "Salvar Dieta"}
    >
      <div className="form-group full-width">
        <label><Utensils size={14} /> Nome da Dieta</label>
        <input 
          type="text" 
          placeholder="Ex: Ração Engorda 18%, Suplemento Seca..." 
          value={formData.nome}
          onChange={(e) => setFormData({...formData, nome: e.target.value})}
          required 
        />
      </div>

      <div className="form-group full-width">
        <label><Wheat size={14} /> Tipo de Formulação</label>
        <div className="elite-form-radio-group">
          <div 
            className={`elite-form-radio-item ${formData.tipo === 'Concentrado' ? 'active' : ''}`}
            onClick={() => setFormData({...formData, tipo: 'Concentrado'})}
          >
            <Layers size={16} />
            <span>Concentrado</span>
          </div>
          <div 
            className={`elite-form-radio-item ${formData.tipo === 'Sal Mineral' ? 'active' : ''}`}
            onClick={() => setFormData({...formData, tipo: 'Sal Mineral'})}
          >
            <Activity size={16} />
            <span>Sal Mineral</span>
          </div>
          <div 
            className={`elite-form-radio-item ${formData.tipo === 'Total Mix' ? 'active' : ''}`}
            onClick={() => setFormData({...formData, tipo: 'Total Mix'})}
          >
            <Utensils size={16} />
            <span>Total Mix</span>
          </div>
          <div 
            className={`elite-form-radio-item ${formData.tipo === 'Volumoso' ? 'active' : ''}`}
            onClick={() => setFormData({...formData, tipo: 'Volumoso'})}
          >
            <Wheat size={16} />
            <span>Volumoso</span>
          </div>
        </div>
      </div>

      <div className="form-group">
        <label><DollarSign size={14} /> Custo por Kg Natural (R$)</label>
        <input 
          type="number" 
          step="0.01"
          placeholder="0.00" 
          value={formData.custo_por_kg}
          onChange={(e) => setFormData({...formData, custo_por_kg: e.target.value})}
          required
        />
      </div>

      <div className="form-group">
        <label><Activity size={14} /> Matéria Seca (% MS)</label>
        <input 
          type="number" 
          step="1"
          placeholder="88" 
          value={formData.percentual_ms}
          onChange={(e) => setFormData({...formData, percentual_ms: e.target.value})}
          required
        />
      </div>

      <div className="form-group full-width">
        <label><Layers size={14} /> Ingredientes</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input 
            type="text" 
            placeholder="Adicionar ingrediente..." 
            value={newIngredient}
            onChange={(e) => setNewIngredient(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addIngredient())}
          />
          <button type="button" className="secondary-btn" onClick={addIngredient} style={{ padding: '0 12px' }}>
            <Plus size={18} />
          </button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
          {ingredients.map((ing, idx) => (
            <span key={idx} className="tag" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {ing}
              <Trash2 size={12} style={{ cursor: 'pointer' }} onClick={() => removeIngredient(idx)} />
            </span>
          ))}
        </div>
      </div>

      <div className="form-group full-width">
        <label><FileText size={14} /> Descrição / Observações</label>
        <textarea 
          placeholder="Notas sobre a formulação..." 
          value={formData.descricao}
          onChange={(e) => setFormData({...formData, descricao: e.target.value})}
          rows={3}
        />
      </div>
    </FormModal>
  );
};
