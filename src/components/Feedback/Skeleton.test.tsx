import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Skeleton, TableSkeleton, KPISkeleton } from './Skeleton';

describe('Skeleton components', () => {
  it('renders Skeleton base', () => {
    const { container } = render(<Skeleton width="50px" height="50px" circle />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveClass('skeleton-base');
    expect(el).toHaveStyle('width: 50px');
    expect(el).toHaveStyle('height: 50px');
    expect(el).toHaveStyle('border-radius: 50%');
  });

  it('renders TableSkeleton', () => {
    const { container } = render(<TableSkeleton />);
    expect(container.firstChild).toHaveClass('premium-card');
    expect(container.querySelectorAll('.skeleton-base').length).toBeGreaterThan(0);
  });

  it('renders KPISkeleton', () => {
    const { container } = render(<KPISkeleton />);
    expect(container.firstChild).toHaveClass('tauze-kpi-card');
    expect(container.querySelectorAll('.skeleton-base').length).toBeGreaterThan(0);
  });
});
