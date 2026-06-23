/**
 * Tests for lazy-loaded map components
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MapLoading } from './LazyMap';

describe('MapLoading', () => {
  it('should render loading indicator with default message', () => {
    render(<MapLoading />);
    expect(screen.getByText('Carregando mapa...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should render loading indicator with custom message', () => {
    render(<MapLoading message="Carregando localização..." />);
    expect(screen.getByText('Carregando localização...')).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(<MapLoading />);
    const loadingElement = screen.getByRole('status');
    expect(loadingElement).toHaveAttribute('aria-live', 'polite');
    expect(loadingElement).toHaveAttribute('aria-label', 'Carregando mapa');
  });

  it('should render with default height', () => {
    const { container } = render(<MapLoading />);
    const loadingDiv = container.firstChild as HTMLElement;
    expect(loadingDiv).toHaveStyle({ height: '500px' });
  });

  it('should render with custom height', () => {
    const { container } = render(<MapLoading height={600} />);
    const loadingDiv = container.firstChild as HTMLElement;
    expect(loadingDiv).toHaveStyle({ height: '600px' });
  });
});
