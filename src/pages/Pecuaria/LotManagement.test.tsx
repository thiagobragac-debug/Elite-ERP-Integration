import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { LotManagement } from './LotManagement';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mocking hooks
vi.mock('../../hooks/useFarmFilter', () => ({
  useFarmFilter: () => ({
    activeFarm: { id: 'farm-1', name: 'Farm 1' },
    isGlobalMode: false,
    activeFarmId: 'farm-1',
    activeTenantId: 'tenant-1',
    applyFarmFilter: vi.fn(),
    canCreate: true,
    insertPayload: { tenant_id: 'tenant-1', fazenda_id: 'farm-1' }
  })
}));

const mockRefresh = vi.fn();
const mockLots = [
  { id: 'lot-1', nome: 'Lote Ativo 1', status: 'ATIVO', capacidade: 100, quantidade_animais: 50 },
  { id: 'lot-2', nome: 'Lote Arquivado 1', status: 'ARQUIVADO', capacidade: 50, quantidade_animais: 0 }
];

vi.mock('../../hooks/useReportData', () => ({
  useReportData: vi.fn(() => ({
    data: mockLots,
    stats: [{ title: 'Total Lotes', value: 2 }],
    loading: false,
    error: null,
    totalCount: 2,
    refresh: mockRefresh
  }))
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1' }
  })
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

// Mocking forms and modals
vi.mock('../../components/Forms/LotForm', () => ({ LotForm: () => <div data-testid="lot-form-mock" /> }));
vi.mock('../../components/Forms/RelocateForm', () => ({ RelocateForm: () => <div data-testid="relocate-form-mock" /> }));
vi.mock('../../components/Forms/AssignAnimalForm', () => ({ AssignAnimalForm: () => <div data-testid="assign-animal-form-mock" /> }));
vi.mock('../../components/Modals/ProcessarLoteModal', () => ({ ProcessarLoteModal: ({ title }: any) => <div>{title || 'Processamento de Lote Pendente'}</div> }));

// Mock ResizeObserver for Recharts
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('LotManagement', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <LotManagement />
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders title and page actions', () => {
    renderComponent();
    expect(screen.getByText('Organização do rebanho, rastreabilidade por grupo e controle de lotação em tempo real.')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /NOVO LOTE/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /REMANEJAR/i })).toBeInTheDocument();
  });

  it('renders lot list (default Ativos)', () => {
    renderComponent();
    
    // Check if the 'Lote Ativo 1' is rendered (in default Grid view or List view)
    expect(screen.getByText('Lote Ativo 1')).toBeInTheDocument();
    
    // Arquivado should not be visible in Ativos tab
    expect(screen.queryByText('Lote Arquivado 1')).not.toBeInTheDocument();
  });

  it('filters lots when switching to Arquivados tab', () => {
    renderComponent();
    
    const arquivadosTab = screen.getByRole('button', { name: /Arquivados/i });
    fireEvent.click(arquivadosTab);
    
    expect(screen.getByText('Lote Arquivado 1')).toBeInTheDocument();
    expect(screen.queryByText('Lote Ativo 1')).not.toBeInTheDocument();
  });

  it('shows pending mock lots when switching to Pendentes tab', () => {
    renderComponent();
    
    const pendentesTab = screen.getByRole('button', { name: /Pendentes/i });
    fireEvent.click(pendentesTab);
    
    // We mocked the state in the component, it has 'Lote NF 4589 - Recria Nelore'
    expect(screen.getByText('Lote NF 4589 - Recria Nelore')).toBeInTheDocument();
    expect(screen.getByText('Lote NF 4612 - Bezerros Angus')).toBeInTheDocument();
    
    // Normal lots shouldn't show
    expect(screen.queryByText('Lote Ativo 1')).not.toBeInTheDocument();
  });

  it('filters by search term', async () => {
    renderComponent();
    
    const searchInput = screen.getByPlaceholderText('Filtrar por nome do lote...');
    fireEvent.change(searchInput, { target: { value: 'Inexistente' } });
    
    expect(screen.queryByText('Lote Ativo 1')).not.toBeInTheDocument();
    expect(screen.getByText('Nenhum registro encontrado')).toBeInTheDocument();
  });

  it('opens lot form modal when clicking NOVO LOTE', () => {
    renderComponent();
    
    const createBtns = screen.getAllByRole('button', { name: /NOVO LOTE/i });
    fireEvent.click(createBtns[0]);
    
    expect(screen.getByTestId('lot-form-mock')).toBeInTheDocument();
  });
  
  it('opens process modal when clicking PROCESSAR AGORA on pending tab', () => {
    renderComponent();
    
    const pendentesTab = screen.getByRole('button', { name: /Pendentes/i });
    fireEvent.click(pendentesTab);
    
    const processBtns = screen.getAllByRole('button', { name: /PROCESSAR AGORA/i });
    fireEvent.click(processBtns[0]);
    
    expect(screen.getByText('Processamento de Lote Pendente')).toBeInTheDocument();
  });

  it('switches to list view and opens edit modal', () => {
    renderComponent();
    
    const listViewBtn = screen.getByTitle('Visualização em Lista');
    fireEvent.click(listViewBtn);
    
    // In list view, the edit dot action has title "Editar"
    // the mock data has 2 items but one is active, the other arquivado, so in ATIVOS tab we see 1.
    const editBtn = screen.getByTitle('Editar');
    fireEvent.click(editBtn);
    
    expect(screen.getByTestId('lot-form-mock')).toBeInTheDocument();
  });

  it('handles archive action in list view', async () => {
    renderComponent();
    
    const listViewBtn = screen.getByTitle('Visualização em Lista');
    fireEvent.click(listViewBtn);
    
    const archiveBtn = screen.getByTitle('Arquivar Lote');
    window.confirm = vi.fn().mockReturnValue(true);
    
    fireEvent.click(archiveBtn);
    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith('Deseja realmente arquivar o lote "Lote Ativo 1"?');
    });
  });

  it('handles delete action in list view', async () => {
    renderComponent();
    
    const listViewBtn = screen.getByTitle('Visualização em Lista');
    fireEvent.click(listViewBtn);
    
    const deleteBtn = screen.getByTitle('Excluir');
    window.confirm = vi.fn().mockReturnValue(true);
    
    fireEvent.click(deleteBtn);
    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith('Deseja excluir este lote?');
    });
  });
});
