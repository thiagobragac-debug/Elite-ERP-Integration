import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProcessarLoteModal } from './ProcessarLoteModal';
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('ProcessarLoteModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    lote: {
      id: 'lote-123',
      nome: 'Lote Teste Entrada',
      quantidade_nota: 2,
      custo_total_aquisicao: 4000,
      custo_por_cabeca: 2000,
      fornecedor: 'Fornecedor Teste',
    },
    onSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders progress bar and cost information correctly', () => {
    render(<ProcessarLoteModal {...defaultProps} />);

    expect(screen.getByText('Processar Lote — Lote Teste Entrada')).toBeInTheDocument();
    expect(screen.getByText('Fornecedor: Fornecedor Teste')).toBeInTheDocument();
    expect(screen.getByText(/4\.000,00/)).toBeInTheDocument();
    expect(screen.getByText(/2\.000,00/)).toBeInTheDocument();

    // Progress bar label and value
    expect(screen.getByText('0/2')).toBeInTheDocument();
  });

  it('allows adding and removing animals', async () => {
    render(<ProcessarLoteModal {...defaultProps} />);

    // Add first animal
    const brincoInput = screen.getByLabelText('Brinco *');
    fireEvent.change(brincoInput, { target: { value: 'B-01' } });

    const pesoInput = screen.getByLabelText(/Peso Inicial/i);
    fireEvent.change(pesoInput, { target: { value: '350' } });

    const addBtn = screen.getByRole('button', { name: /Adicionar Animal/i });
    fireEvent.click(addBtn);

    // Verify first animal was added
    expect(screen.getByText('B-01')).toBeInTheDocument();
    expect(screen.getByText('350 kg')).toBeInTheDocument();
    expect(screen.getByText('1/2')).toBeInTheDocument(); // Count updated

    // Add second animal
    fireEvent.change(brincoInput, { target: { value: 'B-02' } });
    fireEvent.change(pesoInput, { target: { value: '360' } });
    fireEvent.click(addBtn);

    // Verify second animal was added
    expect(screen.getByText('B-02')).toBeInTheDocument();
    expect(screen.getByText('360 kg')).toBeInTheDocument();
    expect(screen.getByText('2/2')).toBeInTheDocument(); // Count updated

    // Remove first animal
    const removeBtns = screen.getAllByRole('button');
    const removeBtn = removeBtns.find(btn => btn.style.color === 'rgb(239, 68, 68)');
    if (removeBtn) {
      fireEvent.click(removeBtn);
    }

    // Verify B-01 is removed, B-02 remains
    expect(screen.queryByText('B-01')).not.toBeInTheDocument();
    expect(screen.getByText('B-02')).toBeInTheDocument();
    expect(screen.getByText('1/2')).toBeInTheDocument();
  });

  it('checks divergence warning and allows confirmation with divergence', async () => {
    vi.useFakeTimers();
    render(<ProcessarLoteModal {...defaultProps} />);

    // Add only 1 animal (NF demands 2)
    const brincoInput = screen.getByLabelText('Brinco *');
    fireEvent.change(brincoInput, { target: { value: 'B-01' } });
    const addBtn = screen.getByRole('button', { name: /Adicionar Animal/i });
    fireEvent.click(addBtn);

    // Click Finalizar Lote
    const finalizeBtn = screen.getByRole('button', { name: /Finalizar Lote/i });
    fireEvent.click(finalizeBtn);

    // Flush state update under fake timers
    vi.advanceTimersByTime(0);
    await Promise.resolve();

    // Should display divergence warning
    expect(screen.getByText(/Atenção: Divergência de Quantidade/i)).toBeInTheDocument();

    // Click confirm with divergence
    const confirmDivergenceBtn = screen.getByRole('button', { name: /Confirmar com divergência/i });
    fireEvent.click(confirmDivergenceBtn);

    // Fast forward save process timer and flush microtasks
    vi.advanceTimersByTime(2000);
    await Promise.resolve();

    expect(defaultProps.onSuccess).toHaveBeenCalled();
    expect(defaultProps.onClose).toHaveBeenCalled();

    vi.useRealTimers();
  });
});
