import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface FormSectionProps {
  title: string;
  icon?: LucideIcon;
  badge?: string;
  marginTop?: number | string;
  className?: string;
  onClick?: () => void;
  rightElement?: React.ReactNode;
}

export const FormSection: React.FC<FormSectionProps> = ({ 
  title, 
  icon: Icon, 
  badge,
  marginTop = '24px',
  className = '',
  onClick,
  rightElement
}) => {
  return (
    <div 
      className={`form-section-title full-width ${className}`} 
      style={{ marginTop, cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
        {badge && <div className="tauze-section-badge">{badge}</div>}
        {Icon && <Icon size={16} />}
        <span>{title}</span>
      </div>
      {rightElement && (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {rightElement}
        </div>
      )}
    </div>
  );
};

