import React from 'react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  labelOn?: string;
  labelOff?: string;
  showStatus?: boolean;
  className?: string;
}

const SIZES = {
  sm: { trackW: 36, trackH: 20, thumbS: 14, pad: 3 },
  md: { trackW: 44, trackH: 24, thumbS: 18, pad: 3 },
  lg: { trackW: 52, trackH: 28, thumbS: 22, pad: 3 },
};

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md',
  labelOn = 'Ativo',
  labelOff = 'Inativo',
  showStatus = true,
  className = '',
}) => {
  const { trackW, trackH, thumbS, pad } = SIZES[size];
  const thumbX = checked ? trackW - thumbS - pad : pad;
  const thumbY = (trackH - thumbS) / 2;

  return (
    <div
      className={`toggle-switch-wrapper ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        opacity: disabled ? 0.5 : 1,
        flexShrink: 0,
      }}
    >
      {/* Track */}
      <div
        role="switch"
        aria-checked={checked}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && onChange(!checked)}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onChange(!checked);
          }
        }}
        style={{
          position: 'relative',
          display: 'inline-block',
          width: trackW,
          height: trackH,
          minWidth: trackW,
          minHeight: trackH,
          borderRadius: trackH,
          background: checked
            ? 'linear-gradient(135deg, #10b981, #059669)'
            : 'rgba(148,163,184,0.3)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'background 0.25s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: checked
            ? '0 0 0 3px rgba(16,185,129,0.18), inset 0 1px 3px rgba(0,0,0,0.12)'
            : 'inset 0 1px 3px rgba(0,0,0,0.1)',
          flexShrink: 0,
          outline: 'none',
          userSelect: 'none',
        }}
        onFocus={(e) => {
          (e.currentTarget as HTMLDivElement).style.outline = '2px solid rgba(99,102,241,0.5)';
          (e.currentTarget as HTMLDivElement).style.outlineOffset = '2px';
        }}
        onBlur={(e) => {
          (e.currentTarget as HTMLDivElement).style.outline = 'none';
        }}
      >
        {/* Thumb */}
        <div
          style={{
            position: 'absolute',
            left: thumbX,
            top: thumbY,
            width: thumbS,
            height: thumbS,
            borderRadius: '50%',
            background: 'hsl(var(--bg-card))',
            boxShadow: '0 1px 4px rgba(0,0,0,0.28), 0 0 0 0.5px rgba(0,0,0,0.08)',
            transition: 'left 0.25s cubic-bezier(0.4,0,0.2,1)',
          }}
        />
      </div>

      {/* Labels */}
      {(label || showStatus) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {label && (
            <span
              style={{
                fontSize: size === 'sm' ? 12 : size === 'lg' ? 14 : 13,
                fontWeight: 600,
                color: 'hsl(var(--text-main))',
                lineHeight: 1.3,
              }}
            >
              {label}
            </span>
          )}
          {showStatus && (
            <span
              style={{
                fontSize: size === 'sm' ? 11 : 12,
                fontWeight: 700,
                color: checked ? '#10b981' : 'hsl(var(--text-muted))',
                transition: 'color 0.2s',
                letterSpacing: '0.02em',
              }}
            >
              {checked ? labelOn : labelOff}
            </span>
          )}
          {description && (
            <span
              style={{
                fontSize: 11,
                color: 'hsl(var(--text-muted))',
                lineHeight: 1.4,
              }}
            >
              {description}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default ToggleSwitch;
