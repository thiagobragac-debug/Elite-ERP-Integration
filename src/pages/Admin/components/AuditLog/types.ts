/**
 * Type definitions for Audit Log components
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import type { LucideIcon } from 'lucide-react';

export interface LogEntry {
  id: string;
  table_name: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'EXPORT';
  timestamp: string;
  user_name: string;
  description: string;
  sublabel?: string;
  old_data?: any;
  new_data?: any;
  entity_id?: string;
}

export interface ActionConfig {
  label: string;
  color: string;
  Icon: LucideIcon;
  severity: 'low' | 'medium' | 'high';
}

export interface AuditFilterValues {
  action: string;
  module: string;
  user: string;
  dateStart: string;
  dateEnd: string;
  severity: string;
}

export interface AuditStats {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  progress?: number;
  change?: string;
  periodLabel?: string;
  sparkline?: number[];
  trend?: 'up' | 'down' | 'stable';
}

export interface UseAuditLogsOptions {
  page: number;
  pageSize: number;
  filters: AuditFilterValues & { search: string };
}

export interface UseAuditLogsResult {
  logs: LogEntry[];
  stats: AuditStats[];
  totalCount: number;
  loading: boolean;
  error: Error | null;
}

export interface TimelineItemProps {
  log: LogEntry;
  moduleIcon: LucideIcon;
  moduleLabel: string;
  actionConfig: ActionConfig;
  onClick: () => void;
}

export interface AuditFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: AuditFilterValues;
  setFilters: (
    filters: AuditFilterValues | ((prev: AuditFilterValues) => AuditFilterValues)
  ) => void;
  modules: Record<string, string>;
}
