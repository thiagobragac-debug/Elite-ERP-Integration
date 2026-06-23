import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AnimalForm } from './AnimalForm';
import { vi } from 'vitest';

vi.mock('../../contexts/TenantContext', () => ({
  useTenant: () => ({ activeTenantId: 'tenant-1' }),
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
            error: null,
          }),
        };
      }
      if (table === 'categorias_sistema') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: [
              { id: 'cat-1', nome: 'Angus', modulo: 'racas' },
              { id: 'cat-2', nome: 'Boi Gordo', modulo: 'pecuaria' },
              { id: 'cat-3', nome: 'Vaca', modulo: 'pecuaria' },
            ],
            error: null,
          }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    }),
  },
}));

// Mock SidePanel to avoid animations and portals issues in test environment
vi.mock('../Layout/SidePanel', () => ({
  SidePanel: ({ isOpen, children, onSubmit, title }: any) =>
    isOpen ? (
      <div data-testid="side-panel">
        <h2>{title}</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(e);
          }}
        >
          {children}
          <button type="submit">Salvar Animal</button>
        </form>
      </div>
    ) : null,
}));

// Mock SearchableSelect to simplify testing
vi.mock('./SearchableSelect', () => ({
  SearchableSelect: ({ value, onChange, options, disabled }: any) => (
    <select
      data-testid="mock-searchable-select"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    >
      {options?.map((opt: any, idx: number) => (
        <option key={idx} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  ),
}));

describe('AnimalForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  it('renders form when open', async () => {
    render(<AnimalForm isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);
    expect(screen.getByText('Cadastrar Novo Animal')).toBeInTheDocument();

    // Wait for supabase fetches to resolve
    await waitFor(() => {
      expect(screen.getAllByTestId('mock-searchable-select').length).toBeGreaterThan(0);
    });
  });

  it('does not render when closed', () => {
    render(<AnimalForm isOpen={false} onClose={mockOnClose} onSubmit={mockOnSubmit} />);
    expect(screen.queryByTestId('side-panel')).not.toBeInTheDocument();
  });

  it('auto-suggests category based on age and sex', async () => {
    render(<AnimalForm isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    // Default is Male
    const idadeInput = screen.getByPlaceholderText('Idade (meses)');
    fireEvent.change(idadeInput, { target: { value: '40' } }); // > 36 months, should be Boi Gordo

    // The category SearchableSelect should update.
    // There are 5 SearchableSelects: Raca, Fazenda, Lote, Pasto, Categoria, Finalidade
    await waitFor(() => {
      const selects = screen.getAllByTestId('mock-searchable-select') as HTMLSelectElement[];
      // category is the 5th select (index 4) based on the DOM order in AnimalForm.tsx
      expect(selects[4].value).toBe('Boi Gordo');
    });

    // Change to Female
    const femaleRadio = screen.getByText('Fêmea');
    fireEvent.click(femaleRadio);

    await waitFor(() => {
      const selects = screen.getAllByTestId('mock-searchable-select') as HTMLSelectElement[];
      expect(selects[4].value).toBe('Vaca'); // > 24 months, Female = Vaca
    });
  });

  it('calculates value per arroba when bought', async () => {
    render(<AnimalForm isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    // Click "Comprado"
    const compradoRadio = screen.getByText('Comprado (Entrada)');
    fireEvent.click(compradoRadio);

    const pesoInput = screen.getByPlaceholderText('0.0'); // peso inicial
    fireEvent.change(pesoInput, { target: { value: '300' } }); // 10 arrobas

    const valorInput = screen.getByPlaceholderText('0.00'); // valor compra
    fireEvent.change(valorInput, { target: { value: '2500' } }); // R$ 2500

    // Arroba = 250
    expect(screen.getByText('Aprox. R$ 250,00 / @')).toBeInTheDocument();
  });

  it('submits correctly', async () => {
    render(<AnimalForm isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    const brincoInput = screen.getByPlaceholderText('Ex: 1234-A');
    fireEvent.change(brincoInput, { target: { value: '9999' } });

    const submitBtn = screen.getByRole('button', { name: 'Salvar Animal' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });

    const submittedData = mockOnSubmit.mock.calls[0][0];
    expect(submittedData.brinco).toBe('9999');
    expect(submittedData.sexo).toBe('M'); // default
  });

  it('populates with initial data for editing', () => {
    const initialData = {
      brinco: '123-A',
      raca: 'Nelore',
      sexo: 'F',
      status: 'Ativo',
    };
    render(
      <AnimalForm
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        initialData={initialData}
      />
    );

    const brincoInput = screen.getByPlaceholderText('Ex: 1234-A') as HTMLInputElement;
    expect(brincoInput.value).toBe('123-A');
  });
});
