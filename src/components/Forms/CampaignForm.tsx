import React, { useState, useEffect } from 'react';
import { Calendar, Percent, Tag, Activity } from 'lucide-react';
import { SidePanel } from '../Layout/SidePanel';

interface CampaignFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  availablePlans?: any[];
  isSubmitting?: boolean;
}

export const CampaignForm: React.FC<CampaignFormProps> = ({ isOpen, onClose, onSubmit, initialData, availablePlans = [], isSubmitting = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    discount_percentage: '',
    start_date: '',
    end_date: '',
    is_active: true,
    target_plan_ids: [] as string[]
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        discount_percentage: initialData.discount_percentage ? initialData.discount_percentage.toString() : '',
        start_date: initialData.start_date ? new Date(initialData.start_date).toISOString().slice(0, 16) : '',
        end_date: initialData.end_date ? new Date(initialData.end_date).toISOString().slice(0, 16) : '',
        is_active: initialData.is_active !== undefined ? initialData.is_active : true,
        target_plan_ids: initialData.target_plan_ids || []
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
        target_plan_ids: []
      });
    }
  }, [initialData, isOpen]);

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(formData);
      }}
      title={initialData ? 'Editar Campanha' : 'Nova Campanha'}
      icon={Tag}
      submitLabel={initialData ? 'Salvar Alterações' : 'Criar Campanha'}
      size="medium"
      loading={isSubmitting}
    >
      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 01</div>
          <h4 className="tauze-section-title">Identificação e Benefício</h4>
        </div>
        <div className="tauze-input-grid grid-col-1">
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
        </div>

        <div className="tauze-input-grid grid-col-2" style={{ marginTop: '16px' }}>
          <div className="tauze-field-group">
            <label className="tauze-label"><Percent size={14} /> Desconto (%)</label>
            <input 
              className="tauze-input"
              type="number" 
              min="1"
              max="100"
              value={formData.discount_percentage} 
              onChange={e => setFormData({...formData, discount_percentage: e.target.value})} 
              placeholder="Ex: 20" 
            />
          </div>
          <div className="tauze-field-group">
            <label className="tauze-label"><Activity size={14} /> Status</label>
            <div className="tauze-form-radio-group">
              <div 
                className={`tauze-form-radio-item ${formData.is_active ? 'active' : ''}`}
                onClick={() => setFormData({...formData, is_active: true})}
                style={{ 
                  borderColor: formData.is_active ? '#10b981' : undefined,
                  background: formData.is_active ? '#10b98115' : undefined,
                  color: formData.is_active ? '#10b981' : undefined
                }}
              >
                <span>Ativa</span>
              </div>
              <div 
                className={`tauze-form-radio-item ${!formData.is_active ? 'active' : ''}`}
                onClick={() => setFormData({...formData, is_active: false})}
                style={{
                  borderColor: !formData.is_active ? '#ef4444' : undefined,
                  background: !formData.is_active ? '#ef444415' : undefined,
                  color: !formData.is_active ? '#ef4444' : undefined
                }}
              >
                <span>Inativa</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 02</div>
          <h4 className="tauze-section-title">Prazos e Condições</h4>
        </div>
        <div className="tauze-input-grid grid-col-2">
          <div className="tauze-field-group">
            <label className="tauze-label"><Calendar size={14} /> Data de Início</label>
            <input 
              className="tauze-input"
              type="datetime-local" 
              value={formData.start_date} 
              onChange={e => setFormData({...formData, start_date: e.target.value})} 
            />
          </div>
          <div className="tauze-field-group">
            <label className="tauze-label"><Calendar size={14} /> Data de Término</label>
            <input 
              className="tauze-input"
              type="datetime-local" 
              value={formData.end_date} 
              onChange={e => setFormData({...formData, end_date: e.target.value})} 
            />
          </div>
        </div>

        <div className="tauze-input-grid grid-col-1" style={{ marginTop: '16px' }}>
          <div className="tauze-field-group">
            <label className="tauze-label">Planos Aplicáveis (Opcional)</label>
            <select 
              className="tauze-input tauze-select"
              multiple
              style={{ minHeight: '100px' }}
              value={formData.target_plan_ids}
              onChange={e => {
                const values = Array.from(e.target.selectedOptions, option => option.value);
                setFormData({...formData, target_plan_ids: values});
              }}
            >
              {availablePlans.filter(p => p.price > 0).map(p => (
                <option key={p.id} value={p.id}>{p.name} - R$ {p.price}</option>
              ))}
            </select>
            <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginTop: '4px' }}>
              Selecione segurando CTRL. Deixe vazio para aplicar a TODOS os planos pagos.
            </span>
          </div>
        </div>
      </section>
    </SidePanel>
  );
};
