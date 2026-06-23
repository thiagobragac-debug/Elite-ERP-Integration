import React, { useState, useEffect } from 'react';
import { usePersistentState } from '../../hooks/usePersistentState';

import {
  Check,
  Server,
  Users,
  HardDrive,
  Building2,
  Activity,
  CheckSquare,
  Square,
  Globe,
  ShieldAlert,
  Star,
  PiggyBank,
  DollarSign,
} from 'lucide-react';
import { SearchableSelect } from './SearchableSelect';
import { SidePanel } from '../Layout/SidePanel';
import { SAAS_MODULES } from '../../config/saasModules';

interface PlanFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  isSubmitting?: boolean;
  actionId?: number;
}

export const PlanForm: React.FC<PlanFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isSubmitting = false,
  actionId,
}) => {
  const [formData, setFormData] = usePersistentState('PlanForm_formData', {
    name: '',
    price: '',
    billingCycle: 'monthly',
    stripePlanId: '',
    pagarMePlanId: '',
    asaasPlanId: '',
    usersLimit: '',
    storageLimit: '',
    animalsLimit: '',
    companiesLimit: '',
    pricePerUserExtra: '',
    pricePerAnimalExtra: '',
    modules: ['Dashboard', 'Administração'] as string[],
    features: '',
    // Novas regras de negócio avançadas
    isPublic: true,
    isRecommended: false,
    overagePolicy: 'auto_addon',
    setupFee: '',
  });

  useEffect(() => {

    if (initialData) {
      setFormData({
        name: initialData.name || '',
        price: initialData.price || '',
        billingCycle: initialData.billing_cycle || 'monthly',
        stripePlanId: initialData.stripe_plan_id || '',
        pagarMePlanId: initialData.pagarme_plan_id || '',
        asaasPlanId: initialData.asaas_plan_id || '',
        usersLimit: initialData.users_limit || '',
        storageLimit: initialData.storage_gb || '',
        animalsLimit: initialData.animals_limit || '',
        companiesLimit: initialData.companies_limit || '',
        pricePerUserExtra: initialData.price_per_user_extra || '',
        pricePerAnimalExtra: initialData.price_per_animal_extra || '',
        modules: initialData.modules || ['Dashboard', 'Administração'],
        features: Array.isArray(initialData.features)
          ? initialData.features.join('\n')
          : initialData.features || '',
        isPublic: initialData.is_public !== undefined ? initialData.is_public : (initialData.settings?.isPublic ?? true),
        isRecommended: initialData.settings?.isRecommended ?? false,
        overagePolicy: initialData.settings?.overagePolicy === 'soft_limit' ? 'auto_addon' : (initialData.settings?.overagePolicy ?? 'auto_addon'),
        setupFee: initialData.settings?.setupFee ?? '',
      });
    } else {
      setFormData({
        name: '',
        price: '',
        billingCycle: 'monthly',
        stripePlanId: '',
        pagarMePlanId: '',
        asaasPlanId: '',
        usersLimit: '',
        storageLimit: '',
        animalsLimit: '',
        companiesLimit: '',
        pricePerUserExtra: '',
        pricePerAnimalExtra: '',
        modules: ['Dashboard', 'Administração'],
        features: '',
        isPublic: true,
        isRecommended: false,
        overagePolicy: 'auto_addon',
        setupFee: '',
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
          is_public: isPublic,
          features: restData.features.split('\n').filter((f) => f.trim()),
          settings: {
            isRecommended,
            overagePolicy,
            setupFee,
          },
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
              <label className="tauze-label">
                <Server size={14} /> Nome do Plano
              </label>
              <input
                className="tauze-input"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Pro, Enterprise..."
                autoFocus
              />
            </div>
            <div className="tauze-field-group">
              <label className="tauze-label">
                <DollarSign size={14} /> Preço Mensal
              </label>
              <input
                className="tauze-input"
                type="text"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="R$ 999"
              />
            </div>
          </div>
        </section>

        {/* VISIBILIDADE E POLÍTICAS DE EXCEDENTE */}
        <section className="tauze-form-section">
          <div className="tauze-section-header">
            <div
              className="tauze-section-badge"
              style={{ background: 'hsl(var(--warning)/0.1)', color: 'hsl(var(--warning))' }}
            >
              POLÍTICAS
            </div>
            <h4 className="tauze-section-title">Regras de Venda & Excedente</h4>
          </div>

          <div className="tauze-input-grid grid-col-2" style={{ marginBottom: '24px' }}>
            <div
              style={{
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid hsl(var(--border))',
                background: 'hsl(var(--bg-main))',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px',
                }}
              >
                <h5
                  style={{
                    margin: 0,
                    fontSize: '12px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Globe size={14} color="hsl(var(--brand))" /> Publicar no Site
                </h5>
                <label className="tauze-switch">
                  <input
                    type="checkbox"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                  />
                  <span className="slider round" />
                </label>
              </div>
              <p style={{ margin: 0, fontSize: '11px', color: 'hsl(var(--text-muted))' }}>
                Se ativo, o plano fica visível publicamente na página de Pricing.
              </p>
            </div>

            <div
              style={{
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid hsl(var(--border))',
                background: 'hsl(var(--bg-main))',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px',
                }}
              >
                <h5
                  style={{
                    margin: 0,
                    fontSize: '12px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Star size={14} color="hsl(var(--warning))" /> Plano Recomendado
                </h5>
                <label className="tauze-switch">
                  <input
                    type="checkbox"
                    checked={formData.isRecommended}
                    onChange={(e) => setFormData({ ...formData, isRecommended: e.target.checked })}
                  />
                  <span className="slider round" />
                </label>
              </div>
              <p style={{ margin: 0, fontSize: '11px', color: 'hsl(var(--text-muted))' }}>
                Destaca este plano com o selo "Mais Popular" nas ofertas.
              </p>
            </div>
          </div>

          <div className="tauze-input-grid grid-col-2">
            <div className="tauze-field-group">
              <label className="tauze-label">
                <ShieldAlert size={14} /> Política de Excedente (Overage)
              </label>
              <SearchableSelect
                value={formData.overagePolicy}
                onChange={(val: any) => setFormData({ ...formData, overagePolicy: val })}
                options={[
                  { value: 'hard_limit', label: 'Bloquear Excedente (Requer compra de Add-on)' },
                  { value: 'auto_addon', label: 'Contratar Add-on Automaticamente' },
                ]}
              />
              <p style={{ margin: '6px 0 0', fontSize: '10px', color: 'hsl(var(--text-muted))' }}>
                Determina o comportamento ao atingir os limites de cadastro.
              </p>
            </div>

            <div className="tauze-field-group">
              <label className="tauze-label">
                <PiggyBank size={14} /> Taxa de Adesão (Setup Fee)
              </label>
              <input
                className="tauze-input"
                type="text"
                value={formData.setupFee}
                onChange={(e) => setFormData({ ...formData, setupFee: e.target.value })}
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

          <div className="tauze-input-grid grid-col-4">
            <div className="tauze-field-group">
              <label className="tauze-label">
                <Users size={14} /> Qtd. de Usuários (Mensal)
              </label>
              <input
                className="tauze-input"
                type="number"
                value={formData.usersLimit}
                onChange={(e) => setFormData({ ...formData, usersLimit: e.target.value })}
                placeholder="Ex: 20"
              />
            </div>
            <div className="tauze-field-group">
              <label className="tauze-label">
                <Activity size={14} /> Qtd. de Animais
              </label>
              <input
                className="tauze-input"
                type="number"
                value={formData.animalsLimit}
                onChange={(e) => setFormData({ ...formData, animalsLimit: e.target.value })}
                placeholder="Ex: 5000"
              />
            </div>
            <div className="tauze-field-group">
              <label className="tauze-label">
                <Building2 size={14} /> Matrizes (CNPJ/CPF)
              </label>
              <input
                className="tauze-input"
                type="number"
                value={formData.companiesLimit}
                onChange={(e) => setFormData({ ...formData, companiesLimit: e.target.value })}
                placeholder="Ex: 2"
              />
            </div>
            <div className="tauze-field-group">
              <label className="tauze-label">
                <HardDrive size={14} /> Storage Base (GB)
              </label>
              <input
                className="tauze-input"
                type="number"
                value={formData.storageLimit}
                onChange={(e) => setFormData({ ...formData, storageLimit: e.target.value })}
                placeholder="Ex: 100"
              />
            </div>
          </div>

          {/* Preços de Excedente */}
          <div className="tauze-input-grid grid-col-2" style={{ marginTop: '16px' }}>
            <div className="tauze-field-group">
              <label className="tauze-label">
                <Users size={14} /> R$/Usuário Extra (Excedente)
              </label>
              <input
                className="tauze-input"
                type="number"
                step="0.01"
                value={formData.pricePerUserExtra}
                onChange={(e) => setFormData({ ...formData, pricePerUserExtra: e.target.value })}
                placeholder="Ex: 15.00"
              />
              <span style={{ fontSize: 11, color: 'hsl(var(--text-muted))', marginTop: 4, display: 'block' }}>
                Cobrado por usuário ativo acima do limite
              </span>
            </div>
            <div className="tauze-field-group">
              <label className="tauze-label">
                <Activity size={14} /> R$/Animal Extra (Excedente)
              </label>
              <input
                className="tauze-input"
                type="number"
                step="0.01"
                value={formData.pricePerAnimalExtra}
                onChange={(e) => setFormData({ ...formData, pricePerAnimalExtra: e.target.value })}
                placeholder="Ex: 2.50"
              />
              <span style={{ fontSize: 11, color: 'hsl(var(--text-muted))', marginTop: 4, display: 'block' }}>
                Cobrado por animal acima do limite do banco
              </span>
            </div>
          </div>
        </section>

        {/* FINANCEIRO E GATEWAY */}
        <section className="tauze-form-section">
          <div className="tauze-section-header">
            <div className="tauze-section-badge">FINANCEIRO & GATEWAY</div>
            <h4 className="tauze-section-title">Regras de Cobrança & Integrações</h4>
          </div>


          <div className="tauze-input-grid grid-col-4">
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
              <label className="tauze-label">ID do Plano (Asaas)</label>
              <input
                type="text"
                className="tauze-input"
                placeholder="sub_..."
                value={formData.asaasPlanId}
                onChange={(e) => setFormData({ ...formData, asaasPlanId: e.target.value })}
              />
            </div>
            <div className="tauze-field-group">
              <label className="tauze-label">Ciclo de Cobrança</label>
              <SearchableSelect
                value={formData.billingCycle}
                onChange={(val: any) => setFormData({ ...formData, billingCycle: val })}
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

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {SAAS_MODULES.map((module) => {
              // Verifica se o módulo pai está ativo
              const isParentActive = formData.modules.includes(module.id);
              
              const handleParentToggle = () => {
                let nextModules = [...formData.modules];
                if (isParentActive) {
                  // Desmarca o pai e TODOS os filhos
                  nextModules = nextModules.filter(m => m !== module.id && !module.submodules.some(sub => sub.id === m));
                } else {
                  // Marca o pai e TODOS os filhos
                  if (!nextModules.includes(module.id)) nextModules.push(module.id);
                  module.submodules.forEach(sub => {
                    if (!nextModules.includes(sub.id)) nextModules.push(sub.id);
                  });
                }
                setFormData({ ...formData, modules: nextModules });
              };

              return (
                <div key={module.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* MÓDULO PAI */}
                  <button
                    type="button"
                    onClick={handleParentToggle}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: '1px solid',
                      borderColor: isParentActive ? 'hsl(var(--brand))' : 'hsl(var(--border))',
                      background: isParentActive ? 'hsl(var(--brand) / 0.05)' : 'hsl(var(--bg-main))',
                      color: isParentActive ? 'hsl(var(--brand))' : 'hsl(var(--text-main))',
                      fontSize: '14px',
                      fontWeight: 800,
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    {isParentActive ? (
                      <CheckSquare size={18} color="hsl(var(--brand))" />
                    ) : (
                      <Square size={18} color="hsl(var(--text-muted))" />
                    )}
                    {module.label}
                  </button>

                  {/* SUBMÓDULOS */}
                  {module.submodules.length > 0 && isParentActive && (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                      gap: '8px',
                      paddingLeft: '32px'
                    }}>
                      {module.submodules.map((sub) => {
                        const isSubActive = formData.modules.includes(sub.id);
                        
                        const handleSubToggle = () => {
                          let nextModules = [...formData.modules];
                          if (isSubActive) {
                            nextModules = nextModules.filter(m => m !== sub.id);
                          } else {
                            nextModules.push(sub.id);
                          }
                          setFormData({ ...formData, modules: nextModules });
                        };

                        return (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={handleSubToggle}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: '1px solid',
                              borderColor: isSubActive ? 'hsl(var(--brand) / 0.3)' : 'hsl(var(--border))',
                              background: isSubActive ? 'hsl(var(--brand) / 0.02)' : 'transparent',
                              color: isSubActive ? 'hsl(var(--text-main))' : 'hsl(var(--text-muted))',
                              fontSize: '12px',
                              fontWeight: 600,
                              textAlign: 'left',
                              cursor: 'pointer',
                            }}
                          >
                            {isSubActive ? (
                              <CheckSquare size={14} color="hsl(var(--brand))" />
                            ) : (
                              <Square size={14} color="hsl(var(--text-muted))" />
                            )}
                            {sub.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
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
              <label className="tauze-label">
                <Check size={14} /> Funcionalidades Inclusas (Linha por linha)
              </label>
              <textarea
                className="tauze-input tauze-textarea"
                style={{ minHeight: '100px' }}
                value={formData.features}
                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                placeholder="Ex: Suporte 24h&#10;Consultoria Técnica..."
              />
            </div>
          </div>
        </section>
      </div>
    </SidePanel>
  );
};
