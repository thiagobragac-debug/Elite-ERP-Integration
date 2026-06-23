import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EnvErrorScreen from './EnvErrorScreen';

describe('EnvErrorScreen', () => {
  it('should render error screen with missing variables', () => {
    const missingVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];

    render(<EnvErrorScreen missingVars={missingVars} />);

    expect(screen.getByText('Configuração Incompleta')).toBeInTheDocument();
    expect(screen.getByText(/O aplicativo não pode iniciar/i)).toBeInTheDocument();

    // Check that all missing variables are displayed
    expect(screen.getByText('VITE_SUPABASE_URL')).toBeInTheDocument();
    expect(screen.getByText('VITE_SUPABASE_ANON_KEY')).toBeInTheDocument();
  });

  it('should display instructions on how to fix', () => {
    const missingVars = ['VITE_SUPABASE_URL'];

    render(<EnvErrorScreen missingVars={missingVars} />);

    expect(screen.getByText('Como Corrigir:')).toBeInTheDocument();
    expect(screen.getByText('Copie o arquivo de exemplo:')).toBeInTheDocument();
    expect(screen.getByText('cp .env.example .env')).toBeInTheDocument();
    expect(screen.getByText('Edite o arquivo .env:')).toBeInTheDocument();
    expect(screen.getByText('Reinicie o servidor:')).toBeInTheDocument();
  });

  it('should reload page when reload button is clicked', async () => {
    const user = userEvent.setup();
    const reloadMock = vi.fn();

    // Mock window.location.reload
    Object.defineProperty(window, 'location', {
      value: { reload: reloadMock },
      writable: true,
    });

    const missingVars = ['VITE_SUPABASE_URL'];
    render(<EnvErrorScreen missingVars={missingVars} />);

    const reloadButton = screen.getByRole('button', { name: /recarregar página/i });
    await user.click(reloadButton);

    expect(reloadMock).toHaveBeenCalledOnce();
  });

  it('should render single missing variable', () => {
    const missingVars = ['VITE_SUPABASE_URL'];

    render(<EnvErrorScreen missingVars={missingVars} />);

    expect(screen.getByText('VITE_SUPABASE_URL')).toBeInTheDocument();
    expect(screen.queryByText('VITE_SUPABASE_ANON_KEY')).not.toBeInTheDocument();
  });

  it('should render multiple missing variables', () => {
    const missingVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
      'VITE_STRIPE_PUBLISHABLE_KEY',
    ];

    render(<EnvErrorScreen missingVars={missingVars} />);

    missingVars.forEach((varName) => {
      expect(screen.getByText(varName)).toBeInTheDocument();
    });
  });

  it('should display helpful tip about .env.example', () => {
    const missingVars = ['VITE_SUPABASE_URL'];

    render(<EnvErrorScreen missingVars={missingVars} />);

    expect(screen.getByText(/Consulte o arquivo/i)).toBeInTheDocument();
    expect(screen.getByText('.env.example')).toBeInTheDocument();
  });
});
