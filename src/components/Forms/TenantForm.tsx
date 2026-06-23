import React, { useState, useEffect } from 'react';
import { usePersistentState } from '../../hooks/usePersistentState';

import {
  Building2,
  CreditCard,
  Mail,
  Phone,
  Lock,
  ShieldCheck,
  Server,
  Database,
  Zap,
  CheckCircle2,
  MonitorPlay,
  PiggyBank,
} from 'lucide-react';
import { SearchableSelect } from './SearchableSelect';
import { SidePanel } from '../Layout/SidePanel';

interface TenantFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  availablePlans?: any[];
  actionId?: number;
}

export const TenantForm: React.FC<TenantFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  availablePlans = [],
  actionId,
}) => {
  const [formData, setFormData] = usePersistentState('TenantForm_formData', {
    name: '',
    cnpj: '',
    email: '',
    phone: '',
    plan: 'Starter',
    status: 'Ativo',
    adminName: '',
    adminEmail: '',
    infrastructure: 'shared',
    setupFee: false,
    modules: [] as string[],
    stripeCustomerId: '',
    asaasCustomerId: '',
    pagarmeCustomerId: '',
  });

  const availableModules = [
    {
      id: 'financial_adv',
      name: 'Financeiro Avançado',
      icon: PiggyBank,
      desc: 'DRE, Fluxo de Caixa e LCDPR',
    },
    { id: 'b3_calc', name: 'Calculadora B3', icon: MonitorPlay, desc: 'Hedge e mercado futuro' },
    {
      id: 'custom_reports',
      name: 'Relatórios Dinâmicos',
      icon: Database,
      desc: 'PowerBI Embed e Customizados',
    },
  ];

  useEffect(() => {
    if (initialData) {
      const normalizedStatus = initialData.status
        ? initialData.status.charAt(0).toUpperCase() + initialData.status.slice(1).toLowerCase()
        : 'Ativo';

      const settings = initialData.settings || {};

      setFormData({
        name: initialData.name || '',
        cnpj: initialData.document || initialData.id || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        plan: initialData.plan || 'Starter',
        status: ['Ativo', 'Suspenso', 'Cancelado'].includes(normalizedStatus)
          ? normalizedStatus
          : 'Ativo',
        adminName: '',
        adminEmail: '',
        infrastructure: settings.infrastructure || 'shared',
        setupFee: settings.setupFee || false,
        modules: settings.modules || [],
        stripeCustomerId: initialData.gateway_ids?.stripe?.customerId || '',
        asaasCustomerId: initialData.gateway_ids?.asaas?.customerId || '',
        pagarmeCustomerId: initialData.gateway_ids?.pagarme?.customerId || '',
      });
    } else {
      setFormData({
        name: '',
        cnpj: '',
        email: '',
        phone: '',
        plan: 'Starter',
        status: 'Ativo',
        adminName: '',
        adminEmail: '',
        infrastructure: 'shared',
        setupFee: false,
        modules: [],
        stripeCustomerId: '',
        asaasCustomerId: '',
        pagarmeCustomerId: '',
      });
    }
  }, [initialData, isOpen, actionId]);

  const toggleModule = (modId: string) => {
    if (formData.modules.includes(modId)) {
      setFormData({ ...formData, modules: formData.modules.filter((m) => m !== modId) });
    } else {
      setFormData({ ...formData, modules: [...formData.modules, modId] });
    }
  };

  const isEnterprise = formData.plan.toLowerCase() === 'enterprise';

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={(e) => {
        e.preventDefault();
        const finalData = {
          ...formData,
          settings: {
            infrastructure: isEnterprise ? formData.infrastructure : 'shared',
            setupFee: formData.setupFee,
            modules: formData.modules,
          },
        };
        onSubmit(finalData);
      }}
      title={initialData ? 'Editar Tenant (Inquilino)' : 'Provisionar Novo Tenant'}
      icon={Building2}
      submitLabel={initialData ? 'Salvar Alterações' : 'Provisionar Inquilino'}
      size="xlarge"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {/* PASSO 01: DADOS DA EMPRESA */}
        <section className="tauze-form-section">
          <div className="tauze-section-header">
            <div className="tauze-section-badge">PASSO 01</div>
            <h4 className="tauze-section-title">Dados Corporativos</h4>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="tauze-field-group">
              <label
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: 'hsl(var(--text-muted))',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Building2 size={12} /> RAZÃO SOCIAL / NOME
              </label>
              <input
                className="tauze-input"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Agropecuária XYZ Ltda"
                style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--bg-main))',
                }}
              />
            </div>
            <div className="tauze-field-group">
              <label
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: 'hsl(var(--text-muted))',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Lock size={12} /> CNPJ / ID INSTITUCIONAL
              </label>
              <input
                className="tauze-input"
                type="text"
                value={formData.cnpj}
                onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                placeholder="00.000.000/0001-00"
                style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--bg-main))',
                }}
              />
            </div>
            <div className="tauze-field-group">
              <label
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: 'hsl(var(--text-muted))',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Mail size={12} /> E-MAIL COMERCIAL
              </label>
              <input
                className="tauze-input"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contato@empresa.com.br"
                style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--bg-main))',
                }}
              />
            </div>
            <div className="tauze-field-group">
              <label
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: 'hsl(var(--text-muted))',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Phone size={12} /> TELEFONE PRINCIPAL
              </label>
              <input
                className="tauze-input"
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(00) 00000-0000"
                style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--bg-main))',
                }}
              />
            </div>
          </div>
        </section>

        {/* PASSO 02: ASSINATURA & INFRAESTRUTURA */}
        <section className="tauze-form-section">
          <div className="tauze-section-header">
            <div className="tauze-section-badge">PASSO 02</div>
            <h4 className="tauze-section-title">Plano & Arquitetura</h4>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '24px',
              marginBottom: '24px',
            }}
          >
            <div className="tauze-field-group">
              <label
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: 'hsl(var(--text-muted))',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <CreditCard size={12} /> PLANO VINCULADO
              </label>
              <SearchableSelect
                value={formData.plan}
                onChange={(val: any) => setFormData({ ...formData, plan: val })}
                options={[
                  { value: '', label: 'Selecione um plano...' },
                  ...(availablePlans || []).map((p) => ({
                    value: String(p.name),
                    label: String(p.name),
                  })),
                ]}
              />
            </div>
            <div className="tauze-field-group">
              <label
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: 'hsl(var(--text-muted))',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Zap size={12} /> STATUS DO TENANT
              </label>
              <SearchableSelect
                value={formData.status}
                onChange={(val: any) => setFormData({ ...formData, status: val })}
                options={[
                  { value: 'Ativo', label: 'Ativo' },
                  { value: 'Trial', label: 'Período de Testes (Trial)' },
                  { value: 'Suspenso', label: 'Suspenso' },
                  { value: 'Cancelado', label: 'Cancelado' },
                ]}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
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
                  <Server size={14} color="hsl(var(--brand))" /> Isolamento de Banco
                </h5>
                <label className="tauze-switch">
                  <input
                    type="checkbox"
                    checked={formData.infrastructure === 'dedicated'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        infrastructure: e.target.checked ? 'dedicated' : 'shared',
                      })
                    }
                    disabled={!isEnterprise}
                  />
                  <span className="slider round" />
                </label>
              </div>
              <p style={{ margin: 0, fontSize: '11px', color: 'hsl(var(--text-muted))' }}>
                {isEnterprise
                  ? 'Ative para alocar DB dedicado.'
                  : 'Disponível apenas em planos Enterprise.'}
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
                  <PiggyBank size={14} color="hsl(var(--success))" /> Taxa de Implantação
                </h5>
                <label className="tauze-switch">
                  <input
                    type="checkbox"
                    checked={formData.setupFee}
                    onChange={(e) => setFormData({ ...formData, setupFee: e.target.checked })}
                  />
                  <span className="slider round" />
                </label>
              </div>
              <p style={{ margin: 0, fontSize: '11px', color: 'hsl(var(--text-muted))' }}>
                Faturar "Setup Fee" na primeira cobrança.
              </p>
            </div>
          </div>

          {/* Módulos Adicionais */}
          <div style={{ marginTop: '24px' }}>
            <label
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: 'hsl(var(--text-muted))',
                display: 'block',
                marginBottom: '12px',
              }}
            >
              MÓDULOS ADICIONAIS (ADD-ONS)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {availableModules.map((mod) => {
                const isActive = formData.modules.includes(mod.id);
                return (
                  <div
                    key={mod.id}
                    onClick={() => toggleModule(mod.id)}
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      border: `1px solid ${isActive ? 'hsl(var(--brand))' : 'hsl(var(--border))'}`,
                      background: isActive ? 'hsl(var(--brand)/0.05)' : 'hsl(var(--bg-main))',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {isActive && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          color: 'hsl(var(--brand))',
                        }}
                      >
                        <CheckCircle2 size={16} fill="hsl(var(--brand))" color="white" />
                      </div>
                    )}
                    <mod.icon
                      size={20}
                      color={isActive ? 'hsl(var(--brand))' : 'hsl(var(--text-muted))'}
                      style={{ marginBottom: '12px' }}
                    />
                    <h5
                      style={{
                        margin: '0 0 4px',
                        fontSize: '12px',
                        fontWeight: 800,
                        color: isActive ? 'hsl(var(--brand))' : 'hsl(var(--text-main))',
                      }}
                    >
                      {mod.name}
                    </h5>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '10px',
                        color: 'hsl(var(--text-muted))',
                        lineHeight: 1.4,
                      }}
                    >
                      {mod.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* IDs DE GATEWAY (Integrações Financeiras) */}
        <section className="tauze-form-section">
          <div className="tauze-section-header">
            <div className="tauze-section-badge">GATEWAYS</div>
            <h4 className="tauze-section-title">IDs de Integração Financeira</h4>
          </div>
          <p style={{ margin: '0 0 16px', fontSize: '12px', color: 'hsl(var(--text-muted))' }}>
            Estes IDs são preenchidos automaticamente pelo sistema ao criar a primeira assinatura. Você pode também informá-los manualmente para vincular um cliente já existente nos gateways.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div className="tauze-field-group">
              <label style={{ fontSize: '11px', fontWeight: 800, color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '8px' }}>STRIPE CUSTOMER ID</label>
              <input
                className="tauze-input"
                type="text"
                value={formData.stripeCustomerId}
                onChange={(e) => setFormData({ ...formData, stripeCustomerId: e.target.value })}
                placeholder="cus_..."
                style={{ fontFamily: 'monospace', fontSize: '12px' }}
              />
            </div>
            <div className="tauze-field-group">
              <label style={{ fontSize: '11px', fontWeight: 800, color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '8px' }}>ASAAS CUSTOMER ID</label>
              <input
                className="tauze-input"
                type="text"
                value={formData.asaasCustomerId}
                onChange={(e) => setFormData({ ...formData, asaasCustomerId: e.target.value })}
                placeholder="cus_..."
                style={{ fontFamily: 'monospace', fontSize: '12px' }}
              />
            </div>
            <div className="tauze-field-group">
              <label style={{ fontSize: '11px', fontWeight: 800, color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '8px' }}>PAGAR.ME CUSTOMER ID</label>
              <input
                className="tauze-input"
                type="text"
                value={formData.pagarmeCustomerId}
                onChange={(e) => setFormData({ ...formData, pagarmeCustomerId: e.target.value })}
                placeholder="cus_..."
                style={{ fontFamily: 'monospace', fontSize: '12px' }}
              />
            </div>
          </div>
        </section>

        {/* PASSO 03: CONTA MASTER */}
        {!initialData && (
          <section className="tauze-form-section">
            <div className="tauze-section-header">
              <div className="tauze-section-badge">PASSO 03</div>
              <h4 className="tauze-section-title">Credenciais Master</h4>
            </div>

            <div
              style={{
                background: 'hsl(var(--warning)/0.1)',
                border: '1px solid hsl(var(--warning)/0.3)',
                padding: '12px 16px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                marginBottom: '24px',
              }}
            >
              <ShieldCheck size={18} color="hsl(var(--warning))" style={{ marginTop: '2px' }} />
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'hsl(var(--warning))',
                  }}
                >
                  Segurança de Provisionamento
                </p>
                <p
                  style={{
                    margin: '4px 0 0',
                    fontSize: '11px',
                    color: 'hsl(var(--text-main))',
                    opacity: 0.8,
                  }}
                >
                  O usuário cadastrado receberá um email criptografado com acesso administrativo
                  vitalício à instância.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="tauze-field-group">
                <label
                  style={{ fontSize: '11px', fontWeight: 800, color: 'hsl(var(--text-muted))' }}
                >
                  NOME DO GESTOR
                </label>
                <input
                  className="tauze-input"
                  type="text"
                  value={formData.adminName}
                  onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                  placeholder="Nome Completo"
                  style={{
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--bg-main))',
                  }}
                />
              </div>
              <div className="tauze-field-group">
                <label
                  style={{ fontSize: '11px', fontWeight: 800, color: 'hsl(var(--text-muted))' }}
                >
                  E-MAIL DE ACESSO (LOGIN)
                </label>
                <input
                  className="tauze-input"
                  type="email"
                  value={formData.adminEmail}
                  onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                  placeholder="gestor@empresa.com.br"
                  style={{
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--bg-main))',
                  }}
                />
              </div>
            </div>
          </section>
        )}
      </div>
    </SidePanel>
  );
};
