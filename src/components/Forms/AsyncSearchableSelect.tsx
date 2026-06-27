import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, Loader2 } from 'lucide-react';

export interface Option {
  value: string;
  label: string;
}

interface AsyncSearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  loadOptions: (inputValue: string) => Promise<Option[]>;
  defaultOptions?: Option[] | boolean;
  placeholder?: string;
  disabled?: boolean;
  height?: string;
}

export const AsyncSearchableSelect: React.FC<AsyncSearchableSelectProps> = ({
  value,
  onChange,
  loadOptions,
  defaultOptions = false,
  placeholder = 'Selecione...',
  disabled = false,
  height,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState<Option[]>(Array.isArray(defaultOptions) ? defaultOptions : []);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value) || (value ? { value, label: value } : undefined);
  const displayPlaceholder = selectedOption && selectedOption.label !== value ? selectedOption.label : placeholder;

  useEffect(() => {
    if (!isOpen) {
      setInputValue(selectedOption ? selectedOption.label : '');
    } else {
      setInputValue('');
    }
  }, [value, isOpen, selectedOption]);

  const fetchOptions = async (query: string) => {
    setIsLoading(true);
    try {
      const results = await loadOptions(query);
      setOptions(results);
    } catch (error) {
      console.error('Error loading options:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (defaultOptions === true) {
        fetchOptions('');
      } else if (Array.isArray(defaultOptions) && inputValue === '') {
        setOptions(defaultOptions);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const handler = setTimeout(() => {
        if (inputValue.length >= 3 || (inputValue.length === 0 && defaultOptions === true)) {
           fetchOptions(inputValue);
        }
      }, 500);
      return () => clearTimeout(handler);
    }
  }, [inputValue, isOpen, defaultOptions]);

  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (isOpen && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const dropdownHeight = 250;

      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;

      let top, bottom;

      if (spaceBelow >= dropdownHeight || spaceBelow > spaceAbove) {
        top = rect.bottom + window.scrollY;
        bottom = 'auto';
      } else {
        top = 'auto';
        bottom = window.innerHeight - rect.top - window.scrollY;
      }

      setDropdownStyle({
        position: 'absolute',
        top,
        bottom,
        left: rect.left + window.scrollX,
        width: rect.width,
        zIndex: 999999,
      });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(optionValue);
    setIsOpen(false);
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    if (disabled) return;
    
    // Prevent toggling if they click exactly on the input while it's open, 
    // to allow typing
    if (isOpen && e.target === inputRef.current) return;
    
    setIsOpen(!isOpen);
    if (!isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const dropdown = isOpen
    ? createPortal(
        <div
          className="searchable-select-dropdown"
          style={{
            ...dropdownStyle,
            background: 'hsl(var(--bg-card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            maxHeight: '250px',
            overflowY: 'auto',
            padding: '8px',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {isLoading ? (
            <div style={{ padding: '16px', textAlign: 'center', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Loader2 size={16} className="animate-spin" /> Buscando...
            </div>
          ) : options.length > 0 ? (
            options.map((opt) => (
              <div
                key={opt.value}
                onClick={(e) => handleSelect(opt.value, e)}
                style={{
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  background: opt.value === value ? 'hsl(var(--brand) / 0.1)' : 'transparent',
                  color: opt.value === value ? 'hsl(var(--brand))' : 'hsl(var(--text-main))',
                  fontWeight: opt.value === value ? 600 : 400,
                  fontSize: '13px',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (opt.value !== value) e.currentTarget.style.background = 'hsl(var(--bg-main))';
                }}
                onMouseLeave={(e) => {
                  if (opt.value !== value) e.currentTarget.style.background = 'transparent';
                }}
              >
                {opt.label}
                {opt.value === value && <Check size={16} />}
              </div>
            ))
          ) : (
            <div style={{ padding: '16px', textAlign: 'center', color: 'hsl(var(--text-muted))', fontSize: '13px' }}>
              {inputValue.length < 3 ? 'Digite 3 caracteres para buscar...' : 'Nenhum resultado.'}
            </div>
          )}
        </div>,
        document.body
      )
    : null;

  return (
    <div
      ref={wrapperRef}
      className={`searchable-select-container ${disabled ? 'disabled' : ''}`}
      onClick={handleContainerClick}
      style={{
        position: 'relative',
        width: '100%',
        height: height || '42px',
        background: disabled ? 'hsl(var(--bg-main))' : 'transparent',
        border: '1px solid hsl(var(--border))',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'all 0.2s',
      }}
    >
      <div style={{ flex: 1, padding: '0 12px', display: 'flex', alignItems: 'center' }}>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={displayPlaceholder}
          disabled={disabled}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'hsl(var(--text-main))',
            fontSize: '14px',
            cursor: disabled ? 'not-allowed' : isOpen ? 'text' : 'pointer',
          }}
        />
      </div>

      <div style={{ padding: '0 12px', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center' }}>
        <ChevronDown
          size={16}
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}
        />
      </div>

      {dropdown}
    </div>
  );
};
