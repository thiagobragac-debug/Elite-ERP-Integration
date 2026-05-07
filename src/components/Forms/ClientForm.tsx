import React, { useState } from 'react';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  ShieldCheck,
  CreditCard,
  FileText,
  Activity
} from 'lucide-react';
import { FormModal } from './FormModal';

interface ClientFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

export const ClientForm: React.FC<ClientFormProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    name: '',
    cnpj: '',
    type: 'Frigorífico',
    email: '',
    phone: '',
    location: '',
    creditLimit: '',
    status: 'ATIVO'
  });

  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.nome || '',
        cnpj: initialData.documento || '',
        type: initialData.tipo || 'Frigorífico',
        email: initialData.email || '',
        phone: initialData.telefone || '',
        location: initialData.localizacao || '',
        creditLimit: initialData.limite_credito || '',
        status: initialData.status || 'ATIVO'
      });
    } else {
      setFormData({
        name: '',
        cnpj: '',
        type: 'Frigorífico',
        email: '',
        phone: '',
        location: '',
        creditLimit: '',
        status: 'ATIVO'
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
      title={initialData ? "Editar Cliente" : "Novo Cliente"}
      subtitle="Cadastre um novo comprador ou parceiro de vendas."
      icon={User}
      loading={loading}
      submitLabel={initialData ? "Salvar Alterações" : "Salvar Cliente"}
    >
      <div className="form-group full-width">
        <label><User size={14} /> Nome / Razão Social</label>
        <input 
          type="text" 
          placeholder="Ex: Frigorífico JBS" 
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          required 
        />
      </div>

      <div className="form-group">
        <label><FileText size={14} /> CNPJ / CPF</label>
        <input 
          type="text" 
          placeholder="00.000.000/0001-00" 
          value={formData.cnpj}
          onChange={(e) => setFormData({...formData, cnpj: e.target.value})}
        />
      </div>

      <div className="form-group">
        <label><ShieldCheck size={14} /> Tipo de Cliente</label>
        <select 
          value={formData.type}
          onChange={(e) => setFormData({...formData, type: e.target.value})}
          required
        >
          <option>Frigorífico</option>
          <option>Trader</option>
          <option>Pessoa Física</option>
          <option>Leilão</option>
        </select>
      </div>

      <div className="form-group">
        <label><Mail size={14} /> E-mail</label>
        <input 
          type="email" 
          placeholder="financeiro@cliente.com" 
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
        />
      </div>

      <div className="form-group">
        <label><Phone size={14} /> Telefone</label>
        <input 
          type="text" 
          placeholder="(00) 00000-0000" 
          value={formData.phone}
          onChange={(e) => setFormData({...formData, phone: e.target.value})}
        />
      </div>

      <div className="form-group">
        <label><MapPin size={14} /> Localização</label>
        <input 
          type="text" 
          placeholder="Cidade/UF" 
          value={formData.location}
          onChange={(e) => setFormData({...formData, location: e.target.value})}
        />
      </div>

      <div className="form-group">
        <label><CreditCard size={14} /> Limite de Crédito (R$)</label>
        <input 
          type="number" 
          placeholder="0,00" 
          value={formData.creditLimit}
          onChange={(e) => setFormData({...formData, creditLimit: e.target.value})}
        />
      </div>

      <div className="form-group">
        <label><Activity size={14} /> Status / CRM</label>
        <select 
          value={formData.status}
          onChange={(e) => setFormData({...formData, status: e.target.value})}
          required
        >
          <option value="ATIVO">Cliente Ativo</option>
          <option value="LEAD">Lead / Prospecto</option>
        </select>
      </div>
    </FormModal>
  );
};
