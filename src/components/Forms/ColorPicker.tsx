import React from 'react';
import { Palette } from 'lucide-react';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  colors?: { value: string; label: string }[];
}

const DEFAULT_COLORS = [
  { value: '#6366f1', label: 'Indigo' },
  { value: '#10b981', label: 'Verde' },
  { value: '#f97316', label: 'Laranja' },
  { value: '#ef4444', label: 'Vermelho' },
  { value: '#8b5cf6', label: 'Roxo' },
  { value: '#06b6d4', label: 'Ciano' },
  { value: '#ec4899', label: 'Rosa' },
  { value: '#64748b', label: 'Cinza' }
];

export const ColorPicker: React.FC<ColorPickerProps> = ({ 
  value, 
  onChange, 
  label = "Cor de Identificação",
  colors = DEFAULT_COLORS
}) => {
  return (
    <div className="tauze-field-group">
      <label className="tauze-label">
        <Palette size={14} /> {label}
      </label>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px', minHeight: '38px' }}>
        {colors.map(color => (
          <button
            key={color.value}
            type="button"
            onClick={() => onChange(color.value)}
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: color.value,
              border: value === color.value ? '2px solid white' : '2px solid transparent',
              boxShadow: value === color.value 
                ? `0 0 0 2px ${color.value}, 0 4px 10px rgba(0,0,0,0.15)` 
                : '0 2px 4px rgba(0,0,0,0.05)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              transform: value === color.value ? 'scale(1.15)' : 'scale(1)',
              padding: 0
            }}
            title={color.label}
          />
        ))}
        <div 
          style={{
            position: 'relative',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: 'conic-gradient(from 0deg, #f87171, #facc15, #4ade80, #2dd4bf, #60a5fa, #c084fc, #f472b6, #f87171)',
            border: !colors.some(c => c.value === value) ? '2px solid white' : '2px solid transparent',
            boxShadow: !colors.some(c => c.value === value) 
              ? `0 0 0 2px ${value}, 0 4px 10px rgba(0,0,0,0.15)` 
              : '0 2px 4px rgba(0,0,0,0.05)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            transform: !colors.some(c => c.value === value) ? 'scale(1.15)' : 'scale(1)',
            marginLeft: '4px'
          }}
          title="Cor Personalizada"
        >
          <input
            type="color"
            value={value || '#000000'}
            onChange={(e) => onChange(e.target.value)}
            style={{
              opacity: 0,
              width: '100%',
              height: '100%',
              cursor: 'pointer',
              position: 'absolute',
              top: 0,
              left: 0
            }}
          />
        </div>
      </div>
    </div>
  );
};
