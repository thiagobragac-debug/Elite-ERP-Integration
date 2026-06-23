import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { NutritionManagement } from './NutritionManagement';
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
          nome: 'Dieta Engorda',
          tipo: 'RACAO',
          custo_por_kg: 2.5,
          percMS: 80,
          custoMS: 3.12,
          status: 'active',
          ingredientes: ['Milho', 'Soja'],
        },
        {
          id: '2',
          nome: 'Milho Moído',
          tipo: 'MATERIA_PRIMA',
          custo_por_kg: 1.2,
          percMS: 88,
          custoMS: 1.36,
          status: 'active',
          ingredientes: [],
        },
      ],
      stats: [
        { label: 'Dietas Ativas', value: 10 },
        { label: 'Custo Médio / kg', value: 'R$ 2,50' },
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

// Mock inner components to avoid complex renders
vi.mock('../../components/Forms/DietForm', () => ({
  DietForm: ({ isOpen, onClose, onSubmit }: any) =>
    isOpen ? (
      <div data-testid="mock-diet-form">
        <button onClick={() => onSubmit({ nome: 'Nova Dieta Mock', custo_por_kg: 1 })}>
          Salvar Mock
        </button>
        <button onClick={onClose}>Cancelar</button>
      </div>
    ) : null,
}));

vi.mock('../../components/Modals/HistoryModal', () => ({
  HistoryModal: ({ isOpen, onClose }: any) =>
    isOpen ? (
      <div data-testid="mock-history-modal">
        <button onClick={onClose}>Fechar Histórico</button>
      </div>
    ) : null,
}));

vi.mock('./components/NutritionSimulatorModal', () => ({
  NutritionSimulatorModal: ({ isOpen, onClose }: any) =>
    isOpen ? (
      <div data-testid="mock-simulator-modal">
        <button onClick={onClose}>Fechar Simulador</button>
      </div>
    ) : null,
}));

vi.mock('./components/NutritionFilterModal', () => ({
  NutritionFilterModal: ({ isOpen, onClose }: any) =>
    isOpen ? (
      <div data-testid="mock-filter-modal">
        <button onClick={onClose}>Aplicar Filtros</button>
      </div>
    ) : null,
}));

describe('NutritionManagement', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <NutritionManagement />
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    window.confirm = vi.fn(() => true); // Auto-confirm deletions
  });

  it('renders page headers and stats', () => {
    renderComponent();
    expect(screen.getAllByText('Nutrição').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Dietas Ativas').length).toBeGreaterThan(0);
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('filters data by active tab', async () => {
    renderComponent();

    // Tab "Dietas Ativas" is active by default
    expect(screen.getByText('Dieta Engorda')).toBeInTheDocument();
    expect(screen.queryByText('Milho Moído')).not.toBeInTheDocument(); // It's MATERIA_PRIMA

    // Click "Matérias Primas" tab
    const materiasPrimasTab = screen.getAllByText('Matérias Primas')[0]; // There might be an icon label too
    fireEvent.click(materiasPrimasTab);

    // Should now show Milho Moído
    await waitFor(() => {
      expect(screen.getByText('Milho Moído')).toBeInTheDocument();
    });
  });

  it('searches by name', async () => {
    renderComponent();
    const searchInput = screen.getByPlaceholderText('Buscar formulação pelo nome...');
    fireEvent.change(searchInput, { target: { value: 'Engorda' } });

    await waitFor(() => {
      expect(screen.getByText('Dieta Engorda')).toBeInTheDocument();
    });
  });

  it('can open and close the Diet Form modal', async () => {
    renderComponent();
    const newDietBtn = screen.getByRole('button', { name: /NOVA DIETA/i });
    fireEvent.click(newDietBtn);

    expect(screen.getByTestId('mock-diet-form')).toBeInTheDocument();

    const cancelBtn = screen.getByText('Cancelar');
    fireEvent.click(cancelBtn);

    await waitFor(() => {
      expect(screen.queryByTestId('mock-diet-form')).not.toBeInTheDocument();
    });
  });

  it('can submit a new diet', async () => {
    renderComponent();
    const newDietBtn = screen.getByRole('button', { name: /NOVA DIETA/i });
    fireEvent.click(newDietBtn);

    const submitBtn = screen.getByText('Salvar Mock');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.queryByTestId('mock-diet-form')).not.toBeInTheDocument(); // closes on success
    });
  });

  it('can open the simulator modal', () => {
    renderComponent();
    const simBtn = screen.getByRole('button', { name: /SIMULADOR/i });
    fireEvent.click(simBtn);

    expect(screen.getByTestId('mock-simulator-modal')).toBeInTheDocument();
  });

  it('can open the advanced filters modal', () => {
    renderComponent();
    const filterBtn = screen.getByTitle('Filtros Avançados');
    fireEvent.click(filterBtn);

    expect(screen.getByTestId('mock-filter-modal')).toBeInTheDocument();
  });
});
