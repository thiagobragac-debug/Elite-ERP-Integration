import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SidePanel } from './SidePanel';
import { Home } from 'lucide-react';

describe('SidePanel', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSubmit: vi.fn((e) => e.preventDefault()),
    title: 'Test Panel',
    subtitle: 'Test Subtitle',
    icon: Home,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    render(<SidePanel {...defaultProps} isOpen={false}>Content</SidePanel>);
    expect(screen.queryByText('Test Panel')).not.toBeInTheDocument();
  });

  it('renders title, subtitle, and content when isOpen is true', () => {
    render(<SidePanel {...defaultProps}>Test Content</SidePanel>);
    
    expect(screen.getByText('Test Panel')).toBeInTheDocument();
    expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('calls onClose when overlay is clicked', () => {
    render(<SidePanel {...defaultProps}>Test Content</SidePanel>);
    
    // The overlay is the first div rendered by portal usually, but let's find it by class or text click outside
    const overlay = document.querySelector('.tauze-sidepanel-overlay');
    expect(overlay).toBeInTheDocument();
    
    if (overlay) fireEvent.click(overlay);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when panel content is clicked', () => {
    render(<SidePanel {...defaultProps}>Test Content</SidePanel>);
    
    const panel = document.querySelector('.tauze-sidepanel-container');
    if (panel) fireEvent.click(panel);
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('calls onClose when escape key is pressed', () => {
    render(<SidePanel {...defaultProps}>Test Content</SidePanel>);
    
    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onSubmit when form is submitted', () => {
    render(<SidePanel {...defaultProps}>Test Content</SidePanel>);
    
    const submitBtn = screen.getByRole('button', { name: /Salvar Alterações/i });
    fireEvent.click(submitBtn);
    
    expect(defaultProps.onSubmit).toHaveBeenCalled();
  });

  it('hides submit button when hideSubmit is true', () => {
    render(<SidePanel {...defaultProps} hideSubmit={true}>Test Content</SidePanel>);
    
    expect(screen.queryByRole('button', { name: /Salvar Alterações/i })).not.toBeInTheDocument();
  });

  it('disables submit button and shows loading state when loading is true', () => {
    render(<SidePanel {...defaultProps} loading={true}>Test Content</SidePanel>);
    
    const submitBtn = screen.getByRole('button', { name: /Processando\.\.\./i });
    expect(submitBtn).toBeInTheDocument();
    expect(submitBtn).toBeDisabled();
  });

  it('renders custom footer if provided', () => {
    render(
      <SidePanel {...defaultProps} customFooter={<div data-testid="custom-footer">Custom</div>}>
        Test Content
      </SidePanel>
    );
    
    expect(screen.getByTestId('custom-footer')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Salvar Alterações/i })).not.toBeInTheDocument();
  });

  it('disables all inputs when isReadOnly is true', () => {
    render(
      <SidePanel {...defaultProps} isReadOnly={true}>
        <input type="text" data-testid="test-input" />
      </SidePanel>
    );
    
    // fieldset will be disabled
    const fieldset = document.querySelector('fieldset');
    expect(fieldset).toBeDisabled();
    
    expect(screen.queryByRole('button', { name: /Salvar Alterações/i })).not.toBeInTheDocument();
  });

  it('changes cancel button text when cancelLabel is provided', () => {
    render(<SidePanel {...defaultProps} cancelLabel="Voltar">Test Content</SidePanel>);
    
    expect(screen.getByRole('button', { name: /Voltar/i })).toBeInTheDocument();
  });

  it('calls onClose when clicking the X button', () => {
    render(<SidePanel {...defaultProps}>Test Content</SidePanel>);
    
    // There are two buttons by default: X icon in header, cancel button in footer, and submit button.
    // X icon doesn't have text, but we can query by clicking the first button without text that is icon-btn-secondary
    const closeBtn = document.querySelector('.icon-btn-secondary');
    if (closeBtn) fireEvent.click(closeBtn);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });
  
  it('disables submit button when submitDisabled is true', () => {
    render(<SidePanel {...defaultProps} submitDisabled={true}>Content</SidePanel>);
    const submitBtn = screen.getByRole('button', { name: /Salvar Alterações/i });
    expect(submitBtn).toBeDisabled();
  });
});
