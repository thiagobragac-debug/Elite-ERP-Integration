import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { AuditManagement } from './AuditManagement';
import { vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../hooks/useFarmFilter', () => ({
  useFarmFilter: () => ({
    activeFarmId: 'farm-1',
    activeTenantId: 'tenant-1',
    isGlobalMode: false,
    applyFarmFilter: (q: any) => q,
    activeFarm: { id: 'farm-1', tenantId: 'tenant-1' },
  }),
}));

vi.mock('../../contexts/TenantContext', () => ({
  useTenant: () => ({ tenant: { id: 'tenant-1' } }),
}));

vi.mock('../../hooks/usePersistentState', () => ({
  usePersistentState: (key: string, initialValue: any) => {
    const [state, setState] = React.useState(initialValue);
    return [state, setState];
  },
}));

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...(actual as any),
    useQueryClient: vi.fn(() => ({ invalidateQueries: vi.fn() })),
    useMutation: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
    useQuery: vi.fn((options: any) => {
      const key = options.queryKey[0];
      if (key === 'audits') {
        return {
          data: [
            {
              id: '1',
              titulo: 'Auditoria Mensal',
              responsavel: 'Admin',
              categoria: 'Estoque Geral',
              status: 'completed',
              accuracy: 99,
              data: '2026-06-08',
            },
            {
              id: '2',
              titulo: 'Inventário Parcial',
              responsavel: 'Admin',
              categoria: 'Sementes',
              status: 'in_progress',
              accuracy: 88,
              data: '2026-06-07',
            },
          ],
          isLoading: false,
        };
      }
      return { data: [], isLoading: false };
    }),
  };
});

describe('AuditManagement', () => {
  const queryClient = new QueryClient();

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AuditManagement />
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders headers and new inventory button', () => {
    renderComponent();
    expect(screen.getAllByText('Inventário & Auditoria').length).toBeGreaterThan(0);
    expect(screen.getByText('NOVO INVENTÁRIO')).toBeInTheDocument();
  });

  it('renders stats correctly', () => {
    renderComponent();
    // 1 concluded audit
    expect(screen.getAllByText('1').length).toBeGreaterThan(0);

    // avg accuracy: (99 + 88) / 2 = 93.5
    expect(screen.getByText('93.5%')).toBeInTheDocument();
  });

  it('renders audit list in table', () => {
    renderComponent();
    expect(screen.getByText('Auditoria Mensal')).toBeInTheDocument();
    expect(screen.getByText('Inventário Parcial')).toBeInTheDocument();

    // Status
    expect(screen.getByText('Concluída')).toBeInTheDocument();
    expect(screen.getByText('Em Aberto')).toBeInTheDocument();
  });

  it('handles tab switches between History and Critical', () => {
    renderComponent();
    const historyTab = screen.getByText('Histórico de Auditorias');
    const criticalTab = screen.getByText('Itens Críticos');

    expect(historyTab).toHaveClass('active');
    expect(criticalTab).not.toHaveClass('active');

    fireEvent.click(criticalTab);
    expect(criticalTab).toHaveClass('active');
    expect(historyTab).not.toHaveClass('active');

    // When critical is active, only the audit with < 95% should show up
    expect(screen.queryByText('Auditoria Mensal')).not.toBeInTheDocument();
    expect(screen.getByText('Inventário Parcial')).toBeInTheDocument();
  });
});
