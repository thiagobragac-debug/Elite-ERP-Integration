import React, { useState, useEffect, useRef } from 'react';
import { Calendar } from 'lucide-react';

interface DateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value?: string | number | readonly string[];
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}

// Helper para converter YYYY-MM-DD em DD/MM/YYYY
const toDisplayFormat = (isoDate: string) => {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-');
  if (!y || !m || !d) return isoDate;
  return `${d}/${m}/${y}`;
};

// Helper para converter DD/MM/YYYY (ou variações) em YYYY-MM-DD
const parseSAPDate = (input: string, baseIsoDate?: string): string => {
  let text = input.trim().toLowerCase();
  if (!text) return '';

  const now = new Date();
  let day = now.getDate();
  let month = now.getMonth() + 1;
  let year = now.getFullYear();

  // "h" ou "t" (Hoje / Today)
  if (text === 'h' || text === 't') {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  // Se for apenas incrementos/decrementos (+, -, +1, -5) a partir da data atual do campo
  if (text.startsWith('+') || text.startsWith('-')) {
    const diff = parseInt(text) || (text === '+' ? 1 : text === '-' ? -1 : 0);
    const baseDate = baseIsoDate ? new Date(baseIsoDate + 'T12:00:00') : new Date();
    baseDate.setDate(baseDate.getDate() + diff);
    return baseDate.toISOString().split('T')[0];
  }

  // Remover tudo que não for número se for uma tentativa de digitação rápida
  // Mas cuidado, pode já estar com barras "15/05/2024"
  if (text.includes('/')) {
    const parts = text.split('/');
    if (parts[0]) day = parseInt(parts[0]);
    if (parts[1]) month = parseInt(parts[1]);
    if (parts[2]) {
      let yStr = parts[2];
      if (yStr.length === 2) yStr = '20' + yStr;
      year = parseInt(yStr);
    }
  } else {
    const numbers = text.replace(/\D/g, '');
    if (numbers.length === 0) return '';
    
    if (numbers.length <= 2) {
      // Ex: "15" -> 15/mes_atual/ano_atual
      day = parseInt(numbers);
    } else if (numbers.length <= 4) {
      // Ex: "1505" -> 15/05/ano_atual
      day = parseInt(numbers.substring(0, 2));
      month = parseInt(numbers.substring(2, 4));
    } else if (numbers.length <= 6) {
      // Ex: "150524" -> 15/05/2024
      day = parseInt(numbers.substring(0, 2));
      month = parseInt(numbers.substring(2, 4));
      year = parseInt('20' + numbers.substring(4, 6));
    } else {
      // Ex: "15052024" -> 15/05/2024
      day = parseInt(numbers.substring(0, 2));
      month = parseInt(numbers.substring(2, 4));
      year = parseInt(numbers.substring(4, 8));
    }
  }

  // Validação básica para evitar datas bizarras (ex: 35/14/2024 vira validacao do JS)
  const finalDate = new Date(year, month - 1, day);
  if (isNaN(finalDate.getTime())) return '';

  return `${finalDate.getFullYear()}-${String(finalDate.getMonth() + 1).padStart(2, '0')}-${String(finalDate.getDate()).padStart(2, '0')}`;
};

export const DateInput: React.FC<DateInputProps> = ({ value, onChange, onBlur, onKeyDown, className, style, disabled, ...props }) => {
  const [displayText, setDisplayText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Sincroniza o prop value (YYYY-MM-DD) com o texto exibido (DD/MM/YYYY)
  useEffect(() => {
    const strVal = value?.toString() || '';
    if (strVal && document.activeElement !== inputRef.current) {
      setDisplayText(toDisplayFormat(strVal));
    } else if (!strVal && document.activeElement !== inputRef.current) {
      setDisplayText('');
    }
  }, [value]);

  const handleApplyDate = (rawText: string) => {
    const baseIso = value?.toString() || undefined;
    const parsedIso = parseSAPDate(rawText, baseIso);
    
    if (parsedIso !== value) {
      // Dispara o onChange simulando o evento nativo
      if (onChange) {
        const syntheticEvent = {
          target: { value: parsedIso, name: props.name },
          currentTarget: { value: parsedIso, name: props.name },
          preventDefault: () => {},
          stopPropagation: () => {},
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      }
    }
    setDisplayText(toDisplayFormat(parsedIso));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    handleApplyDate(displayText);
    if (onBlur) onBlur(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleApplyDate(displayText);
      // Opcional: focar no próximo campo
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      handleApplyDate('+1');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      handleApplyDate('-1');
    }
    if (onKeyDown) onKeyDown(e);
  };

  const { width, flex, margin, marginTop, marginBottom, marginLeft, marginRight, ...inputStyle } = (style || {}) as any;
  const wrapperStyle = { width: width || '100%', flex, margin, marginTop, marginBottom, marginLeft, marginRight };

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', ...wrapperStyle }}>
      <input
        {...props}
        ref={inputRef}
        type="text"
        className={className || "tauze-input"}
        value={displayText}
        onChange={(e) => setDisplayText(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder="DD/MM/AAAA"
        disabled={disabled}
        autoComplete="off"
        style={{ width: '100%', paddingRight: '36px', ...inputStyle }}
      />
      
      {/* Ícone de Calendário Simulado */}
      <div style={{ 
        position: 'absolute', 
        right: '8px', 
        pointerEvents: 'none',
        color: disabled ? 'hsl(var(--text-muted))' : 'hsl(var(--text-primary))',
        opacity: 0.6
      }}>
        <Calendar size={16} />
      </div>

      {/* Input de Data Nativo Invisível para permitir o uso do DatePicker nativo via clique */}
      {!disabled && (
        <input
          type="date"
          value={value?.toString() || ''}
          onChange={(e) => {
            const iso = e.target.value;
            if (onChange) {
              const syntheticEvent = {
                ...e,
                target: { ...e.target, value: iso, name: props.name },
                currentTarget: { ...e.currentTarget, value: iso, name: props.name }
              } as unknown as React.ChangeEvent<HTMLInputElement>;
              onChange(syntheticEvent);
            }
            setDisplayText(toDisplayFormat(iso));
          }}
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            width: '36px',
            height: '100%',
            opacity: 0,
            cursor: 'pointer'
          }}
        />
      )}
    </div>
  );
};
