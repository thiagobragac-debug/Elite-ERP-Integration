import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { AnimalManagement } from './AnimalManagement';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';

// Mock ResizeObserver for Recharts / UI components
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock dependencies
vi.mock('../../hooks/useFarmFilter', () => ({
  useFarmFilter: () => ({
    activeFarm: { id: 'farm-1', name: 'Fazenda 01' },
    isGlobalMode: false,
    activeFarmId: 'farm-1',
    activeTenantId: 'tenant-1',
    applyFarmFilter: vi.fn(),
    canCreate: true,
    insertPayload: { tenant_id: 'tenant-1', fazenda_id: 'farm-1' }
  })
}));

const mockRefresh = vi.fn();
const mockAnimals = [
  { id: '1', brinco: '001', raca: 'Nelore', sexo: 'M', status: 'Ativo', peso_inicial: 200, peso_atual: 250, lote: 'Lote 1', isSanitaryBlocked: false },
  { id: '2', brinco: '002', raca: 'Angus', sexo: 'F', status: 'Abatido', peso_inicial: 300, peso_atual: 350, lote: 'Lote 2', isSanitaryBlocked: true }
];

vi.mock('../../hooks/useReportData', () => ({
  useReportData: vi.fn(() => ({
    data: mockAnimals,
    stats: [{ title: 'Total Animais', value: 2 }],
    loading: false,
    error: null,
    totalCount: 2,
    refresh: mockRefresh
  }))
}));

// Mock supabase client
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ count: 0, error: null }),
      update: vi.fn().mockResolvedValue({ error: null }),
      delete: vi.fn().mockResolvedValue({ error: null }),
      insert: vi.fn().mockResolvedValue({ error: null }),
    })
  }
}));

// Mocking Modals
vi.mock('../../components/Forms/AnimalForm', () => ({ AnimalForm: () => <div data-testid="animal-form-mock" /> }));
vi.mock('./components/QuickManejoModal', () => ({ QuickManejoModal: () => <div data-testid="quick-manejo-mock" /> }));
vi.mock('../../components/Modals/RomaneioEmbarqueModal', () => ({ RomaneioEmbarqueModal: () => <div data-testid="romaneio-mock" /> }));

describe('AnimalManagement', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AnimalManagement />
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders title and page actions', () => {
    renderComponent();
    expect(screen.getByText('Inventário individualizado e controle de ativos biológicos em tempo real.')).toBeInTheDocument();
    
    // Check buttons
    expect(screen.getByRole('button', { name: /Lotes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Romaneio de Embarque/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Novo Animal/i }).length).toBeGreaterThan(0);
  });

  it('renders animal list (default Todos)', () => {
    renderComponent();
    
    expect(screen.getByText('#001')).toBeInTheDocument();
    expect(screen.getByText('#002')).toBeInTheDocument();
  });

  it('filters animals when switching to Ativos tab', () => {
    renderComponent();
    
    const ativosTab = screen.getByRole('button', { name: 'Ativos' });
    fireEvent.click(ativosTab);
    
    expect(screen.getByText('#001')).toBeInTheDocument();
    expect(screen.queryByText('#002')).not.toBeInTheDocument();
  });

  it('filters by search term', () => {
    renderComponent();
    
    const searchInput = screen.getByPlaceholderText('Filtrar por brinco, raça ou lote...');
    fireEvent.change(searchInput, { target: { value: 'Angus' } });
    
    expect(screen.getByText('#002')).toBeInTheDocument();
    expect(screen.queryByText('#001')).not.toBeInTheDocument();
  });

  it('opens animal form modal when clicking Novo Animal', () => {
    renderComponent();
    
    const createBtns = screen.getAllByRole('button', { name: /Novo Animal/i });
    fireEvent.click(createBtns[createBtns.length - 1]); // click the primary btn
    
    expect(screen.getByTestId('animal-form-mock')).toBeInTheDocument();
  });

  it('switches to list view and interacts with buttons', () => {
    renderComponent();
    
    const listViewBtn = screen.getByTitle('Visualização em Lista');
    fireEvent.click(listViewBtn);
    
    const editBtns = screen.getAllByTitle('Editar');
    fireEvent.click(editBtns[0]);
    
    expect(screen.getByTestId('animal-form-mock')).toBeInTheDocument();
  });

  it('handles delete action in list view', async () => {
    renderComponent();
    
    const listViewBtn = screen.getByTitle('Visualização em Lista');
    fireEvent.click(listViewBtn);
    
    const deleteBtns = screen.getAllByTitle('Excluir');
    window.confirm = vi.fn().mockReturnValue(true);
    
    fireEvent.click(deleteBtns[0]);
    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith('Tem certeza que deseja excluir este animal?');
    });
  });

  it('handles delete action in grid view', async () => {
    renderComponent();
    // Grid is default
    const deleteBtns = screen.getAllByTitle('Excluir');
    window.confirm = vi.fn().mockReturnValue(true);
    
    fireEvent.click(deleteBtns[0]);
    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith('Tem certeza que deseja excluir este animal?');
    });
  });

  it('handles Manejo action', () => {
    renderComponent();
    
    const manejoBtns = screen.getAllByTitle('Manejos');
    fireEvent.click(manejoBtns[0]);
    
    expect(screen.getByTestId('quick-manejo-mock')).toBeInTheDocument();
  });

  it('handles export actions', () => {
    renderComponent();
    
    const exportMenuBtn = screen.getByTitle('Exportar');
    fireEvent.click(exportMenuBtn);
    
    // We mocked the export functionality directly in the module but we didn't mock the export module here. 
    // Just click to ensure it doesn't crash. We can mock export module to verify it was called.
    const csvBtn = screen.getByText('Excel (.CSV)');
    fireEvent.click(csvBtn);
  });
});
