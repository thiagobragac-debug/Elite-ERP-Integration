import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Percent, Tag, Activity } from 'lucide-react';

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
            style={{ maxWidth: 500 }}
          >
            <div className="tauze-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Tag size={20} color="#f59e0b" />
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>
                  {initialData ? 'Editar Campanha' : 'Nova Campanha'}
                </h3>
              </div>
              <button className="icon-btn-secondary" onClick={onClose}>
                <X size={20} />
              </button>
            </div>

            <div className="tauze-modal-content">
              
              <section className="tauze-form-section">
                <div className="tauze-input-grid" style={{ gridTemplateColumns: '1fr' }}>
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

                <div className="tauze-input-grid">
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
                    <select 
                      className="tauze-input tauze-select"
                      value={formData.is_active ? 'true' : 'false'} 
                      onChange={e => setFormData({...formData, is_active: e.target.value === 'true'})}
                    >
                      <option value="true">Ativa</option>
                      <option value="false">Pausada / Encerrada</option>
                    </select>
                  </div>
                </div>

                <div className="tauze-input-grid">
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

                <div className="tauze-input-grid" style={{ gridTemplateColumns: '1fr', marginTop: 15 }}>
                  <div className="tauze-field-group">
                    <label className="tauze-label">Planos Aplicáveis (Opcional)</label>
                    <select 
                      className="tauze-input tauze-select"
                      multiple
                      style={{ height: 100 }}
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
                    <span style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                      Selecione segurando CTRL. Deixe vazio para aplicar a TODOS os planos pagos.
                    </span>
                  </div>
                </div>
              </section>

            </div>

            <div className="tauze-modal-footer">
              <button className="glass-btn secondary" onClick={onClose} disabled={isSubmitting}>Cancelar</button>
              <button className="primary-btn" onClick={() => onSubmit(formData)} disabled={isSubmitting} style={{ boxShadow: '0 8px 20px hsl(var(--brand) / 0.2)' }}>
                {isSubmitting ? 'Salvando...' : (initialData ? 'Salvar Alterações' : 'Criar Campanha')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
