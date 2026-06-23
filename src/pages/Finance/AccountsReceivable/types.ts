/**
 * Shared types for AccountsReceivable module
 */

export interface Receivable {
  id: string;
  tenant_id?: string;
  descricao: string;
  valor_total: number;
  data_vencimento: string;
  categoria_id?: string | null;
  categoria?: string;
  cliente_id?: string | null;
  parceiro?: string;
  metodo_recebimento?: string;
  status: 'PENDENTE' | 'RECEBIDO' | 'ATRASADO';
  parceiros?: {
    nome: string;
  };
}

export interface ReceivableFormData {
  description: string;
  value: string | number;
  dueDate: string;
  category?: string | null;
  entityId?: string | null;
  paymentMethod?: string;
  status: 'PENDENTE' | 'RECEBIDO' | 'ATRASADO';
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
  value: string;
  status?: 'success' | 'warning' | 'info';
}

export type TabType = 'TODAS' | 'PENDENTE' | 'RECEBIDO';
