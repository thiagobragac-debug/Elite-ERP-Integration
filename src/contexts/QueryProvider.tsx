import React, { createContext, useContext } from 'react';
import { QueryClient, QueryClientProvider as TanstackQueryProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Configure a global QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 5 minutes stale time. Data won't be refetched in background during this window
      // unless specifically invalidated (e.g., by Live Sync)
      staleTime: 1000 * 60 * 5, 
      // Cache remains in memory for 24 hours if unused
      gcTime: 1000 * 60 * 60 * 24,
      // In case of network errors, retry up to 3 times before failing
      retry: 3,
      // Refetch when the window regains focus (excellent for dashboard/SaaS apps)
      refetchOnWindowFocus: true,
      // Keep fetching even if offline, let the Offline Mode queue handle the actual persistence later
      networkMode: 'offlineFirst',
    },
    mutations: {
      networkMode: 'offlineFirst',
    }
  },
});

export const QueryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <TanstackQueryProvider client={queryClient}>
      {children}
      {/* Devtools are automatically excluded in production builds */}
      {/* <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" /> */}
    </TanstackQueryProvider>
  );
};

// Export the queryClient instance so we can manually invalidate caches from anywhere
export { queryClient };
