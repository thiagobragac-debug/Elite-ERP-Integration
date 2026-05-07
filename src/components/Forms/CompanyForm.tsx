import React, { useState } from 'react';
import { 
  Building2, 
  FileText,
  MapPin,
  Globe,
  ShieldCheck,
  Mail,
  Phone,
  Map,
  Users
} from 'lucide-react';
import { FormModal } from './FormModal';

interface CompanyFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

export const CompanyForm: React.FC<CompanyFormProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = React.useState({
    name: '',
    document: '',
    type: 'matriz',
    email: '',
    phone: '',
    address: ''
  });

  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        document: initialData.document || '',
        type: initialData.type || 'matriz',
        email: initialData.email || '',
        phone: initialData.phone || '',
        address: initialData.address || ''
      });
    } else {
      setFormData({
        name: '',
        document: '',
        type: 'matriz',
        email: '',
        phone: '',
        address: ''
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      console.log('Submitting company data:', formData);
      await onSubmit(formData);
      console.log('Submission complete');
    } catch (err) {
      console.error('Error in CompanyForm handleSubmit:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={initialData ? "Editar Empresa" : "Cadastrar Nova Empresa"}
      subtitle={initialData ? "Atualize os dados cadastrais da unidade." : "Adicione uma matriz ou filial ao seu grupo agropecuário."}
      icon={Building2}
      loading={loading}
      submitLabel={initialData ? "Salvar Alterações" : "Salvar Empresa"}
    >
      <div className="form-group full-width">
        <label><Building2 size={14} /> Razão Social / Nome Fantasia</label>
        <input 
          type="text" 
          placeholder="Ex: Agropecuária Matriz Ltda..." 
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          required 
        />
      </div>

      <div className="form-group">
        <label><FileText size={14} /> CNPJ / CPF</label>
        <input 
          type="text" 
          placeholder="00.000.000/0000-00" 
          value={formData.document}
          onChange={(e) => setFormData({...formData, document: e.target.value})}
          required
        />
      </div>

      <div className="form-group full-width">
        <label><ShieldCheck size={14} /> Tipo de Unidade</label>
        <div className="elite-form-radio-group">
          <div 
            className={`elite-form-radio-item ${formData.type === 'matriz' ? 'active' : ''}`}
            onClick={() => setFormData({...formData, type: 'matriz'})}
          >
            <Building2 size={16} />
            <span>Matriz</span>
          </div>
          <div 
            className={`elite-form-radio-item ${formData.type === 'filial' ? 'active' : ''}`}
            onClick={() => setFormData({...formData, type: 'filial'})}
          >
            <Map size={16} />
            <span>Filial</span>
          </div>
          <div 
            className={`elite-form-radio-item ${formData.type === 'parceiro' ? 'active' : ''}`}
            onClick={() => setFormData({...formData, type: 'parceiro'})}
          >
            <Users size={16} />
            <span>Parceiro</span>
          </div>
        </div>
      </div>

      <div className="form-group">
        <label><Mail size={14} /> E-mail de Contato</label>
        <input 
          type="email" 
          placeholder="contato@empresa.com.br" 
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
        />
      </div>

      <div className="form-group">
        <label><Phone size={14} /> Telefone Principal</label>
        <input 
          type="text" 
          placeholder="(00) 0000-0000" 
          value={formData.phone}
          onChange={(e) => setFormData({...formData, phone: e.target.value})}
        />
      </div>

      <div className="form-group full-width">
        <label><MapPin size={14} /> Endereço Sede</label>
        <input 
          type="text" 
          placeholder="Rua, Número, Bairro, Cidade - UF" 
          value={formData.address}
          onChange={(e) => setFormData({...formData, address: e.target.value})}
        />
      </div>
    </FormModal>
  );
};
