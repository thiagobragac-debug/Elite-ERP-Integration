import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { WarehouseDetails } from './WarehouseDetails';
import { vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn()
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

describe('WarehouseDetails', () => {
  const queryClient = new QueryClient();

  const renderComponent = (id = '1') => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/estoque/deposito/${id}`]}>
          <Routes>
            <Route path="/estoque/deposito/:id" element={<WarehouseDetails />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock Supabase chained calls
    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockResolvedValue({
      data: {
        id: '1',
        nome: 'Galpão Sede',
        tipo: 'Galpão',
        localizacao_tecnica: 'Sede Principal',
        capacidade_maxima: 1000,
        status: 'ativo'
      }
    });
    
    const mockOrder = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'mov1',
          deposito_id: '1',
          produto_id: 'prod1',
          tipo: 'IN',
          quantidade: 50,
          created_at: new Date().toISOString(),
          produtos: {
            id: 'prod1',
            nome: 'Semente de Milho',
            categoria_id: 'Sementes',
            custo_medio: 10,
            unidade_medida: 'sc'
          }
        },
        {
          id: 'mov2',
          deposito_id: '1',
          produto_id: 'prod1',
          tipo: 'OUT',
          quantidade: 20,
          created_at: new Date().toISOString(),
          produtos: {
            id: 'prod1',
            nome: 'Semente de Milho',
            categoria_id: 'Sementes',
            custo_medio: 10,
            unidade_medida: 'sc'
          }
        }
      ]
    });

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'depositos') {
        return { select: mockSelect, eq: mockEq, single: mockSingle };
      }
      if (table === 'movimentacoes_estoque') {
        return { select: mockSelect, eq: mockEq, order: mockOrder };
      }
      return { select: mockSelect };
    });
  });

  it('renders warehouse data and calculates stock correctly', async () => {
    renderComponent();

    // Verify it loads the name
    await waitFor(() => {
      expect(screen.getAllByText('Galpão Sede').length).toBeGreaterThan(0);
    });

    // Check stats (stock IN 50, OUT 20 -> balance 30. Total Value 30 * 10 = 300)
    expect(screen.getAllByText('30').length).toBeGreaterThan(0); // quantity
    
    // Check tabs
    const historyTab = screen.getByText('Histórico de Movimentações');
    fireEvent.click(historyTab);
    
    // Should display the history records
    await waitFor(() => {
      expect(screen.getAllByText('ENTRADA').length).toBeGreaterThan(0);
      expect(screen.getAllByText('SAÍDA').length).toBeGreaterThan(0);
    });
  });
});
