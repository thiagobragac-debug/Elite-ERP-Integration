import { renderHook, waitFor } from '@testing-library/react';
import { useSidebarAlerts } from './useSidebarAlerts';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock FarmFilter Context/Hooks
vi.mock('./useFarmFilter', () => ({
  useFarmFilter: () => ({
    activeTenantId: 'tenant-123',
    activeFarmId: 'farm-456',
    applyFarmFilter: (query: any) => query,
  }),
}));

// Mock Supabase client
vi.mock('../lib/supabase', () => {
  const mockFrom = vi.fn();
  return {
    supabase: {
      from: mockFrom,
    },
  };
});

import { supabase } from '../lib/supabase';

describe('useSidebarAlerts hook', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  it('should fetch and compute correct counts of alerts', async () => {
    // Mock Supabase tables query responses
    const mockIn = vi.fn().mockResolvedValue({ data: null, count: 5, error: null });
    const mockNeq = vi.fn().mockReturnValue({
      lt: vi.fn().mockResolvedValue({ data: null, count: 2, error: null }),
      eq: vi.fn().mockResolvedValue({ data: null, count: 1, error: null }),
    });
    const mockEq = vi.fn().mockReturnValue({
      gt: vi.fn().mockResolvedValue({
        data: [{ data_manejo: '2026-06-08', carencia_dias: 2 }],
        error: null,
      }),
    });

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'lotes') {
        return { select: vi.fn().mockReturnValue({ in: mockIn }) };
      }
      if (table === 'contas_pagar' || table === 'contas_receber') {
        return { select: vi.fn().mockReturnValue({ neq: mockNeq }) };
      }
      if (table === 'sanidade') {
        return { select: vi.fn().mockReturnValue({ eq: mockEq }) };
      }
      if (table === 'saas_invoices') {
        return { select: vi.fn().mockReturnValue({ neq: mockNeq }) };
      }
      return { select: vi.fn().mockResolvedValue({ data: [], error: null }) };
    });

    const { result } = renderHook(() => useSidebarAlerts(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Counts should be resolved based on mocks (5 lotes, contas_pagar (2) + contas_receber (2) = 4 financeiro)
    expect(result.current.alerts.lotes).toBe(5);
    expect(result.current.alerts.financeiro).toBe(4);
  });
});
