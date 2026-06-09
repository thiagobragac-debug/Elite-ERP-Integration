import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LotForm } from './LotForm';
import { vi } from 'vitest';

vi.mock('../../contexts/TenantContext', () => ({
  useTenant: () => ({ activeTenantId: 'tenant-1' })
}));

// Mock supabase client
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockImplementation((table) => {
      if (table === 'fazendas') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: [{ id: 'fazenda-1', nome: 'Fazenda Mock' }],
            error: null
          })
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null })
      };
    })
  }
}));

// Mock SidePanel
vi.mock('../Layout/SidePanel', () => ({
  SidePanel: ({ isOpen, children, onSubmit, title }: any) => isOpen ? (
    <div data-testid="side-panel">
      <h2>{title}</h2>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(e); }}>
        {children}
        <button type="submit">Criar Lote</button>
      </form>
    </div>
  ) : null
}));

// Mock SearchableSelect
vi.mock('./SearchableSelect', () => ({
  SearchableSelect: ({ value, onChange, options, disabled }: any) => (
    <select 
      data-testid="mock-searchable-select"
      value={value || ''} 
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    >
      {options?.map((opt: any, idx: number) => (
        <option key={idx} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  )
}));

describe('LotForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  it('renders form when open', async () => {
    render(<LotForm isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);
    expect(screen.getByText('Novo Lote')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getAllByTestId('mock-searchable-select').length).toBeGreaterThan(0);
    });
  });

  it('calculates target weight (peso_alvo) based on cycle days and GMD', async () => {
    render(<LotForm isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);
    
    // Inputs
    const pesoEntrada = screen.getByPlaceholderText('Ex: 300');
    const gmd = screen.getByPlaceholderText('Ex: 1.200');
    const diasCiclo = screen.getByPlaceholderText('Dias');
    const pesoAlvo = screen.getByPlaceholderText('Ex: 420') as HTMLInputElement;

    fireEvent.change(pesoEntrada, { target: { value: '300' } });
    fireEvent.change(gmd, { target: { value: '1.2' } });
    fireEvent.change(diasCiclo, { target: { value: '100' } });

    // 300 + (100 * 1.2) = 420
    await waitFor(() => {
      expect(pesoAlvo.value).toBe('420');
    });

    // Strategy text should appear
    expect(screen.getByText(/O animal entrará com/)).toBeInTheDocument();
    expect(screen.getByText(/420kg/)).toBeInTheDocument(); // Result of calculation in the smart card
  });

  it('submits correctly', async () => {
    render(<LotForm isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);
    
    const nomeInput = screen.getByPlaceholderText('Ex: LOTE-ENGORDA-01');
    fireEvent.change(nomeInput, { target: { value: 'LOTE-TESTE' } });
    
    const submitBtn = screen.getByRole('button', { name: 'Criar Lote' });
    fireEvent.click(submitBtn);
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });
    
    const submittedData = mockOnSubmit.mock.calls[0][0];
    expect(submittedData.nome).toBe('LOTE-TESTE');
  });

  it('populates with initial data for editing', () => {
    const initialData = {
      nome: 'LOTE-EXISTENTE',
      status: 'FINALIZADO'
    };
    render(<LotForm isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} initialData={initialData} />);
    
    const nomeInput = screen.getByPlaceholderText('Ex: LOTE-ENGORDA-01') as HTMLInputElement;
    expect(nomeInput.value).toBe('LOTE-EXISTENTE');
  });
});
