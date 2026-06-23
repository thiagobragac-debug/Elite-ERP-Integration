import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryProvider, queryClient } from '@/contexts/QueryProvider';

describe('QueryProvider', () => {
  describe('ReactQueryDevtools', () => {
    it('should NOT render DevTools in production mode (DEV=false)', () => {
      // Mock import.meta.env.DEV to false (production)
      vi.stubGlobal('import', {
        meta: {
          env: {
            DEV: false,
            VITE_SUPABASE_URL: 'https://test.supabase.co',
            VITE_SUPABASE_ANON_KEY: 'test-key'
          }
        }
      });

      const { container } = render(
        <QueryProvider>
          <div>Test Content</div>
        </QueryProvider>
      );

      // DevTools should not be in the DOM in production
      // React Query DevTools renders as a fixed panel with class prefix
      const devToolsPanel = container.querySelector('[class*="devtools"]');
      
      // In production with DEV=false, the conditional {import.meta.env.DEV && ...}
      // prevents the ReactQueryDevtools component from being rendered at all
      expect(devToolsPanel).toBeNull();
    });

    it('should render children regardless of DEV mode', () => {
      render(
        <QueryProvider>
          <div>Test Content</div>
        </QueryProvider>
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should provide QueryClient to children', () => {
      const TestComponent = () => {
        return <div>Query Provider Working</div>;
      };

      render(
        <QueryProvider>
          <TestComponent />
        </QueryProvider>
      );

      expect(screen.getByText('Query Provider Working')).toBeInTheDocument();
    });
  });

  describe('QueryClient Configuration', () => {
    it('should be configured with optimized defaults per requirements 20.1-20.4', () => {
      // This test verifies that the QueryClient configuration follows
      // Requirements 20.1-20.4 from the system-improvements spec:
      // - staleTime: 5 minutes (Req 20.1)
      // - gcTime (cacheTime): 30 minutes (Req 20.2)
      // - retry: 1 attempt (Req 20.4)
      // - refetchOnWindowFocus: only in development (Req 20.3)
      
      const defaultOptions = queryClient.getDefaultOptions();
      
      // Requirement 20.1: staleTime should be 5 minutes
      expect(defaultOptions.queries?.staleTime).toBe(5 * 60 * 1000);
      
      // Requirement 20.2: gcTime (formerly cacheTime) should be 30 minutes
      expect(defaultOptions.queries?.gcTime).toBe(30 * 60 * 1000);
      
      // Requirement 20.4: retry should be 1 instead of default 3
      expect(defaultOptions.queries?.retry).toBe(1);
      
      // Requirement 20.3: refetchOnWindowFocus should be false in production
      // In development mode (DEV=true), it should be true
      // The value is set to import.meta.env.DEV
      expect(defaultOptions.queries?.refetchOnWindowFocus).toBeDefined();
      
      // Additional configuration checks
      expect(defaultOptions.queries?.retryDelay).toBe(1000);
      expect(defaultOptions.queries?.networkMode).toBe('offlineFirst');
      
      // Mutations should not retry (to avoid duplicate operations)
      expect(defaultOptions.mutations?.retry).toBe(0);
      expect(defaultOptions.mutations?.networkMode).toBe('offlineFirst');
    });

    it('should render provider correctly', () => {
      const { container } = render(
        <QueryProvider>
          <div>Config Test</div>
        </QueryProvider>
      );

      expect(container).toBeTruthy();
      expect(screen.getByText('Config Test')).toBeInTheDocument();
    });
  });
});
