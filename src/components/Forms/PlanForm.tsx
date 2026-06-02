import React, { useState, useEffect } from 'react';
import { Check, Server, Users, HardDrive, Building2, Activity, CheckSquare, Square } from 'lucide-react';
import { SearchableSelect } from './SearchableSelect';
import { SidePanel } from '../Layout/SidePanel';

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

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          ...formData,
          features: formData.features.split('\n').filter(f => f.trim())
        });
      }}
      title={initialData ? 'Editar Plano SaaS' : 'Configurar Novo Plano'}
      icon={Server}
      submitLabel={initialData ? 'Salvar Alterações' : 'Criar Plano SaaS'}
      size="large"
      loading={isSubmitting}
    >
      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">COMERCIAL</div>
          <h4 className="tauze-section-title">Definições do Produto</h4>
        </div>

        <div className="tauze-input-grid grid-col-2">
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
        
        <div className="tauze-input-grid grid-col-2">
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

        <div className="tauze-input-grid grid-col-2" style={{ marginTop: '16px' }}>
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
          <h4 className="tauze-section-title">Regras de Cobrança & Integrações</h4>
        </div>

        <div className="tauze-input-grid grid-col-2">
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
        </div>
        <div className="tauze-input-grid grid-col-2" style={{ marginTop: '16px' }}>
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
        </div>
        <div className="tauze-input-grid grid-col-1" style={{ marginTop: '16px' }}>
          <div className="tauze-field-group">
            <label className="tauze-label">Ciclo de Cobrança</label>
            <SearchableSelect 
              value={formData.billingCycle}
              onChange={(val: any) => setFormData({...formData, billingCycle: val})}
              options={[
                { value: 'monthly', label: 'Mensal' },
                { value: 'quarterly', label: 'Trimestral' },
                { value: 'yearly', label: 'Anual' },
              ]}
            />
          </div>
        </div>
      </section>

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
                  borderRadius: '12px',
                  border: '1px solid',
                  borderColor: isActive ? 'hsl(var(--brand))' : 'hsl(var(--border))',
                  background: isActive ? 'hsl(var(--brand) / 0.05)' : 'hsl(var(--bg-main))',
                  color: isActive ? 'hsl(var(--brand))' : 'hsl(var(--text-muted))',
                  fontSize: '12px',
                  fontWeight: 700,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  textAlign: 'left',
                  cursor: 'pointer'
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
        <div className="tauze-input-grid grid-col-1">
          <div className="tauze-field-group">
            <label className="tauze-label"><Check size={14} /> Funcionalidades Inclusas (Linha por linha)</label>
            <textarea 
              className="tauze-input tauze-textarea"
              style={{ minHeight: '100px' }}
              value={formData.features}
              onChange={e => setFormData({...formData, features: e.target.value})}
              placeholder="Ex: Suporte 24h&#10;Consultoria Técnica..."
            />
          </div>
        </div>
      </section>
    </SidePanel>
  );
};
