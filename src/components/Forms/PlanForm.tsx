import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Server, Users, HardDrive, Building2, Activity, ShieldCheck, CheckSquare, Square } from 'lucide-react';

interface PlanFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  isSubmitting?: boolean;
}

export const PlanForm: React.FC<PlanFormProps> = ({ isOpen, onClose, onSubmit, initialData, isSubmitting = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    pricePerUserExtra: '',
    pricePerAnimalExtra: '',
    billingCycle: 'monthly',
    stripePlanId: '',
    pagarMePlanId: '',
    usersLimit: '',
    storageLimit: '',
    animalsLimit: '',
    companiesLimit: '',
    modules: ['Dashboard', 'Administração'] as string[],
    features: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        price: initialData.price || '',
        pricePerUserExtra: initialData.pricePerUserExtra || '',
        pricePerAnimalExtra: initialData.pricePerAnimalExtra || '',
        billingCycle: initialData.billingCycle || 'monthly',
        stripePlanId: initialData.stripePlanId || '',
        pagarMePlanId: initialData.pagarMePlanId || '',
        usersLimit: initialData.usersLimit || '',
        storageLimit: initialData.storageLimit || '',
        animalsLimit: initialData.animalsLimit || '',
        companiesLimit: initialData.companiesLimit || '',
        modules: initialData.modules || ['Dashboard', 'Administração'],
        features: Array.isArray(initialData.features) ? initialData.features.join('\n') : (initialData.features || '')
      });
    } else {
      setFormData({
        name: '',
        price: '',
        pricePerUserExtra: '',
        pricePerAnimalExtra: '',
        billingCycle: 'monthly',
        stripePlanId: '',
        pagarMePlanId: '',
        usersLimit: '',
        storageLimit: '',
        animalsLimit: '',
        companiesLimit: '',
        modules: ['Dashboard', 'Administração'],
        features: ''
      });
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
            style={{ maxWidth: '540px' }}
          >
            <div className="tauze-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Server size={20} color="#38bdf8" />
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>
                  {initialData ? 'Editar Plano SaaS' : 'Configurar Novo Plano'}
                </h3>
              </div>
              <button className="icon-btn-secondary" onClick={onClose}>
                <X size={20} />
              </button>
            </div>

            <div className="tauze-modal-content" style={{ gap: '24px' }}>
              <section className="tauze-form-section">
                <div className="tauze-section-header">
                  <div className="tauze-section-badge">COMERCIAL</div>
                  <h4 className="tauze-section-title">Definições do Produto</h4>
                </div>

                <div className="tauze-input-grid">
                  <div className="tauze-field-group">
                    <label className="tauze-label">Nome do Plano</label>
                    <input 
                      className="tauze-input"
                      type="text" 
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      placeholder="Ex: Pro, Enterprise..."
                    />
                  </div>
                  <div className="tauze-field-group">
                    <label className="tauze-label">Preço Mensal</label>
                    <input 
                      className="tauze-input"
                      type="text" 
                      value={formData.price}
                      onChange={e => setFormData({...formData, price: e.target.value})}
                      placeholder="R$ 999"
                    />
                  </div>
                </div>
              </section>

              <section className="tauze-form-section">
                <div className="tauze-section-header">
                  <div className="tauze-section-badge">LIMITES</div>
                  <h4 className="tauze-section-title">Regras de Operação</h4>
                </div>
                
                <div className="tauze-input-grid">
                  <div className="tauze-field-group">
                    <label className="tauze-label"><Users size={14} /> Qtd. de Usuários</label>
                    <input 
                      className="tauze-input"
                      type="number" 
                      value={formData.usersLimit}
                      onChange={e => setFormData({...formData, usersLimit: e.target.value})}
                      placeholder="Ex: 20"
                    />
                  </div>
                  <div className="tauze-field-group">
                    <label className="tauze-label"><Activity size={14} /> Qtd. de Animais</label>
                    <input 
                      className="tauze-input"
                      type="number" 
                      value={formData.animalsLimit}
                      onChange={e => setFormData({...formData, animalsLimit: e.target.value})}
                      placeholder="Ex: 5000"
                    />
                  </div>
                </div>

                <div className="tauze-input-grid">
                  <div className="tauze-field-group">
                    <label className="tauze-label"><Building2 size={14} /> Matrizes (CNPJ/CPF)</label>
                    <input 
                      className="tauze-input"
                      type="number" 
                      value={formData.companiesLimit}
                      onChange={e => setFormData({...formData, companiesLimit: e.target.value})}
                      placeholder="Ex: 2"
                    />
                  </div>
                  <div className="tauze-field-group">
                    <label className="tauze-label"><HardDrive size={14} /> Storage Base (GB)</label>
                    <input 
                      className="tauze-input"
                      type="number" 
                      value={formData.storageLimit}
                      onChange={e => setFormData({...formData, storageLimit: e.target.value})}
                      placeholder="Ex: 100"
                    />
                  </div>
                </div>
              </section>

              <section className="tauze-form-section">
                <div className="tauze-section-header">
                  <div className="tauze-section-badge">FINANCEIRO & GATEWAY</div>
                  <h4 className="tauze-section-title">Regras de Cobrança & Stripe</h4>
                </div>

                <div className="tauze-input-grid">
                  <div className="tauze-field-group">
                    <label className="tauze-label">Preço por Usuário Extra</label>
                    <input 
                      type="text"
                      className="tauze-input"
                      placeholder="Ex: R$ 49,90"
                      value={formData.pricePerUserExtra}
                      onChange={(e) => setFormData({ ...formData, pricePerUserExtra: e.target.value })}
                    />
                  </div>
                  <div className="tauze-field-group">
                    <label className="tauze-label">Preço por Animal Extra</label>
                    <input 
                      type="text"
                      className="tauze-input"
                      placeholder="Ex: R$ 0,50"
                      value={formData.pricePerAnimalExtra}
                      onChange={(e) => setFormData({ ...formData, pricePerAnimalExtra: e.target.value })}
                    />
                  </div>
                  <div className="tauze-field-group">
                    <label className="tauze-label">ID do Plano (Stripe)</label>
                    <input 
                      type="text"
                      className="tauze-input"
                      placeholder="price_1HhG..."
                      value={formData.stripePlanId}
                      onChange={(e) => setFormData({ ...formData, stripePlanId: e.target.value })}
                    />
                  </div>
                  <div className="tauze-field-group">
                    <label className="tauze-label">ID do Plano (Pagar.me)</label>
                    <input 
                      type="text"
                      className="tauze-input"
                      placeholder="plan_..."
                      value={formData.pagarMePlanId}
                      onChange={(e) => setFormData({ ...formData, pagarMePlanId: e.target.value })}
                    />
                  </div>
                  <div className="tauze-field-group">
                    <label className="tauze-label">Ciclo de Cobrança</label>
                    <select 
                      className="tauze-input tauze-select"
                      value={formData.billingCycle}
                      onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value })}
                    >
                      <option value="monthly">Mensal</option>
                      <option value="quarterly">Trimestral</option>
                      <option value="yearly">Anual</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* Seção 3: Ecossistema */}
              <section className="tauze-form-section">
                <div className="tauze-section-header">
                  <div className="tauze-section-badge">ECOSSISTEMA</div>
                  <h4 className="tauze-section-title">Módulos de Acesso</h4>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {[
                    'Dashboard', 'Administração', 'Pecuária', 'Máquina & Frota', 
                    'Compra & Cotação', 'Venda & CRM', 'Estoque', 'Financeiro & Banco', 'Relatórios'
                  ].map(module => {
                    const isActive = formData.modules.includes(module);
                    return (
                      <button
                        key={module}
                        type="button"
                        onClick={() => {
                          const next = isActive 
                            ? formData.modules.filter(m => m !== module)
                            : [...formData.modules, module];
                          setFormData({ ...formData, modules: next });
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px 16px',
                          borderRadius: '14px',
                          border: '1px solid',
                          borderColor: isActive ? 'hsl(var(--brand))' : 'hsl(var(--border))',
                          background: isActive ? 'hsl(var(--brand) / 0.05)' : 'hsl(var(--bg-main))',
                          color: isActive ? 'hsl(var(--brand))' : 'hsl(var(--text-muted))',
                          fontSize: '12px',
                          fontWeight: 700,
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          textAlign: 'left'
                        }}
                      >
                        {isActive ? <CheckSquare size={16} /> : <Square size={16} />}
                        {module}
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="tauze-form-section">
                <div className="tauze-section-header">
                  <div className="tauze-section-badge">EXTRAS</div>
                  <h4 className="tauze-section-title">Notas Comerciais</h4>
                </div>
                <div className="tauze-field-group" style={{ gridColumn: 'span 4' }}>
                  <label className="tauze-label"><Check size={14} /> Funcionalidades Inclusas (Linha por linha)</label>
                  <textarea 
                    className="tauze-input"
                    style={{ height: '100px', paddingTop: '12px', resize: 'none' }}
                    value={formData.features}
                    onChange={e => setFormData({...formData, features: e.target.value})}
                    placeholder="Ex: Suporte 24h&#10;Consultoria Técnica..."
                  />
                </div>
              </section>
            </div>

            <div className="tauze-modal-footer">
              <button className="glass-btn secondary" onClick={onClose} disabled={isSubmitting}>Cancelar</button>
              <button 
                className="primary-btn" 
                disabled={isSubmitting}
                onClick={() => {
                  onSubmit({
                    ...formData,
                    features: formData.features.split('\n').filter(f => f.trim())
                  });
                }}
              >
                {isSubmitting ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="tauze-spinner-mini" />
                    SALVANDO...
                  </div>
                ) : (
                  initialData ? 'SALVAR ALTERAÇÕES' : 'CRIAR PLANO SAAS'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
