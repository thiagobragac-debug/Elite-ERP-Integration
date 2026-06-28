import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { ConfinementManagement } from './ConfinementManagement';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';

const mockConfirm = vi.fn().mockResolvedValue(true);
vi.mock('../../contexts/ConfirmContext', () => ({
  useConfirm: () => ({ confirm: mockConfirm }),
  ConfirmProvider: ({ children }: any) => <>{children}</>,
}));

vi.mock('../../hooks/useFarmFilter', () => ({
  useFarmFilter: () => ({
    activeFarmId: 'farm-1',
    activeTenantId: 'tenant-1',
    canCreate: true,
    insertPayload: { tenant_id: 'tenant-1', fazenda_id: 'farm-1' },
  }),
}));

vi.mock('../../hooks/usePermissions', () => ({
  usePermissions: () => ({
    can: () => true,
    hasRole: () => true,
  }),
}));

const mockRefresh = vi.fn();
vi.mock('../../hooks/useReportData', () => ({
  useReportData: vi.fn((reportType, options) => {
    return {
      data: [
        {
          id: '1',
          nome_curral: 'Curral 01',
          lotes: { nome: 'Lote Teste' },
          capacidade_animais: 100,
          dof: 45,
          dof_alvo: 90,
          progress: 50,
          status: 'active',
          projectedWeight: 450,
          cpd: 12,
        },
        {
          id: '2',
          nome_curral: 'Curral 02',
          lotes: null,
          capacidade_animais: 80,
          dof: 100,
          dof_alvo: 90,
          progress: 111,
          status: 'archived',
          projectedWeight: 520,
          cpd: 15,
        },
      ],
      stats: [
        { label: 'Currais Ativos', value: 5 },
        { label: 'Taxa de Ocupação', value: '85%' },
      ],
      loading: false,
      error: null,
      totalCount: 2,
      refresh: mockRefresh,
    };
  }),
}));

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockImplementation(() => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
      delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
    })),
  },
}));

// Mock export functions
vi.mock('../../utils/export', () => ({
  exportToCSV: vi.fn(),
  exportToExcel: vi.fn(),
  exportToPDF: vi.fn(),
}));

// Mock modals
vi.mock('../../components/Modals/HistoryModal', () => ({
  HistoryModal: ({ isOpen, onClose }: any) =>
    isOpen ? (
      <div data-testid="mock-history-modal">
        <button onClick={onClose}>Fechar Histórico</button>
      </div>
    ) : null,
}));

vi.mock('./components/CheckOutModal', () => ({
  CheckOutModal: ({ isOpen, onClose }: any) =>
    isOpen ? (
      <div data-testid="mock-checkout-modal">
        <button onClick={onClose}>Fechar CheckOut</button>
      </div>
    ) : null,
}));

vi.mock('./components/ConfinementFilterModal', () => ({
  ConfinementFilterModal: ({ isOpen, onClose }: any) =>
    isOpen ? (
      <div data-testid="mock-filter-modal">
        <button onClick={onClose}>Fechar Filtro</button>
      </div>
    ) : null,
}));

// It opens a simple form, but we can just check if we trigger setIsModalOpen which renders a ConfinementForm
// The component renders ConfinementForm implicitly because of previous structure but let's check if it exists in the file:
// Wait, looking at the code, ConfinementForm is not in the JSX return block in the truncated code, let me assume it's there or I can mock it if it's rendered.
// Actually, I can mock it just in case:
vi.mock('../../components/Forms/ConfinementForm', () => ({
  ConfinementForm: ({ isOpen, onClose }: any) =>
    isOpen ? (
      <div data-testid="mock-confinement-form">
        <button onClick={onClose}>Fechar Check-in</button>
      </div>
    ) : null,
}));

describe('ConfinementManagement', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ConfirmProvider>
            <ConfinementManagement />
          </ConfirmProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page headers and stats', () => {
    renderComponent();
    expect(screen.getAllByText('Confinamento').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Currais Ativos').length).toBeGreaterThan(0);
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('filters data by active tab', async () => {
    renderComponent();

    // Grid mode is default. Should show Curral 01
    expect(screen.getByText('Curral 01')).toBeInTheDocument();
    expect(screen.queryByText('Curral 02')).not.toBeInTheDocument(); // Archived

    // Click "Histórico" tab
    const historicoTab = screen.getByText('Histórico de Ciclos');
    fireEvent.click(historicoTab);

    await waitFor(() => {
      expect(screen.getByText('Curral 02')).toBeInTheDocument();
    });
  });

  it('searches by curral name', async () => {
    renderComponent();
    const searchInput = screen.getByPlaceholderText('Buscar por curral ou lote...');
    fireEvent.change(searchInput, { target: { value: 'Curral 01' } });

    await waitFor(() => {
      expect(screen.getByText('Curral 01')).toBeInTheDocument();
    });
  });

  it('switches between grid and list views', async () => {
    renderComponent();

    // By default it might be grid (has cards) or list depending on hook
    const listBtn = screen.getByTitle('Visualização em Lista');
    const gridBtn = screen.getByTitle('Visualização em Cards');

    fireEvent.click(listBtn);

    await waitFor(() => {
      // In list mode, ModernTable renders ID
      expect(screen.getByText(/ID:/i)).toBeInTheDocument();
    });

    fireEvent.click(gridBtn);

    await waitFor(() => {
      // In grid mode, we see DOF / PROCESSO
      expect(screen.getAllByText('DOF / PROCESSO').length).toBeGreaterThan(0);
    });
  });

  it('can open advanced filters', () => {
    renderComponent();
    const filterBtn = screen.getByTitle('Filtros Avançados');
    fireEvent.click(filterBtn);

    expect(screen.getByTestId('mock-filter-modal')).toBeInTheDocument();
  });

  it('can open checkout modal', () => {
    renderComponent();
    const checkoutBtn = screen.getByRole('button', { name: /Check-out Lote/i });
    fireEvent.click(checkoutBtn);

    expect(screen.getByTestId('mock-checkout-modal')).toBeInTheDocument();
  });
});
