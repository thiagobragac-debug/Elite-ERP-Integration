import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  icon?: React.ReactNode;
  creatable?: boolean;
  disabled?: boolean;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Selecione...',
  icon,
  creatable = false,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find(opt => opt.value === value);
  const displayPlaceholder = selectedOption ? selectedOption.label : placeholder;

  // Sync inputValue with the actual selected option label
  useEffect(() => {
    if (!isOpen) {
      setInputValue(selectedOption ? selectedOption.label : '');
    } else {
      setInputValue('');
    }
  }, [value, isOpen, options]);

  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        // Also check if they clicked inside the portal dropdown
        const dropdown = document.getElementById('searchable-select-portal');
        if (dropdown && dropdown.contains(event.target as Node)) {
          return;
        }
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const dropdownHeight = 250; // default max height of dropdown

      if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
        // Open upwards
        setDropdownStyle({
          position: 'fixed',
          bottom: window.innerHeight - rect.top + 4,
          left: rect.left,
          width: rect.width,
          zIndex: 99999
        });
      } else {
        // Open downwards
        setDropdownStyle({
          position: 'fixed',
          top: rect.bottom + 4,
          left: rect.left,
          width: rect.width,
          zIndex: 99999
        });
      }
    }
  }, [isOpen, inputValue]); // Update if typed value changes layout

  const filteredOptions = options.filter(opt => {
    const safeLabel = (opt.label || '').toString().toLowerCase();
    const safeInput = (inputValue || '').toString().toLowerCase();
    return safeLabel.includes(safeInput);
  });

  const exactMatch = options.some(opt => 
    (opt.label || '').toString().toLowerCase() === (inputValue || '').toString().toLowerCase()
  );

  const showCreatable = creatable && inputValue.trim().length > 0 && !exactMatch;

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <div 
        className={`tauze-input ${isOpen ? 'focused' : ''} ${disabled ? 'disabled' : ''}`}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          padding: '0 14px',
          background: disabled ? 'hsl(var(--bg-main) / 0.5)' : 'var(--bg-main)',
          minHeight: '42px',
          cursor: disabled ? 'not-allowed' : 'text',
          opacity: disabled ? 0.6 : 1,
          border: isOpen ? '1px solid hsl(var(--brand))' : undefined,
          boxShadow: isOpen ? '0 0 0 4px hsl(var(--brand) / 0.1)' : undefined
        }}
        onClick={() => {
          if (disabled) return;
          setIsOpen(true);
          inputRef.current?.focus();
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', flex: 1 }}>
          {icon && <span style={{ color: '#94a3b8', display: 'flex' }}>{icon}</span>}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            placeholder={displayPlaceholder}
            onChange={(e) => {
              setInputValue(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => {
              setIsOpen(true);
              setInputValue('');
            }}
            disabled={disabled}
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              width: '100%',
              padding: '10px 0',
              fontSize: '13px',
              color: 'inherit',
              cursor: disabled ? 'not-allowed' : 'inherit'
            }}
          />
        </div>
        <div style={{ cursor: 'pointer', padding: '4px' }} onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}>
          <ChevronDown size={16} color="#94a3b8" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </div>
      </div>

      {isOpen && createPortal(
        <div id="searchable-select-portal" style={{
          ...dropdownStyle,
          background: 'hsl(var(--bg-card))',
          border: '1px solid hsl(var(--border))',
          borderRadius: '12px',
          boxShadow: '0 10px 30px -10px rgb(0 0 0 / 0.5)',
          maxHeight: '250px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <div style={{ overflowY: 'auto', padding: '4px' }}>
            {showCreatable && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(inputValue); // Using the exact typed value
                  setIsOpen(false);
                  inputRef.current?.blur();
                }}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  background: 'hsl(var(--brand) / 0.1)',
                  color: 'hsl(var(--brand))',
                  fontWeight: 600,
                  marginBottom: '4px'
                }}
              >
                + Criar "{inputValue}"
              </div>
            )}
            
            {filteredOptions.length === 0 && !showCreatable ? (
              <div style={{ padding: '16px', textAlign: 'center', color: 'hsl(var(--text-muted))', fontSize: '13px' }}>
                Nenhum resultado encontrado. <br/> <span style={{ fontSize: '10px', marginTop: '4px', display: 'block' }}>[Total base: {options.length}]</span>
              </div>
            ) : (
              filteredOptions.map(opt => (
                <div
                  key={opt.value}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(opt.value);
                    setIsOpen(false);
                    inputRef.current?.blur();
                  }}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: value === opt.value ? 'hsl(var(--brand) / 0.08)' : 'transparent',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'hsl(var(--bg-main))'}
                  onMouseLeave={(e) => e.currentTarget.style.background = value === opt.value ? 'hsl(var(--brand) / 0.08)' : 'transparent'}
                >
                  <span style={{ 
                    fontSize: '13px', 
                    fontWeight: value === opt.value ? 700 : 500,
                    color: value === opt.value ? 'hsl(var(--brand))' : 'hsl(var(--text-main))'
                  }}>
                    {opt.label}
                  </span>
                  {value === opt.value && <Check size={16} color="hsl(var(--brand))" />}
                </div>
              ))
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
