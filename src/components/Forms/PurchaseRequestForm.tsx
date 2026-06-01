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
import { SidePanel } from '../Layout/SidePanel';
import { InsumoEntryTable } from './InsumoEntryTable';
import { useTenant } from '../../contexts/TenantContext';
import { SearchableSelect } from './SearchableSelect';

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
    <SidePanel
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
                <SearchableSelect 
          value={formData.company_id}
          onChange={(val: any) => { /* TODO: adjust */ }}
          options={[
            { value: ``, label: `Selecione a empresa...` },
            { value: `{c.name}`, label: `{c.name}` },
            ...(companies || []).map(c => ({ value: String(c.id), label: String(c.name) })),
          ]}
        />
      </div>

      <div className="form-group full-width">
        <label><FileText size={14} /> Título da Solicitação</label>
        <input 
          className="tauze-input"
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
          className="tauze-input"
          type="text" 
          value={formData.requester}
          onChange={(e) => setFormData({...formData, requester: e.target.value})}
          required 
        />
      </div>

      <div className="form-group span-2">
        <label><Building2 size={14} /> Departamento</label>
                <SearchableSelect 
          value={formData.department}
          onChange={(val: any) => { /* TODO: adjust */ }}
          options={[
            { value: ``, label: `Selecione o setor...` },
            { value: `Operacional`, label: `Operacional` },
            { value: `Administrativo`, label: `Administrativo` },
            { value: `Manutenção`, label: `Manutenção` },
            { value: `Logística`, label: `Logística` },
          ]}
        />
      </div>

      <div className="form-group span-1">
        <label><Calendar size={14} /> Data</label>
        <input 
          className="tauze-input"
          type="date" 
          value={formData.date}
          onChange={(e) => setFormData({...formData, date: e.target.value})}
          required
        />
      </div>

      <div className="form-group span-1">
        <label><AlertCircle size={14} /> Prioridade</label>
                <SearchableSelect 
          value={formData.priority}
          onChange={(val: any) => { /* TODO: adjust */ }}
          options={[
            { value: `low`, label: `Baixa` },
            { value: `medium`, label: `Média` },
            { value: `high`, label: `Alta` },
            { value: `urgent`, label: `Urgente` },
          ]}
        />
      </div>

      <div className="form-group span-1">
        <label><DollarSign size={14} /> Valor Estimado (R$)</label>
        <input 
          className="tauze-input"
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
    </SidePanel>
  );
};
