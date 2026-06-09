import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { MaintenanceManagement } from './MaintenanceManagement';
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
      if (key === 'maintenance_orders') {
        return {
          data: [
            { id: '1', maquina_id: 'maq-1', tipo: 'preventiva', descricao: 'Troca de óleo', data_inicio: '2026-06-01', custo: 500, responsavel: 'Mecânico A', status: 'completed', maquinas: { nome: 'Trator A' } },
            { id: '2', maquina_id: 'maq-2', tipo: 'corretiva', descricao: 'Reparo do motor', data_inicio: '2026-06-02', custo: 2000, responsavel: 'Mecânico B', status: 'ABERTA', maquinas: { nome: 'Colheitadeira B' } }
          ],
          isLoading: false
        };
      }
      if (key === 'machines_maint') {
        return {
          data: {
            data: [{ id: 'maq-1', nome: 'Trator A' }],
            count: 1
          },
          isLoading: false
        };
      }
      return { data: [], isLoading: false };
    })
  };
});

describe('MaintenanceManagement', () => {
  const queryClient = new QueryClient();

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <MaintenanceManagement />
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders headers and buttons', () => {
    renderComponent();
    expect(screen.getAllByText('Manutenções').length).toBeGreaterThan(0);
    expect(screen.getAllByText('NOVA ORDEM').length).toBeGreaterThan(0);
    expect(screen.getAllByText('CHECKLIST 100H').length).toBeGreaterThan(0);
  });

  it('renders stats correctly', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getAllByText('1').length).toBeGreaterThan(0); // OS em aberto
      expect(screen.getAllByText('R$ 2.500,00').length).toBeGreaterThan(0); // TCO (Manutenção) = 500 + 2000
    });
  });

  it('renders the kanban board columns', () => {
    renderComponent();
    expect(screen.getAllByText('📌 Pendente').length).toBeGreaterThan(0);
    expect(screen.getAllByText('🛠️ Em Oficina').length).toBeGreaterThan(0);
    expect(screen.getAllByText('✅ Concluída').length).toBeGreaterThan(0);
  });

  it('renders the maintenance cards in kanban', () => {
    renderComponent();
    // Em kanban view by default, status is checked
    expect(screen.getAllByText('Colheitadeira B').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Reparo do motor').length).toBeGreaterThan(0);
  });
});
