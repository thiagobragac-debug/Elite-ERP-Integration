import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TauzeStatCard } from './TauzeStatCard';
import { Activity } from 'lucide-react';
import { vi } from 'vitest';

describe('TauzeStatCard', () => {
  it('renders loading state', () => {
    const { container } = render(
      <TauzeStatCard label="Test Label" value="100" icon={Activity} color="#000" loading={true} />
    );
    expect(container.firstChild).toHaveClass('loading-skeleton');
  });

  it('renders label, value and icon', () => {
    render(
      <TauzeStatCard
        label="Total Revenue"
        value="$10,000"
        subtitle="Monthly"
        icon={Activity}
        color="#3b82f6"
      />
    );

    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('$10,000')).toBeInTheDocument();
    expect(screen.getByText('Monthly')).toBeInTheDocument();
  });

  it('renders change and trend indicators', () => {
    render(
      <TauzeStatCard
        label="Growth"
        value="15%"
        icon={Activity}
        color="#10b981"
        change="+5%"
        trend="up"
      />
    );

    expect(screen.getByText('+5%')).toBeInTheDocument();
  });

  it('renders children when passed', () => {
    render(
      <TauzeStatCard label="Custom" value="X" icon={Activity} color="#10b981">
        <div data-testid="custom-child">Child Content</div>
      </TauzeStatCard>
    );

    expect(screen.getByTestId('custom-child')).toBeInTheDocument();
  });
});
