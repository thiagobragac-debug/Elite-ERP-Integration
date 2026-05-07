import React, { useState } from 'react';
import { 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Truck,
  FileText,
  Tag,
  User
} from 'lucide-react';
import { FormModal } from './FormModal';

interface SupplierFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

export const SupplierForm: React.FC<SupplierFormProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    contato: '',
    telefone: '',
    email: '',
    categoria: 'Geral',
    status: 'ATIVO'
  });

  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (initialData) {
      setFormData({
        nome: initialData.nome || '',
        cnpj: initialData.cnpj || initialData.cnpj_cpf || '',
        contato: initialData.contato || '',
        telefone: initialData.telefone || '',
        email: initialData.email || '',
        categoria: initialData.categoria || 'Geral',
        status: initialData.status || 'ATIVO'
      });
    } else {
      setFormData({
        nome: '',
        cnpj: '',
        contato: '',
        telefone: '',
        email: '',
        categoria: 'Geral',
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
      title={initialData ? "Editar Fornecedor" : "Novo Fornecedor"}
      subtitle="Cadastre parceiros para compras de insumos e serviços."
      icon={Truck}
      loading={loading}
      submitLabel={initialData ? "Salvar Alterações" : "Salvar Fornecedor"}
    >
      <div className="form-group full-width">
        <label><Building2 size={14} /> Nome / Razão Social</label>
        <input 
          type="text" 
          placeholder="Ex: Agropecuária Fertilizantes Ltda" 
          value={formData.nome}
          onChange={(e) => setFormData({...formData, nome: e.target.value})}
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
        <label><Tag size={14} /> Categoria</label>
        <select 
          value={formData.categoria}
          onChange={(e) => setFormData({...formData, categoria: e.target.value})}
        >
          <option>Geral</option>
          <option>Insumos</option>
          <option>Máquinas</option>
          <option>Serviços</option>
          <option>Nutrição</option>
        </select>
      </div>

      <div className="form-group">
        <label><User size={14} /> Pessoa de Contato</label>
        <input 
          type="text" 
          placeholder="Nome do contato" 
          value={formData.contato}
          onChange={(e) => setFormData({...formData, contato: e.target.value})}
        />
      </div>

      <div className="form-group">
        <label><Phone size={14} /> Telefone</label>
        <input 
          type="text" 
          placeholder="(00) 00000-0000" 
          value={formData.telefone}
          onChange={(e) => setFormData({...formData, telefone: e.target.value})}
        />
      </div>

      <div className="form-group full-width">
        <label><Mail size={14} /> E-mail</label>
        <input 
          type="email" 
          placeholder="vendas@fornecedor.com" 
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
        />
      </div>
    </FormModal>
  );
};
