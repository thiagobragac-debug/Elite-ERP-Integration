import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { HealthManagement } from './HealthManagement';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';

vi.mock('../../hooks/useFarmFilter', () => ({
  useFarmFilter: () => ({
    activeFarmId: 'farm-1',
    activeTenantId: 'tenant-1',
    canCreate: true,
    insertPayload: { tenant_id: 'tenant-1', fazenda_id: 'farm-1' }
  })
}));

const mockRefresh = vi.fn();
vi.mock('../../hooks/useReportData', () => ({
  useReportData: vi.fn((reportType, options) => {
    return {
      data: [
        { id: '1', titulo: 'Vacina Aftosa', produto: 'Bovilis', tipo: 'VACINA', dose: '5ml', via_aplicacao: 'SC', targetName: 'Lote Engorda', targetType: 'LOTE', status: 'REALIZADO', carencia_dias: 0, isBlocked: false, data_manejo: '2026-06-08' },
        { id: '2', titulo: 'Protocolo IATF - D0', produto: 'Sincrogest', tipo: 'PROTOCOLO', dose: '1 implante', via_aplicacao: 'INTRA', targetName: 'Vaca 123', targetType: 'ANIMAL', status: 'REALIZADO', carencia_dias: 30, isBlocked: true, diasRestantes: 15, dataLiberacao: '2026-06-23', data_manejo: '2026-06-08' }
      ],
      stats: [
        { label: 'Manejos no Mês', value: 20 },
        { label: 'Animais em Carência', value: 5 }
      ],
      loading: false,
      error: null,
      totalCount: 2,
      refresh: mockRefresh
    };
  })
}));

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockImplementation(() => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
      delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
    }))
  }
}));

// Mock export functions
vi.mock('../../utils/export', () => ({
  exportToCSV: vi.fn(),
  exportToExcel: vi.fn(),
  exportToPDF: vi.fn()
}));

// Mock inner modals
vi.mock('../../components/Modals/HistoryModal', () => ({
  HistoryModal: ({ isOpen, onClose }: any) => isOpen ? (
    <div data-testid="mock-history-modal">
      <button onClick={onClose}>Fechar Histórico</button>
    </div>
  ) : null
}));

vi.mock('./components/HealthProtocolsModal', () => ({
  HealthProtocolsModal: ({ isOpen, onClose, onApply }: any) => isOpen ? (
    <div data-testid="mock-protocols-modal">
      <button onClick={() => onApply({
        protocol: { name: 'IATF Padrão', steps: [{ day: 0, product: 'Hormônio A', dose: '2ml' }] },
        targetType: 'LOTE',
        targetId: 'lote-1',
        startDate: '2026-06-08'
      })}>Aplicar Protocolo Mock</button>
      <button onClick={onClose}>Fechar Protocolos</button>
    </div>
  ) : null
}));

vi.mock('./components/HealthFilterModal', () => ({
  HealthFilterModal: ({ isOpen, onClose }: any) => isOpen ? (
    <div data-testid="mock-filter-modal">
      <button onClick={onClose}>Aplicar Filtros</button>
    </div>
  ) : null
}));

vi.mock('../../components/Forms/HealthForm', () => ({
  HealthForm: ({ isOpen, onClose, onSubmit }: any) => isOpen ? (
    <div data-testid="mock-health-form">
      <button onClick={() => onSubmit({ titulo: 'Nova Vacina Mock' })}>Salvar Mock</button>
      <button onClick={onClose}>Cancelar</button>
    </div>
  ) : null
}));

describe('HealthManagement', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <HealthManagement />
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
    expect(screen.getAllByText('Sanidade').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Manejos Sanitários').length).toBeGreaterThan(0);
    expect(screen.getByText('20')).toBeInTheDocument(); // Manejos no Mês
  });

  it('filters data by active tab', async () => {
    renderComponent();
    
    // Default is 'MANEJOS'
    expect(screen.getByText('Bovilis')).toBeInTheDocument();
    expect(screen.queryByText('Sincrogest')).not.toBeInTheDocument(); // It's PROTOCOLO

    // Click "Protocolos Ativos" tab
    const protocolosTab = screen.getByText('Protocolos Ativos');
    fireEvent.click(protocolosTab);
    
    await waitFor(() => {
      expect(screen.getByText('Sincrogest')).toBeInTheDocument();
    });
  });

  it('searches by name or product', async () => {
    renderComponent();
    const searchInput = screen.getByPlaceholderText('Filtrar por protocolo ou fármaco...');
    fireEvent.change(searchInput, { target: { value: 'Aftosa' } });
    
    await waitFor(() => {
      expect(screen.getByText('Bovilis')).toBeInTheDocument();
    });
  });

  it('can open and close the Health Form modal', async () => {
    renderComponent();
    const newBtn = screen.getByRole('button', { name: /NOVO REGISTRO/i });
    fireEvent.click(newBtn);
    
    expect(screen.getByTestId('mock-health-form')).toBeInTheDocument();
    
    const cancelBtn = screen.getByText('Cancelar');
    fireEvent.click(cancelBtn);
    
    await waitFor(() => {
      expect(screen.queryByTestId('mock-health-form')).not.toBeInTheDocument();
    });
  });

  it('can open advanced filters', () => {
    renderComponent();
    const filterBtn = screen.getByTitle('Filtros Avançados');
    fireEvent.click(filterBtn);
    
    expect(screen.getByTestId('mock-filter-modal')).toBeInTheDocument();
  });

  it('can open protocols modal and apply a protocol', async () => {
    renderComponent();
    const protocolsBtn = screen.getAllByRole('button', { name: /PROTOCOLOS/i })[0];
    fireEvent.click(protocolsBtn);
    
    expect(screen.getByTestId('mock-protocols-modal')).toBeInTheDocument();
    
    const applyBtn = screen.getByText('Aplicar Protocolo Mock');
    fireEvent.click(applyBtn);
    
    await waitFor(() => {
      expect(screen.queryByTestId('mock-protocols-modal')).not.toBeInTheDocument();
    });
  });
});
