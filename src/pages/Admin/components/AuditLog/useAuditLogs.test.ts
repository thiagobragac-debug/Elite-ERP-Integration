/**
 * Unit tests for useAuditLogs hook
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAuditLogs } from './useAuditLogs';
import * as useReportDataModule from '../../../../hooks/useReportData';

vi.mock('../../../../hooks/useReportData');

describe('useAuditLogs', () => {
  it('should return empty logs when loading', () => {
    vi.spyOn(useReportDataModule, 'useReportData').mockReturnValue({
      data: null,
      stats: null,
      totalCount: 0,
      loading: true,
      error: null,
    });

    const { result } = renderHook(() =>
      useAuditLogs({
        page: 1,
        pageSize: 25,
        filters: {
          action: 'ALL',
          module: 'ALL',
          user: '',
          dateStart: '',
          dateEnd: '',
          severity: 'all',
          search: '',
        },
      })
    );

    expect(result.current.logs).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.totalCount).toBe(0);
  });

  it('should return logs data when loaded', () => {
    const mockLogs = [
      {
        id: '1',
        table_name: 'animais',
        action: 'INSERT' as const,
        timestamp: '2024-01-01T10:00:00Z',
        user_name: 'Test User',
        description: 'Created animal',
        entity_id: 'animal-1',
      },
    ];

    const mockStats = [
      {
        label: 'Total Events',
        value: 100,
        icon: vi.fn(),
        color: '#3b82f6',
      },
    ];

    vi.spyOn(useReportDataModule, 'useReportData').mockReturnValue({
      data: mockLogs,
      stats: mockStats,
      totalCount: 100,
      loading: false,
      error: null,
    });

    const { result } = renderHook(() =>
      useAuditLogs({
        page: 1,
        pageSize: 25,
        filters: {
          action: 'ALL',
          module: 'ALL',
          user: '',
          dateStart: '',
          dateEnd: '',
          severity: 'all',
          search: '',
        },
      })
    );

    expect(result.current.logs).toEqual(mockLogs);
    expect(result.current.stats).toEqual(mockStats);
    expect(result.current.totalCount).toBe(100);
    expect(result.current.loading).toBe(false);
  });

  it('should pass filters to useReportData', () => {
    const useReportDataSpy = vi.spyOn(useReportDataModule, 'useReportData').mockReturnValue({
      data: [],
      stats: [],
      totalCount: 0,
      loading: false,
      error: null,
    });

    const filters = {
      action: 'INSERT',
      module: 'animais',
      user: 'test@example.com',
      dateStart: '2024-01-01',
      dateEnd: '2024-01-31',
      severity: 'low',
      search: 'test',
    };

    renderHook(() =>
      useAuditLogs({
        page: 2,
        pageSize: 50,
        filters,
      })
    );

    expect(useReportDataSpy).toHaveBeenCalledWith('audit-logs', {
      page: 2,
      pageSize: 50,
      filters,
    });
  });
});
