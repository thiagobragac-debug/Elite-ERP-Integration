import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Package,
  Calendar,
  User,
  DollarSign,
  AlertTriangle,
  Layers,
  FileText,
  Building2
} from 'lucide-react';
import { FormModal } from './FormModal';

interface PurchaseRequestFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

export const PurchaseRequestForm: React.FC<PurchaseRequestFormProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    priority: 'medium',
    estimatedValue: '',
    description: '',
    items: [] as any[]
  });

  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.titulo || '',
        department: initialData.departamento || '',
        priority: initialData.prioridade || 'medium',
        estimatedValue: initialData.valor_estimado?.toString() || '',
        description: initialData.descricao || '',
        items: initialData.itens || []
      });
    } else {
      setFormData({
        title: '',
        department: '',
        priority: 'medium',
        estimatedValue: '',
        description: '',
        items: []
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
      title={initialData ? "Editar Solicitação" : "Nova Solicitação de Compra"}
      subtitle="Abra uma requisição interna de materiais ou serviços."
      icon={ShoppingCart}
      loading={loading}
      submitLabel={initialData ? "Salvar Alterações" : "Enviar Solicitação"}
    >
      <div className="form-group full-width">
        <label><FileText size={14} /> Título da Solicitação</label>
        <input 
          type="text" 
          placeholder="Ex: Adubo NPK Safra 2024, Peças Trator..." 
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          required 
        />
      </div>

      <div className="form-group">
        <label><Building2 size={14} /> Departamento / Setor</label>
        <select 
          value={formData.department}
          onChange={(e) => setFormData({...formData, department: e.target.value})}
          required
        >
          <option value="">Selecione o setor...</option>
          <option value="Pecuária">Pecuária / Campo</option>
          <option value="Veterinária">Veterinária / Sanidade</option>
          <option value="Nutrição">Nutrição / Fábrica</option>
          <option value="Frota">Frota / Oficina</option>
          <option value="Admin">Administrativo / Sede</option>
        </select>
      </div>

      <div className="form-group">
        <label><AlertTriangle size={14} /> Prioridade</label>
        <select 
          value={formData.priority}
          onChange={(e) => setFormData({...formData, priority: e.target.value})}
          required
        >
          <option value="low">Baixa (Planejada)</option>
          <option value="medium">Média (Normal)</option>
          <option value="high">Alta (Urgente)</option>
        </select>
      </div>

      <div className="form-group">
        <label><DollarSign size={14} /> Valor Estimado (R$)</label>
        <input 
          type="number" 
          step="0.01"
          placeholder="0.00" 
          value={formData.estimatedValue}
          onChange={(e) => setFormData({...formData, estimatedValue: e.target.value})}
          required
        />
      </div>

      <div className="form-group full-width">
        <label><FileText size={14} /> Justificativa / Detalhes</label>
        <textarea 
          placeholder="Descreva a necessidade da compra e urgência..." 
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          rows={3}
          required
        />
      </div>

      <div className="form-group full-width">
        <label><Package size={14} /> Lista de Itens (Opcional)</label>
        <div className="elite-form-info-box" style={{ justifyContent: 'center' }}>
          <p style={{ textAlign: 'center' }}>
            Adicione itens detalhados à solicitação após o salvamento inicial.
          </p>
        </div>
      </div>
    </FormModal>
  );
};
