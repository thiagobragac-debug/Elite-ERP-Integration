/**
 * Lazy-loaded chart components wrapper
 * Reduces initial bundle size by loading Recharts only when charts are displayed
 *
 * Usage:
 *   import { LazyChart } from '@/components/Charts/LazyCharts';
 *   <LazyChart component={MyChartComponent} />
 */

import { Suspense, type ComponentType } from 'react';
import React from 'react';

interface ChartLoadingProps {
  message?: string;
  height?: number | string;
}

/**
 * Loading skeleton specifically for charts
 */
export function ChartLoading({
  message = 'Carregando gráfico...',
  height = 400,
}: ChartLoadingProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: typeof height === 'number' ? `${height}px` : height,
        background: 'hsl(var(--bg-card))',
        borderRadius: '12px',
        border: '1px solid hsl(var(--border))',
        flexDirection: 'column',
        gap: '16px',
      }}
      role="status"
      aria-live="polite"
      aria-label="Carregando gráfico"
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          border: '3px solid hsl(var(--border))',
          borderTopColor: 'hsl(var(--brand))',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
        aria-hidden="true"
      />
      <span
        style={{
          fontSize: '13px',
          fontWeight: 600,
          color: 'hsl(var(--text-muted))',
          letterSpacing: '0.05em',
        }}
      >
        {message}
      </span>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

/**
 * Generic lazy chart wrapper component
 * Use this to wrap any component that uses Recharts
 */
interface LazyChartProps<T extends object = Record<string, unknown>> {
  component: ComponentType<T>;
  fallback?: React.ReactNode;
}

export function LazyChart<T extends object = Record<string, unknown>>({
  component: Component,
  fallback,
  ...props
}: LazyChartProps<T> & T) {
  return (
    <Suspense fallback={fallback || <ChartLoading />}>
      <Component {...(props as T)} />
    </Suspense>
  );
}
