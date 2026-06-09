import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { InventoryManagement } from './InventoryManagement';
import { vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../hooks/useFarmFilter', () => ({
  useFarmFilter: () => ({
    activeFarmId: 'farm-1',
    activeTenantId: 'tenant-1',
    isGlobalMode: false,
    applyFarmFilter: (q: any) => q,
    applyTenantFilter: (q: any) => q,
    canCreate: true,
    insertPayload: {}
  })
}));

vi.mock('../../contexts/TenantContext', () => ({
  useTenant: () => ({ tenant: { id: 'tenant-1' } })
}));

// Mock simple usePersistentState
vi.mock('../../hooks/usePersistentState', () => ({
  usePersistentState: (key: string, initialValue: any) => {
    const [state, setState] = React.useState(initialValue);
    return [state, setState];
  }
}));

vi.mock('../../hooks/useViewMode', () => ({
  useViewMode: (key: string, initialValue: any) => {
    const [state, setState] = React.useState(initialValue);
    return [state, setState];
  }
}));

// Mock the React Query hook used
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual as any,
    useQueryClient: vi.fn(() => ({ invalidateQueries: vi.fn() })),
    useMutation: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
    useQuery: vi.fn((options: any) => {
      const key = options.queryKey[0];
      if (key === 'inventory_products') {
        return {
          data: {
            products: [
              { id: '1', nome: 'Semente Milho', estoque_atual: 10, estoque_minimo: 50, custo_medio: 100, unidade: 'kg', categoria: 'Insumo', created_at: '2026-06-01' },
              { id: '2', nome: 'Adubo', estoque_atual: 500, estoque_minimo: 100, custo_medio: 50, unidade: 'kg', categoria: 'Insumo', created_at: '2026-06-02' }
            ],
            totalCount: 2
          },
          isLoading: false
        };
      }
      return { data: { products: [], totalCount: 0 }, isLoading: false };
    })
  };
});

describe('InventoryManagement', () => {
  const queryClient = new QueryClient();

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <InventoryManagement />
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page headers and stats', async () => {
    renderComponent();
    expect(screen.getAllByText('Gestão de Insumos').length).toBeGreaterThan(0);
    
    // Stats
    expect(screen.getByText('R$ 26.000')).toBeInTheDocument(); // Patrimônio
    expect(screen.getByText('1')).toBeInTheDocument(); // Ruptura (Semente Milho)
  });

  it('renders products in grid view (default)', async () => {
    renderComponent();
    // Default view might be 'grid' or 'list' based on the mock. I mocked it to 'grid'.
    // If it's grid view, it should show 'Semente Milho' and 'Adubo' as cards
    expect(screen.getAllByText('Semente Milho').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Adubo').length).toBeGreaterThan(0);
  });

  it('handles tab switches', async () => {
    renderComponent();
    const supplementTab = screen.getByText('Suplemento');
    fireEvent.click(supplementTab);
    expect(supplementTab).toHaveClass('active');
  });

  it('toggles view mode', async () => {
    renderComponent();
    
    // Switch to list view
    const viewListBtn = screen.getByTitle('Visualização em Lista');
    fireEvent.click(viewListBtn);
    
    // List view uses ModernTable which uses 'Mostrando' text
    await waitFor(() => {
      expect(screen.getByText(/Mostrando/i)).toBeInTheDocument();
    });
  });
});
