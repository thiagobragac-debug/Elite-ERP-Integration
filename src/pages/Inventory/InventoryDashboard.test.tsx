import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { InventoryDashboard } from './InventoryDashboard';
import { vi } from 'vitest';

vi.mock('../../hooks/useFarmFilter', () => ({
  useFarmFilter: () => ({
    activeFarmId: 'farm-1',
    activeTenantId: 'tenant-1',
    isGlobalMode: false,
    applyFarmFilter: (q: any) => q,
  }),
}));

vi.mock('../../contexts/TenantContext', () => ({
  useTenant: () => ({ tenant: { id: 'tenant-1' } }),
}));

// Mock useQuery to bypass Supabase queries
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...(actual as any),
    useQuery: vi.fn((options: any) => {
      const key = options.queryKey[0];
      if (key === 'inventory_products') {
        return {
          data: [
            {
              id: '1',
              nome: 'Semente Milho',
              estoque_atual: 10,
              estoque_minimo: 50,
              custo_medio: 100,
              unidade: 'kg',
              categoria: 'Insumo',
              created_at: '2026-06-01',
            },
            {
              id: '2',
              nome: 'Adubo',
              estoque_atual: 500,
              estoque_minimo: 100,
              custo_medio: 50,
              unidade: 'kg',
              categoria: 'Insumo',
              created_at: '2026-06-02',
            },
          ],
          isLoading: false,
        };
      }
      if (key === 'inventory_recent_movements') {
        return {
          data: [
            {
              id: '1',
              tipo: 'in',
              data_movimentacao: '2026-06-08',
              quantidade: 50,
              responsavel: 'João',
              produtos: { nome: 'Adubo', unidade: 'kg' },
            },
            {
              id: '2',
              tipo: 'out',
              data_movimentacao: '2026-06-07',
              quantidade: 10,
              responsavel: 'Maria',
              produtos: { nome: 'Semente Milho', unidade: 'kg' },
            },
          ],
          isLoading: false,
        };
      }
      if (key === 'inventory_outgoing_movements') {
        return {
          data: [
            { quantidade: 10, valor_unitario: 100, tipo: 'out', data_movimentacao: '2026-06-07' },
          ],
          isLoading: false,
        };
      }
      return { data: [], isLoading: false };
    }),
  };
});

describe('InventoryDashboard', () => {
  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <InventoryDashboard />
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page headers', () => {
    renderComponent();
    expect(screen.getAllByText('Intelligence Hub').length).toBeGreaterThan(0);
    expect(screen.getByText('VALORAÇÃO TOTAL')).toBeInTheDocument();
  });

  it('renders stats calculations correctly', () => {
    renderComponent();
    // Patrimônio Total: (10*100) + (500*50) = 1000 + 25000 = 26000
    expect(screen.getByText('R$ 26.000')).toBeInTheDocument();

    // Ruptura de Estoque (1 item: Semente Milho is 10 < 50)
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Ruptura de Estoque')).toBeInTheDocument();
  });

  it('renders critical items grid', () => {
    renderComponent();
    expect(screen.getByText('Itens para Reposição Urgente')).toBeInTheDocument();
    expect(screen.getAllByText('Semente Milho').length).toBe(2); // 1 in critical, 1 in recent
    // It should not show Adubo in critical list
    expect(screen.getAllByText('Adubo').length).toBe(1); // Only in recent movements, not critical list
  });

  it('renders recent movements', () => {
    renderComponent();
    expect(screen.getByText('Fluxo de Movimentação')).toBeInTheDocument();

    // recent movements list titles
    // Note: Both 'Adubo' and 'Semente Milho' appear in recent movements
    const aduboElements = screen.getAllByText('Adubo');
    expect(aduboElements.length).toBeGreaterThan(0);

    expect(screen.getByText('Entrada')).toBeInTheDocument();
    expect(screen.getByText('Saída')).toBeInTheDocument();
  });
});
