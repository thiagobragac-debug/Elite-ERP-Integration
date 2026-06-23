/**
 * Shared types for AccountsPayable module
 */

export interface Account {
  id: string;
  tenant_id?: string;
  descricao: string;
  valor_total: number;
  data_vencimento: string;
  categoria_id?: string | null;
  categoria?: string;
  fornecedor_id?: string | null;
  parceiro?: string;
  metodo_pagamento?: string;
  status: 'PENDENTE' | 'PAGO' | 'ATRASADO';
  parceiros?: {
    nome: string;
  };
}

export interface AccountFormData {
  description: string;
  value: string | number;
  dueDate: string;
  category?: string | null;
  entityId?: string | null;
  paymentMethod?: string;
  status: 'PENDENTE' | 'PAGO' | 'ATRASADO';
}

export interface FilterValues {
  status: string;
  minAmount: number;
  maxAmount: number;
  dateStart: string;
  dateEnd: string;
}

export interface HistoryItem {
  id: string;
  date: string;
  title: string;
  subtitle: string;
  value?: string;
  status?: 'success' | 'warning' | 'info';
  userName?: string;
  userAvatar?: string;
}

export type TabType = 'TODAS' | 'PENDENTE' | 'PAGO';
