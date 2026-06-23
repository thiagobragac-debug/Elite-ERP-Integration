/**
 * Shared types for SalesOrders module
 */

export interface SalesOrder {
  id: string;
  tenant_id?: string;
  fazenda_id?: string;
  numero_pedido: string;
  cliente_id: string;
  produto_id?: string;
  quantidade: number;
  unidade: string;
  valor_total: number;
  data_pedido: string;
  data_emissao: string;
  status: 'pending' | 'delivered' | 'canceled';
  transportadora?: string;
  placa_veiculo?: string;
  numero_gta?: string;
  forma_pagamento?: string;
  comissao?: number;
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
  // Computed fields
  parceiros?: {
    nome: string;
  };
  margin?: number;
  isHighRisk?: boolean;
  clientRating?: string;
}

export interface SalesOrderFormData {
  orderNumber: string;
  clientId: string;
  productId?: string;
  quantity: string;
  unit: string;
  totalValue: string;
  date: string;
  status: 'pending' | 'delivered' | 'canceled';
  transportadora?: string;
  placa_veiculo?: string;
  numero_gta?: string;
  forma_pagamento?: string;
  comissao?: string;
  observacoes?: string;
}

export interface SalesFilterValues {
  status: string;
  clientTypes: string[];
  minMargin: number;
  maxMargin: number;
  dateStart: string;
  dateEnd: string;
  onlyHighRisk: boolean;
  missingGta: boolean;
}

export interface SparklineData {
  value: number;
  label: string;
}

export interface RecordWithDate {
  [key: string]: any;
}

export interface HistoryItem {
  id: string;
  date: string;
  title: string;
  subtitle: string;
  entity_type: string;
  entity_id: string;
  action: string;
  user_id: string;
  created_at: string;
  value?: string;
  status?: 'success' | 'warning' | 'info';
  userName?: string;
  userAvatar?: string;
}

export type SalesTabType = 'OPEN' | 'CLOSED';

export interface SalesStats {
  label: string;
  value: string | number;
  icon: any;
  color: string;
  progress: number;
  change: string;
  periodLabel: string;
  sparkline: SparklineData[];
  trend?: 'up' | 'down' | 'neutral';
}
