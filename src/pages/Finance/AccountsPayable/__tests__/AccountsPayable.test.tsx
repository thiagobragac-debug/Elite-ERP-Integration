/**
 * Integration tests for refactored AccountsPayable module
 * Ensures all components work together after refactoring
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../test-utils/render';
import { AccountsPayable } from '../index';
import { server } from '../../../../__mocks__/browser';
import { http, HttpResponse } from 'msw';

describe('AccountsPayable - Refactored Module Integration', () => {
  const mockTenantId = 'test-tenant-id';
  const mockBills = [
    {
      id: 'bill-1',
      tenant_id: mockTenantId,
      descricao: 'Fornecedor X',
      valor_total: 5000,
      data_vencimento: '2024-12-31',
      status: 'PENDENTE',
      categoria: 'Insumos',
      metodo_pagamento: 'Boleto',
      parceiros: { nome: 'Fornecedor X' },
    },
    {
      id: 'bill-2',
      tenant_id: mockTenantId,
      descricao: 'Fornecedor Y',
      valor_total: 3000,
      data_vencimento: '2024-11-30',
      status: 'PAGO',
      categoria: 'Serviços',
      metodo_pagamento: 'PIX',
      parceiros: { nome: 'Fornecedor Y' },
    },
  ];

  beforeEach(() => {
    // Mock API responses
    server.use(
      // Mock direct table query for contas_pagar
      http.get('*/rest/v1/contas_pagar*', () => {
        return HttpResponse.json(mockBills, {
          headers: {
            'Content-Range': `0-${mockBills.length - 1}/${mockBills.length}`,
          },
        });
      }),
      // Mock RPC call for finance summary
      http.post('*/rest/v1/rpc/get_finance_summary', () => {
        return HttpResponse.json([
          { status: 'PENDENTE', total_value: 5000 },
          { status: 'PAGO', total_value: 3000 },
        ]);
      })
    );
  });

  it('should render AccountsPayable module with all components', async () => {
    renderWithProviders(<AccountsPayable />);

    // Check header elements
    expect(screen.getByText('Contas a Pagar')).toBeInTheDocument();
    expect(screen.getByText(/Gestão de obrigações/i)).toBeInTheDocument();

    // Check action buttons
    expect(screen.getByRole('button', { name: /calendário/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /nova conta/i })).toBeInTheDocument();
  });

  it('should display accounts in table after loading', async () => {
    renderWithProviders(<AccountsPayable />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Fornecedor X')).toBeInTheDocument();
    });

    expect(screen.getByText('Fornecedor Y')).toBeInTheDocument();
  });

  it('should allow tab filtering between different account statuses', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AccountsPayable />);

    await waitFor(() => {
      expect(screen.getByText('Fornecedor X')).toBeInTheDocument();
    });

    // Click on "Pagas" tab
    const pagasTab = screen.getByRole('button', { name: /pagas/i });
    await user.click(pagasTab);

    // Should now show only paid accounts
    await waitFor(() => {
      expect(pagasTab).toHaveClass('active');
    });
  });

  it('should allow searching accounts by description', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AccountsPayable />);

    await waitFor(() => {
      expect(screen.getByText('Fornecedor X')).toBeInTheDocument();
    });

    // Type in search input
    const searchInput = screen.getByPlaceholderText(/filtrar por descrição/i);
    await user.type(searchInput, 'Fornecedor X');

    expect(searchInput).toHaveValue('Fornecedor X');
  });

  it('should toggle advanced filters modal', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AccountsPayable />);

    // Click filter button
    const filterButton = screen.getByTitle('Filtros Avançados');
    await user.click(filterButton);

    // Check if filter modal opens
    await waitFor(() => {
      expect(screen.getByText('Filtros de Pagamento')).toBeInTheDocument();
    });
  });

  it('should verify modular structure exports correctly', () => {
    // This test ensures the module exports work correctly
    expect(AccountsPayable).toBeDefined();
    expect(typeof AccountsPayable).toBe('function');
  });
});
