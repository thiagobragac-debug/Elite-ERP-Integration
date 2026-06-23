import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { fetchHistoricalQuotes } from '../lib/marketQueries';

/**
 * Hook for fetching Cepea market indicators with optimized caching
 *
 * Market data changes infrequently (daily updates), so we use:
 * - staleTime: 1 hour (Requirement 20.5)
 * - This prevents unnecessary refetches of infrequently changing data
 *
 * @param indicator - Market indicator name (e.g., 'boi_gordo_cepea', 'milho_cepea')
 * @param enabled - Whether to enable the query
 * @returns Query result with latest market quote
 */
export function useLatestMarketQuote(indicator: string, enabled = true) {
  return useQuery({
    queryKey: ['market', 'latest', indicator],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('market_quotes')
        .select('*')
        .eq('indicator', indicator)
        .order('date', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    },
    // Market data changes infrequently (daily), so cache for 1 hour
    staleTime: 1000 * 60 * 60, // 1 hour
    enabled,
  });
}

/**
 * Hook for fetching multiple latest Cepea market indicators
 *
 * @param limit - Number of latest quotes to fetch
 * @param enabled - Whether to enable the query
 * @returns Query result with recent market quotes
 */
export function useLatestMarketQuotes(limit = 20, enabled = true) {
  return useQuery({
    queryKey: ['market', 'latest', 'all', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('market_quotes')
        .select('indicator, value, date')
        .order('date', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data || [];
    },
    // Market data changes infrequently (daily), so cache for 1 hour
    staleTime: 1000 * 60 * 60, // 1 hour
    enabled,
  });
}

/**
 * Hook for fetching historical Cepea market data
 *
 * @param indicator - Market indicator name
 * @param startDate - Optional start date (YYYY-MM-DD)
 * @param endDate - Optional end date (YYYY-MM-DD)
 * @param ascending - Sort direction
 * @param enabled - Whether to enable the query
 * @returns Query result with historical market quotes
 */
export function useHistoricalMarketQuotes(
  indicator: string,
  startDate?: string,
  endDate?: string,
  ascending = true,
  enabled = true
) {
  return useQuery({
    queryKey: ['market', 'historical', indicator, startDate, endDate, ascending],
    queryFn: () => fetchHistoricalQuotes(indicator, startDate, endDate, ascending),
    // Historical market data is immutable, so cache for 1 hour
    staleTime: 1000 * 60 * 60, // 1 hour
    enabled,
  });
}

/**
 * Hook for fetching Cepea Boi Gordo specifically (most commonly used)
 *
 * @param enabled - Whether to enable the query
 * @returns Query result with latest Boi Gordo quote
 */
export function useBoiGordoCepea(enabled = true) {
  return useLatestMarketQuote('boi_gordo_cepea', enabled);
}

/**
 * Hook for fetching Milho Cepea
 *
 * @param enabled - Whether to enable the query
 * @returns Query result with latest Milho quote
 */
export function useMilhoCepea(enabled = true) {
  return useLatestMarketQuote('milho_cepea', enabled);
}

/**
 * Hook for fetching Bezerro MS Cepea
 *
 * @param enabled - Whether to enable the query
 * @returns Query result with latest Bezerro MS quote
 */
export function useBezerroMSCepea(enabled = true) {
  return useLatestMarketQuote('bezerro_ms_cepea', enabled);
}

/**
 * Hook for fetching Bezerro SP Cepea
 *
 * @param enabled - Whether to enable the query
 * @returns Query result with latest Bezerro SP quote
 */
export function useBezerroSPCepea(enabled = true) {
  return useLatestMarketQuote('bezerro_sp_cepea', enabled);
}
