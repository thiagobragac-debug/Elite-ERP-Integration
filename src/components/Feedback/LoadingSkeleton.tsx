/**
 * LoadingSkeleton Component
 * 
 * Componente reutilizável de loading skeleton com suporte a múltiplas variantes
 * que refletem a estrutura final da UI para melhor experiência do usuário.
 * 
 * **Validates: Requirements 15.1, 15.2, 15.3, 15.4**
 * 
 * Variantes disponíveis:
 * - `table`: Skeleton de tabela com linhas e colunas
 * - `card`: Skeleton para layouts de cards
 * - `form`: Skeleton para campos de formulário
 * - `chart`: Skeleton para placeholders de gráficos
 * 
 * @example
 * ```tsx
 * // Em rotas lazy-loaded
 * <Suspense fallback={<LoadingSkeleton variant="table" />}>
 *   <AnimalManagement />
 * </Suspense>
 * ```
 */

import React from 'react';
import { Skeleton } from './Skeleton';

type SkeletonVariant = 'table' | 'card' | 'form' | 'chart';

interface LoadingSkeletonProps {
  variant?: SkeletonVariant;
  rows?: number; // Para variant="table"
  columns?: number; // Para variant="table"
  message?: string;
  fullScreen?: boolean;
}

export function LoadingSkeleton({
  variant = 'table',
  rows = 5,
  columns = 4,
  message,
  fullScreen = true,
}: LoadingSkeletonProps) {
  const containerStyle: React.CSSProperties = {
    padding: '24px',
    background: 'hsl(var(--bg-main))',
    minHeight: fullScreen ? '100vh' : '400px',
  };

  return (
    <div style={containerStyle} role="status" aria-live="polite" aria-label={message || 'Carregando conteúdo'}>
      {variant === 'table' && <TableSkeletonVariant rows={rows} columns={columns} />}
      {variant === 'card' && <CardSkeletonVariant />}
      {variant === 'form' && <FormSkeletonVariant />}
      {variant === 'chart' && <ChartSkeletonVariant />}
    </div>
  );
}

/**
 * Table Variant: Skeleton de tabela com header e linhas
 */
function TableSkeletonVariant({ rows, columns }: { rows: number; columns: number }) {
  return (
    <div className="premium-card" style={{ padding: '24px' }}>
      {/* Header com título e botão de ação */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Skeleton width="240px" height="32px" />
        <Skeleton width="140px" height="40px" />
      </div>

      {/* Barra de pesquisa e filtros */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <Skeleton width="100%" height="40px" />
        <Skeleton width="120px" height="40px" />
        <Skeleton width="120px" height="40px" />
      </div>

      {/* Table Header */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: '16px', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid hsl(var(--border))' }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} width="80%" height="20px" />
        ))}
      </div>

      {/* Table Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={`row-${rowIndex}`}
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: '16px',
            paddingTop: '16px',
            paddingBottom: '16px',
            borderBottom: '1px solid hsl(var(--border))',
          }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={`cell-${rowIndex}-${colIndex}`} height="20px" width={colIndex === 0 ? '90%' : '70%'} />
          ))}
        </div>
      ))}

      {/* Pagination */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
        <Skeleton width="180px" height="20px" />
        <div style={{ display: 'flex', gap: '8px' }}>
          <Skeleton width="40px" height="36px" />
          <Skeleton width="40px" height="36px" />
          <Skeleton width="40px" height="36px" />
        </div>
      </div>
    </div>
  );
}

/**
 * Card Variant: Grid de cards para layouts tipo dashboard
 */
function CardSkeletonVariant() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={`card-${index}`} className="premium-card" style={{ padding: '24px' }}>
          {/* Card Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <Skeleton width="60px" height="60px" circle />
            <Skeleton width="80px" height="28px" />
          </div>

          {/* Card Title */}
          <Skeleton width="70%" height="24px" style={{ marginBottom: '12px' }} />
          
          {/* Card Value */}
          <Skeleton width="50%" height="36px" style={{ marginBottom: '16px' }} />
          
          {/* Card Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid hsl(var(--border))' }}>
            <Skeleton width="100px" height="20px" />
            <Skeleton width="60px" height="20px" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Form Variant: Skeleton para campos de formulário
 */
function FormSkeletonVariant() {
  return (
    <div className="premium-card" style={{ padding: '32px', maxWidth: '800px', margin: '0 auto' }}>
      {/* Form Title */}
      <Skeleton width="60%" height="32px" style={{ marginBottom: '32px' }} />

      {/* Form Fields */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Text Input Field */}
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={`field-${index}`}>
            <Skeleton width="140px" height="20px" style={{ marginBottom: '8px' }} />
            <Skeleton width="100%" height="44px" />
          </div>
        ))}

        {/* Two columns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <Skeleton width="100px" height="20px" style={{ marginBottom: '8px' }} />
            <Skeleton width="100%" height="44px" />
          </div>
          <div>
            <Skeleton width="120px" height="20px" style={{ marginBottom: '8px' }} />
            <Skeleton width="100%" height="44px" />
          </div>
        </div>

        {/* Textarea */}
        <div>
          <Skeleton width="180px" height="20px" style={{ marginBottom: '8px' }} />
          <Skeleton width="100%" height="120px" />
        </div>

        {/* Form Actions */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px', paddingTop: '24px', borderTop: '1px solid hsl(var(--border))' }}>
          <Skeleton width="100px" height="44px" />
          <Skeleton width="140px" height="44px" />
        </div>
      </div>
    </div>
  );
}

/**
 * Chart Variant: Skeleton para placeholders de gráficos
 */
function ChartSkeletonVariant() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* KPIs Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={`kpi-${index}`} className="premium-card" style={{ padding: '24px' }}>
            <Skeleton width="100px" height="16px" style={{ marginBottom: '12px' }} />
            <Skeleton width="60%" height="40px" style={{ marginBottom: '8px' }} />
            <Skeleton width="80px" height="16px" />
          </div>
        ))}
      </div>

      {/* Main Chart */}
      <div className="premium-card" style={{ padding: '24px' }}>
        {/* Chart Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Skeleton width="220px" height="28px" />
          <div style={{ display: 'flex', gap: '8px' }}>
            <Skeleton width="80px" height="36px" />
            <Skeleton width="80px" height="36px" />
            <Skeleton width="80px" height="36px" />
          </div>
        </div>

        {/* Chart Area */}
        <div style={{ position: 'relative', height: '400px' }}>
          {/* Y-axis labels */}
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 40, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={`y-${i}`} width="40px" height="16px" />
            ))}
          </div>

          {/* Bars/Lines placeholder */}
          <div style={{ marginLeft: '60px', marginBottom: '40px', height: '340px', display: 'flex', alignItems: 'flex-end', gap: '16px' }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton
                key={`bar-${i}`}
                width="100%"
                height={`${Math.random() * 60 + 40}%`}
              />
            ))}
          </div>

          {/* X-axis labels */}
          <div style={{ position: 'absolute', bottom: 0, left: 60, right: 0, display: 'flex', justifyContent: 'space-between' }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={`x-${i}`} width="50px" height="16px" />
            ))}
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '24px' }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={`legend-${i}`} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Skeleton width="16px" height="16px" />
              <Skeleton width="80px" height="16px" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton para conteúdo inline (não fullscreen)
 * @deprecated Use LoadingSkeleton com fullScreen={false}
 */
export function LoadingInline({ message = 'Carregando...' }: { message?: string }) {
  return <LoadingSkeleton message={message} fullScreen={false} />;
}
