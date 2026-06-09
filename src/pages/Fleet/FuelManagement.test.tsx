import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { FuelManagement } from './FuelManagement';
import { vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../hooks/useFarmFilter', () => ({
  useFarmFilter: () => ({
    activeFarmId: 'farm-1',
    activeTenantId: 'tenant-1',
    isGlobalMode: false,
    applyFarmFilter: (q: any) => q,
    canCreate: true,
    activeFarm: { id: 'farm-1', tenantId: 'tenant-1', name: 'Fazenda Boa Esperança' },
    insertPayload: {}
  })
}));

vi.mock('../../contexts/TenantContext', () => ({
  useTenant: () => ({ tenant: { id: 'tenant-1' } })
}));

vi.mock('../../hooks/usePersistentState', () => ({
  usePersistentState: (key: string, initialValue: any) => {
    const [state, setState] = React.useState(initialValue);
    return [state, setState];
  }
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual as any,
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  };
});

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual as any,
    useQueryClient: vi.fn(() => ({ invalidateQueries: vi.fn() })),
    useMutation: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
    useQuery: vi.fn((options: any) => {
      const key = options.queryKey[0];
      if (key === 'fuel_logs') {
        return {
          data: [
            { id: '1', data: '2026-06-01', litros: 100, valor_total: 500, tipo_combustivel: 'Diesel', maquina_id: 'maq-1', maquinas: { nome: 'Trator A' } },
            { id: '2', data: '2026-06-02', litros: 50, valor_total: 300, tipo_combustivel: 'Especial', maquina_id: 'maq-2', maquinas: { nome: 'Colheitadeira B' } }
          ],
          isLoading: false
        };
      }
      return { data: [], isLoading: false };
    })
  };
});

describe('FuelManagement', () => {
  const queryClient = new QueryClient();

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <FuelManagement />
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders headers and buttons', () => {
    renderComponent();
    expect(screen.getAllByText('Abastecimentos').length).toBeGreaterThan(0);
    expect(screen.getAllByText('NOVO REGISTRO').length).toBeGreaterThan(0);
    expect(screen.getAllByText('KPI AUTONOMIA').length).toBeGreaterThan(0);
  });

  it('renders stats correctly', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getAllByText('150 L').length).toBeGreaterThan(0); // 100 + 50
      expect(screen.getAllByText('R$ 800,00').length).toBeGreaterThan(0); // 500 + 300
    });
  });

  it('renders logs list', () => {
    renderComponent();
    expect(screen.getAllByText('Trator A').length).toBeGreaterThan(0);
    expect(screen.getAllByText('100 L').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Colheitadeira B').length).toBeGreaterThan(0);
    expect(screen.getAllByText('50 L').length).toBeGreaterThan(0);
  });
});
