import React from 'react';
import { render } from '@testing-library/react';
import type { RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { TenantProvider } from '../contexts/TenantContext';
import { ConfirmProvider } from '../contexts/ConfirmContext';

/**
 * Creates a test QueryClient with optimized settings for tests
 * - Disables retry to make tests faster
 * - Disables caching to ensure test isolation
 * - Disables refetchOnWindowFocus for deterministic tests
 */
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },

  });

interface AllTheProvidersProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
}

/**
 * Wrapper component that provides all necessary providers for testing
 * Includes:
 * - QueryClientProvider (React Query)
 * - BrowserRouter (React Router)
 * - AuthProvider (Authentication context)
 * - TenantProvider (Multi-tenant context)
 * - ConfirmProvider (Confirmation dialog context)
 */
export function AllTheProviders({ children, queryClient }: AllTheProvidersProps) {
  const testQueryClient = queryClient || createTestQueryClient();

  return (
    <QueryClientProvider client={testQueryClient}>
      <BrowserRouter>
        <AuthProvider>
          <TenantProvider>
            <ConfirmProvider>{children}</ConfirmProvider>
          </TenantProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
}

/**
 * Custom render function that wraps components with all necessary providers
 *
 * @param ui - The React component to render
 * @param options - Optional render options including custom queryClient
 * @returns Testing Library render result
 *
 * @example
 * ```tsx
 * import { renderWithProviders } from '@/test-utils/render';
 * import MyComponent from './MyComponent';
 *
 * test('renders component', () => {
 *   const { getByText } = renderWithProviders(<MyComponent />);
 *   expect(getByText('Hello')).toBeInTheDocument();
 * });
 * ```
 *
 * @example With custom QueryClient
 * ```tsx
 * const customQueryClient = new QueryClient({
 *   defaultOptions: { queries: { retry: 3 } }
 * });
 *
 * renderWithProviders(<MyComponent />, { queryClient: customQueryClient });
 * ```
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options: RenderWithProvidersOptions = {}
) {
  const { queryClient, ...renderOptions } = options;

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <AllTheProviders queryClient={queryClient}>{children}</AllTheProviders>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Re-export everything from Testing Library for convenience
export * from '@testing-library/react';
export { renderWithProviders as render };
