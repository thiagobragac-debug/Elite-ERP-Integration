export type ReportStat = {
  id?: string;
  label: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  color?: string;
  progress?: number;
  periodLabel?: string;
  sparkline?: { value: number; label?: string }[];
  icon?: any;
};

export type ReportData = {
  data: any[];
  stats: ReportStat[];
  columns: any[];
  totalCount?: number;
  healthScore?: number;
  loading?: boolean;
  error?: string | null;
};

export type ReportHandler = (
  tenantId: string,
  fazendaId?: string,
  page?: number,
  pageSize?: number,
  filters?: any
) => Promise<Partial<ReportData> & { totalCount?: number }>;

export const REPORTS_MODULE_MARKER = true;
