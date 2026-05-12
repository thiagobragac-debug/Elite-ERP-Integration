import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, CreditCard, Mail, Phone, Lock } from 'lucide-react';

interface TenantFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

export const TenantForm: React.FC<TenantFormProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
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
      setFormData({
        name: initialData.name || '',
        cnpj: initialData.id || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        plan: initialData.plan || 'Starter',
        status: initialData.status || 'Ativo',
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
        <div className="elite-modal-overlay" onClick={onClose} style={{ zIndex: 99999 }}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="elite-modal-container"
            onClick={e => e.stopPropagation()}
          >
            <div className="elite-modal-header">
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

            <div className="elite-modal-content">
              
              <section className="elite-form-section">
                <div className="elite-section-header">
                  <div className="elite-section-badge">PASSO 01</div>
                  <h4 className="elite-section-title">Dados da Empresa</h4>
                </div>

                <div className="elite-input-grid">
                  <div className="elite-field-group">
                    <label className="elite-label">Razão Social / Nome da Fazenda</label>
                    <input 
                      className="elite-input"
                      type="text" 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})} 
                      placeholder="Agropecuária XYZ" 
                    />
                  </div>
                  <div className="elite-field-group">
                    <label className="elite-label">CNPJ / ID</label>
                    <input 
                      className="elite-input"
                      type="text" 
                      value={formData.cnpj} 
                      onChange={e => setFormData({...formData, cnpj: e.target.value})} 
                      placeholder="00.000.000/0001-00" 
                    />
                  </div>
                </div>

                <div className="elite-input-grid">
                  <div className="elite-field-group">
                    <label className="elite-label"><Mail size={14} /> Email Comercial</label>
                    <input 
                      className="elite-input"
                      type="email" 
                      value={formData.email} 
                      onChange={e => setFormData({...formData, email: e.target.value})} 
                      placeholder="contato@empresa.com" 
                    />
                  </div>
                  <div className="elite-field-group">
                    <label className="elite-label"><Phone size={14} /> Telefone</label>
                    <input 
                      className="elite-input"
                      type="text" 
                      value={formData.phone} 
                      onChange={e => setFormData({...formData, phone: e.target.value})} 
                      placeholder="(00) 00000-0000" 
                    />
                  </div>
                </div>
              </section>

              <section className="elite-form-section">
                <div className="elite-section-header">
                  <div className="elite-section-badge">PASSO 02</div>
                  <h4 className="elite-section-title">Assinatura & Status</h4>
                </div>

                <div className="elite-input-grid">
                  <div className="elite-field-group">
                    <label className="elite-label"><CreditCard size={14} /> Plano Vinculado</label>
                    <select 
                      className="elite-input elite-select"
                      value={formData.plan} 
                      onChange={e => setFormData({...formData, plan: e.target.value})}
                    >
                      <option value="Starter">Starter</option>
                      <option value="Pro">Pro</option>
                      <option value="Enterprise">Enterprise</option>
                    </select>
                  </div>
                  <div className="elite-field-group">
                    <label className="elite-label"><Lock size={14} /> Status da Conta</label>
                    <select 
                      className="elite-input elite-select"
                      value={formData.status} 
                      onChange={e => setFormData({...formData, status: e.target.value})}
                    >
                      <option value="Ativo">Ativo</option>
                      <option value="Bloqueado">Bloqueado (Inadimplência)</option>
                      <option value="Cancelado">Cancelado</option>
                    </select>
                  </div>
                </div>
              </section>

              {!initialData && (
                <section className="elite-form-section">
                  <div className="elite-section-header">
                    <div className="elite-section-badge">PASSO 03</div>
                    <h4 className="elite-section-title">Conta Master (Administrador)</h4>
                  </div>

                  <div className="elite-input-grid">
                    <div className="elite-field-group">
                      <label className="elite-label">Nome do Gestor</label>
                      <input 
                        className="elite-input"
                        type="text" 
                        value={formData.adminName} 
                        onChange={e => setFormData({...formData, adminName: e.target.value})} 
                        placeholder="Nome Completo" 
                      />
                    </div>
                    <div className="elite-field-group">
                      <label className="elite-label">Email de Acesso (Login)</label>
                      <input 
                        className="elite-input"
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

            <div className="elite-modal-footer">
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
