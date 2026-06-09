import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { FleetDashboard } from './FleetDashboard';
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

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual as any,
    useQueryClient: vi.fn(() => ({ invalidateQueries: vi.fn() })),
    useMutation: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
    useQuery: vi.fn((options: any) => {
      const key = options.queryKey[0];
      if (key === 'fleet_dashboard') {
        return {
          data: {
            machines: [
              { id: '1', nome: 'Trator John Deere', tipo: 'Trator', status: 'ATIVO', created_at: new Date().toISOString() },
              { id: '2', nome: 'Colheitadeira Case', tipo: 'Colheitadeira', status: 'ATIVO', created_at: new Date().toISOString() }
            ],
            fuelings: [
              { id: 'f1', maquina_id: '1', data: new Date().toISOString(), litros: 100, valor_total: 500, maquinas: { nome: 'Trator John Deere' } }
            ],
            maintenance: [
              { id: 'm1', maquina_id: '2', data_inicio: new Date().toISOString(), status: 'ABERTO', custo: 2000, descricao: 'Troca de óleo', maquinas: { nome: 'Colheitadeira Case' } }
            ],
            consumption: { total_litros: 100, total_custo: 500, media_litros: 100 },
            maintStats: [
              { custo: 2000, maquina_id: '2', status: 'ABERTO' }
            ]
          },
          isLoading: false
        };
      }
      return { data: null, isLoading: false };
    })
  };
});

describe('FleetDashboard', () => {
  const queryClient = new QueryClient();

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <FleetDashboard />
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders headers and KPI cards', async () => {
    renderComponent();
    expect(screen.getAllByText('Intelligence Hub').length).toBeGreaterThan(0);
    
    // KPI Data checks based on mocked data
    await waitFor(() => {
      // availability: 1 in maintenance out of 2 = 50%
      expect(screen.getAllByText('50.0%').length).toBeGreaterThan(0);
      
      // TCO: 500 fuel + 2000 maint = 2500 -> R$ 2.5k
      expect(screen.getAllByText('R$ 2.5k').length).toBeGreaterThan(0);
      
      // MTBF: 2 machines * 720 / 1 failure = 1440h
      expect(screen.getAllByText('1440h').length).toBeGreaterThan(0);
      
      // Avg Diesel: 100 L/abast.
      expect(screen.getAllByText('100.0 L/abast.').length).toBeGreaterThan(0);
    });
  });

  it('renders asset health and operational activity', async () => {
    renderComponent();

    // The machine in maintenance is 'Colheitadeira Case'
    expect(screen.getAllByText('Colheitadeira Case').length).toBeGreaterThan(0);
    
    // Fueling activity
    expect(screen.getAllByText('Abastecimento: Trator John Deere').length).toBeGreaterThan(0);
    expect(screen.getByText('R$ 500')).toBeInTheDocument();
  });
});
