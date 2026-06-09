import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { FleetManagement } from './FleetManagement';
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

vi.mock('../../hooks/useViewMode', () => ({
  useViewMode: (key: string, initialValue: any) => {
    const [state, setState] = React.useState(initialValue);
    return [state, setState];
  }
}));

vi.mock('../../hooks/useServerPagination', () => ({
  useServerPagination: () => ({
    page: 1,
    pageSize: 20,
    totalCount: 2,
    setTotalCount: vi.fn(),
    setPage: vi.fn(),
    getRange: () => ({ from: 0, to: 19 })
  })
}));

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual as any,
    useQueryClient: vi.fn(() => ({ invalidateQueries: vi.fn() })),
    useMutation: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
    useQuery: vi.fn((options: any) => {
      const key = options.queryKey[0];
      if (key === 'machines') {
        return {
          data: [
            { id: '1', nome: 'Trator MF', tipo: 'Trator', categoria: 'Trator', marca: 'Massey', modelo: '4292', ano: 2020, status: 'active', horimetro_atual: 150 },
            { id: '2', nome: 'Colheitadeira TC', tipo: 'Colheitadeira', categoria: 'Colheitadeira', marca: 'New Holland', modelo: 'TC5090', ano: 2018, status: 'maintenance', horimetro_atual: 450 }
          ],
          isLoading: false
        };
      }
      if (key === 'fuelStats') {
        return {
          data: [
            { litros: 200, maquina_id: '1' }
          ],
          isLoading: false
        };
      }
      return { data: [], isLoading: false };
    })
  };
});

describe('FleetManagement', () => {
  const queryClient = new QueryClient();

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <FleetManagement />
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders headers and new machine button', () => {
    renderComponent();
    expect(screen.getAllByText('Máquinas & Equipamentos').length).toBeGreaterThan(0);
    expect(screen.getAllByText('NOVO ATIVO').length).toBeGreaterThan(0);
  });

  it('renders stats correctly', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getAllByText('2').length).toBeGreaterThan(0); // Frota Operacional (2 assets)
      expect(screen.getAllByText('1').length).toBeGreaterThan(0); // Em manutenção
      expect(screen.getAllByText('200 L').length).toBeGreaterThan(0); // Consumo Total
      expect(screen.getAllByText('50.0%').length).toBeGreaterThan(0); // Disponibilidade (1 active / 2 total)
    });
  });

  it('renders grid view by default and lists machines', () => {
    renderComponent();
    expect(screen.getAllByText('Trator MF').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Colheitadeira TC').length).toBeGreaterThan(0);
  });

  it('filters by tabs', () => {
    renderComponent();
    const tab = screen.getAllByText('Trator')[0];
    fireEvent.click(tab);
    
    expect(screen.getAllByText('Trator MF').length).toBeGreaterThan(0);
    expect(screen.queryByText('Colheitadeira TC')).not.toBeInTheDocument();
  });
});
