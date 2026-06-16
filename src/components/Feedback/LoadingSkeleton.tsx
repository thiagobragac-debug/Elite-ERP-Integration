/**
 * Componente de Loading padronizado para Suspense boundaries
 * Substitui os fallbacks inline por uma experiência consistente
 */

interface LoadingSkeletonProps {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingSkeleton({ 
  message = 'Carregando módulo...', 
  fullScreen = true 
}: LoadingSkeletonProps) {
  return (
    <div 
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: fullScreen ? '100vh' : '400px',
        background: 'hsl(var(--bg-main))',
        flexDirection: 'column',
        gap: '24px',
      }}
      role="status"
      aria-live="polite"
      aria-label="Carregando conteúdo"
    >
      {/* Spinner animado */}
      <div 
        style={{
          width: '48px',
          height: '48px',
          border: '4px solid hsl(var(--border))',
          borderTopColor: 'hsl(var(--brand))',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
        aria-hidden="true"
      />
      
      {/* Mensagem de loading */}
      <span 
        style={{
          fontSize: '13px',
          fontWeight: 600,
          color: 'hsl(var(--text-muted))',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}
      >
        {message}
      </span>

      {/* Animação de pulso sutil */}
      <div 
        style={{
          width: '120px',
          height: '4px',
          background: 'hsl(var(--border))',
          borderRadius: '2px',
          overflow: 'hidden',
          position: 'relative',
        }}
        aria-hidden="true"
      >
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '50%',
            height: '100%',
            background: 'hsl(var(--brand))',
            animation: 'shimmer 1.5s ease-in-out infinite',
          }}
        />
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes shimmer {
          0%, 100% { left: -100%; }
          50% { left: 150%; }
        }
      `}</style>
    </div>
  );
}

/**
 * Skeleton para conteúdo inline (não fullscreen)
 */
export function LoadingInline({ message = 'Carregando...' }: { message?: string }) {
  return <LoadingSkeleton message={message} fullScreen={false} />;
}
