import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SearchableSelect } from './SearchableSelect';

describe('SearchableSelect', () => {
  const mockOptions = [
    { value: '1', label: 'Option 1' },
    { value: '2', label: 'Option 2' },
    { value: '3', label: 'Apple' },
  ];

  const defaultProps = {
    value: '',
    onChange: vi.fn(),
    options: mockOptions,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with placeholder', () => {
    render(<SearchableSelect {...defaultProps} placeholder="Select an option" />);
    expect(screen.getByPlaceholderText('Select an option')).toBeInTheDocument();
  });

  it('displays the label of the selected value', () => {
    render(<SearchableSelect {...defaultProps} value="2" />);
    expect(screen.getByDisplayValue('Option 2')).toBeInTheDocument();
  });

  it('opens dropdown and displays options on click', () => {
    render(<SearchableSelect {...defaultProps} />);
    const input = screen.getByPlaceholderText('Selecione...');
    
    fireEvent.click(input);
    
    // Portal renders options
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('Apple')).toBeInTheDocument();
  });

  it('filters options based on input', () => {
    render(<SearchableSelect {...defaultProps} />);
    const input = screen.getByPlaceholderText('Selecione...');
    
    fireEvent.click(input);
    fireEvent.change(input, { target: { value: 'app' } });
    
    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
  });

  it('calls onChange when an option is selected', () => {
    render(<SearchableSelect {...defaultProps} />);
    const input = screen.getByPlaceholderText('Selecione...');
    
    fireEvent.click(input);
    const option = screen.getByText('Option 1');
    fireEvent.click(option);
    
    expect(defaultProps.onChange).toHaveBeenCalledWith('1');
  });

  it('shows creatable option and calls onChange with new value', () => {
    render(<SearchableSelect {...defaultProps} creatable={true} />);
    const input = screen.getByPlaceholderText('Selecione...');
    
    fireEvent.click(input);
    fireEvent.change(input, { target: { value: 'New Option' } });
    
    const createOption = screen.getByText('+ Criar "New Option"');
    expect(createOption).toBeInTheDocument();
    
    fireEvent.click(createOption);
    expect(defaultProps.onChange).toHaveBeenCalledWith('New Option');
  });

  it('does not show creatable option if exact match exists', () => {
    render(<SearchableSelect {...defaultProps} creatable={true} />);
    const input = screen.getByPlaceholderText('Selecione...');
    
    fireEvent.click(input);
    fireEvent.change(input, { target: { value: 'Option 1' } });
    
    expect(screen.queryByText('+ Criar "Option 1"')).not.toBeInTheDocument();
    expect(screen.getByText('Option 1')).toBeInTheDocument();
  });

  it('shows no results found when filter matches nothing', () => {
    render(<SearchableSelect {...defaultProps} />);
    const input = screen.getByPlaceholderText('Selecione...');
    
    fireEvent.click(input);
    fireEvent.change(input, { target: { value: 'xyz' } });
    
    expect(screen.getByText(/Nenhum resultado encontrado/i)).toBeInTheDocument();
  });

  it('is disabled and prevents interaction', () => {
    render(<SearchableSelect {...defaultProps} disabled={true} />);
    const input = screen.getByPlaceholderText('Selecione...');
    
    expect(input).toBeDisabled();
    
    fireEvent.click(input);
    // Portal shouldn't be open
    expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
  });

  it('closes dropdown when clicking outside', () => {
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <SearchableSelect {...defaultProps} />
      </div>
    );
    const input = screen.getByPlaceholderText('Selecione...');
    
    fireEvent.click(input);
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    
    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
  });
});
