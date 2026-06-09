import React, { useState, useEffect } from 'react';
import { usePersistentState } from '../../hooks/usePersistentState';

import { Check, Server, Users, HardDrive, Building2, Activity, CheckSquare, Square, Globe, ShieldAlert, Star, PiggyBank, DollarSign } from 'lucide-react';
import { SearchableSelect } from './SearchableSelect';
import { SidePanel } from '../Layout/SidePanel';

interface PlanFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  isSubmitting?: boolean;
  actionId?: number;
}

export const PlanForm: React.FC<PlanFormProps> = ({isOpen, onClose, onSubmit, initialData, isSubmitting = false, actionId }) => {
  const [formData, setFormData] = usePersistentState('PlanForm_formData', {
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
    features: '',
    // Novas regras de negócio avançadas
    isPublic: true,
    isRecommended: false,
    overagePolicy: 'soft_limit',
    setupFee: ''
  });

  useEffect(() => {
    if (!actionId) return; // Ignore on initial mount / refresh

    if (initialData) { setFormData({
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
        features: Array.isArray(initialData.features) ? initialData.features.join('\n') : (initialData.features || ''),
        isPublic: initialData.settings?.isPublic ?? true,
        isRecommended: initialData.settings?.isRecommended ?? false,
        overagePolicy: initialData.settings?.overagePolicy ?? 'soft_limit',
        setupFee: initialData.settings?.setupFee ?? ''
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
        features: '',
        isPublic: true,
        isRecommended: false,
        overagePolicy: 'soft_limit',
        setupFee: ''
      });
    }
  }, [initialData, isOpen, actionId]);

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={(e) => {
        e.preventDefault();
        const { isPublic, isRecommended, overagePolicy, setupFee, ...restData } = formData;
        onSubmit({
          ...restData,
          features: restData.features.split('\n').filter(f => f.trim()),
          settings: {
            isPublic,
            isRecommended,
            overagePolicy,
            setupFee
          }
        });
      }}
      title={initialData ? 'Editar Plano SaaS' : 'Configurar Novo Plano'}
      icon={Server}
      submitLabel={initialData ? 'Salvar Alterações' : 'Criar Plano SaaS'}
      size="xlarge"
      loading={isSubmitting}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* COMERCIAL */}
        <section className="tauze-form-section">
          <div className="tauze-section-header">
            <div className="tauze-section-badge">COMERCIAL</div>
            <h4 className="tauze-section-title">Definições do Produto</h4>
          </div>

          <div className="tauze-input-grid grid-col-2">
            <div className="tauze-field-group">
              <label className="tauze-label"><Server size={14} /> Nome do Plano</label>
              <input 
                className="tauze-input"
                type="text" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="Ex: Pro, Enterprise..."
                autoFocus
              />
            </div>
            <div className="tauze-field-group">
              <label className="tauze-label"><DollarSign size={14} /> Preço Mensal</label>
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

        {/* VISIBILIDADE E POLÍTICAS DE EXCEDENTE */}
        <section className="tauze-form-section">
          <div className="tauze-section-header">
            <div className="tauze-section-badge" style={{ background: 'hsl(var(--warning)/0.1)', color: 'hsl(var(--warning))' }}>POLÍTICAS</div>
            <h4 className="tauze-section-title">Regras de Venda & Excedente</h4>
          </div>

          <div className="tauze-input-grid grid-col-2" style={{ marginBottom: '24px' }}>
            <div style={{ padding: '16px', borderRadius: '12px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--bg-main))' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h5 style={{ margin: 0, fontSize: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Globe size={14} color="hsl(var(--brand))" /> Publicar no Site
                </h5>
                <label className="tauze-switch">
                  <input 
                    type="checkbox" 
                    checked={formData.isPublic} 
                    onChange={e => setFormData({...formData, isPublic: e.target.checked})}
                  />
                  <span className="slider round"></span>
                </label>
              </div>
              <p style={{ margin: 0, fontSize: '11px', color: 'hsl(var(--text-muted))' }}>
                Se ativo, o plano fica visível publicamente na página de Pricing.
              </p>
            </div>

            <div style={{ padding: '16px', borderRadius: '12px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--bg-main))' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h5 style={{ margin: 0, fontSize: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Star size={14} color="hsl(var(--warning))" /> Plano Recomendado
                </h5>
                <label className="tauze-switch">
                  <input 
                    type="checkbox" 
                    checked={formData.isRecommended} 
                    onChange={e => setFormData({...formData, isRecommended: e.target.checked})}
                  />
                  <span className="slider round"></span>
                </label>
              </div>
              <p style={{ margin: 0, fontSize: '11px', color: 'hsl(var(--text-muted))' }}>
                Destaca este plano com o selo "Mais Popular" nas ofertas.
              </p>
            </div>
          </div>

          <div className="tauze-input-grid grid-col-2">
            <div className="tauze-field-group">
              <label className="tauze-label"><ShieldAlert size={14} /> Política de Excedente (Overage)</label>
              <SearchableSelect 
                value={formData.overagePolicy}
                onChange={(val: any) => setFormData({...formData, overagePolicy: val})}
                options={[
                  { value: 'hard_limit', label: 'Bloquear Excedente (Hard Limit)' },
                  { value: 'soft_limit', label: 'Cobrar Excedente (Soft Limit / Pay as you go)' }
                ]}
              />
              <p style={{ margin: '6px 0 0', fontSize: '10px', color: 'hsl(var(--text-muted))' }}>
                Determina o comportamento ao atingir os limites de cadastro.
              </p>
            </div>

            <div className="tauze-field-group">
              <label className="tauze-label"><PiggyBank size={14} /> Taxa de Adesão (Setup Fee)</label>
              <input 
                className="tauze-input"
                type="text" 
                value={formData.setupFee}
                onChange={e => setFormData({...formData, setupFee: e.target.value})}
                placeholder="R$ 1.500 (Opcional)"
              />
              <p style={{ margin: '6px 0 0', fontSize: '10px', color: 'hsl(var(--text-muted))' }}>
                Cobrança única de Implantação/Setup.
              </p>
            </div>
          </div>
        </section>

        {/* LIMITES DE OPERAÇÃO */}
        <section className="tauze-form-section">
          <div className="tauze-section-header">
            <div className="tauze-section-badge">LIMITES</div>
            <h4 className="tauze-section-title">Regras de Operação</h4>
          </div>
          
          <div className="tauze-input-grid grid-col-2">
            <div className="tauze-field-group">
              <label className="tauze-label"><Users size={14} /> Qtd. de Usuários (Mensal)</label>
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

        {/* FINANCEIRO E GATEWAY */}
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

        {/* MÓDULOS ECOSSISTEMA */}
        <section className="tauze-form-section">
          <div className="tauze-section-header">
            <div className="tauze-section-badge">ECOSSISTEMA</div>
            <h4 className="tauze-section-title">Módulos de Acesso Default</h4>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
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
                    borderRadius: '10px',
                    border: '1px solid',
                    borderColor: isActive ? 'hsl(var(--brand))' : 'hsl(var(--border))',
                    background: isActive ? 'hsl(var(--brand) / 0.05)' : 'hsl(var(--bg-main))',
                    color: isActive ? 'hsl(var(--brand))' : 'hsl(var(--text-main))',
                    fontSize: '12px',
                    fontWeight: 700,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  {isActive ? <CheckSquare size={16} color="hsl(var(--brand))" /> : <Square size={16} color="hsl(var(--text-muted))" />}
                  {module}
                </button>
              );
            })}
          </div>
        </section>

        {/* NOTAS COMERCIAIS */}
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

      </div>
    </SidePanel>
  );
};
