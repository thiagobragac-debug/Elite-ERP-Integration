import { describe, it, expect } from 'vitest';
import { formatNumber, formatCurrency, formatPercent, maskCPFCNPJ } from './format';

describe('formatNumber', () => {
  it('should format positive numbers with default 2 decimals', () => {
    expect(formatNumber(1234.56)).toBe('1.234,56');
  });

  it('should format numbers with custom decimal places', () => {
    expect(formatNumber(1234.5678, 3)).toBe('1.234,568');
    expect(formatNumber(1234.5678, 0)).toBe('1.235');
    expect(formatNumber(1234.5678, 1)).toBe('1.234,6');
  });

  it('should handle zero', () => {
    expect(formatNumber(0)).toBe('0,00');
    expect(formatNumber(0, 3)).toBe('0,000');
  });

  it('should handle negative numbers', () => {
    expect(formatNumber(-500)).toBe('-500,00');
    expect(formatNumber(-1234.56)).toBe('-1.234,56');
  });

  it('should handle undefined values', () => {
    expect(formatNumber(undefined)).toBe('0.00');
  });

  it('should handle null values', () => {
    expect(formatNumber(null)).toBe('0.00');
  });

  it('should handle string numbers', () => {
    expect(formatNumber('1234.56')).toBe('1.234,56');
    expect(formatNumber('0')).toBe('0,00');
  });

  it('should handle invalid string values', () => {
    expect(formatNumber('abc')).toBe('0.00');
    expect(formatNumber('')).toBe('0,00'); // Empty string converts to 0, which is then formatted
  });

  it('should handle large numbers', () => {
    expect(formatNumber(1000000)).toBe('1.000.000,00');
    expect(formatNumber(1234567.89)).toBe('1.234.567,89');
  });

  it('should handle very small numbers', () => {
    expect(formatNumber(0.001)).toBe('0,00');
    expect(formatNumber(0.001, 3)).toBe('0,001');
  });
});

describe('formatCurrency', () => {
  it('should format positive numbers as BRL currency', () => {
    expect(formatCurrency(1234.56)).toBe('R$\u00a01.234,56');
  });

  it('should handle zero', () => {
    expect(formatCurrency(0)).toBe('R$\u00a00,00');
  });

  it('should format negative numbers', () => {
    expect(formatCurrency(-500)).toBe('-R$\u00a0500,00');
    expect(formatCurrency(-1234.56)).toBe('-R$\u00a01.234,56');
  });

  it('should handle undefined values', () => {
    expect(formatCurrency(undefined)).toBe('R$ 0,00');
  });

  it('should handle null values', () => {
    expect(formatCurrency(null)).toBe('R$ 0,00');
  });

  it('should handle string numbers', () => {
    expect(formatCurrency('1234.56')).toBe('R$\u00a01.234,56');
    expect(formatCurrency('0')).toBe('R$\u00a00,00');
  });

  it('should handle invalid string values', () => {
    expect(formatCurrency('abc')).toBe('R$ 0,00');
    expect(formatCurrency('')).toBe('R$\u00a00,00'); // Empty string converts to 0, which is then formatted
  });

  it('should handle large currency values', () => {
    expect(formatCurrency(1000000)).toBe('R$\u00a01.000.000,00');
    expect(formatCurrency(999999.99)).toBe('R$\u00a0999.999,99');
  });

  it('should handle fractional cents', () => {
    expect(formatCurrency(10.999)).toBe('R$\u00a011,00');
    expect(formatCurrency(10.001)).toBe('R$\u00a010,00');
  });

  it('should always show 2 decimal places', () => {
    expect(formatCurrency(100)).toBe('R$\u00a0100,00');
    expect(formatCurrency(100.5)).toBe('R$\u00a0100,50');
  });
});

describe('formatPercent', () => {
  it('should format positive percentages with default 1 decimal', () => {
    expect(formatPercent(50)).toBe('50.0%');
    expect(formatPercent(75.5)).toBe('75.5%');
  });

  it('should format percentages with custom decimal places', () => {
    expect(formatPercent(50.123, 2)).toBe('50.12%');
    expect(formatPercent(50.123, 3)).toBe('50.123%');
    expect(formatPercent(50.123, 0)).toBe('50%');
  });

  it('should handle zero', () => {
    expect(formatPercent(0)).toBe('0.0%');
    expect(formatPercent(0, 2)).toBe('0.00%');
  });

  it('should handle negative percentages', () => {
    expect(formatPercent(-25)).toBe('-25.0%');
    expect(formatPercent(-10.5)).toBe('-10.5%');
  });

  it('should handle undefined values', () => {
    expect(formatPercent(undefined)).toBe('0.0%');
  });

  it('should handle null values', () => {
    expect(formatPercent(null)).toBe('0.0%');
  });

  it('should handle string numbers', () => {
    expect(formatPercent('50.5')).toBe('50.5%');
    expect(formatPercent('0')).toBe('0.0%');
  });

  it('should handle invalid string values', () => {
    expect(formatPercent('abc')).toBe('0.0%');
    expect(formatPercent('')).toBe('0.0%');
  });

  it('should handle percentages over 100', () => {
    expect(formatPercent(150)).toBe('150.0%');
    expect(formatPercent(200.5)).toBe('200.5%');
  });

  it('should handle very small percentages', () => {
    expect(formatPercent(0.1)).toBe('0.1%');
    expect(formatPercent(0.01, 2)).toBe('0.01%');
  });

  it('should round to specified decimal places', () => {
    expect(formatPercent(50.456, 1)).toBe('50.5%');
    expect(formatPercent(50.454, 1)).toBe('50.5%');
    expect(formatPercent(50.444, 1)).toBe('50.4%');
  });
});

describe('maskCPFCNPJ', () => {
  describe('CPF formatting (11 digits or less)', () => {
    it('should format valid CPF with 11 digits', () => {
      expect(maskCPFCNPJ('12345678900')).toBe('123.456.789-00');
    });

    it('should format partially entered CPF (3 digits)', () => {
      expect(maskCPFCNPJ('123')).toBe('123');
    });

    it('should format partially entered CPF (6 digits)', () => {
      expect(maskCPFCNPJ('123456')).toBe('123.456');
    });

    it('should format partially entered CPF (9 digits)', () => {
      expect(maskCPFCNPJ('123456789')).toBe('123.456.789');
    });

    it('should handle already formatted CPF', () => {
      expect(maskCPFCNPJ('123.456.789-00')).toBe('123.456.789-00');
    });

    it('should remove non-digit characters before formatting', () => {
      expect(maskCPFCNPJ('123abc456def789ghi00')).toBe('123.456.789-00');
    });

    it('should handle empty string', () => {
      expect(maskCPFCNPJ('')).toBe('');
    });

    it('should handle CPF with spaces', () => {
      expect(maskCPFCNPJ('123 456 789 00')).toBe('123.456.789-00');
    });
  });

  describe('CNPJ formatting (12+ digits)', () => {
    it('should format valid CNPJ with 14 digits', () => {
      expect(maskCPFCNPJ('12345678000190')).toBe('12.345.678/0001-90');
    });

    it('should format partially entered CNPJ (12 digits)', () => {
      expect(maskCPFCNPJ('123456780001')).toBe('12.345.678/0001');
    });

    it('should format partially entered CNPJ (13 digits)', () => {
      expect(maskCPFCNPJ('1234567800019')).toBe('12.345.678/0001-9');
    });

    it('should handle already formatted CNPJ', () => {
      expect(maskCPFCNPJ('12.345.678/0001-90')).toBe('12.345.678/0001-90');
    });

    it('should remove non-digit characters before formatting', () => {
      expect(maskCPFCNPJ('12.345.678/0001-90')).toBe('12.345.678/0001-90');
    });

    it('should truncate input longer than 14 digits', () => {
      expect(maskCPFCNPJ('123456780001901234')).toBe('12.345.678/0001-90');
    });

    it('should handle CNPJ with spaces', () => {
      expect(maskCPFCNPJ('12 345 678 0001 90')).toBe('12.345.678/0001-90');
    });
  });

  describe('edge cases', () => {
    it('should handle string with only non-digit characters', () => {
      expect(maskCPFCNPJ('abc-def/ghi')).toBe('');
    });

    it('should handle mixed valid CPF digits with special characters', () => {
      expect(maskCPFCNPJ('123-456-789-00')).toBe('123.456.789-00');
    });

    it('should handle mixed valid CNPJ digits with special characters', () => {
      expect(maskCPFCNPJ('12-345-678-0001-90')).toBe('12.345.678/0001-90');
    });

    it('should handle transition from CPF to CNPJ format at 12 digits', () => {
      // 11 digits = CPF format
      expect(maskCPFCNPJ('12345678901')).toBe('123.456.789-01');
      // 12 digits = CNPJ format
      expect(maskCPFCNPJ('123456789012')).toBe('12.345.678/9012');
    });

    it('should handle single digit', () => {
      expect(maskCPFCNPJ('1')).toBe('1');
    });

    it('should handle two digits', () => {
      expect(maskCPFCNPJ('12')).toBe('12');
    });
  });
});
