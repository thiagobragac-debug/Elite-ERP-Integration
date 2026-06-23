import React from 'react';
import { QueryClient, QueryClientProvider as TanstackQueryProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

/**
 * Optimized QueryClient configuration
 *
 * Default options (Requirements 20.1-20.4):
 * - staleTime: 5 minutes - prevents unnecessary refetches for most queries
 * - cacheTime (gcTime): 30 minutes - keeps data in memory for quick access
 * - retry: 1 attempt - faster error feedback instead of 3 retries
 * - refetchOnWindowFocus: disabled in production - avoids excessive network usage
 *
 * For market data (Cepea) queries, use longer staleTime (Requirement 20.5):
 * useQuery({
 *   queryKey: ['market', 'cepea', indicator],
 *   queryFn: () => fetchHistoricalQuotes(indicator),
 *   staleTime: 1000 * 60 * 60, // 1 hour for infrequently changing market data
 * })
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 5 minutes stale time (Requirement 20.1)
      staleTime: 5 * 60 * 1000,
      // 30 minutes cache time (Requirement 20.2)
      gcTime: 30 * 60 * 1000,
      // 1 retry instead of 3 (Requirement 20.4)
      retry: 1,
      retryDelay: 1000,
      // Desabilitado globalmente — trocar de aba não deve disparar 17+ queries simultâneas
      // Use queryClient.invalidateQueries() manualmente quando precisar de dados frescos
      refetchOnWindowFocus: false,
      // Offline-first for rural areas with poor connectivity
      networkMode: 'offlineFirst',
    },
    mutations: {
      // Mutations should not retry automatically to avoid duplicate operations
      retry: 0,
      networkMode: 'offlineFirst',
    },
  },
});

export const QueryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <TanstackQueryProvider client={queryClient}>
      {children}
      {/* DevTools removido para evitar confusão visual com widget na tela */}
    </TanstackQueryProvider>
  );
};

// Export do queryClient para invalidações manuais
export { queryClient };
