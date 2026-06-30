import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, Loader2 } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface AsyncSearchableSelectProps {
  value: string;
  onChange: (value: string, label: string) => void;
  loadOptions: (inputValue: string) => Promise<Option[]>;
  defaultOptions?: Option[];
  placeholder?: string;
  icon?: React.ReactNode;
  creatable?: boolean;
  disabled?: boolean;
  height?: string;
}

export const AsyncSearchableSelect: React.FC<AsyncSearchableSelectProps> = ({
  value,
  onChange,
  loadOptions,
  defaultOptions = [],
  placeholder = 'Digite para buscar...',
  icon,
  creatable = false,
  disabled = false,
  height,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState<Option[]>(defaultOptions);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value) || { value, label: value };
  const displayPlaceholder = value && selectedOption && selectedOption.label !== value ? selectedOption.label : placeholder;

  useEffect(() => {
    if (!isOpen) {
      setInputValue(value && selectedOption && selectedOption.label !== value ? selectedOption.label : '');
    } else {
      setInputValue('');
    }
  }, [value, isOpen, selectedOption]);

  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        const dropdown = document.getElementById('async-searchable-select-portal');
        if (dropdown && dropdown.contains(event.target as Node)) {
          return;
        }
        setIsOpen(false);
      }
    }
    function handleScroll(event: Event) {
      const dropdown = document.getElementById('async-searchable-select-portal');
      if (dropdown && dropdown.contains(event.target as Node)) return;
      setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, []);

  useEffect(() => {
    if (isOpen && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const dropdownHeight = 250;
      if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
        setDropdownStyle({
          position: 'fixed',
          bottom: window.innerHeight - rect.top + 4,
          left: rect.left,
          width: rect.width,
          minWidth: Math.max(rect.width, 220),
          zIndex: 99999,
        });
      } else {
        setDropdownStyle({
          position: 'fixed',
          top: rect.bottom + 4,
          left: rect.left,
          width: rect.width,
          minWidth: Math.max(rect.width, 220),
          zIndex: 99999,
        });
      }
    }
  }, [isOpen, options]);

  useEffect(() => {
    const fetchOptions = async () => {
      setLoading(true);
      try {
        const results = await loadOptions(inputValue);
        setOptions(results);
      } catch (error) {
        console.error('Error loading options', error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      const debounceFn = setTimeout(() => {
        fetchOptions();
      }, 300);
      return () => clearTimeout(debounceFn);
    }
  }, [inputValue, isOpen, loadOptions]);

  const exactMatch = options.some(
    (opt) => (opt.label || '').toLowerCase() === (inputValue || '').toLowerCase()
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
          minHeight: height || '48px',
          height: height || 'auto',
          cursor: disabled ? 'not-allowed' : 'text',
          opacity: disabled ? 0.6 : 1,
          border: isOpen ? '1px solid hsl(var(--brand))' : undefined,
          boxShadow: isOpen ? '0 0 0 4px hsl(var(--brand) / 0.1)' : undefined,
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
              minWidth: 0,
              padding: height ? '0' : '10px 0',
              height: height ? '100%' : 'auto',
              fontSize: '13px',
              color: 'inherit',
              cursor: disabled ? 'not-allowed' : 'inherit',
              textOverflow: 'ellipsis',
            }}
          />
        </div>
        <div style={{ cursor: 'pointer', padding: '4px' }} onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}>
          {loading ? (
            <Loader2 size={16} color="#94a3b8" className="animate-spin" />
          ) : (
            <ChevronDown size={16} color="#94a3b8" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          )}
        </div>
      </div>

      {isOpen &&
        createPortal(
          <div
            id="async-searchable-select-portal"
            style={{
              ...dropdownStyle,
              background: 'hsl(var(--bg-card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '12px',
              boxShadow: '0 10px 30px -10px rgb(0 0 0 / 0.5)',
              maxHeight: '250px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              animation: 'slideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <div style={{ overflowY: 'auto', padding: '4px' }}>
              {showCreatable && (
                <div
                  onClick={(e) => { e.stopPropagation(); onChange(inputValue, inputValue); setIsOpen(false); inputRef.current?.blur(); }}
                  style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: '4px', display: 'flex', alignItems: 'center', background: 'hsl(var(--brand) / 0.1)', color: 'hsl(var(--brand))', fontWeight: 600, marginBottom: '4px' }}
                >
                  + Criar "{inputValue}"
                </div>
              )}

              {options.length === 0 && !showCreatable && !loading ? (
                <div style={{ padding: '16px', textAlign: 'center', color: 'hsl(var(--text-muted))', fontSize: '13px' }}>
                  Nenhum resultado encontrado.
                </div>
              ) : (
                options.map((opt) => (
                  <div
                    key={opt.value}
                    onClick={(e) => { e.stopPropagation(); onChange(opt.value, opt.label); setIsOpen(false); inputRef.current?.blur(); }}
                    style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: value === opt.value ? 'hsl(var(--brand) / 0.08)' : 'transparent', transition: 'all 0.2s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'hsl(var(--bg-main))')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = value === opt.value ? 'hsl(var(--brand) / 0.08)' : 'transparent')}
                  >
                    <span style={{ fontSize: '13px', fontWeight: value === opt.value ? 700 : 500, color: value === opt.value ? 'hsl(var(--brand))' : 'hsl(var(--text-main))' }}>
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
