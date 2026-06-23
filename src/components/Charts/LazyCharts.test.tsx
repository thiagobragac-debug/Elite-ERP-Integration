/**
 * Tests for lazy-loaded chart components
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChartLoading } from './LazyCharts';

describe('ChartLoading', () => {
  it('should render loading indicator with default message', () => {
    render(<ChartLoading />);
    expect(screen.getByText('Carregando gráfico...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should render loading indicator with custom message', () => {
    render(<ChartLoading message="Carregando dados..." />);
    expect(screen.getByText('Carregando dados...')).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(<ChartLoading />);
    const loadingElement = screen.getByRole('status');
    expect(loadingElement).toHaveAttribute('aria-live', 'polite');
    expect(loadingElement).toHaveAttribute('aria-label', 'Carregando gráfico');
  });

  it('should render with custom height', () => {
    const { container } = render(<ChartLoading height={300} />);
    const loadingDiv = container.firstChild as HTMLElement;
    expect(loadingDiv).toHaveStyle({ height: '300px' });
  });

  it('should render with string height', () => {
    const { container } = render(<ChartLoading height="50vh" />);
    const loadingDiv = container.firstChild as HTMLElement;
    expect(loadingDiv).toHaveStyle({ height: '50vh' });
  });
});
