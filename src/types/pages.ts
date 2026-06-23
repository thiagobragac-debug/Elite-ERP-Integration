/**
 * Common types for page components
 */

// Base types for database records
export interface BaseRecord {
  id: string;
  tenant_id: string;
  created_at?: string;
  updated_at?: string;
}

// Sales Order Types
export interface SalesOrder extends BaseRecord {
  numero_pedido: string;
  cliente_id: string;
  fazenda_id?: string;
  data_emissao: string;
  data_entrega?: string;
  valor_total: number;
  status: 'pending' | 'OPEN' | 'in_progress' | 'delivered' | 'CLOSED' | 'cancelled';
  transportadora?: string;
  placa_veiculo?: string;
  numero_gta?: string;
  observacoes?: string;
  margin?: number;
  isHighRisk?: boolean;
  parceiros?: {
    nome: string;
    tipo: string;
  };
}

export interface SalesOrderFormData {
  orderNumber: string;
  clientId: string;
  issueDate: string;
  deliveryDate?: string;
  totalValue: number;
  status: string;
  carrier?: string;
  vehiclePlate?: string;
  gtaNumber?: string;
  notes?: string;
}

// Client/Partner Types
export interface Partner extends BaseRecord {
  nome: string;
  tipo: 'cliente' | 'fornecedor' | 'ambos';
  cpf_cnpj?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  status?: string;
}

// Dashboard Analytics Types
export interface DashboardMetrics {
  totalValue: number;
  valueChange: number;
  count: number;
  countChange: number;
  trend: Array<{ value: number; label: string }>;
}

export interface CepeaQuote {
  indicator: string;
  value: number;
  date: string;
  change?: number;
}

export interface PriceAlert extends BaseRecord {
  indicator: string;
  target_price: number;
  direction: 'UP' | 'DOWN';
  current_value?: number;
}

// Filter Types
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

// Generic filter type for modals
export interface GenericFilterValues {
  [key: string]: string | number | boolean | string[] | Date | null | undefined;
}

// Form Handler Types
export type FormSubmitHandler<T = unknown> = (data: T) => Promise<void> | void;
export type FormChangeHandler<T = string> = (value: T) => void;

// API Response Types
export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

// Route Parameter Types
export interface RouteParams {
  id?: string;
  tab?: string;
  mode?: string;
}

// State Types for Common UI Elements
export interface ModalState {
  isOpen: boolean;
  data?: unknown;
}

export interface FilterState {
  isOpen: boolean;
  values: Record<string, unknown>;
}

// History/Audit Types
export interface HistoryItem {
  id: string;
  entity_type: string;
  entity_id: string;
  action: 'create' | 'update' | 'delete';
  old_data?: Record<string, unknown>;
  new_data?: Record<string, unknown>;
  user_id: string;
  created_at: string;
}

// Animal Management Types
export interface Animal extends BaseRecord {
  brinco: string;
  brinco_eletronico?: string;
  raca?: string;
  sexo?: 'Macho' | 'Fêmea';
  data_nascimento?: string;
  peso_atual?: number;
  peso_inicial?: number;
  status?: 'Ativo' | 'Vendido' | 'Morto' | 'Transferido';
  fazenda_id?: string;
  lote_id?: string;
  categoria?: string;
}

// Finance Types
export interface AccountPayable extends BaseRecord {
  descricao: string;
  valor_total: number;
  data_vencimento: string;
  data_pagamento?: string;
  status: 'PENDENTE' | 'PAGO' | 'VENCIDA' | 'CANCELADA';
  fornecedor_id?: string;
  categoria?: string;
  fazenda_id?: string;
}

export interface AccountReceivable extends BaseRecord {
  descricao: string;
  valor_total: number;
  data_vencimento: string;
  data_recebimento?: string;
  status: 'PENDENTE' | 'RECEBIDO' | 'VENCIDA' | 'CANCELADA';
  cliente_id?: string;
  categoria?: string;
  fazenda_id?: string;
}

// Inventory Types
export interface InventoryItem extends BaseRecord {
  codigo?: string;
  nome: string;
  tipo: string;
  unidade_medida: string;
  quantidade_atual: number;
  quantidade_minima?: number;
  valor_unitario?: number;
  armazem_id?: string;
  fazenda_id?: string;
}

// Fleet Types
export interface Vehicle extends BaseRecord {
  placa: string;
  tipo: string;
  marca?: string;
  modelo?: string;
  ano?: number;
  status: 'Ativo' | 'Manutenção' | 'Inativo';
  fazenda_id?: string;
  km_atual?: number;
}

export interface Maintenance extends BaseRecord {
  veiculo_id: string;
  tipo_manutencao: string;
  descricao?: string;
  data_manutencao: string;
  km_manutencao?: number;
  valor?: number;
  status: 'Agendada' | 'Em Andamento' | 'Concluída' | 'Cancelada';
  fazenda_id?: string;
}

// Purchasing Types
export interface PurchaseOrder extends BaseRecord {
  numero_pedido: string;
  fornecedor_id: string;
  data_pedido: string;
  data_entrega_prevista?: string;
  valor_total: number;
  status: 'RASCUNHO' | 'ENVIADO' | 'RECEBIDO' | 'CANCELADO';
  fazenda_id?: string;
}

// Market Types
export interface MarketIndicator {
  indicator: string;
  value: number;
  date: string;
  change_percent?: number;
  change_value?: number;
}

// Sparkline data type
export interface SparklineData {
  value: number;
  label: string;
}

// Generic record type with any date field
export interface RecordWithDate {
  [key: string]: string | number | boolean | null | undefined;
}

// LCDPR (Livro Caixa Digital do Produtor Rural) Types
export interface LCDPRLancamento extends BaseRecord {
  fazenda_id: string;
  data_lancamento: string;
  tipo: 'R' | 'D'; // Receita ou Despesa
  cod_natureza: string;
  descricao: string;
  valor: number;
  nome_participante?: string;
  cpf_cnpj_participante?: string;
}

// Bank Reconciliation Types
export interface BankRecord {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  matched?: boolean;
  internal_match_id?: string;
}

export interface InternalRecord extends BaseRecord {
  date: string;
  description: string;
  amount: number;
  category: string;
  matched?: boolean;
}

// Cash Flow Types
export interface CashFlowTransaction extends BaseRecord {
  date: string;
  description: string;
  category: string;
  type: 'inflow' | 'outflow';
  value: number;
  fazenda_id?: string;
  status?: 'paid' | 'pending';
  runningBalance?: number;
}

// Bank Account Types
export interface BankAccount extends BaseRecord {
  banco: string;
  agencia: string;
  conta: string;
  tipo: 'Corrente' | 'Poupança';
  saldo_atual: number;
  fazenda_id?: string;
}

// Insights Types
export interface FinanceInsight {
  id: string;
  type: 'warning' | 'success' | 'info' | 'critical';
  message: string;
  value?: number;
  date?: string;
}

// Chart Data Types
export interface ChartDataPoint {
  name: string;
  value: number;
  fill?: string;
}

// Stats Card Data
export interface StatsCardData {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  color: string;
  progress?: number;
  change?: string;
  periodLabel?: string;
  sparkline?: SparklineData[];
}
