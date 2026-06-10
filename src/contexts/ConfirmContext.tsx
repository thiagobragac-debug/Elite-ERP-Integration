import React, { createContext, useContext, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { AlertCircle, HelpCircle, AlertTriangle } from 'lucide-react';

interface ConfirmOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolveRef = useRef<(value: boolean) => void>(null);

  const confirm = (opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      (resolveRef as any).current = resolve;
    });
  };

  const handleConfirm = () => {
    setIsOpen(false);
    if (resolveRef.current) resolveRef.current(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    if (resolveRef.current) resolveRef.current(false);
  };

  const variantColors = {
    danger: {
      iconBg: 'hsl(var(--danger)/0.1)',
      iconColor: 'hsl(var(--danger))',
      btnBg: 'hsl(var(--danger))',
      btnText: '#ffffff',
      Icon: AlertTriangle
    },
    warning: {
      iconBg: 'hsl(var(--warning)/0.1)',
      iconColor: 'hsl(var(--warning))',
      btnBg: 'hsl(var(--warning))',
      btnText: '#ffffff',
      Icon: AlertCircle
    },
    primary: {
      iconBg: 'hsl(var(--brand)/0.1)',
      iconColor: 'hsl(var(--brand))',
      btnBg: 'hsl(var(--brand))',
      btnText: '#ffffff',
      Icon: HelpCircle
    }
  };

  const selectedVariant = options?.variant || 'primary';
  const colors = variantColors[selectedVariant];
  const IconComponent = colors.Icon;

  const modalOverlay = isOpen && options ? ReactDOM.createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(5, 8, 15, 0.75)', backdropFilter: 'blur(4px)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'hsl(var(--bg-card))', borderRadius: '16px', padding: '24px', maxWidth: '420px', width: '90%', boxShadow: '0 24px 80px rgba(0,0,0,0.5)', border: '1px solid hsl(var(--border))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: colors.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.iconColor }}>
            <IconComponent size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'hsl(var(--text-main))' }}>{options.title}</h3>
            <p style={{ margin: 0, fontSize: '12px', color: 'hsl(var(--text-muted))' }}>Confirmação necessária</p>
          </div>
        </div>
        <p style={{ margin: '0 0 24px 0', fontSize: '13px', color: 'hsl(var(--text-main))', lineHeight: 1.5 }}>
          {options.description}
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={handleCancel} style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--bg-main))', color: 'hsl(var(--text-main))', cursor: 'pointer', fontWeight: 700, fontSize: '13px' }}>
            {options.cancelText || 'Cancelar'}
          </button>
          <button type="button" onClick={handleConfirm} style={{ padding: '10px 16px', borderRadius: '10px', border: 'none', background: colors.btnBg, color: colors.btnText, cursor: 'pointer', fontWeight: 700, fontSize: '13px' }}>
            {options.confirmText || 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  , document.body) : null;

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {modalOverlay}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
};
