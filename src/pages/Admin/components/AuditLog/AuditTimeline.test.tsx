/**
 * Unit tests for AuditTimeline component
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuditTimeline } from './AuditTimeline';
import type { LogEntry } from './types';

describe('AuditTimeline', () => {
  const mockLogs: LogEntry[] = [
    {
      id: '1',
      table_name: 'animais',
      action: 'INSERT',
      timestamp: '2024-01-01T10:00:00Z',
      user_name: 'Test User',
      description: 'Created new animal',
      sublabel: 'Brinco: 12345',
      entity_id: 'animal-1',
    },
    {
      id: '2',
      table_name: 'contas_pagar',
      action: 'UPDATE',
      timestamp: '2024-01-02T11:00:00Z',
      user_name: 'Another User',
      description: 'Updated payment',
      entity_id: 'payment-1',
    },
  ];

  it('should render loading skeleton when loading', () => {
    render(<AuditTimeline logs={[]} loading={true} onLogClick={vi.fn()} />);

    const skeletons = document.querySelectorAll('.skeleton-base');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should render empty state when no logs', () => {
    render(<AuditTimeline logs={[]} loading={false} onLogClick={vi.fn()} />);

    expect(screen.getByText('Histórico de Auditoria Limpo')).toBeInTheDocument();
    expect(screen.getByText('Nenhum evento registrado nesta base de dados.')).toBeInTheDocument();
  });

  it('should render log entries', () => {
    render(<AuditTimeline logs={mockLogs} loading={false} onLogClick={vi.fn()} />);

    expect(screen.getByText('Created new animal')).toBeInTheDocument();
    expect(screen.getByText('Updated payment')).toBeInTheDocument();
    expect(screen.getByText('Brinco: 12345')).toBeInTheDocument();
  });

  it('should call onLogClick when entry is clicked', async () => {
    const user = userEvent.setup();
    const onLogClick = vi.fn();

    render(<AuditTimeline logs={mockLogs} loading={false} onLogClick={onLogClick} />);

    const firstEntry = screen.getByText('Created new animal').closest('.audit-entry');
    expect(firstEntry).toBeInTheDocument();

    if (firstEntry) {
      await user.click(firstEntry);
      expect(onLogClick).toHaveBeenCalledWith(mockLogs[0]);
    }
  });

  it('should render correct module labels', () => {
    render(<AuditTimeline logs={mockLogs} loading={false} onLogClick={vi.fn()} />);

    expect(screen.getByText('Gestão de Animais')).toBeInTheDocument();
    expect(screen.getByText('Contas a Pagar')).toBeInTheDocument();
  });

  it('should display timestamps correctly', () => {
    render(<AuditTimeline logs={mockLogs} loading={false} onLogClick={vi.fn()} />);

    // Check if timestamps are rendered (format may vary based on locale)
    const timestamps = screen.getAllByText(/\d{2}\/\d{2}/);
    expect(timestamps.length).toBeGreaterThan(0);
  });
});
