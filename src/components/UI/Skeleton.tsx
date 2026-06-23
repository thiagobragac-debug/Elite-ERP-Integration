import React from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '20px',
  borderRadius = '8px',
  className = '',
  style = {},
}) => {
  return (
    <div
      className={`tauze-skeleton ${className}`}
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
    >
      <style>{`
        .tauze-skeleton {
          background: linear-gradient(
            90deg,
            hsl(var(--bg-main)) 0%,
            hsl(var(--bg-card)) 50%,
            hsl(var(--bg-main)) 100%
          );
          background-size: 200% 100%;
          animation: skeleton-pulse 1.5s infinite ease-in-out;
          opacity: 0.7;
        }

        @keyframes skeleton-pulse {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
};

export const SkeletonLine: React.FC<SkeletonProps & { lines?: number; gap?: number }> = ({
  lines = 1,
  gap = 12,
  ...props
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: `${gap}px`,
        width: props.width || '100%',
      }}
    >
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          {...props}
          width={i === lines - 1 && lines > 1 ? '70%' : props.width || '100%'}
        />
      ))}
    </div>
  );
};
