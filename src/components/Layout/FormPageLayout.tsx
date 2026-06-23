import React, { type ReactNode } from 'react';
import { ArrowLeft, Save, type LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FormPageLayoutProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  children: ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  loading?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  backPath?: string;
  tabs?: { id: string; label: string }[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

export const FormPageLayout: React.FC<FormPageLayoutProps> = ({
  title,
  subtitle,
  icon: Icon,
  children,
  onSubmit,
  loading = false,
  submitLabel = 'Salvar',
  cancelLabel = 'Cancelar',
  onCancel,
  backPath,
  tabs,
  activeTab,
  onTabChange,
}) => {
  const navigate = useNavigate();

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else if (backPath) {
      navigate(backPath);
    } else {
      navigate(-1);
    }
  };

  return (
    <div
      className="form-page-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '24px',
        gap: '24px',
      }}
    >
      <style>{`
        .form-page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: hsl(var(--bg-card));
          padding: 24px 32px;
          border-radius: 24px;
          border: 1px solid hsl(var(--border));
          box-shadow: 0 4px 20px rgba(0,0,0,0.05);
        }
        .form-page-back-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          color: hsl(var(--text-muted));
          background: transparent;
          border: none;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          margin-bottom: 12px;
          padding: 0;
        }
        .form-page-back-btn:hover {
          color: hsl(var(--brand));
        }
        .form-page-content {
          background: hsl(var(--bg-card));
          border-radius: 24px;
          border: 1px solid hsl(var(--border));
          padding: 32px;
          flex: 1;
          box-shadow: 0 4px 20px rgba(0,0,0,0.05);
          display: flex;
          flex-direction: column;
        }
        .form-page-tabs {
          display: flex;
          gap: 32px;
          border-bottom: 1px solid hsl(var(--border));
          margin-bottom: 32px;
        }
        .form-page-tab {
          padding: 12px 0;
          background: transparent;
          border: none;
          color: hsl(var(--text-muted));
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          position: relative;
        }
        .form-page-tab.active {
          color: hsl(var(--brand));
        }
        .form-page-tab.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 2px;
          background: hsl(var(--brand));
        }
        .form-page-footer {
          display: flex;
          justify-content: flex-end;
          gap: 16px;
          margin-top: auto;
          padding-top: 32px;
          border-top: 1px solid hsl(var(--border));
        }
      `}</style>

      <div>
        <button onClick={handleCancel} className="form-page-back-btn">
          <ArrowLeft size={16} /> Voltar
        </button>
        <div className="form-page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              className="icon-wrapper"
              style={{
                background: 'hsl(var(--brand) / 0.1)',
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'hsl(var(--brand))',
              }}
            >
              <Icon size={28} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 800 }}>{title}</h2>
              <p
                style={{
                  margin: '4px 0 0',
                  fontSize: '14px',
                  color: 'hsl(var(--text-muted))',
                  fontWeight: 500,
                }}
              >
                {subtitle}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button type="button" className="glass-btn secondary" onClick={handleCancel}>
              {cancelLabel}
            </button>
            <button
              type="button"
              className="primary-btn"
              onClick={onSubmit}
              disabled={loading}
              style={{ boxShadow: '0 8px 20px hsl(var(--brand) / 0.2)' }}
            >
              <Save size={18} />
              {loading ? 'Processando...' : submitLabel}
            </button>
          </div>
        </div>
      </div>

      <div className="form-page-content">
        {tabs && tabs.length > 0 && (
          <div className="form-page-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`form-page-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => onTabChange && onTabChange(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={onSubmit} style={{ display: 'contents' }}>
          <div className="tauze-input-grid">{children}</div>
        </form>
      </div>
    </div>
  );
};
