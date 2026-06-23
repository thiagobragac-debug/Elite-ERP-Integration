/**
 * Hook for fetching and managing audit log data
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { useReportData } from '../../../../hooks/useReportData';
import type { UseAuditLogsOptions, UseAuditLogsResult, LogEntry, AuditStats } from './types';

export function useAuditLogs(options: UseAuditLogsOptions): UseAuditLogsResult {
  const { page, pageSize, filters } = options;

  const {
    data: logs,
    stats,
    totalCount,
    loading,
    error,
  } = useReportData('audit-logs', {
    page,
    pageSize,
    filters: filters as unknown as Record<string, unknown>,
  });

  return {
    logs: (logs || []) as unknown as LogEntry[],
    stats: (stats || []) as unknown as AuditStats[],
    totalCount: totalCount || 0,
    loading,
    error: error ? (typeof error === 'string' ? new Error(error) : error as Error) : null,
  };
}
