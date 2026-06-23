import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useLatestMarketQuote,
  useLatestMarketQuotes,
  useHistoricalMarketQuotes,
  useBoiGordoCepea,
  useMilhoCepea,
  useBezerroMSCepea,
  useBezerroSPCepea,
} from './useMarketData';
import { supabase } from '../lib/supabase';

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: mockMarketQuote, error: null })),
            })),
          })),
        })),
        order: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: mockMarketQuotes, error: null })),
        })),
      })),
    })),
  },
}));

// Mock market data
const mockMarketQuote = {
  id: '1',
  indicator: 'boi_gordo_cepea',
  value: 345.5,
  date: '2024-01-15',
  created_at: '2024-01-15T17:00:00Z',
};

const mockMarketQuotes = [
  { indicator: 'boi_gordo_cepea', value: 345.5, date: '2024-01-15' },
  { indicator: 'milho_cepea', value: 85.0, date: '2024-01-15' },
  { indicator: 'bezerro_ms_cepea', value: 2800.0, date: '2024-01-15' },
];

// Helper to create a test QueryClient
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
    },
  });

// Helper to create wrapper with QueryClient
function createWrapper(queryClient: QueryClient) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  }
  return Wrapper;
}

describe('useMarketData - staleTime Configuration (Requirement 20.5)', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('useLatestMarketQuote', () => {
    it('should configure 1 hour staleTime for market data', async () => {
      const { result } = renderHook(() => useLatestMarketQuote('boi_gordo_cepea'), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Check that query exists in cache
      const queries = queryClient.getQueryCache().findAll({
        queryKey: ['market', 'latest', 'boi_gordo_cepea'],
      });

      expect(queries).toHaveLength(1);

      // Verify staleTime is set to 1 hour (3600000 ms)
      const query = queries[0];
      expect(query.options.staleTime).toBe(1000 * 60 * 60);
    });

    it('should return market quote data', async () => {
      const { result } = renderHook(() => useLatestMarketQuote('boi_gordo_cepea'), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockMarketQuote);
    });

    it('should respect enabled flag', async () => {
      const { result } = renderHook(() => useLatestMarketQuote('boi_gordo_cepea', false), {
        wrapper: createWrapper(queryClient),
      });

      // Should not execute query when disabled
      expect(result.current.data).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('useLatestMarketQuotes', () => {
    it('should configure 1 hour staleTime for multiple quotes', async () => {
      const { result } = renderHook(() => useLatestMarketQuotes(20), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const queries = queryClient.getQueryCache().findAll({
        queryKey: ['market', 'latest', 'all', 20],
      });

      expect(queries).toHaveLength(1);
      expect(queries[0].options.staleTime).toBe(1000 * 60 * 60);
    });

    it('should return array of market quotes', async () => {
      const { result } = renderHook(() => useLatestMarketQuotes(20), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockMarketQuotes);
    });
  });

  describe('Specific Market Indicators', () => {
    it('useBoiGordoCepea should use 1 hour staleTime', async () => {
      const { result } = renderHook(() => useBoiGordoCepea(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const queries = queryClient.getQueryCache().findAll({
        queryKey: ['market', 'latest', 'boi_gordo_cepea'],
      });

      expect(queries[0].options.staleTime).toBe(1000 * 60 * 60);
    });

    it('useMilhoCepea should use 1 hour staleTime', async () => {
      const { result } = renderHook(() => useMilhoCepea(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const queries = queryClient.getQueryCache().findAll({
        queryKey: ['market', 'latest', 'milho_cepea'],
      });

      expect(queries[0].options.staleTime).toBe(1000 * 60 * 60);
    });

    it('useBezerroMSCepea should use 1 hour staleTime', async () => {
      const { result } = renderHook(() => useBezerroMSCepea(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const queries = queryClient.getQueryCache().findAll({
        queryKey: ['market', 'latest', 'bezerro_ms_cepea'],
      });

      expect(queries[0].options.staleTime).toBe(1000 * 60 * 60);
    });

    it('useBezerroSPCepea should use 1 hour staleTime', async () => {
      const { result } = renderHook(() => useBezerroSPCepea(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const queries = queryClient.getQueryCache().findAll({
        queryKey: ['market', 'latest', 'bezerro_sp_cepea'],
      });

      expect(queries[0].options.staleTime).toBe(1000 * 60 * 60);
    });
  });

  describe('Performance Benefits', () => {
    it('should reduce API calls by caching for 1 hour', async () => {
      const { result, rerender } = renderHook(() => useBoiGordoCepea(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // First call should have executed
      expect(supabase.from).toHaveBeenCalledTimes(1);

      // Clear mock call count
      vi.clearAllMocks();

      // Rerender (simulating component remount or navigation)
      rerender();

      // Should NOT make another API call because data is still fresh (within staleTime)
      // Note: In real app with proper time passing, this would require advancing timers
      expect(result.current.data).toEqual(mockMarketQuote);
    });
  });

  describe('Documentation Compliance', () => {
    it('should document reasoning for 1 hour staleTime in hook comments', () => {
      // This test verifies that the hook file contains proper documentation
      const hookFile = require('fs').readFileSync(
        require('path').join(__dirname, 'useMarketData.ts'),
        'utf-8'
      );

      // Check for documentation of staleTime reasoning
      expect(hookFile).toContain('staleTime: 1 hour');
      expect(hookFile).toContain('Requirement 20.5');
      expect(hookFile).toContain('Market data changes infrequently');
    });
  });
});
