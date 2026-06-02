import React, { useState, useEffect } from 'react';
import { DollarSign, Building2, Calendar, Link as LinkIcon, FileText, CheckCircle2 } from 'lucide-react';
import { SearchableSelect } from './SearchableSelect';
import { SidePanel } from '../Layout/SidePanel';

interface ChargeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  tenantsList: any[];
  plansList: any[];
  isSubmitting?: boolean;
}

export const ChargeForm: React.FC<ChargeFormProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  tenantsList = [], 
  plansList = [], 
  isSubmitting = false 
}) => {
  const [formData, setFormData] = useState({
    tenant_id: '',
    plan_name: '',
    amount: '',
    status: 'pendente',
    due_date: '',
    payment_link: '',
    description: ''
  });

  const [isCustomPlan, setIsCustomPlan] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        tenant_id: '',
        plan_name: '',
        amount: '',
        status: 'pendente',
        due_date: new Date().toISOString().split('T')[0],
        payment_link: '',
        description: ''
      });
      setIsCustomPlan(false);
    }
  }, [isOpen]);

  // When a predefined plan is selected, auto-fill the amount
  useEffect(() => {
    if (!isCustomPlan && formData.plan_name) {
      const selectedPlan = plansList.find(p => p.name === formData.plan_name);
      if (selectedPlan) {
        setFormData(prev => ({ ...prev, amount: String(selectedPlan.price || 0) }));
      }
    }
  }, [formData.plan_name, isCustomPlan, plansList]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const tenantOptions = [
    { value: '', label: 'Selecione um inquilino...' },
    ...tenantsList.map(t => ({ value: t.id, label: t.name || t.nome || t.id }))
  ];

  const planOptions = [
    { value: '', label: 'Selecione um plano...' },
    { value: 'custom', label: '+ Plano / Valor Personalizado' },
    ...plansList.map(p => ({ value: p.name, label: `${p.name} (R$ ${Number(p.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})` }))
  ];

  return (
    <SidePanel size="medium"
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Nova Cobrança"
      subtitle="Gerar fatura ou cobrança manual para um inquilino"
      icon={DollarSign}
      submitLabel={isSubmitting ? 'Gerando...' : 'Gerar Cobrança'}
    >
      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 01</div>
          <h4 className="tauze-section-title">Destinatário & Detalhes</h4>
        </div>
        <div className="tauze-input-grid grid-col-1">
          <div className="tauze-field-group">
            <label className="tauze-label"><Building2 size={14} /> Cliente (Inquilino) *</label>
            <SearchableSelect 
              value={formData.tenant_id}
              onChange={(val: any) => setFormData({...formData, tenant_id: val})}
              options={tenantOptions}
            />
          </div>
        </div>
        <div className="tauze-input-grid grid-col-2" style={{ marginTop: '16px' }}>
          <div className="tauze-field-group">
            <label className="tauze-label"><FileText size={14} /> Tipo de Plano / Faturamento *</label>
            <SearchableSelect 
              value={isCustomPlan ? 'custom' : formData.plan_name}
              onChange={(val: any) => {
                if (val === 'custom') {
                  setIsCustomPlan(true);
                  setFormData({...formData, plan_name: 'Cobrança Avulsa/Personalizada'});
                } else {
                  setIsCustomPlan(false);
                  setFormData({...formData, plan_name: val});
                }
              }}
              options={planOptions}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><DollarSign size={14} /> Valor (R$) *</label>
            <input 
              className="tauze-input"
              type="number" 
              step="0.01"
              min="0"
              value={formData.amount} 
              onChange={e => setFormData({...formData, amount: e.target.value})} 
              placeholder="0.00" 
              required
              disabled={!isCustomPlan && !!formData.plan_name}
              style={{ opacity: (!isCustomPlan && !!formData.plan_name) ? 0.7 : 1 }}
            />
          </div>
        </div>
      </section>

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 02</div>
          <h4 className="tauze-section-title">Vencimento & Pagamento</h4>
        </div>
        <div className="tauze-input-grid grid-col-2">
          <div className="tauze-field-group">
            <label className="tauze-label"><Calendar size={14} /> Vencimento *</label>
            <input 
              className="tauze-input"
              type="date" 
              value={formData.due_date} 
              onChange={e => setFormData({...formData, due_date: e.target.value})} 
              required
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><CheckCircle2 size={14} /> Status Inicial</label>
            <SearchableSelect 
              value={formData.status}
              onChange={(val: any) => setFormData({...formData, status: val})}
              options={[
                { value: 'pendente', label: 'Pendente' },
                { value: 'pago', label: 'Pago' },
                { value: 'atrasado', label: 'Atrasado' }
              ]}
            />
          </div>
        </div>
        <div className="tauze-input-grid grid-col-1" style={{ marginTop: '16px' }}>
          <div className="tauze-field-group">
            <label className="tauze-label"><LinkIcon size={14} /> Link de Pagamento / Gateway</label>
            <input 
              className="tauze-input"
              type="url" 
              value={formData.payment_link} 
              onChange={e => setFormData({...formData, payment_link: e.target.value})} 
              placeholder="https://link-do-asaas-ou-stripe..." 
            />
            <span style={{ fontSize: '10px', color: 'hsl(var(--text-muted))', marginTop: '4px' }}>
              O sistema detectará automaticamente se é Stripe, Asaas, etc.
            </span>
          </div>
        </div>
      </section>
    </SidePanel>
  );
};
