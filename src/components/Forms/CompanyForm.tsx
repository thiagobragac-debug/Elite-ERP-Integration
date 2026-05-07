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
  Users,
  Search,
  CreditCard
} from 'lucide-react';
import { FormModal } from './FormModal';
import { fetchCNPJData } from '../../utils/cnpj';
import { maskCPFCNPJ } from '../../utils/format';

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
    cep: '',
    tipo_logradouro: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    pais: 'Brasil'
  });

  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        document: initialData.document || '',
        type: initialData.type || 'matriz',
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
        pais: initialData.pais || 'Brasil'
      });
    } else {
      setFormData({
        name: '',
        document: '',
        type: 'matriz',
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
        pais: 'Brasil'
      });
    }
  }, [initialData, isOpen]);

  const handleCNPJSearch = async () => {
    const cleanCNPJ = formData.document.replace(/\D/g, '');
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
        <div className="elite-input-with-action">
          <input 
            type="text" 
            placeholder="00.000.000/0000-00" 
            value={formData.document}
            onChange={(e) => setFormData({...formData, document: maskCPFCNPJ(e.target.value)})}
            required
          />
          <button 
            type="button"
            className="action-trigger-btn"
            onClick={handleCNPJSearch}
            title="Buscar dados na Receita"
            disabled={formData.document.replace(/\D/g, '').length !== 14 || loading}
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

      <div className="form-section-title full-width">
        <MapPin size={16} />
        <span>Endereço Sede (Granular)</span>
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
    </FormModal>
  );
};
