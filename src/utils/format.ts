/**
 * Diamond Precision 5.0 - Number Formatting Utility
 * Standardizes decimal precision across the Elite ERP suite.
 */

export const formatNumber = (value: number | string | undefined | null, decimals: number = 2): string => {
  if (value === undefined || value === null || isNaN(Number(value))) return '0.00';
  
  const num = Number(value);
  
  // For large integers, we might want 0 decimals, but by default we use the requested amount.
  return num.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

export const formatCurrency = (value: number | string | undefined | null): string => {
  if (value === undefined || value === null || isNaN(Number(value))) return 'R$ 0,00';
  
  return Number(value).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
};

export const formatPercent = (value: number | string | undefined | null, decimals: number = 1): string => {
  if (value === undefined || value === null || isNaN(Number(value))) return '0.0%';
  
  return `${Number(value).toFixed(decimals)}%`;
};
