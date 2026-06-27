import React, { type ReactNode, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, type LucideIcon } from 'lucide-react';

interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (e: React.FormEvent) => void;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  children: ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  size?: 'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge' | 'full' | string;
  iconSubmit?: LucideIcon;
  hideSubmit?: boolean;
  isReadOnly?: boolean;
  customFooter?: ReactNode;
  contentPadding?: string | number;
  submitDisabled?: boolean;
  /** Chamado ao clicar em "Cancelar" explicitamente. Use para clearDraft(). Se omitido, chama onClose. */
  onCancel?: () => void;
}

export const SidePanel: React.FC<SidePanelProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  subtitle,
  icon: Icon,
  children,
  submitLabel = 'Salvar Alterações',
  cancelLabel = 'Cancelar',
  loading = false,
  size = 'medium',
  iconSubmit: IconSubmit = Save,
  hideSubmit = false,
  isReadOnly = false,
  customFooter,
  contentPadding,
  submitDisabled = false,
  onCancel,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        (onCancel ?? onClose)();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background scrolling when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const widthMap: Record<string, string> = {
    small: '400px',
    medium: '600px',
    large: '800px',
    xlarge: '1000px',
    xxlarge: '1200px',
    full: '95vw',
  };

  const actualWidth = widthMap[size] || size;

  return createPortal(
    <div
      className="tauze-sidepanel-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(5, 8, 15, 0.6)',
        backdropFilter: 'blur(5px)',
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes slideUpBottom {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .tauze-sidepanel-container {
          animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          background: hsl(var(--bg-card));
          height: 100vh;
          display: flex;
          flex-direction: column;
          box-shadow: -10px 0 40px rgba(0, 0, 0, 0.3);
          border-left: 1px solid hsl(var(--border));
          border-top-left-radius: 24px;
          border-bottom-left-radius: 24px;
          overflow: hidden;
        }
        .tauze-sidepanel-header {
          padding: 20px 24px;
          background: #0f172a;
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: relative;
        }
        .tauze-sidepanel-header::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, hsl(var(--brand) / 0.5), transparent);
        }
        .tauze-sidepanel-content {
          padding: ${contentPadding !== undefined ? (typeof contentPadding === 'number' ? `${contentPadding}px` : contentPadding) : '24px'};
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: ${contentPadding !== undefined ? '0px' : '20px'};
          flex: 1;
        }
        .tauze-sidepanel-footer {
          padding: 20px 24px;
          background: hsl(var(--bg-main));
          border-top: 1px solid hsl(var(--border));
          display: flex;
          justify-content: flex-end;
          gap: 16px;
        }
        @media (max-width: 768px) {
          .tauze-sidepanel-overlay {
            align-items: flex-end !important;
            justify-content: center !important;
          }
          .tauze-sidepanel-container {
            width: 100% !important;
            height: 90vh !important;
            border-radius: 24px 24px 0 0;
            animation: slideUpBottom 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            border-left: none;
            border-top: 1px solid hsl(var(--border) / 0.5);
            box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.3);
          }
          .tauze-sidepanel-header {
            padding: 20px 24px;
            border-radius: 24px 24px 0 0;
          }
          .tauze-sidepanel-content {
            padding: 24px;
          }
          .tauze-sidepanel-footer {
            padding: 20px 24px;
          }
        }
      `}</style>

      <div
        ref={panelRef}
        className="tauze-sidepanel-container"
        style={{ width: actualWidth, maxWidth: '100vw' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="tauze-sidepanel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              className="icon-wrapper"
              style={{
                background: 'rgba(255,255,255,0.1)',
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8',
              }}
            >
              <Icon size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>{title}</h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>
                {subtitle}
              </p>
            </div>
          </div>
          <button
            className="icon-btn-secondary"
            onClick={onCancel ?? onClose}
            style={{
              background: 'transparent',
              color: '#94a3b8',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={onSubmit}
          style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}
        >
          <div className="tauze-sidepanel-content">
            <fieldset
              disabled={isReadOnly}
              style={{ border: 'none', padding: 0, margin: 0, display: 'contents' }}
            >
              {children}
            </fieldset>
          </div>

          <div className="tauze-sidepanel-footer">
            {customFooter ? (
              customFooter
            ) : (
              <>
                <button type="button" className="glass-btn secondary" onClick={onCancel ?? onClose}>
                  {isReadOnly ? 'Fechar' : cancelLabel}
                </button>
                {!hideSubmit && !isReadOnly && (
                  <button
                    type="button"
                    onClick={onSubmit}
                    className="primary-btn"
                    disabled={loading || submitDisabled}
                    style={{
                      boxShadow: submitDisabled ? 'none' : '0 8px 20px hsl(var(--brand) / 0.2)',
                      opacity: submitDisabled ? 0.5 : 1,
                      cursor: submitDisabled ? 'not-allowed' : 'pointer',
                    }}
                    title={
                      submitDisabled ? 'Resolva os itens sem vínculo antes de salvar' : undefined
                    }
                  >
                    <IconSubmit size={18} />
                    {loading ? 'Processando...' : submitLabel}
                  </button>
                )}
              </>
            )}
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
