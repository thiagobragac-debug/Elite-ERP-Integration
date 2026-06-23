import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { ReproductionManagement } from './ReproductionManagement';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';

vi.mock('../../hooks/useFarmFilter', () => ({
  useFarmFilter: () => ({
    activeFarmId: 'farm-1',
    activeTenantId: 'tenant-1',
    canCreate: true,
    insertPayload: { tenant_id: 'tenant-1', fazenda_id: 'farm-1' },
  }),
}));

const mockRefresh = vi.fn();
vi.mock('../../hooks/useReportData', () => ({
  useReportData: vi.fn((reportType, options) => {
    return {
      data: [
        {
          id: '1',
          animais: { brinco: 'VACA-1' },
          tipo_evento: 'IATF',
          data_evento: '2026-06-08',
          resultado: 'Aguardando',
          ecc: 3.5,
          touro: 'Touro Nelore',
          progressoGestacao: 0,
          status: 'completed',
        },
        {
          id: '2',
          animais: { brinco: 'VACA-2' },
          tipo_evento: 'Parto',
          data_evento: '2026-06-08',
          resultado: 'Prenha',
          ecc: 2.5,
          touro: null,
          progressoGestacao: 95,
          status: 'completed',
        },
      ],
      stats: [
        { label: 'Eventos no Mês', value: 15 },
        { label: 'Taxa de Prenhez', value: '80%' },
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

vi.mock('./components/BatchReproModal', () => ({
  BatchReproModal: ({ isOpen, onClose, onBatchSubmit }: any) =>
    isOpen ? (
      <div data-testid="mock-batch-modal">
        <button onClick={() => onBatchSubmit([{ animal_id: 'vaca-1', tipo_evento: 'IATF' }])}>
          Lançar Lote Mock
        </button>
        <button onClick={onClose}>Fechar Lote</button>
      </div>
    ) : null,
}));

vi.mock('./components/ReproductionFilterModal', () => ({
  ReproductionFilterModal: ({ isOpen, onClose }: any) =>
    isOpen ? (
      <div data-testid="mock-filter-modal">
        <button onClick={onClose}>Aplicar Filtros</button>
      </div>
    ) : null,
}));

vi.mock('../../components/Forms/ReproductionForm', () => ({
  ReproductionForm: ({ isOpen, onClose, onSubmit }: any) =>
    isOpen ? (
      <div data-testid="mock-repro-form">
        <button onClick={() => onSubmit({ tipo_evento: 'IATF' })}>Salvar Mock</button>
        <button onClick={onClose}>Cancelar</button>
      </div>
    ) : null,
}));

describe('ReproductionManagement', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ReproductionManagement />
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    window.confirm = vi.fn(() => true);
  });

  it('renders page headers and stats', () => {
    renderComponent();
    expect(screen.getAllByText('Reprodução').length).toBeGreaterThan(0);
    expect(screen.getByText('Estação de Monta')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument(); // Taxa de Prenhez
  });

  it('filters data by active tab', async () => {
    renderComponent();

    // Default is 'ESTACAO'
    expect(screen.getByText('#VACA-1')).toBeInTheDocument();
    expect(screen.queryByText('#VACA-2')).not.toBeInTheDocument(); // It's Parto

    // Click "Previsão de Partos" tab
    const partosTab = screen.getByText('Previsão de Partos');
    fireEvent.click(partosTab);

    await waitFor(() => {
      expect(screen.getByText('#VACA-2')).toBeInTheDocument();
    });
  });

  it('searches by brinco or event', async () => {
    renderComponent();
    const searchInput = screen.getByPlaceholderText('Buscar por animal ou tipo de evento...');
    fireEvent.change(searchInput, { target: { value: 'VACA-1' } });

    await waitFor(() => {
      expect(screen.getByText('#VACA-1')).toBeInTheDocument();
    });
  });

  it('can open and close the Repro Form modal', async () => {
    renderComponent();
    const newBtn = screen.getByRole('button', { name: /NOVO EVENTO/i });
    fireEvent.click(newBtn);

    expect(screen.getByTestId('mock-repro-form')).toBeInTheDocument();

    const cancelBtn = screen.getByText('Cancelar');
    fireEvent.click(cancelBtn);

    await waitFor(() => {
      expect(screen.queryByTestId('mock-repro-form')).not.toBeInTheDocument();
    });
  });

  it('can open advanced filters', () => {
    renderComponent();
    const filterBtn = screen.getByTitle('Filtros Avançados');
    fireEvent.click(filterBtn);

    expect(screen.getByTestId('mock-filter-modal')).toBeInTheDocument();
  });

  it('can open batch modal and apply a batch', async () => {
    renderComponent();
    const batchBtn = screen.getByRole('button', { name: /LANÇAMENTO LOTE/i });
    fireEvent.click(batchBtn);

    expect(screen.getByTestId('mock-batch-modal')).toBeInTheDocument();

    const applyBtn = screen.getByText('Lançar Lote Mock');
    fireEvent.click(applyBtn);

    await waitFor(() => {
      expect(screen.queryByTestId('mock-batch-modal')).not.toBeInTheDocument();
    });
  });
});
