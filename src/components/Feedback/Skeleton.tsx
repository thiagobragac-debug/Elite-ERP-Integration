import React from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  circle?: boolean;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  width = '100%', 
  height = '1rem', 
  circle = false,
  className = ''
}) => {
  return (
    <div 
      className={`skeleton-base ${className}`}
      style={{ 
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: circle ? '50%' : 'var(--radius-md)'
      }}
    />
  );
};

export const TableSkeleton: React.FC = () => (
  <div className="premium-card" style={{ padding: '24px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
      <Skeleton width="200px" height="32px" />
      <Skeleton width="120px" height="32px" />
    </div>
    {[...Array(5)].map((_, i) => (
      <div key={i} style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <Skeleton height="48px" />
      </div>
    ))}
  </div>
);

export const KPISkeleton: React.FC = () => (
  <div className="elite-kpi-card">
    <div className="kpi-main-content">
      <Skeleton width={80} height={80} circle />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
        <Skeleton width="60px" height="12px" />
        <Skeleton width="100px" height="32px" />
      </div>
    </div>
    <div className="kpi-divider" />
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '40px' }}>
      <Skeleton width="60%" height="24px" />
      <Skeleton width="40px" height="12px" />
    </div>
  </div>
);
