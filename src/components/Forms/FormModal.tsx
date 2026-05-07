import React, { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, type LucideIcon } from 'lucide-react';

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  children: ReactNode;
  submitLabel?: string;
  loading?: boolean;
}

export const FormModal: React.FC<FormModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  title, 
  subtitle, 
  icon: Icon, 
  children,
  submitLabel = 'Salvar Alterações',
  loading = false
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="elite-modal-overlay" onClick={onClose}>
      <div className="elite-modal-container" onClick={e => e.stopPropagation()}>
        <div className="elite-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="icon-wrapper" style={{ 
              background: 'rgba(255,255,255,0.1)', 
              width: '44px', 
              height: '44px', 
              borderRadius: '12px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#38bdf8'
            }}>
              <Icon size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>{title}</h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>{subtitle}</p>
            </div>
          </div>
          <button className="icon-btn-secondary" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="elite-modal-content">
            <div className="elite-input-grid">
              {children}
            </div>
          </div>

          <div className="elite-modal-footer">
            <button type="button" className="glass-btn secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="primary-btn" disabled={loading} style={{ boxShadow: '0 8px 20px hsl(var(--brand) / 0.2)' }}>
              <Save size={18} />
              {loading ? 'Processando...' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
