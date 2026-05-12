import React, { useState } from 'react';
import { 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Truck,
  FileText,
  Tag,
  User,
  Search,
  Check,
  ChevronDown
} from 'lucide-react';
import { FormModal } from './FormModal';
import { fetchCNPJData } from '../../utils/cnpj';
import { maskCPFCNPJ } from '../../utils/format';
import { useTenant } from '../../contexts/TenantContext';

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
    cep: '',
    tipo_logradouro: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    pais: 'Brasil',
    status: 'ATIVO',
    is_global: true,
    fazendas_vinculadas: [] as string[]
  });

  const { farms } = useTenant();
  const [isFarmDropdownOpen, setIsFarmDropdownOpen] = useState(false);

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
        cep: initialData.cep || '',
        tipo_logradouro: initialData.tipo_logradouro || '',
        logradouro: initialData.logradouro || '',
        numero: initialData.numero || '',
        complemento: initialData.complemento || '',
        bairro: initialData.bairro || '',
        cidade: initialData.cidade || '',
        estado: initialData.estado || '',
        pais: initialData.pais || 'Brasil',
        status: initialData.status || 'ATIVO',
        is_global: initialData.is_global !== undefined ? initialData.is_global : true,
        fazendas_vinculadas: initialData.fazendas_vinculadas || []
      });
    } else {
      setFormData({
        nome: '',
        cnpj: '',
        contato: '',
        telefone: '',
        email: '',
        categoria: 'Geral',
        cep: '',
        tipo_logradouro: '',
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        estado: '',
        pais: 'Brasil',
        status: 'ATIVO',
        is_global: true,
        fazendas_vinculadas: []
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
        nome: data.razao_social,
        email: data.email || prev.email,
        telefone: data.telefone || prev.telefone,
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

      <div className="form-section-title full-width" style={{ marginTop: '24px' }}>
        <Building2 size={16} />
        <span>Abrangência e Visibilidade</span>
      </div>

      <div className="form-group full-width">
        <div 
          className="elite-toggle-row"
          onClick={() => setFormData({ ...formData, is_global: !formData.is_global })}
        >
          <div className={`elite-toggle-switch ${formData.is_global ? 'active' : ''}`} />
          <div className="toggle-label-group">
            <span className="toggle-title">Habilitar em todas as fazendas (Global)</span>
            <span className="toggle-desc">Este fornecedor estará visível em todas as unidades do grupo.</span>
          </div>
        </div>
      </div>

      {!formData.is_global && (
        <div className="form-group full-width">
          <label>Vincular a Fazendas Específicas</label>
          <div className="elite-multi-select-container">
            <div 
              className="elite-multi-select-trigger"
              onClick={() => setIsFarmDropdownOpen(!isFarmDropdownOpen)}
            >
              <div className="selected-chips">
                {formData.fazendas_vinculadas.length === 0 ? (
                  <span className="placeholder">Nenhuma fazenda selecionada</span>
                ) : (
                  formData.fazendas_vinculadas.map(fid => {
                    const farm = farms.find(f => f.id === fid);
                    return (
                      <span key={fid} className="elite-chip">
                        {farm?.name || 'Fazenda'}
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFormData({
                              ...formData,
                              fazendas_vinculadas: formData.fazendas_vinculadas.filter(id => id !== fid)
                            });
                          }}
                        >
                          ×
                        </button>
                      </span>
                    );
                  })
                )}
              </div>
              <ChevronDown size={18} className={`chevron ${isFarmDropdownOpen ? 'open' : ''}`} />
            </div>

            {isFarmDropdownOpen && (
              <div className="elite-multi-select-dropdown">
                {farms.map(farm => (
                  <div 
                    key={farm.id}
                    className={`dropdown-item ${formData.fazendas_vinculadas.includes(farm.id) ? 'selected' : ''}`}
                    onClick={() => {
                      const isSelected = formData.fazendas_vinculadas.includes(farm.id);
                      setFormData({
                        ...formData,
                        fazendas_vinculadas: isSelected 
                          ? formData.fazendas_vinculadas.filter(id => id !== farm.id)
                          : [...formData.fazendas_vinculadas, farm.id]
                      });
                    }}
                  >
                    <div className="checkbox-mini">
                      {formData.fazendas_vinculadas.includes(farm.id) && <Check size={12} />}
                    </div>
                    <span>{farm.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .elite-toggle-row {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: hsl(var(--bg-main) / 0.3);
          border: 1px solid hsl(var(--border));
          border-radius: 16px;
          cursor: pointer;
          transition: 0.2s;
        }

        .elite-toggle-row:hover {
          border-color: hsl(var(--brand) / 0.5);
          background: hsl(var(--bg-main) / 0.5);
        }

        .elite-toggle-switch {
          width: 44px;
          height: 24px;
          background: #cbd5e1;
          border-radius: 100px;
          position: relative;
          transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .elite-toggle-switch::after {
          content: '';
          position: absolute;
          left: 3px;
          top: 3px;
          width: 18px;
          height: 18px;
          background: white;
          border-radius: 50%;
          transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .elite-toggle-switch.active {
          background: #10b981;
        }

        .elite-toggle-switch.active::after {
          left: calc(100% - 21px);
        }

        .toggle-label-group {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .toggle-title {
          font-size: 13px;
          font-weight: 800;
          color: hsl(var(--text-main));
        }

        .toggle-desc {
          font-size: 11px;
          color: hsl(var(--text-muted));
          font-weight: 500;
        }

        .elite-multi-select-container {
          position: relative;
          width: 100%;
        }

        .elite-multi-select-trigger {
          min-height: 48px;
          padding: 8px 16px;
          background: hsl(var(--bg-card));
          border: 1px solid hsl(var(--border));
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: 0.2s;
        }

        .elite-multi-select-trigger:hover {
          border-color: hsl(var(--brand) / 0.5);
        }

        .selected-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .elite-chip {
          display: flex;
          align-items: center;
          gap: 6px;
          background: hsl(var(--brand) / 0.1);
          color: hsl(var(--brand));
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .elite-chip button {
          border: none;
          background: transparent;
          color: inherit;
          font-size: 14px;
          padding: 0;
          cursor: pointer;
          line-height: 1;
        }

        .placeholder {
          color: hsl(var(--text-muted));
          font-size: 13px;
        }

        .chevron {
          color: hsl(var(--text-muted));
          transition: 0.3s;
        }

        .chevron.open {
          transform: rotate(180deg);
        }

        .elite-multi-select-dropdown {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          right: 0;
          background: hsl(var(--bg-card));
          border: 1px solid hsl(var(--border));
          border-radius: 12px;
          box-shadow: var(--shadow-lg);
          z-index: 50;
          max-height: 200px;
          overflow-y: auto;
          padding: 6px;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: 0.2s;
          font-size: 13px;
          font-weight: 600;
        }

        .dropdown-item:hover {
          background: hsl(var(--bg-main));
        }

        .dropdown-item.selected {
          color: hsl(var(--brand));
          background: hsl(var(--brand) / 0.05);
        }

        .checkbox-mini {
          width: 18px;
          height: 18px;
          border: 2px solid hsl(var(--border-strong));
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: 0.2s;
        }

        .selected .checkbox-mini {
          background: hsl(var(--brand));
          border-color: hsl(var(--brand));
          color: white;
        }
      `}</style>
    </FormModal>
  );
};
