import React, { useState, useEffect } from 'react';
import { Building2, CreditCard, Mail, Phone, Lock } from 'lucide-react';
import { SearchableSelect } from './SearchableSelect';
import { SidePanel } from '../Layout/SidePanel';

interface TenantFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  availablePlans?: any[];
}

export const TenantForm: React.FC<TenantFormProps> = ({ isOpen, onClose, onSubmit, initialData, availablePlans = [] }) => {
  const [formData, setFormData] = useState({
    name: '',
    cnpj: '',
    email: '',
    phone: '',
    plan: 'Starter',
    status: 'Ativo',
    adminName: '',
    adminEmail: ''
  });

  useEffect(() => {
    if (initialData) {
      const normalizedStatus = initialData.status 
        ? initialData.status.charAt(0).toUpperCase() + initialData.status.slice(1).toLowerCase() 
        : 'Ativo';

      setFormData({
        name: initialData.name || '',
        cnpj: initialData.document || initialData.id || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        plan: initialData.plan || 'Starter',
        status: ['Ativo', 'Suspenso', 'Cancelado'].includes(normalizedStatus) ? normalizedStatus : 'Ativo',
        adminName: '', // Em edição, talvez não se edite o admin root aqui
        adminEmail: ''
      });
    } else {
      setFormData({ name: '', cnpj: '', email: '', phone: '', plan: 'Starter', status: 'Ativo', adminName: '', adminEmail: '' });
    }
  }, [initialData, isOpen]);

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(formData);
      }}
      title={initialData ? 'Editar Tenant (Inquilino)' : 'Provisionar Novo Tenant'}
      icon={Building2}
      submitLabel={initialData ? 'Salvar Alterações' : 'Provisionar Inquilino'}
      size="large"
    >
      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 01</div>
          <h4 className="tauze-section-title">Dados da Empresa</h4>
        </div>

        <div className="tauze-input-grid grid-col-2">
          <div className="tauze-field-group">
            <label className="tauze-label">Razão Social / Nome da Fazenda</label>
            <input 
              className="tauze-input"
              type="text" 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              placeholder="Agropecuária XYZ" 
            />
          </div>
          <div className="tauze-field-group">
            <label className="tauze-label">CNPJ / ID</label>
            <input 
              className="tauze-input"
              type="text" 
              value={formData.cnpj} 
              onChange={e => setFormData({...formData, cnpj: e.target.value})} 
              placeholder="00.000.000/0001-00" 
            />
          </div>
        </div>

        <div className="tauze-input-grid grid-col-2" style={{ marginTop: '16px' }}>
          <div className="tauze-field-group">
            <label className="tauze-label"><Mail size={14} /> Email Comercial</label>
            <input 
              className="tauze-input"
              type="email" 
              value={formData.email} 
              onChange={e => setFormData({...formData, email: e.target.value})} 
              placeholder="contato@empresa.com" 
            />
          </div>
          <div className="tauze-field-group">
            <label className="tauze-label"><Phone size={14} /> Telefone</label>
            <input 
              className="tauze-input"
              type="text" 
              value={formData.phone} 
              onChange={e => setFormData({...formData, phone: e.target.value})} 
              placeholder="(00) 00000-0000" 
            />
          </div>
        </div>
      </section>

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 02</div>
          <h4 className="tauze-section-title">Assinatura & Status</h4>
        </div>

        <div className="tauze-input-grid grid-col-2">
          <div className="tauze-field-group">
            <label className="tauze-label"><CreditCard size={14} /> Plano Vinculado</label>
            <SearchableSelect 
              value={formData.plan}
              onChange={(val: any) => setFormData({...formData, plan: val})}
              options={[
                { value: '', label: 'Selecione um plano...' },
                ...(availablePlans || []).map(p => ({ value: String(p.name), label: String(p.name) })),
              ]}
            />
          </div>
          <div className="tauze-field-group">
            <label className="tauze-label"><Lock size={14} /> Status da Conta</label>
            <SearchableSelect 
              value={formData.status}
              onChange={(val: any) => setFormData({...formData, status: val})}
              options={[
                { value: 'Ativo', label: 'Ativo' },
                { value: 'Suspenso', label: 'Suspenso' },
                { value: 'Cancelado', label: 'Cancelado' },
              ]}
            />
          </div>
        </div>
      </section>

      {!initialData && (
        <section className="tauze-form-section">
          <div className="tauze-section-header">
            <div className="tauze-section-badge">PASSO 03</div>
            <h4 className="tauze-section-title">Conta Master (Administrador)</h4>
          </div>

          <div className="tauze-input-grid grid-col-2">
            <div className="tauze-field-group">
              <label className="tauze-label">Nome do Gestor</label>
              <input 
                className="tauze-input"
                type="text" 
                value={formData.adminName} 
                onChange={e => setFormData({...formData, adminName: e.target.value})} 
                placeholder="Nome Completo" 
              />
            </div>
            <div className="tauze-field-group">
              <label className="tauze-label">Email de Acesso (Login)</label>
              <input 
                className="tauze-input"
                type="email" 
                value={formData.adminEmail} 
                onChange={e => setFormData({...formData, adminEmail: e.target.value})} 
                placeholder="gestor@empresa.com" 
              />
            </div>
          </div>
          <p style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginTop: '12px', fontWeight: 600 }}>* Um email de boas-vindas com as instruções será enviado automaticamente.</p>
        </section>
      )}
    </SidePanel>
  );
};
