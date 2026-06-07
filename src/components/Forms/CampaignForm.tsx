import React, { useState, useEffect } from 'react';
import { usePersistentState } from '../../hooks/usePersistentState';

import { Calendar, Percent, Tag, Activity, DollarSign, Clock, Hash, ShieldCheck, CheckSquare, Square } from 'lucide-react';
import { SidePanel } from '../Layout/SidePanel';
import { SearchableSelect } from './SearchableSelect';

interface CampaignFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  availablePlans?: any[];
  isSubmitting?: boolean;
}

export const CampaignForm: React.FC<CampaignFormProps> = ({ isOpen, onClose, onSubmit, initialData, availablePlans = [], isSubmitting = false }) => {
  const [formData, setFormData] = usePersistentState('CampaignForm_formData', {
    name: '',
    discount_percentage: '',
    start_date: '',
    end_date: '',
    is_active: true,
    target_plan_ids: [] as string[],
    // New Advanced SaaS Settings
    discountType: 'percent', // 'percent' or 'fixed'
    discountAmount: '', // Fixed R$ amount
    couponCode: '', // E.g. BLACKFRIDAY50
    duration: 'once', // 'once', 'repeating', 'forever'
    durationInMonths: '', // Used only if duration === 'repeating'
    maxRedemptions: '' // Optional usage limit
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        discount_percentage: initialData.discount_percentage ? initialData.discount_percentage.toString() : '',
        start_date: initialData.start_date ? new Date(initialData.start_date).toISOString().slice(0, 16) : '',
        end_date: initialData.end_date ? new Date(initialData.end_date).toISOString().slice(0, 16) : '',
        is_active: initialData.is_active !== undefined ? initialData.is_active : true,
        target_plan_ids: initialData.target_plan_ids || [],
        discountType: initialData.settings?.discountType ?? 'percent',
        discountAmount: initialData.settings?.discountAmount ?? '',
        couponCode: initialData.settings?.couponCode ?? '',
        duration: initialData.settings?.duration ?? 'once',
        durationInMonths: initialData.settings?.durationInMonths ?? '',
        maxRedemptions: initialData.settings?.maxRedemptions ?? ''
      });
    } else {
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      setFormData({ 
        name: '', 
        discount_percentage: '', 
        start_date: now.toISOString().slice(0, 16),
        end_date: nextWeek.toISOString().slice(0, 16),
        is_active: true,
        target_plan_ids: [],
        discountType: 'percent',
        discountAmount: '',
        couponCode: '',
        duration: 'once',
        durationInMonths: '',
        maxRedemptions: ''
      });
    }
  }, [initialData, isOpen]);

  const togglePlan = (planId: string) => {
    const isActive = formData.target_plan_ids.includes(planId);
    if (isActive) {
      setFormData({ ...formData, target_plan_ids: formData.target_plan_ids.filter(id => id !== planId) });
    } else {
      setFormData({ ...formData, target_plan_ids: [...formData.target_plan_ids, planId] });
    }
  };

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={(e) => {
        e.preventDefault();
        const { discountType, discountAmount, couponCode, duration, durationInMonths, maxRedemptions, ...baseData } = formData;
        onSubmit({
          ...baseData,
          settings: {
            discountType,
            discountAmount,
            couponCode,
            duration,
            durationInMonths,
            maxRedemptions
          }
        });
      }}
      title={initialData ? 'Editar Campanha' : 'Nova Campanha'}
      icon={Tag}
      submitLabel={initialData ? 'Salvar Alterações' : 'Criar Campanha'}
      size="xlarge"
      loading={isSubmitting}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* PASSO 01: IDENTIFICAÇÃO E BENEFÍCIO */}
        <section className="tauze-form-section">
          <div className="tauze-section-header">
            <div className="tauze-section-badge">PASSO 01</div>
            <h4 className="tauze-section-title">Identificação e Benefício</h4>
          </div>
          <div className="tauze-input-grid grid-col-2">
            <div className="tauze-field-group">
              <label className="tauze-label">Nome da Campanha (Público)</label>
              <input 
                className="tauze-input"
                type="text" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                placeholder="Ex: Black Friday" 
              />
            </div>
            <div className="tauze-field-group">
              <label className="tauze-label"><Hash size={14} /> Código do Cupom (Opcional)</label>
              <input 
                className="tauze-input"
                type="text" 
                value={formData.couponCode} 
                onChange={e => setFormData({...formData, couponCode: e.target.value.toUpperCase()})} 
                placeholder="Ex: BLACK50" 
              />
            </div>
          </div>

          <div className="tauze-input-grid grid-col-2" style={{ marginTop: '16px' }}>
            <div className="tauze-field-group">
              <label className="tauze-label">Tipo e Valor do Desconto</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select 
                  className="tauze-input tauze-select" 
                  style={{ width: '120px', flexShrink: 0 }}
                  value={formData.discountType}
                  onChange={e => setFormData({...formData, discountType: e.target.value})}
                >
                  <option value="percent">% Percentual</option>
                  <option value="fixed">$ Fixo (R$)</option>
                </select>
                {formData.discountType === 'percent' ? (
                  <div style={{ position: 'relative', flexGrow: 1 }}>
                    <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-muted))' }}><Percent size={14} /></div>
                    <input 
                      className="tauze-input"
                      type="number" 
                      min="1" max="100"
                      value={formData.discount_percentage} 
                      onChange={e => setFormData({...formData, discount_percentage: e.target.value})} 
                      placeholder="Ex: 20" 
                      style={{ paddingLeft: '32px' }}
                    />
                  </div>
                ) : (
                  <div style={{ position: 'relative', flexGrow: 1 }}>
                    <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-muted))' }}><DollarSign size={14} /></div>
                    <input 
                      className="tauze-input"
                      type="number" 
                      min="1"
                      value={formData.discountAmount} 
                      onChange={e => setFormData({...formData, discountAmount: e.target.value})} 
                      placeholder="Ex: 50" 
                      style={{ paddingLeft: '32px' }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="tauze-field-group">
              <label className="tauze-label"><Activity size={14} /> Status</label>
              <div className="tauze-form-radio-group">
                <div 
                  className={`tauze-form-radio-item ${formData.is_active ? 'active' : ''}`}
                  onClick={() => setFormData({...formData, is_active: true})}
                  style={{ 
                    borderColor: formData.is_active ? 'hsl(var(--success))' : undefined,
                    background: formData.is_active ? 'hsl(var(--success)/0.1)' : undefined,
                    color: formData.is_active ? 'hsl(var(--success))' : undefined
                  }}
                >
                  <span>Ativa</span>
                </div>
                <div 
                  className={`tauze-form-radio-item ${!formData.is_active ? 'active' : ''}`}
                  onClick={() => setFormData({...formData, is_active: false})}
                  style={{
                    borderColor: !formData.is_active ? 'hsl(var(--error))' : undefined,
                    background: !formData.is_active ? 'hsl(var(--error)/0.1)' : undefined,
                    color: !formData.is_active ? 'hsl(var(--error))' : undefined
                  }}
                >
                  <span>Inativa</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PASSO 02: REGRAS DE APLICAÇÃO E VALIDADE */}
        <section className="tauze-form-section">
          <div className="tauze-section-header">
            <div className="tauze-section-badge">PASSO 02</div>
            <h4 className="tauze-section-title">Regras de Aplicação e Validade</h4>
          </div>

          <div className="tauze-input-grid grid-col-2">
            <div className="tauze-field-group">
              <label className="tauze-label"><Clock size={14} /> Duração do Desconto (SaaS)</label>
              <SearchableSelect 
                value={formData.duration}
                onChange={(val: any) => setFormData({...formData, duration: val})}
                options={[
                  { value: 'once', label: 'Uma vez (Apenas primeira fatura)' },
                  { value: 'repeating', label: 'Múltiplos meses (Recorrente com limite)' },
                  { value: 'forever', label: 'Para Sempre (Enquanto durar a assinatura)' },
                ]}
              />
            </div>
            
            {formData.duration === 'repeating' ? (
              <div className="tauze-field-group">
                <label className="tauze-label"><Clock size={14} /> Duração em Meses</label>
                <input 
                  className="tauze-input"
                  type="number" 
                  min="2"
                  value={formData.durationInMonths} 
                  onChange={e => setFormData({...formData, durationInMonths: e.target.value})} 
                  placeholder="Ex: 6 (Aplica durante 6 faturas)" 
                />
              </div>
            ) : (
              <div className="tauze-field-group">
                <label className="tauze-label"><ShieldCheck size={14} /> Limite de Resgates (Opcional)</label>
                <input 
                  className="tauze-input"
                  type="number" 
                  min="1"
                  value={formData.maxRedemptions} 
                  onChange={e => setFormData({...formData, maxRedemptions: e.target.value})} 
                  placeholder="Ex: 100 (Só os primeiros 100 usam)" 
                />
              </div>
            )}
          </div>

          {formData.duration === 'repeating' && (
             <div className="tauze-input-grid grid-col-1" style={{ marginTop: '16px' }}>
                <div className="tauze-field-group">
                  <label className="tauze-label"><ShieldCheck size={14} /> Limite de Resgates (Opcional)</label>
                  <input 
                    className="tauze-input"
                    type="number" 
                    min="1"
                    value={formData.maxRedemptions} 
                    onChange={e => setFormData({...formData, maxRedemptions: e.target.value})} 
                    placeholder="Ex: 100 (Só os primeiros 100 usuários podem usar)" 
                  />
                </div>
             </div>
          )}

          <div className="tauze-input-grid grid-col-2" style={{ marginTop: '16px' }}>
            <div className="tauze-field-group">
              <label className="tauze-label"><Calendar size={14} /> Data e Hora de Início</label>
              <input 
                className="tauze-input"
                type="datetime-local" 
                value={formData.start_date} 
                onChange={e => setFormData({...formData, start_date: e.target.value})} 
              />
            </div>
            <div className="tauze-field-group">
              <label className="tauze-label"><Calendar size={14} /> Data e Hora de Término</label>
              <input 
                className="tauze-input"
                type="datetime-local" 
                value={formData.end_date} 
                onChange={e => setFormData({...formData, end_date: e.target.value})} 
              />
            </div>
          </div>
        </section>

        {/* PASSO 03: PLANOS APLICÁVEIS */}
        <section className="tauze-form-section">
          <div className="tauze-section-header">
            <div className="tauze-section-badge">PASSO 03</div>
            <h4 className="tauze-section-title">Planos Elegíveis</h4>
          </div>

          <div className="tauze-field-group">
            <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '12px' }}>
              Selecione os planos que aceitam esta campanha. Se nenhum for marcado, ela será válida para <strong>TODOS</strong> os planos pagos.
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
              {availablePlans.filter(p => p.price > 0).map(plan => {
                const isActive = formData.target_plan_ids.includes(plan.id);
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => togglePlan(plan.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span>{plan.name}</span>
                      <span style={{ fontSize: '10px', color: isActive ? 'hsl(var(--brand)/0.7)' : 'hsl(var(--text-muted))', fontWeight: 500 }}>R$ {plan.price}</span>
                    </div>
                    {isActive ? <CheckSquare size={16} color="hsl(var(--brand))" /> : <Square size={16} color="hsl(var(--text-muted))" />}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

      </div>
    </SidePanel>
  );
};
