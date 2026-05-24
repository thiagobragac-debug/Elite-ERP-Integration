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
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Selecione...',
  icon
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync inputValue with the actual selected option label
  useEffect(() => {
    if (!isOpen) {
      const selectedOption = options.find(opt => opt.value === value);
      setInputValue(selectedOption ? selectedOption.label : '');
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
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        zIndex: 99999
      });
    }
  }, [isOpen, inputValue]); // Update if typed value changes layout

  const filteredOptions = options.filter(opt => {
    const safeLabel = (opt.label || '').toString().toLowerCase();
    const safeInput = (inputValue || '').toString().toLowerCase();
    return safeLabel.includes(safeInput);
  });

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <div 
        className={`tauze-input ${isOpen ? 'focused' : ''}`}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          padding: '0 14px',
          background: 'var(--bg-main)',
          minHeight: '42px',
          cursor: 'text',
          border: isOpen ? '1px solid hsl(var(--brand))' : undefined,
          boxShadow: isOpen ? '0 0 0 4px hsl(var(--brand) / 0.1)' : undefined
        }}
        onClick={() => {
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
            placeholder={placeholder}
            onChange={(e) => {
              setInputValue(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              width: '100%',
              padding: '10px 0',
              fontSize: '13px',
              color: 'inherit'
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
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          maxHeight: '250px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <div style={{ overflowY: 'auto', padding: '4px' }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '12px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                Nenhum resultado encontrado. <br/> <span style={{ fontSize: '10px' }}>[Total base: {options.length}]</span>
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
                    background: value === opt.value ? '#f8fafc' : 'transparent',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                  onMouseLeave={(e) => e.currentTarget.style.background = value === opt.value ? '#f8fafc' : 'transparent'}
                >
                  <span style={{ 
                    fontSize: '13px', 
                    fontWeight: value === opt.value ? 600 : 500,
                    color: value === opt.value ? 'hsl(var(--brand))' : '#334155'
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
