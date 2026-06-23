import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EmptyState } from './EmptyState';
import { Activity } from 'lucide-react';
import { vi } from 'vitest';

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(<EmptyState title="No items found" description="Try adjusting your filters" />);
    expect(screen.getByText('No items found')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your filters')).toBeInTheDocument();
  });

  it('renders icon if provided', () => {
    const { container } = render(
      <EmptyState title="No items" description="Empty" icon={Activity} />
    );
    // lucide-react icons render an SVG element
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders action button and triggers onAction', () => {
    const onAction = vi.fn();
    render(
      <EmptyState
        title="No items"
        description="Empty"
        actionLabel="Create Item"
        onAction={onAction}
      />
    );

    const button = screen.getByRole('button', { name: 'Create Item' });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
