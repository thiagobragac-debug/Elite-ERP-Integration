import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { MovementManagement } from './MovementManagement';
import { vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../hooks/useFarmFilter', () => ({
  useFarmFilter: () => ({
    activeFarmId: 'farm-1',
    activeTenantId: 'tenant-1',
    isGlobalMode: false,
    applyFarmFilter: (q: any) => q,
    canCreate: true,
    activeFarm: { id: 'farm-1', tenantId: 'tenant-1' }
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

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual as any,
    useQueryClient: vi.fn(() => ({ invalidateQueries: vi.fn() })),
    useMutation: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
    useQuery: vi.fn((options: any) => {
      const key = options.queryKey[0];
      if (key === 'movements') {
        return {
          data: {
            data: [
              { id: '1', tipo: 'in', quantidade: 50, valor_unitario: 10, data_movimentacao: '2026-06-08', responsavel: 'Admin', produtos: { nome: 'Semente Milho', unidade: 'kg' } },
              { id: '2', tipo: 'out', quantidade: 20, valor_unitario: 10, data_movimentacao: '2026-06-07', responsavel: 'Admin', produtos: { nome: 'Semente Milho', unidade: 'kg' } },
              { id: '3', tipo: 'transfer', quantidade: 10, valor_unitario: 50, data_movimentacao: '2026-06-06', responsavel: 'User', produtos: { nome: 'Adubo', unidade: 'kg' } }
            ],
            count: 3
          },
          isLoading: false
        };
      }
      return { data: { data: [], count: 0 }, isLoading: false };
    })
  };
});

describe('MovementManagement', () => {
  const queryClient = new QueryClient();

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <MovementManagement />
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders headers and buttons', () => {
    renderComponent();
    expect(screen.getAllByText('Movimentações').length).toBeGreaterThan(0);
    expect(screen.getByText('TRANSFERÊNCIA')).toBeInTheDocument();
    expect(screen.getByText('LANÇAR ENTRADA')).toBeInTheDocument();
    expect(screen.getByText('LANÇAR SAÍDA')).toBeInTheDocument();
  });

  it('renders stats correctly based on query data', () => {
    renderComponent();
    
    // Movimentações = 3
    expect(screen.getAllByText('3').length).toBeGreaterThan(0);
    
    // Entradas = 1, Saídas = 1
    expect(screen.getByText('Entradas (Pág.)')).toBeInTheDocument();
    expect(screen.getByText('Saídas (Pág.)')).toBeInTheDocument();
  });

  it('renders movement list in table', () => {
    renderComponent();
    expect(screen.getAllByText('Semente Milho').length).toBe(2);
    expect(screen.getByText('Adubo')).toBeInTheDocument();
    
    // Types
    expect(screen.getByText('Entrada')).toBeInTheDocument();
    expect(screen.getByText('Saída')).toBeInTheDocument();
    expect(screen.getByText('Transf.')).toBeInTheDocument();
  });

  it('handles tab switches between Log and Analysis', () => {
    renderComponent();
    const logTab = screen.getByText('Log de Movimentos');
    const analysisTab = screen.getByText('Análise de Fluxo');
    
    expect(logTab).toHaveClass('active');
    expect(analysisTab).not.toHaveClass('active');
    
    fireEvent.click(analysisTab);
    expect(analysisTab).toHaveClass('active');
    expect(logTab).not.toHaveClass('active');
  });
});
