import React, { useState, useEffect } from 'react';
import { usePersistentState } from '../../hooks/usePersistentState';

import {
  DollarSign,
  Building2,
  Calendar,
  Link as LinkIcon,
  FileText,
  CheckCircle2,
  Repeat,
  Zap,
  TrendingDown,
  Mail,
  CreditCard,
  Barcode,
  Smartphone,
} from 'lucide-react';
import { SearchableSelect } from './SearchableSelect';
import { SidePanel } from '../Layout/SidePanel';
import { DateInput } from '../../components/Form/DateInput';

interface ChargeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  tenantsList: any[];
  plansList: any[];
  isSubmitting?: boolean;
  actionId?: number;
}

export const ChargeForm: React.FC<ChargeFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  tenantsList = [],
  plansList = [],
  isSubmitting = false,
  actionId: _actionId,
}) => {
  const [formData, setFormData] = usePersistentState('ChargeForm_formData', {
    tenant_id: '',
    plan_name: '',
    billing_type: 'recurring', // 'recurring' ou 'one_time'
    amount: '',
    discount_amount: '',
    payment_method: 'pix', // 'pix', 'boleto', 'credit_card'
    status: 'pendente',
    due_date: '',
    payment_link: '',
    auto_send_email: true,
    description: '',
  });

  const [isCustomPlan, setIsCustomPlan] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        tenant_id: '',
        plan_name: '',
        billing_type: 'recurring',
        amount: '',
        discount_amount: '',
        payment_method: 'pix',
        status: 'pendente',
        due_date: new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
          .toISOString()
          .split('T')[0],
        payment_link: '',
        auto_send_email: true,
        description: '',
      });
      setIsCustomPlan(false);
    }
  }, [isOpen]);

  // When a predefined plan is selected, auto-fill the amount
  useEffect(() => {
    if (!isCustomPlan && formData.plan_name) {
      const selectedPlan = plansList.find((p) => p.name === formData.plan_name);
      if (selectedPlan) {
        setFormData((prev) => ({ ...prev, amount: String(selectedPlan.price || 0) }));
      }
    }
  }, [formData.plan_name, isCustomPlan, plansList]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const tenantOptions = [
    { value: '', label: 'Selecione um inquilino...' },
    ...tenantsList.map((t) => ({ value: t.id, label: t.name || t.nome || t.id })),
  ];

  const planOptions = [
    { value: '', label: 'Selecione um plano...' },
    { value: 'custom', label: '+ Plano / Valor Personalizado' },
    ...plansList.map((p) => ({
      value: p.name,
      label: `${p.name} (R$ ${Number(p.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`,
    })),
  ];

  const baseAmount = Number(formData.amount) || 0;
  const discountAmount = Number(formData.discount_amount) || 0;
  const netAmount = Math.max(0, baseAmount - discountAmount);

  return (
    <SidePanel
      size="large"
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Emissão de Fatura SaaS"
      subtitle="Geração manual de cobrança B2B (Assinaturas ou Setup)."
      icon={DollarSign}
      submitLabel={isSubmitting ? 'Gerando Fatura...' : 'Gerar Fatura & Cobrar'}
    >
      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 01</div>
          <h4 className="tauze-section-title">Destinatário & Serviço</h4>
        </div>

        <div className="tauze-input-grid grid-col-1">
          <div className="tauze-field-group">
            <label className="tauze-label">
              <Building2 size={14} /> Cliente / Inquilino *
            </label>
            <SearchableSelect
              value={formData.tenant_id}
              onChange={(val: any) => setFormData({ ...formData, tenant_id: val })}
              options={tenantOptions}
            />
          </div>
        </div>

        <div className="tauze-input-grid grid-col-2" style={{ marginTop: '16px' }}>
          <div className="tauze-field-group">
            <label className="tauze-label">
              <FileText size={14} /> Plano de Assinatura *
            </label>
            <SearchableSelect
              value={isCustomPlan ? 'custom' : formData.plan_name}
              onChange={(val: any) => {
                if (val === 'custom') {
                  setIsCustomPlan(true);
                  setFormData({ ...formData, plan_name: 'Cobrança Avulsa/Personalizada' });
                } else {
                  setIsCustomPlan(false);
                  setFormData({ ...formData, plan_name: val });
                }
              }}
              options={planOptions}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label">Tipo de Cobrança</label>
            <div className="tauze-form-radio-group">
              <div
                className={`tauze-form-radio-item ${formData.billing_type === 'recurring' ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, billing_type: 'recurring' })}
                style={{ padding: '8px 12px' }}
              >
                <Repeat size={14} /> Recorrente
              </div>
              <div
                className={`tauze-form-radio-item ${formData.billing_type === 'one_time' ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, billing_type: 'one_time' })}
                style={{ padding: '8px 12px' }}
              >
                <Zap size={14} /> Avulsa/Setup
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 02</div>
          <h4 className="tauze-section-title">Ajustes & Valores (Pró-rata)</h4>
        </div>

        <div className="tauze-input-grid grid-col-2">
          <div className="tauze-field-group">
            <label className="tauze-label">
              <DollarSign size={14} /> Valor Base da Fatura (R$) *
            </label>
            <input
              className="tauze-input"
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
              required
              disabled={!isCustomPlan && !!formData.plan_name}
              style={{
                opacity: !isCustomPlan && !!formData.plan_name ? 0.7 : 1,
                fontSize: '16px',
                fontWeight: 800,
              }}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label">
              <TrendingDown size={14} /> Desconto Comercial / Pró-rata (R$)
            </label>
            <input
              className="tauze-input"
              type="number"
              step="0.01"
              min="0"
              value={formData.discount_amount}
              onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value })}
              placeholder="0.00"
              style={{ color: 'hsl(var(--danger))' }}
            />
            <span style={{ fontSize: '10px', color: 'hsl(var(--text-muted))', marginTop: '4px' }}>
              Aplicado para entrada no meio do mês ou cortesias.
            </span>
          </div>
        </div>

        <div
          style={{
            background: 'hsl(var(--bg-main))',
            padding: '16px',
            borderRadius: '12px',
            marginTop: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            border: '1px solid hsl(var(--border))',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '11px',
                color: 'hsl(var(--text-muted))',
                fontWeight: 800,
                textTransform: 'uppercase',
              }}
            >
              Valor Líquido da Fatura
            </div>
            <div style={{ fontSize: '10px', color: 'hsl(var(--text-muted))' }}>
              Base (R$ {baseAmount.toFixed(2)}) - Desconto (R$ {discountAmount.toFixed(2)})
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: 'hsl(var(--brand))' }}>
            R$ {netAmount.toFixed(2)}
          </div>
        </div>
      </section>

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 03</div>
          <h4 className="tauze-section-title">Pagamento & Régua de Cobrança</h4>
        </div>

        <div className="tauze-input-grid grid-col-2">
          <div className="tauze-field-group">
            <label className="tauze-label">
              <Calendar size={14} /> Data de Vencimento *
            </label>
            <DateInput
              className="tauze-input"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              required
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label">
              <CheckCircle2 size={14} /> Status Financeiro
            </label>
            <SearchableSelect
              value={formData.status}
              onChange={(val: any) => setFormData({ ...formData, status: val })}
              options={[
                { value: 'pendente', label: 'Pendente (Aguardando Pagamento)' },
                { value: 'pago', label: 'Pago (Conciliado)' },
                { value: 'atrasado', label: 'Atrasado' },
              ]}
            />
          </div>
        </div>

        <div className="tauze-field-group" style={{ marginTop: '16px' }}>
          <label className="tauze-label">Meio de Pagamento Solicitado</label>
          <div className="tauze-form-radio-group">
            <div
              className={`tauze-form-radio-item ${formData.payment_method === 'pix' ? 'active' : ''}`}
              onClick={() => setFormData({ ...formData, payment_method: 'pix' })}
              style={{ padding: '8px 12px' }}
            >
              <Smartphone size={14} /> PIX (D+0)
            </div>
            <div
              className={`tauze-form-radio-item ${formData.payment_method === 'boleto' ? 'active' : ''}`}
              onClick={() => setFormData({ ...formData, payment_method: 'boleto' })}
              style={{ padding: '8px 12px' }}
            >
              <Barcode size={14} /> Boleto
            </div>
            <div
              className={`tauze-form-radio-item ${formData.payment_method === 'credit_card' ? 'active' : ''}`}
              onClick={() => setFormData({ ...formData, payment_method: 'credit_card' })}
              style={{ padding: '8px 12px' }}
            >
              <CreditCard size={14} /> Cartão
            </div>
          </div>
        </div>

        <div className="tauze-input-grid grid-col-1" style={{ marginTop: '16px' }}>
          <div className="tauze-field-group">
            <label className="tauze-label">
              <LinkIcon size={14} /> Link do Gateway (Opcional)
            </label>
            <input
              className="tauze-input"
              type="url"
              value={formData.payment_link}
              onChange={(e) => setFormData({ ...formData, payment_link: e.target.value })}
              placeholder="https://link-do-asaas-ou-stripe..."
            />
          </div>
        </div>

        <div
          style={{
            marginTop: '20px',
            background: formData.auto_send_email ? 'hsl(var(--brand)/0.1)' : 'hsl(var(--bg-card))',
            border: `1px solid ${formData.auto_send_email ? 'hsl(var(--brand))' : 'hsl(var(--border))'}`,
            padding: '16px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onClick={() => setFormData({ ...formData, auto_send_email: !formData.auto_send_email })}
        >
          <div
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '6px',
              background: formData.auto_send_email ? 'hsl(var(--brand))' : 'transparent',
              border: `2px solid ${formData.auto_send_email ? 'hsl(var(--brand))' : 'hsl(var(--border))'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}
          >
            {formData.auto_send_email && <CheckCircle2 size={12} strokeWidth={3} />}
          </div>
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 800,
                fontSize: '13px',
                color: formData.auto_send_email ? 'hsl(var(--brand))' : 'hsl(var(--text-main))',
              }}
            >
              <Mail size={16} /> Régua Automática: Enviar Fatura por E-mail
            </div>
            <div style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>
              Ao salvar, o Inquilino será notificado com o espelho da fatura, chaves de pagamento e
              PDF.
            </div>
          </div>
        </div>
      </section>
    </SidePanel>
  );
};
