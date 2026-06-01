import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, CreditCard, Mail, Phone, Lock } from 'lucide-react';
import { SearchableSelect } from './SearchableSelect';

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

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="tauze-modal-overlay" onClick={onClose} style={{ zIndex: 99999 }}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="tauze-modal-container"
            onClick={e => e.stopPropagation()}
          >
            <div className="tauze-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Building2 size={20} color="#38bdf8" />
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>
                  {initialData ? 'Editar Tenant (Inquilino)' : 'Provisionar Novo Tenant'}
                </h3>
              </div>
              <button className="icon-btn-secondary" onClick={onClose}>
                <X size={20} />
              </button>
            </div>

            <div className="tauze-modal-content">
              
              <section className="tauze-form-section">
                <div className="tauze-section-header">
                  <div className="tauze-section-badge">PASSO 01</div>
                  <h4 className="tauze-section-title">Dados da Empresa</h4>
                </div>

                <div className="tauze-input-grid">
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

                <div className="tauze-input-grid">
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

                <div className="tauze-input-grid">
                  <div className="tauze-field-group">
                    <label className="tauze-label"><CreditCard size={14} /> Plano Vinculado</label>
                              <SearchableSelect 
          value={formData.plan}
          onChange={(val: any) => { /* TODO: adjust */ }}
          options={[
            { value: ``, label: `Selecione um plano...` },
            { value: `{p.name}`, label: `{p.name}` },
            ...(availablePlans || []).map(p => ({ value: String(p.name), label: String(p.name) })),
          ]}
        />
                  </div>
                  <div className="tauze-field-group">
                    <label className="tauze-label"><Lock size={14} /> Status da Conta</label>
                            <SearchableSelect 
          value={formData.status}
          onChange={(val: any) => { /* TODO: adjust */ }}
          options={[
            { value: `Ativo`, label: `Ativo` },
            { value: `Suspenso`, label: `Suspenso` },
            { value: `Cancelado`, label: `Cancelado` },
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

                  <div className="tauze-input-grid">
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
                  <p style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', fontWeight: 600 }}>* Um email de boas-vindas com as instruções será enviado automaticamente.</p>
                </section>
              )}

            </div>

            <div className="tauze-modal-footer">
              <button className="glass-btn secondary" onClick={onClose}>Cancelar</button>
              <button className="primary-btn" onClick={() => onSubmit(formData)} style={{ boxShadow: '0 8px 20px hsl(var(--brand) / 0.2)' }}>
                {initialData ? 'Salvar Alterações' : 'Provisionar Inquilino'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
