/**
 * Error Boundary granular por módulo
 * Previne que erros em um módulo derrubem todo o app
 */

import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  moduleName: string;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

export class ModuleErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Log to console in development
    console.error(`[${this.props.moduleName}] Error caught:`, error, errorInfo);
    
    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
    
    // TODO: Send to Sentry/monitoring service
    // Sentry.captureException(error, {
    //   tags: { module: this.props.moduleName },
    //   contexts: { react: errorInfo }
    // });

    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    window.location.href = '/painel';
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          padding: '48px 24px',
          background: 'hsl(var(--bg-card))',
          borderRadius: '12px',
          margin: '24px',
          border: '1px solid hsl(var(--border))',
        }}>
          {/* Icon */}
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'hsl(var(--error) / 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
          }}>
            <AlertTriangle size={40} color="hsl(var(--error))" />
          </div>

          {/* Title */}
          <h2 style={{ 
            margin: 0,
            marginBottom: '8px',
            color: 'hsl(var(--text-main))',
            fontSize: '24px',
            fontWeight: 700,
          }}>
            Erro no módulo {this.props.moduleName}
          </h2>

          {/* Description */}
          <p style={{ 
            color: 'hsl(var(--text-muted))',
            margin: '0 0 24px 0',
            textAlign: 'center',
            maxWidth: '500px',
          }}>
            Algo deu errado ao carregar este módulo. Você pode tentar recarregar 
            ou voltar para o painel principal.
          </p>

          {/* Error details (development only) */}
          {import.meta.env.DEV && this.state.error && (
            <details style={{ 
              marginBottom: '24px',
              maxWidth: '600px',
              width: '100%',
            }}>
              <summary style={{
                cursor: 'pointer',
                padding: '8px 12px',
                background: 'hsl(var(--bg-main))',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                color: 'hsl(var(--text-main))',
              }}>
                Detalhes técnicos (apenas em desenvolvimento)
              </summary>
              <div style={{
                marginTop: '12px',
                padding: '16px',
                background: '#000',
                borderRadius: '8px',
                overflow: 'auto',
              }}>
                <div style={{
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  color: '#ff6b6b',
                  marginBottom: '8px',
                  fontWeight: 'bold',
                }}>
                  {this.state.error.name}: {this.state.error.message}
                </div>
                {this.state.error.stack && (
                  <pre style={{
                    margin: 0,
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    color: '#94a3b8',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}>
                    {this.state.error.stack}
                  </pre>
                )}
              </div>
            </details>
          )}

          {/* Actions */}
          <div style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}>
            <button
              onClick={this.handleReset}
              style={{
                padding: '12px 24px',
                background: 'hsl(var(--brand))',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: 600,
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'hsl(var(--brand-hover))';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'hsl(var(--brand))';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <RefreshCw size={16} />
              Tentar Novamente
            </button>

            <button
              onClick={this.handleGoHome}
              style={{
                padding: '12px 24px',
                background: 'transparent',
                color: 'hsl(var(--text-main))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: 600,
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'hsl(var(--bg-elevated))';
                e.currentTarget.style.borderColor = 'hsl(var(--brand))';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'hsl(var(--border))';
              }}
            >
              <Home size={16} />
              Voltar ao Painel
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook helper para usar com function components
 */
export function withModuleErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  moduleName: string
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ModuleErrorBoundary moduleName={moduleName}>
        <Component {...props} />
      </ModuleErrorBoundary>
    );
  };
}
