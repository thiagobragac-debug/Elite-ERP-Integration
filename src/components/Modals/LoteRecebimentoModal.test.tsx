import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LoteRecebimentoModal } from './LoteRecebimentoModal';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock contexts/TenantContext
const mockUseTenant = vi.fn();
vi.mock('../../contexts/TenantContext', () => ({
  useTenant: () => mockUseTenant(),
}));

// Mock Supabase
vi.mock('../../lib/supabase', () => {
  const selectMock = vi.fn().mockReturnThis();
  const eqMock = vi.fn().mockResolvedValue({
    data: [
      { id: 'farm-1', nome: 'Fazenda São Bento' },
      { id: 'farm-2', nome: 'Fazenda Santa Cruz' },
    ],
    error: null,
  });
  return {
    supabase: {
      from: vi.fn().mockReturnValue({
        select: selectMock,
        eq: eqMock,
      }),
    },
  };
});

describe('LoteRecebimentoModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    notaFiscalId: 'nf-123',
    fornecedor: 'Fornecedor Exemplo',
    quantidadeCabecas: 50,
    valorTotal: 100000,
    onSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTenant.mockReturnValue({
      activeTenantId: 'tenant-123',
      activeFarm: { id: 'farm-1', name: 'Fazenda São Bento' },
    });
  });

  it('renders correctly with initial pending tab and props data', async () => {
    render(<LoteRecebimentoModal {...defaultProps} />);

    // Check title and subtitle
    expect(screen.getByText('Recebimento de Gado')).toBeInTheDocument();
    expect(
      screen.getByText('Nota Fiscal de Fornecedor Exemplo · 50 cabeças')
    ).toBeInTheDocument();

    // Check cost computation (R$ 100.000 / 50 = R$ 2.000,00)
    expect(screen.getByText('Custo estimado/cabeça:')).toBeInTheDocument();
    expect(screen.getByText(/2\.000,00/)).toBeInTheDocument();

    // Active tab initially is "Criar Lote Pendente" (Aguardando chegada do gado)
    expect(screen.getByText('Aguardando chegada do gado')).toBeInTheDocument();
  });

  it('allows filling the pending form and calls onSuccess', async () => {
    vi.useFakeTimers();
    render(<LoteRecebimentoModal {...defaultProps} />);

    // Fill the curral input
    const curralInput = screen.getByPlaceholderText(/Curral A, Piquete 3/i);
    fireEvent.change(curralInput, { target: { value: 'Curral 5' } });

    // Fill GTA
    const gtaInput = screen.getByPlaceholderText(/GTA-SP-2026/i);
    fireEvent.change(gtaInput, { target: { value: '987654' } });

    // Submit pending
    const submitBtn = screen.getByRole('button', { name: /Criar Lote Pendente/i });
    fireEvent.click(submitBtn);

    // Fast-forward timers and flush microtasks
    vi.advanceTimersByTime(1500);
    await Promise.resolve();

    expect(defaultProps.onSuccess).toHaveBeenCalledWith(
      expect.any(String),
      'pendente'
    );
    expect(defaultProps.onClose).toHaveBeenCalled();

    vi.useRealTimers();
  });

  it('switches tabs to Vincular Lote and checks divergence warnings', async () => {
    vi.useFakeTimers();
    render(<LoteRecebimentoModal {...defaultProps} />);

    // Switch to Aba 2 (Vincular Lote Existente)
    const vincularTabBtn = screen.getByText('Gado já chegou?');
    fireEvent.click(vincularTabBtn);

    expect(screen.getByText('O gado já chegou?')).toBeInTheDocument();

    // Select first lot (Chegada 04/06 - Curral A, which has 48 animals)
    // The NF has 50 heads, so divergence is -2.
    const lot1Card = screen.getByText('Chegada 04/06 - Curral A');
    fireEvent.click(lot1Card);

    // Divergence warning should show
    expect(
      screen.getByText(/Divergência detectada/i)
    ).toBeInTheDocument();

    // Click submit
    const linkBtn = screen.getByRole('button', { name: /Vincular e Calcular Custo\/Cabeça/i });
    fireEvent.click(linkBtn);

    vi.advanceTimersByTime(1200);
    await Promise.resolve();

    expect(defaultProps.onSuccess).toHaveBeenCalledWith('lot-av-1', 'vinculado');
    expect(defaultProps.onClose).toHaveBeenCalled();

    vi.useRealTimers();
  });
});
