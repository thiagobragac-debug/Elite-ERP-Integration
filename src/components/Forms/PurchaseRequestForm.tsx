import React, { useState } from 'react';
import { 
  FileText, 
  User, 
  Building2, 
  Calendar, 
  AlertCircle, 
  DollarSign,
  ClipboardList
} from 'lucide-react';
import { FormModal } from './FormModal';
import { InsumoEntryTable } from './InsumoEntryTable';
import { useTenant } from '../../contexts/TenantContext';

interface PurchaseRequestFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

export const PurchaseRequestForm: React.FC<PurchaseRequestFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData
}) => {
  const { activeCompany, companies } = useTenant();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>(initialData?.items || []);

  const [formData, setFormData] = useState({
    company_id: initialData?.company_id || activeCompany?.id || '',
    title: initialData?.title || '',
    requester: initialData?.requester || '',
    department: initialData?.department || '',
    date: initialData?.date || new Date().toISOString().split('T')[0],
    priority: initialData?.priority || 'medium',
    estimated_value: initialData?.estimated_value || '',
    description: initialData?.description || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({ ...formData, items });
      onClose();
    } catch (error) {
      console.error('Error submitting request:', error);
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
      subtitle="Crie uma nova requisição de materiais ou serviços para aprovação."
      icon={ClipboardList}
      loading={loading}
      submitLabel={initialData ? "Salvar Alterações" : "Enviar Solicitação"}
      size="xlarge"
    >
      <div className="form-group full-width">
        <label><Building2 size={14} /> Empresa / Unidade Solicitante</label>
        <select 
          className="elite-input"
          value={formData.company_id}
          onChange={(e) => setFormData({...formData, company_id: e.target.value})}
          required
        >
          <option value="">Selecione a empresa...</option>
          {companies.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="form-group full-width">
        <label><FileText size={14} /> Título da Solicitação</label>
        <input 
          className="elite-input"
          type="text" 
          placeholder="Ex: Compra de Fertilizantes para Safra..." 
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          required 
        />
      </div>

      <div className="form-group span-2">
        <label><User size={14} /> Requerente</label>
        <input 
          className="elite-input"
          type="text" 
          value={formData.requester}
          onChange={(e) => setFormData({...formData, requester: e.target.value})}
          required 
        />
      </div>

      <div className="form-group span-2">
        <label><Building2 size={14} /> Departamento</label>
        <select 
          className="elite-input"
          value={formData.department}
          onChange={(e) => setFormData({...formData, department: e.target.value})}
          required
        >
          <option value="">Selecione o setor...</option>
          <option value="Operacional">Operacional</option>
          <option value="Administrativo">Administrativo</option>
          <option value="Manutenção">Manutenção</option>
          <option value="Logística">Logística</option>
        </select>
      </div>

      <div className="form-group span-1">
        <label><Calendar size={14} /> Data</label>
        <input 
          className="elite-input"
          type="date" 
          value={formData.date}
          onChange={(e) => setFormData({...formData, date: e.target.value})}
          required
        />
      </div>

      <div className="form-group span-1">
        <label><AlertCircle size={14} /> Prioridade</label>
        <select 
          className="elite-input"
          value={formData.priority}
          onChange={(e) => setFormData({...formData, priority: e.target.value})}
          required
        >
          <option value="low">Baixa</option>
          <option value="medium">Média</option>
          <option value="high">Alta</option>
          <option value="urgent">Urgente</option>
        </select>
      </div>

      <div className="form-group span-1">
        <label><DollarSign size={14} /> Valor Estimado (R$)</label>
        <input 
          className="elite-input"
          type="number" 
          step="0.01"
          placeholder="0.00" 
          value={formData.estimated_value}
          onChange={(e) => setFormData({...formData, estimated_value: e.target.value})}
          required
        />
      </div>

      <div className="form-group full-width">
        <InsumoEntryTable 
          items={items}
          onChange={setItems}
        />
      </div>
    </FormModal>
  );
};
