import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SentryErrorFallback } from './SentryErrorFallback';
import * as Sentry from '@sentry/react';

// Mock Sentry
vi.mock('@sentry/react', () => ({
  getFeedback: vi.fn(() => ({
    createForm: vi.fn(),
  })),
}));

describe('SentryErrorFallback', () => {
  const mockError = new Error('Test error message');
  const mockResetError = vi.fn();

  it('should render error fallback UI with error message', () => {
    render(
      <SentryErrorFallback
        error={mockError}
        componentStack={null}
        eventId="test-event-123"
        resetError={mockResetError}
      />
    );

    // Check title
    expect(screen.getByText('Algo deu errado')).toBeInTheDocument();

    // Check description
    expect(screen.getByText(/Nossa equipe foi notificada automaticamente/i)).toBeInTheDocument();

    // Check error details are collapsed by default
    expect(screen.getByText('Detalhes técnicos')).toBeInTheDocument();
    expect(screen.getByText(/Test error message/i)).toBeInTheDocument();

    // Check action buttons
    expect(screen.getByRole('button', { name: /Recarregar Página/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Voltar para Início/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Enviar Feedback/i })).toBeInTheDocument();
  });

  it('should display event ID when provided', () => {
    render(
      <SentryErrorFallback
        error={mockError}
        componentStack={null}
        eventId="test-event-123"
        resetError={mockResetError}
      />
    );

    // Expand details
    const details = screen.getByText('Detalhes técnicos');
    details.click();

    expect(screen.getByText(/ID do Evento:/i)).toBeInTheDocument();
    expect(screen.getByText('test-event-123')).toBeInTheDocument();
  });

  it('should not show feedback button when eventId is null', () => {
    render(
      <SentryErrorFallback
        error={mockError}
        componentStack={null}
        eventId={null}
        resetError={mockResetError}
      />
    );

    expect(screen.queryByRole('button', { name: /Enviar Feedback/i })).not.toBeInTheDocument();
  });

  it('should show feedback sent confirmation after clicking feedback button', async () => {
    const user = userEvent.setup();

    render(
      <SentryErrorFallback
        error={mockError}
        componentStack={null}
        eventId="test-event-123"
        resetError={mockResetError}
      />
    );

    const feedbackButton = screen.getByRole('button', { name: /Enviar Feedback/i });
    await user.click(feedbackButton);

    expect(screen.getByText(/Obrigado pelo seu feedback!/i)).toBeInTheDocument();
    expect(Sentry.getFeedback).toHaveBeenCalled();
  });

  it('should reload page when clicking reload button', async () => {
    const user = userEvent.setup();
    delete (window as any).location;
    (window as any).location = { href: '' };

    render(
      <SentryErrorFallback
        error={mockError}
        componentStack={null}
        eventId="test-event-123"
        resetError={mockResetError}
      />
    );

    const reloadButton = screen.getByRole('button', { name: /Recarregar Página/i });
    await user.click(reloadButton);

    expect(window.location.href).toBe('/');
  });

  it('should call resetError and navigate when clicking home button', async () => {
    const user = userEvent.setup();
    delete (window as any).location;
    (window as any).location = { href: '' };

    render(
      <SentryErrorFallback
        error={mockError}
        componentStack={null}
        eventId="test-event-123"
        resetError={mockResetError}
      />
    );

    const homeButton = screen.getByRole('button', { name: /Voltar para Início/i });
    await user.click(homeButton);

    expect(mockResetError).toHaveBeenCalled();
    expect(window.location.href).toBe('/');
  });
});
