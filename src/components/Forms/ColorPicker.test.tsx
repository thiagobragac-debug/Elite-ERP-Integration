import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ColorPicker } from './ColorPicker';

describe('ColorPicker', () => {
  const defaultProps = {
    value: '#6366f1',
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with default label', () => {
    render(<ColorPicker {...defaultProps} />);
    expect(screen.getByText('Cor de Identificação')).toBeInTheDocument();
  });

  it('renders with custom label', () => {
    render(<ColorPicker {...defaultProps} label="Custom Color Label" />);
    expect(screen.getByText('Custom Color Label')).toBeInTheDocument();
  });

  it('renders default color options and calls onChange when clicked', () => {
    render(<ColorPicker {...defaultProps} />);
    const greenBtn = screen.getByTitle('Verde');
    expect(greenBtn).toBeInTheDocument();

    fireEvent.click(greenBtn);
    expect(defaultProps.onChange).toHaveBeenCalledWith('#10b981'); // Verde
  });

  it('renders custom color options', () => {
    const customColors = [
      { value: '#000000', label: 'Black' },
      { value: '#ffffff', label: 'White' },
    ];
    render(<ColorPicker {...defaultProps} colors={customColors} />);

    expect(screen.getByTitle('Black')).toBeInTheDocument();
    expect(screen.getByTitle('White')).toBeInTheDocument();
    expect(screen.queryByTitle('Verde')).not.toBeInTheDocument();
  });

  it('calls onChange when native color input changes', () => {
    render(<ColorPicker {...defaultProps} />);
    // The native color input is inside a div with title "Cor Personalizada"
    const colorInput = document.querySelector('input[type="color"]');
    expect(colorInput).toBeInTheDocument();

    if (colorInput) {
      fireEvent.change(colorInput, { target: { value: '#123456' } });
      expect(defaultProps.onChange).toHaveBeenCalledWith('#123456');
    }
  });
});
