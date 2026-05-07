import React, { useState } from 'react';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  ShieldCheck,
  CreditCard,
  FileText,
  Activity,
  Search
} from 'lucide-react';
import { FormModal } from './FormModal';
import { fetchCNPJData } from '../../utils/cnpj';
import { maskCPFCNPJ } from '../../utils/format';

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
    cep: '',
    tipo_logradouro: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    pais: 'Brasil',
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
        cep: initialData.cep || '',
        tipo_logradouro: initialData.tipo_logradouro || '',
        logradouro: initialData.logradouro || '',
        numero: initialData.numero || '',
        complemento: initialData.complemento || '',
        bairro: initialData.bairro || '',
        cidade: initialData.cidade || '',
        estado: initialData.estado || '',
        pais: initialData.pais || 'Brasil',
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
        cep: '',
        tipo_logradouro: '',
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        estado: '',
        pais: 'Brasil',
        creditLimit: '',
        status: 'ATIVO'
      });
    }
  }, [initialData, isOpen]);

  const handleCNPJSearch = async () => {
    const cleanCNPJ = formData.cnpj.replace(/\D/g, '');
    if (cleanCNPJ.length !== 14) return;
    
    setLoading(true);
    try {
      const data = await fetchCNPJData(cleanCNPJ);
      setFormData(prev => ({
        ...prev,
        name: data.razao_social,
        email: data.email || prev.email,
        phone: data.telefone || prev.phone,
        cep: data.cep,
        tipo_logradouro: data.tipo_logradouro,
        logradouro: data.logradouro,
        numero: data.numero,
        complemento: data.complemento,
        bairro: data.bairro,
        cidade: data.municipio,
        estado: data.uf,
        pais: 'Brasil'
      }));
    } catch (err) {
      alert('Não foi possível localizar este CNPJ. Verifique os dados ou digite manualmente.');
    } finally {
      setLoading(false);
    }
  };

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
        <div className="elite-input-with-action">
          <input 
            type="text" 
            placeholder="00.000.000/0000-00" 
            value={formData.cnpj}
            onChange={(e) => setFormData({...formData, cnpj: maskCPFCNPJ(e.target.value)})}
            className="flex-1"
          />
          <button 
            type="button"
            className="action-trigger-btn"
            onClick={handleCNPJSearch}
            title="Buscar dados na Receita"
            disabled={formData.cnpj.replace(/\D/g, '').length !== 14 || loading}
          >
            {loading ? <div className="spinner-tiny" /> : <Search size={18} />}
          </button>
        </div>
      </div>

      <style>{`
        .elite-input-with-action {
          position: relative;
          display: flex;
          align-items: center;
        }

        .elite-input-with-action input {
          width: 100%;
          padding-right: 46px !important;
        }

        .action-trigger-btn {
          position: absolute;
          right: 8px;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: none;
          background: hsl(var(--bg-main));
          color: hsl(var(--brand));
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: 0.2s;
        }

        .action-trigger-btn:hover:not(:disabled) {
          background: hsl(var(--brand));
          color: white;
        }

        .action-trigger-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          color: hsl(var(--text-muted));
        }

        .spinner-tiny {
          width: 16px;
          height: 16px;
          border: 2px solid hsl(var(--brand) / 0.3);
          border-top-color: hsl(var(--brand));
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

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
          placeholder="contato@empresa.com" 
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
        />
      </div>

      <div className="form-section-title full-width">
        <MapPin size={16} />
        <span>Endereço Completo</span>
      </div>

      <div className="form-group">
        <label>CEP</label>
        <input 
          type="text" 
          placeholder="00000-000" 
          value={formData.cep}
          onChange={(e) => setFormData({...formData, cep: e.target.value})}
        />
      </div>

      <div className="form-group">
        <label>Tipo</label>
        <input 
          type="text" 
          placeholder="Rua, Av..." 
          value={formData.tipo_logradouro}
          onChange={(e) => setFormData({...formData, tipo_logradouro: e.target.value})}
        />
      </div>

      <div className="form-group" style={{ flex: '2 1 250px' }}>
        <label>Logradouro</label>
        <input 
          type="text" 
          placeholder="Nome da rua ou avenida" 
          value={formData.logradouro}
          onChange={(e) => setFormData({...formData, logradouro: e.target.value})}
        />
      </div>

      <div className="form-group">
        <label>Número</label>
        <input 
          type="text" 
          placeholder="123" 
          value={formData.numero}
          onChange={(e) => setFormData({...formData, numero: e.target.value})}
        />
      </div>

      <div className="form-group">
        <label>Complemento</label>
        <input 
          type="text" 
          placeholder="Sala, Andar, Bloco" 
          value={formData.complemento}
          onChange={(e) => setFormData({...formData, complemento: e.target.value})}
        />
      </div>

      <div className="form-group">
        <label>Bairro</label>
        <input 
          type="text" 
          placeholder="Nome do bairro" 
          value={formData.bairro}
          onChange={(e) => setFormData({...formData, bairro: e.target.value})}
        />
      </div>

      <div className="form-group">
        <label>Cidade</label>
        <input 
          type="text" 
          placeholder="Nome da cidade" 
          value={formData.cidade}
          onChange={(e) => setFormData({...formData, cidade: e.target.value})}
        />
      </div>

      <div className="form-group">
        <label>Estado (UF)</label>
        <input 
          type="text" 
          placeholder="EX: MT" 
          value={formData.estado}
          onChange={(e) => setFormData({...formData, estado: e.target.value})}
        />
      </div>

      <div className="form-group">
        <label>País</label>
        <input 
          type="text" 
          value={formData.pais}
          onChange={(e) => setFormData({...formData, pais: e.target.value})}
        />
      </div>

      <div className="form-section-title full-width" style={{ marginTop: '12px' }}>
        <CreditCard size={16} />
        <span>Parâmetros Financeiros</span>
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
