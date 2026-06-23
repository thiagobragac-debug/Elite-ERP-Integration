import React, { type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, type LucideIcon } from 'lucide-react';

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  children: ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  iconSubmit?: LucideIcon;
  hideSubmit?: boolean;
  submitColor?: string;
  isReadOnly?: boolean;
  highlightedFields?: string[];
}

const mapDbToFormFields = (tableName: string, dbFields: string[]): string[] => {
  const mapped: string[] = [];
  for (const field of dbFields) {
    if (tableName === 'parceiros') {
      if (field === 'nome') {
        mapped.push('name');
      } else if (field === 'documento') {
        mapped.push('cnpj');
      } else if (field === 'tipo') {
        mapped.push('type');
      } else if (field === 'telefone') {
        mapped.push('phone');
      } else if (field === 'limite_credito') {
        mapped.push('creditLimit');
      } else if (field === 'segmento') {
        mapped.push('segment');
      } else {
        mapped.push(field);
      }
    } else if (tableName === 'maquinas') {
      if (field === 'horimetro_atual') {
        mapped.push('horimetro_inicial');
      } else if (field === 'quilometragem_atual') {
        mapped.push('quilometragem_inicial');
      } else {
        mapped.push(field);
      }
    } else {
      mapped.push(field);
    }
  }
  return mapped;
};

const isFieldMatch = (labelText: string, fieldName: string): boolean => {
  const normLabel = labelText
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
  const normField = fieldName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');

  if (
    normField === 'documento' ||
    normField === 'cnpjcpf' ||
    normField === 'cnpj' ||
    normField === 'cnpjcpf'
  ) {
    if (
      normLabel.includes('cnpj') ||
      normLabel.includes('cpf') ||
      normLabel.includes('documento')
    ) {
      return true;
    }
  }
  if (
    normField === 'nomerapid' ||
    normField === 'nomeraao' ||
    normField === 'nome' ||
    normField === 'nomerao' ||
    normField === 'nome_razao'
  ) {
    if (normLabel.includes('nome') || normLabel.includes('razao')) {
      return true;
    }
  }
  if (
    normField === 'limitecredito' ||
    normField === 'creditlimit' ||
    normField === 'limite_credito'
  ) {
    if (normLabel.includes('credito') || normLabel.includes('limite')) {
      return true;
    }
  }
  if (normField === 'categoria' || normField === 'type' || normField === 'tipo') {
    if (normLabel.includes('tipo') || normLabel.includes('categoria')) {
      return true;
    }
  }
  if (normField === 'capacidadeua' || normField === 'capacidade') {
    if (normLabel.includes('capacidade')) {
      return true;
    }
  }
  if (normField === 'gmdalvo') {
    if (normLabel.includes('gmd')) {
      return true;
    }
  }
  if (normField === 'pesosalvo' || normField === 'peso') {
    if (normLabel.includes('peso')) {
      return true;
    }
  }
  if (normField === 'telefone' || normField === 'phone') {
    if (
      normLabel.includes('telefone') ||
      normLabel.includes('celular') ||
      normLabel.includes('fone') ||
      normLabel.includes('phone')
    ) {
      return true;
    }
  }
  if (normField === 'marca') {
    if (normLabel.includes('marca')) {
      return true;
    }
  }
  if (normField === 'modelo') {
    if (normLabel.includes('modelo')) {
      return true;
    }
  }

  return normLabel.includes(normField) || normField.includes(normLabel);
};

export const FormModal: React.FC<FormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  subtitle,
  icon: Icon,
  children,
  submitLabel = 'Salvar Alterações',
  cancelLabel,
  loading = false,
  size = 'medium',
  iconSubmit: IconSubmit = Save,
  hideSubmit = false,
  isReadOnly = false,
  highlightedFields = [],
}) => {
  const modalRef = React.useRef<HTMLDivElement>(null);

  // Auto-detect if we are on the audit log page to enforce read-only historical view
  const isAuditPage =
    typeof window !== 'undefined' && window.location.pathname.includes('/admin/auditoria');
  const actualReadOnly = isReadOnly || isAuditPage;

  // Dynamic extraction of audit changes from global scope
  const lastLog = typeof window !== 'undefined' ? (window as any).__lastAuditLog : null;

  const dbChangedFields = React.useMemo(() => {
    if (!lastLog || lastLog.action !== 'UPDATE') {
      return [];
    }
    const oldData = lastLog.old_data || {};
    const newData = lastLog.new_data || {};
    const changed: string[] = [];

    const allKeys = Array.from(new Set([...Object.keys(oldData), ...Object.keys(newData)]));
    for (const key of allKeys) {
      if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
        changed.push(key);
      }
    }
    return changed;
  }, [lastLog, isOpen]);

  const actualHighlightedFields = React.useMemo(() => {
    if (highlightedFields && highlightedFields.length > 0) {
      return highlightedFields;
    }
    if (!isAuditPage || !lastLog) {
      return [];
    }
    return mapDbToFormFields(lastLog.table_name, dbChangedFields);
  }, [highlightedFields, isAuditPage, lastLog, dbChangedFields]);

  React.useEffect(() => {
    if (!isOpen || !actualReadOnly || !modalRef.current) {
      return;
    }

    const timer = setTimeout(() => {
      const formGroups = modalRef.current?.querySelectorAll('.form-group');
      if (!formGroups) {
        return;
      }

      formGroups.forEach((group: any) => {
        const label = group.querySelector('label');
        if (!label) {
          return;
        }

        const labelText = label.textContent || '';
        const isHighlighted = (actualHighlightedFields || []).some((field) =>
          isFieldMatch(labelText, field)
        );

        if (isHighlighted) {
          group.classList.add('tauze-form-highlighted');

          if (!group.querySelector('.audit-change-badge')) {
            const badge = document.createElement('span');
            badge.className = 'audit-change-badge';
            badge.innerText = 'Alterado';
            badge.style.position = 'absolute';
            badge.style.right = '12px';
            badge.style.top = '10px';
            badge.style.fontSize = '9px';
            badge.style.fontWeight = '900';
            badge.style.textTransform = 'uppercase';
            badge.style.background = '#f59e0b';
            badge.style.color = '#ffffff';
            badge.style.padding = '2px 6px';
            badge.style.borderRadius = '4px';
            badge.style.letterSpacing = '0.5px';
            group.style.position = 'relative';
            group.appendChild(badge);
          }
        }
      });
    }, 150);

    return () => clearTimeout(timer);
  }, [isOpen, actualReadOnly, actualHighlightedFields]);

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div
      className="tauze-modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <style>{`
        .tauze-form-highlighted {
          border: 1.5px solid #f59e0b !important;
          box-shadow: 0 0 16px rgba(245, 158, 11, 0.2) !important;
          background: rgba(245, 158, 11, 0.02) !important;
          border-radius: 12px;
          padding: 10px;
          position: relative;
          transition: all 0.3s ease;
          animation: pulseHighlight 2s infinite ease-in-out;
        }

        @keyframes pulseHighlight {
          0% { box-shadow: 0 0 12px rgba(245, 158, 11, 0.2); }
          50% { box-shadow: 0 0 20px rgba(245, 158, 11, 0.45); }
          100% { box-shadow: 0 0 12px rgba(245, 158, 11, 0.2); }
        }

        .tauze-form-highlighted label {
          color: #f59e0b !important;
          font-weight: 800 !important;
        }

        .tauze-form-highlighted input, 
        .tauze-form-highlighted select, 
        .tauze-form-highlighted textarea {
          border-color: #f59e0b !important;
          color: inherit !important;
        }
      `}</style>

      <div
        ref={modalRef}
        className={`tauze-modal-container ${size}`}
        style={{
          maxWidth:
            size === 'xlarge'
              ? '1200px'
              : size === 'large'
                ? '900px'
                : size === 'small'
                  ? '440px'
                  : '680px',
          width: '95%',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="tauze-modal-header">
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
          <button className="icon-btn-secondary" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={onSubmit}
          style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}
        >
          <div className="tauze-modal-content">
            <fieldset
              disabled={actualReadOnly}
              style={{ border: 'none', padding: 0, margin: 0, display: 'contents' }}
            >
              <div className="tauze-input-grid">{children}</div>
            </fieldset>
          </div>

          <div className="tauze-modal-footer">
            <button type="button" className="glass-btn secondary" onClick={onClose}>
              {actualReadOnly ? 'Fechar' : cancelLabel || 'Cancelar'}
            </button>
            {!hideSubmit && !actualReadOnly && (
              <button
                type="submit"
                className="primary-btn"
                disabled={loading}
                style={{ boxShadow: '0 8px 20px hsl(var(--brand) / 0.2)' }}
              >
                <IconSubmit size={18} />
                {loading ? 'Processando...' : submitLabel}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
