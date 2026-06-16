import React, { createContext, useContext } from 'react';
import { QueryClient, QueryClientProvider as TanstackQueryProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Configuração otimizada do QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 5 minutos de stale time - dados não serão refetchados nesse período
      staleTime: 1000 * 60 * 5,
      // Cache permanece na memória por 30 minutos (otimizado de 24h)
      gcTime: 1000 * 60 * 30,
      // Reduzido para 1 retry (mais rápido em caso de erro)
      retry: 1,
      retryDelay: 1000,
      // Desabilitado em produção para evitar refetches excessivos
      refetchOnWindowFocus: import.meta.env.DEV,
      // Offline-first para áreas rurais
      networkMode: 'offlineFirst',
    },
    mutations: {
      retry: 0, // Mutations não devem ser retentadas automaticamente
      networkMode: 'offlineFirst',
    }
  },
});

export const QueryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <TanstackQueryProvider client={queryClient}>
      {children}
      {/* DevTools apenas em desenvolvimento */}
      {import.meta.env.DEV && (
        <ReactQueryDevtools 
          initialIsOpen={false} 
          position="bottom-right"
        />
      )}
    </TanstackQueryProvider>
  );
};

// Export do queryClient para invalidações manuais
export { queryClient };
