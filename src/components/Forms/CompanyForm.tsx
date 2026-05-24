import React from 'react';
import {
  Building2,
  FileText,
  MapPin,
  ShieldCheck,
  Mail,
  Phone,
  Map,
  Users,
  Search,
  UserCheck,
  BookOpen,
  CreditCard
} from 'lucide-react';
import { FormModal } from './FormModal';
import { fetchCNPJData } from '../../utils/cnpj';
import { fetchCEPData } from '../../utils/cep';
import { maskCPFCNPJ } from '../../utils/format';

interface CompanyFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

const maskCPF = (v: string) => {
  const n = v.replace(/\D/g, '').slice(0, 11);
  return n
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

export const CompanyForm: React.FC<CompanyFormProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = React.useState({
    name: '',
    document: '',
    tipo_documento: 'CNPJ',
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
    pais: 'Brasil',
    socio_cpf: '',
    socio_nome: '',
    socio_ind_sit_esp: 0,
    contador_cpf: '',
    contador_nome: '',
    contador_crc: '',
  });

  const [loading, setLoading] = React.useState(false);

  const docDigits = formData.document.replace(/\D/g, '');
  const isCNPJ = formData.tipo_documento === 'CNPJ';
  const isMatriz = formData.type === 'matriz';

  React.useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.razao_social || initialData.nome || initialData.name || '',
        document: initialData.cnpj || initialData.documento || initialData.document || '',
        tipo_documento: initialData.tipo_documento || ((initialData.cnpj || initialData.documento || '').replace(/\D/g, '').length === 14 ? 'CNPJ' : 'CPF'),
        type: initialData.tipo || initialData.type || 'matriz',
        email: initialData.email || '',
        phone: initialData.telefone || initialData.phone || '',
        cep: initialData.cep || '',
        tipo_logradouro: initialData.tipo_logradouro || '',
        logradouro: initialData.logradouro || '',
        numero: initialData.numero || '',
        complemento: initialData.complemento || '',
        bairro: initialData.bairro || '',
        cidade: initialData.cidade || '',
        estado: initialData.estado || '',
        pais: initialData.pais || 'Brasil',
        socio_cpf: initialData.socio_cpf || '',
        socio_nome: initialData.socio_nome || '',
        socio_ind_sit_esp: initialData.socio_ind_sit_esp ?? 0,
        contador_cpf: initialData.contador_cpf || '',
        contador_nome: initialData.contador_nome || '',
        contador_crc: initialData.contador_crc || '',
      });
    } else {
      setFormData({
        name: '', document: '', tipo_documento: 'CNPJ', type: 'matriz',
        email: '', phone: '', cep: '', tipo_logradouro: '', logradouro: '',
        numero: '', complemento: '', bairro: '', cidade: '', estado: '',
        pais: 'Brasil', socio_cpf: '', socio_nome: '', socio_ind_sit_esp: 0,
        contador_cpf: '', contador_nome: '', contador_crc: '',
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
    } catch {
      alert('Não foi possível localizar este CNPJ. Verifique os dados ou preencha manualmente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCEPSearch = async () => {
    const cleanCEP = formData.cep.replace(/\D/g, '');
    if (cleanCEP.length !== 8) return;
    
    setLoading(true);
    try {
      const data = await fetchCEPData(cleanCEP);
      setFormData(prev => ({
        ...prev,
        logradouro: data.street || prev.logradouro,
        bairro: data.neighborhood || prev.bairro,
        cidade: data.city || prev.cidade,
        estado: data.state || prev.estado,
        pais: 'Brasil'
      }));
    } catch (err) {
      alert('Não foi possível localizar este CEP. Verifique os dados ou preencha manualmente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
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
      title={initialData ? 'Editar Empresa' : 'Cadastrar Nova Empresa'}
      subtitle={initialData ? 'Atualize os dados cadastrais da unidade.' : 'Adicione uma matriz ou filial ao seu grupo agropecuário.'}
      icon={Building2}
      loading={loading}
      submitLabel={initialData ? 'Salvar Alterações' : 'Salvar Empresa'}
    >
      {/* Identificação */}
      <div className="form-group full-width">
        <label><Building2 size={14} /> Razão Social / Nome Fantasia</label>
        <input type="text" placeholder="Ex: Agropecuária Matriz Ltda..." value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})} required />
      </div>

      <div className="form-group">
        <label><FileText size={14} /> Tipo de Documento</label>
        <select value={formData.tipo_documento}
          onChange={(e) => setFormData({...formData, tipo_documento: e.target.value, document: ''})}>
          <option value="CNPJ">CNPJ (Pessoa Jurídica)</option>
          <option value="CPF">CPF (Pessoa Física / Produtor Rural)</option>
        </select>
      </div>

      <div className="form-group">
        <label><FileText size={14} /> {formData.tipo_documento}</label>
        <div className="tauze-input-with-action">
          <input type="text"
            placeholder={formData.tipo_documento === 'CNPJ' ? '00.000.000/0000-00' : '000.000.000-00'}
            value={formData.document}
            onChange={(e) => setFormData({...formData, document: maskCPFCNPJ(e.target.value)})}
            required />
          {formData.tipo_documento === 'CNPJ' && (
            <button type="button" className="action-trigger-btn" onClick={handleCNPJSearch}
              title="Buscar dados na Receita" disabled={docDigits.length !== 14 || loading}>
              {loading ? <div className="spinner-tiny" /> : <Search size={18} />}
            </button>
          )}
        </div>
      </div>

      <div className="form-group full-width">
        <label><ShieldCheck size={14} /> Tipo de Unidade</label>
        <div className="tauze-form-radio-group">
          {['matriz', 'filial', 'parceiro'].map(t => (
            <div key={t} className={`tauze-form-radio-item ${formData.type === t ? 'active' : ''}`}
              onClick={() => setFormData({...formData, type: t})}>
              {t === 'matriz' ? <Building2 size={16} /> : t === 'filial' ? <Map size={16} /> : <Users size={16} />}
              <span style={{textTransform: 'capitalize'}}>{t}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label><Mail size={14} /> E-mail de Contato</label>
        <input type="email" placeholder="contato@empresa.com.br" value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})} />
      </div>

      <div className="form-group">
        <label><Phone size={14} /> Telefone Principal</label>
        <input type="text" placeholder="(00) 0000-0000" value={formData.phone}
          onChange={(e) => setFormData({...formData, phone: e.target.value})} />
      </div>

      {/* Endereço */}
      <div className="form-section-title full-width">
        <MapPin size={16} /><span>Endereço Sede</span>
      </div>

      <div className="form-group">
        <label>CEP</label>
        <div className="tauze-input-with-action">
          <input type="text" placeholder="00000-000" value={formData.cep}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '');
              const masked = val.replace(/^(\d{5})(\d)/, '$1-$2').substring(0, 9);
              setFormData({...formData, cep: masked});
            }} />
          <button 
            type="button"
            className="action-trigger-btn"
            onClick={handleCEPSearch}
            title="Buscar CEP"
            disabled={formData.cep.replace(/\D/g, '').length !== 8 || loading}
          >
            {loading ? <div className="spinner-tiny" /> : <Search size={18} />}
          </button>
        </div>
      </div>
      <div className="form-group">
        <label>Tipo</label>
        <input type="text" placeholder="Rua, Av..." value={formData.tipo_logradouro}
          onChange={(e) => setFormData({...formData, tipo_logradouro: e.target.value})} />
      </div>
      <div className="form-group" style={{flex: '2 1 250px'}}>
        <label>Logradouro</label>
        <input type="text" placeholder="Nome da rua ou avenida" value={formData.logradouro}
          onChange={(e) => setFormData({...formData, logradouro: e.target.value})} />
      </div>
      <div className="form-group">
        <label>Número</label>
        <input type="text" placeholder="123" value={formData.numero}
          onChange={(e) => setFormData({...formData, numero: e.target.value})} />
      </div>
      <div className="form-group">
        <label>Complemento</label>
        <input type="text" placeholder="Sala, Andar, Bloco" value={formData.complemento}
          onChange={(e) => setFormData({...formData, complemento: e.target.value})} />
      </div>
      <div className="form-group">
        <label>Bairro</label>
        <input type="text" placeholder="Nome do bairro" value={formData.bairro}
          onChange={(e) => setFormData({...formData, bairro: e.target.value})} />
      </div>
      <div className="form-group">
        <label>Cidade</label>
        <input type="text" placeholder="Nome da cidade" value={formData.cidade}
          onChange={(e) => setFormData({...formData, cidade: e.target.value})} />
      </div>
      <div className="form-group">
        <label>Estado (UF)</label>
        <input type="text" placeholder="MT" maxLength={2} value={formData.estado}
          onChange={(e) => setFormData({...formData, estado: e.target.value.toUpperCase()})} />
      </div>
      <div className="form-group">
        <label>País</label>
        <input type="text" value={formData.pais}
          onChange={(e) => setFormData({...formData, pais: e.target.value})} />
      </div>

      {/* Sócio Responsável — somente quando CNPJ */}
      {isCNPJ && (
        <>
          <div className="form-section-title full-width" style={{borderColor: 'hsl(var(--brand) / 0.3)'}}>
            <UserCheck size={16} style={{color: 'hsl(var(--brand))'}} />
            <span>Sócio / Responsável pelo LCDPR</span>
            <span className="cf-section-badge">Pessoa Física</span>
          </div>
          <div className="form-group full-width">
            <div className="cf-hint">
              Quando a empresa possui <strong>CNPJ</strong>, o LCDPR é declarado em nome do <strong>sócio produtor rural</strong> (pessoa física). Informe o CPF e nome do responsável.
            </div>
          </div>

          <div className="form-group">
            <label><UserCheck size={14} /> CPF do Sócio Responsável</label>
            <input type="text" placeholder="000.000.000-00" maxLength={14}
              value={formData.socio_cpf}
              onChange={(e) => setFormData({...formData, socio_cpf: maskCPF(e.target.value)})} />
          </div>
          <div className="form-group">
            <label><UserCheck size={14} /> Nome Completo do Sócio</label>
            <input type="text" placeholder="Nome como consta no CPF" value={formData.socio_nome}
              onChange={(e) => setFormData({...formData, socio_nome: e.target.value})} />
          </div>
          <div className="form-group full-width">
            <label><ShieldCheck size={14} /> Situação Especial (LCDPR)</label>
            <select value={formData.socio_ind_sit_esp}
              onChange={(e) => setFormData({...formData, socio_ind_sit_esp: Number(e.target.value)})}>
              <option value={0}>0 — Normal</option>
              <option value={1}>1 — Falecimento</option>
              <option value={2}>2 — Espólio</option>
              <option value={3}>3 — Saída Definitiva do País</option>
            </select>
          </div>
        </>
      )}

      {/* Contador — somente na Matriz */}
      {isMatriz && (
        <>
          <div className="form-section-title full-width" style={{borderColor: '#f59e0b44'}}>
            <BookOpen size={16} style={{color: '#f59e0b'}} />
            <span>Contador Responsável</span>
            <span className="cf-section-badge" style={{background: '#f59e0b15', color: '#f59e0b', borderColor: '#f59e0b30'}}>
              Matriz · Compartilhado com Filiais
            </span>
          </div>
          <div className="form-group full-width">
            <div className="cf-hint">
              Os dados do contador são vinculados à <strong>Matriz</strong> e aplicados automaticamente a todas as filiais na geração do arquivo LCDPR (Registro 9999).
            </div>
          </div>

          <div className="form-group">
            <label><BookOpen size={14} /> CPF do Contador</label>
            <input type="text" placeholder="000.000.000-00" maxLength={14}
              value={formData.contador_cpf}
              onChange={(e) => setFormData({...formData, contador_cpf: maskCPF(e.target.value)})} />
          </div>
          <div className="form-group">
            <label><BookOpen size={14} /> Nome do Contador</label>
            <input type="text" placeholder="Nome completo do contador" value={formData.contador_nome}
              onChange={(e) => setFormData({...formData, contador_nome: e.target.value})} />
          </div>
          <div className="form-group">
            <label><CreditCard size={14} /> Número do CRC</label>
            <input type="text" placeholder="Ex: CRC-MT/123456-O" value={formData.contador_crc}
              onChange={(e) => setFormData({...formData, contador_crc: e.target.value})} />
          </div>
        </>
      )}

      <style>{`
        .tauze-input-with-action { position: relative; display: flex; align-items: center; }
        .tauze-input-with-action input { width: 100%; padding-right: 46px !important; }
        .action-trigger-btn {
          position: absolute; right: 8px; width: 32px; height: 32px;
          border-radius: 8px; border: none; background: hsl(var(--bg-main));
          color: hsl(var(--brand)); display: flex; align-items: center;
          justify-content: center; cursor: pointer; transition: 0.2s;
        }
        .action-trigger-btn:hover:not(:disabled) { background: hsl(var(--brand)); color: white; }
        .action-trigger-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .spinner-tiny {
          width: 16px; height: 16px;
          border: 2px solid hsl(var(--brand) / 0.3);
          border-top-color: hsl(var(--brand));
          border-radius: 50%; animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .cf-section-badge {
          margin-left: auto; font-size: 10px; font-weight: 700;
          padding: 2px 8px; border-radius: 6px;
          background: hsl(var(--brand) / 0.1); color: hsl(var(--brand));
          border: 1px solid hsl(var(--brand) / 0.2);
          letter-spacing: 0.05em; text-transform: uppercase;
        }
        .cf-hint {
          font-size: 12px; color: hsl(var(--text-muted));
          background: hsl(var(--bg-main)); border: 1px solid hsl(var(--border));
          border-radius: 10px; padding: 10px 14px; line-height: 1.6;
          box-sizing: border-box; width: 100%;
        }
        .cf-hint strong { color: hsl(var(--text-main)); font-weight: 700; }
      `}</style>
    </FormModal>
  );
};
