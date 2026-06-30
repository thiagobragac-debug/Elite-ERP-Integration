import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { ConfirmProvider } from '../../contexts/ConfirmContext';
import { NcmSettingsTab } from './InventorySettings';
import { vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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
      if (key === 'ncms') {
        return {
          data: [
            {
              id: '1',
              codigo: '3105.20.00',
              descricao: 'Adubos (fertilizantes) minerais ou químicos',
              is_active: true,
            },
            { id: '2', codigo: '1005.90.10', descricao: 'Milho em grão', is_active: false },
          ],
          isLoading: false,
        };
      }
      return { data: [], isLoading: false };
    }),
  };
});

describe('InventorySettings (NcmSettingsTab)', () => {
  const queryClient = new QueryClient();

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ConfirmProvider>
        <MemoryRouter>
          <NcmSettingsTab searchTerm="" triggerCreate={0} triggerImport={0} />
        </MemoryRouter>
        </ConfirmProvider>
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders ncm list', () => {
    renderComponent();
    expect(screen.getAllByText('3105.20.00').length).toBeGreaterThan(0);
    expect(screen.getAllByText('1005.90.10').length).toBeGreaterThan(0);

    // Status
    expect(screen.getByText('ATIVO')).toBeInTheDocument();
    expect(screen.getByText('INATIVO')).toBeInTheDocument();
  });

  it('opens import modal when triggerImport changes', () => {
    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <NcmSettingsTab searchTerm="" triggerCreate={0} triggerImport={0} />
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Rerender with triggerImport > 0
    rerender(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <NcmSettingsTab searchTerm="" triggerCreate={0} triggerImport={1} />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getAllByText('Importador da Receita').length).toBeGreaterThan(0);
  });
});
