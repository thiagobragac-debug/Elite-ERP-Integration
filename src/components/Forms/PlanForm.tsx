import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Server, Users, HardDrive } from 'lucide-react';

interface PlanFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

export const PlanForm: React.FC<PlanFormProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    usersLimit: '',
    storageLimit: '',
    features: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        price: initialData.price || '',
        usersLimit: initialData.usersLimit || '',
        storageLimit: initialData.storageLimit || '',
        features: (initialData.features || []).join('\n')
      });
    } else {
      setFormData({ name: '', price: '', usersLimit: '', storageLimit: '', features: '' });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="elite-modal-overlay" onClick={onClose}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="elite-modal-container"
          onClick={e => e.stopPropagation()}
          style={{ maxWidth: '540px' }}
        >
          <div className="elite-modal-header">
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

          <div className="elite-modal-content">
            <section className="elite-form-section">
              <div className="elite-section-header">
                <div className="elite-section-badge">COMERCIAL</div>
                <h4 className="elite-section-title">Definições do Produto</h4>
              </div>

              <div className="elite-input-grid">
                <div className="elite-field-group">
                  <label className="elite-label">Nome do Plano</label>
                  <input 
                    className="elite-input"
                    type="text" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="Ex: Pro, Enterprise..."
                  />
                </div>
                <div className="elite-field-group">
                  <label className="elite-label">Preço Mensal</label>
                  <input 
                    className="elite-input"
                    type="text" 
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: e.target.value})}
                    placeholder="R$ 999"
                  />
                </div>
              </div>
              
              <div className="elite-input-grid">
                <div className="elite-field-group">
                  <label className="elite-label"><Users size={14} /> Limite de Usuários</label>
                  <input 
                    className="elite-input"
                    type="number" 
                    value={formData.usersLimit}
                    onChange={e => setFormData({...formData, usersLimit: e.target.value})}
                    placeholder="Ex: 20"
                  />
                </div>
                <div className="elite-field-group">
                  <label className="elite-label"><HardDrive size={14} /> Storage Base (GB)</label>
                  <input 
                    className="elite-input"
                    type="number" 
                    value={formData.storageLimit}
                    onChange={e => setFormData({...formData, storageLimit: e.target.value})}
                    placeholder="Ex: 100"
                  />
                </div>
              </div>

              <div className="elite-field-group">
                <label className="elite-label"><Check size={14} /> Funcionalidades Inclusas</label>
                <textarea 
                  className="elite-input elite-textarea"
                  rows={5}
                  value={formData.features}
                  onChange={e => setFormData({...formData, features: e.target.value})}
                  placeholder="Dashboard Avançado&#10;Suporte 24/7&#10;Relatórios Customizados"
                />
              </div>
            </section>
          </div>

          <div className="elite-modal-footer">
            <button className="glass-btn secondary" onClick={onClose}>Cancelar</button>
            <button className="primary-btn" onClick={() => {
              onSubmit({
                ...formData,
                features: formData.features.split('\n').filter(f => f.trim())
              });
            }}>
              {initialData ? 'Salvar Alterações' : 'Criar Plano SaaS'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
