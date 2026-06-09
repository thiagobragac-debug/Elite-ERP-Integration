import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FormModal } from './FormModal';
import { User } from 'lucide-react';

describe('FormModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSubmit: vi.fn((e) => e.preventDefault()),
    title: 'Test Form Modal',
    subtitle: 'Test Subtitle',
    icon: User,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // reset window fields
    Object.defineProperty(window, 'location', {
      value: { pathname: '/admin/dashboard' },
      writable: true,
    });
    delete (window as any).__lastAuditLog;
  });

  it('renders nothing when isOpen is false', () => {
    render(<FormModal {...defaultProps} isOpen={false}>Content</FormModal>);
    expect(screen.queryByText('Test Form Modal')).not.toBeInTheDocument();
  });

  it('renders correctly when isOpen is true', () => {
    render(
      <FormModal {...defaultProps}>
        <div data-testid="child-content">Child Content</div>
      </FormModal>
    );
    expect(screen.getByText('Test Form Modal')).toBeInTheDocument();
    expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('calls onClose when overlay is clicked', () => {
    render(<FormModal {...defaultProps}>Content</FormModal>);
    const overlay = document.querySelector('.tauze-modal-overlay');
    if (overlay) fireEvent.click(overlay);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls onSubmit on form submission', () => {
    render(<FormModal {...defaultProps}>Content</FormModal>);
    const submitBtn = screen.getByRole('button', { name: /Salvar Alterações/i });
    fireEvent.click(submitBtn);
    expect(defaultProps.onSubmit).toHaveBeenCalled();
  });

  it('disables submit button and shows loading state when loading is true', () => {
    render(<FormModal {...defaultProps} loading={true}>Content</FormModal>);
    const submitBtn = screen.getByRole('button', { name: /Processando\.\.\./i });
    expect(submitBtn).toBeInTheDocument();
    expect(submitBtn).toBeDisabled();
  });

  it('hides submit button when hideSubmit is true', () => {
    render(<FormModal {...defaultProps} hideSubmit={true}>Content</FormModal>);
    expect(screen.queryByRole('button', { name: /Salvar Alterações/i })).not.toBeInTheDocument();
  });

  it('disables form and hides submit button when isReadOnly is true', () => {
    render(
      <FormModal {...defaultProps} isReadOnly={true}>
        <input data-testid="form-input" />
      </FormModal>
    );
    
    expect(document.querySelector('fieldset')).toBeDisabled();
    expect(screen.queryByRole('button', { name: /Salvar Alterações/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Fechar/i })).toBeInTheDocument();
  });

  it('automatically sets readOnly mode if window location is audit page', () => {
    window.location.pathname = '/admin/auditoria/123';
    
    render(
      <FormModal {...defaultProps}>
        <input data-testid="form-input" />
      </FormModal>
    );
    
    expect(document.querySelector('fieldset')).toBeDisabled();
    expect(screen.queryByRole('button', { name: /Salvar Alterações/i })).not.toBeInTheDocument();
  });

  it('applies highlighted fields logic when highlightedFields is provided', async () => {
    render(
      <FormModal {...defaultProps} highlightedFields={['nome']} isReadOnly={true}>
        <div className="form-group">
          <label>Nome do Parceiro</label>
          <input />
        </div>
      </FormModal>
    );
    
    // the highlight effect uses setTimeout of 150ms
    await waitFor(() => {
      const group = document.querySelector('.form-group');
      expect(group?.classList.contains('tauze-form-highlighted')).toBe(true);
      expect(group?.querySelector('.audit-change-badge')).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('extracts changes from __lastAuditLog and highlights fields', async () => {
    window.location.pathname = '/admin/auditoria/123';
    (window as any).__lastAuditLog = {
      action: 'UPDATE',
      table_name: 'outros',
      old_data: { nome: 'Old Name' },
      new_data: { nome: 'New Name' }
    };
    
    render(
      <FormModal {...defaultProps}>
        <div className="form-group">
          <label>Nome</label>
          <input />
        </div>
      </FormModal>
    );
    
    await waitFor(() => {
      const group = document.querySelector('.form-group');
      expect(group?.classList.contains('tauze-form-highlighted')).toBe(true);
    }, { timeout: 1000 });
  });

  it('does not apply highlights if labels do not match', async () => {
    render(
      <FormModal {...defaultProps} highlightedFields={['cpf']}>
        <div className="form-group">
          <label>Nome</label>
          <input />
        </div>
      </FormModal>
    );
    
    // Wait for timeout to pass
    await new Promise((r) => setTimeout(r, 200));
    
    const group = document.querySelector('.form-group');
    expect(group?.classList.contains('tauze-form-highlighted')).toBe(false);
  });
});
