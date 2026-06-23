/**
 * Lazy-loaded map components wrapper
 * Reduces initial bundle size by loading Leaflet only when maps are displayed
 *
 * Usage:
 *   import { LazyMap } from '@/components/Map/LazyMap';
 *   <LazyMap component={MyMapComponent} />
 */

import { Suspense, type ComponentType } from 'react';
import React from 'react';

interface MapLoadingProps {
  message?: string;
  height?: number | string;
}

/**
 * Loading skeleton specifically for maps
 */
export function MapLoading({ message = 'Carregando mapa...', height = 500 }: MapLoadingProps) {
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
      aria-label="Carregando mapa"
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
 * Generic lazy map wrapper component
 * Use this to wrap any component that uses Leaflet/react-leaflet
 */
interface LazyMapProps<T extends object = Record<string, unknown>> {
  component: ComponentType<T>;
  fallback?: React.ReactNode;
}

export function LazyMap<T extends object = Record<string, unknown>>({
  component: Component,
  fallback,
  ...props
}: LazyMapProps<T> & T) {
  return (
    <Suspense fallback={fallback || <MapLoading />}>
      <Component {...(props as T)} />
    </Suspense>
  );
}
