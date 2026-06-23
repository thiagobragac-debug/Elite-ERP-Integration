import React from 'react';
import { AlertTriangle, RefreshCw, Home, Send } from 'lucide-react';
import * as Sentry from '@sentry/react';

/**
 * Sentry ErrorBoundary Fallback UI
 * 
 * Displays a user-friendly error page when an unhandled error occurs.
 * Provides options to:
 * - Reload the page
 * - Return to home/dashboard
 * - Report the issue with feedback
 * 
 * **Validates: Requirements 10.1, 10.2**
 * - 10.1: Captures errors with full stack trace and context
 * - 10.2: Enriches errors with tenant_id, user_id, user_role
 * 
 * @param props - Error and component stack from ErrorBoundary
 */
interface SentryErrorFallbackProps {
  error: Error;
  componentStack: string | null;
  eventId: string | null;
  resetError: () => void;
}

export function SentryErrorFallback({
  error,
  eventId,
  resetError,
}: SentryErrorFallbackProps): React.ReactElement {
  const [feedbackSent, setFeedbackSent] = React.useState(false);

  const handleReload = () => {
    window.location.href = '/';
  };

  const handleReset = () => {
    resetError();
    window.location.href = '/';
  };

  const handleSendFeedback = () => {
    if (eventId) {
      // Open Sentry User Feedback dialog
      const feedback = Sentry.getFeedback();
      if (feedback) {
        feedback.createForm();
        setFeedbackSent(true);
      }
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        padding: '24px',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: '560px',
          width: '100%',
          background: '#1e293b',
          borderRadius: '16px',
          padding: '48px 32px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
          border: '1px solid #334155',
        }}
      >
        {/* Error Icon */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid rgba(239, 68, 68, 0.3)',
            }}
          >
            <AlertTriangle size={40} color="#ef4444" strokeWidth={2} />
          </div>
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#f1f5f9',
            textAlign: 'center',
            marginBottom: '12px',
            lineHeight: '1.3',
          }}
        >
          Algo deu errado
        </h1>

        {/* Description */}
        <p
          style={{
            fontSize: '15px',
            color: '#94a3b8',
            textAlign: 'center',
            marginBottom: '24px',
            lineHeight: '1.6',
          }}
        >
          Desculpe, encontramos um erro inesperado. Nossa equipe foi notificada automaticamente e
          está trabalhando para resolver o problema.
        </p>

        {/* Error Details (Collapsed by default) */}
        <details
          style={{
            background: '#0f172a',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px',
            border: '1px solid #334155',
            cursor: 'pointer',
          }}
        >
          <summary
            style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#cbd5e1',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            Detalhes técnicos
          </summary>
          <div
            style={{
              marginTop: '12px',
              fontSize: '13px',
              color: '#64748b',
              fontFamily: 'Monaco, Consolas, "Courier New", monospace',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            <div
              style={{
                marginBottom: '8px',
                paddingBottom: '8px',
                borderBottom: '1px solid #334155',
              }}
            >
              <strong style={{ color: '#94a3b8' }}>Erro:</strong> {error.message}
            </div>
            {eventId && (
              <div>
                <strong style={{ color: '#94a3b8' }}>ID do Evento:</strong> {eventId}
              </div>
            )}
          </div>
        </details>

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {/* Primary Action: Reload */}
          <button
            onClick={handleReload}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '14px 24px',
              background: '#6366f1',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              outline: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#4f46e5';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#6366f1';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <RefreshCw size={18} />
            Recarregar Página
          </button>

          {/* Secondary Action: Go Home */}
          <button
            onClick={handleReset}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '14px 24px',
              background: '#334155',
              color: '#e2e8f0',
              border: '1px solid #475569',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              outline: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#475569';
              e.currentTarget.style.borderColor = '#64748b';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#334155';
              e.currentTarget.style.borderColor = '#475569';
            }}
          >
            <Home size={18} />
            Voltar para Início
          </button>

          {/* Tertiary Action: Send Feedback */}
          {eventId && !feedbackSent && (
            <button
              onClick={handleSendFeedback}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 24px',
                background: 'transparent',
                color: '#94a3b8',
                border: '1px solid #334155',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                outline: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#cbd5e1';
                e.currentTarget.style.borderColor = '#475569';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#94a3b8';
                e.currentTarget.style.borderColor = '#334155';
              }}
            >
              <Send size={16} />
              Enviar Feedback
            </button>
          )}

          {feedbackSent && (
            <div
              style={{
                padding: '12px',
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '8px',
                color: '#86efac',
                fontSize: '14px',
                textAlign: 'center',
              }}
            >
              ✓ Obrigado pelo seu feedback!
            </div>
          )}
        </div>

        {/* Footer Note */}
        <p
          style={{
            fontSize: '13px',
            color: '#64748b',
            textAlign: 'center',
            marginTop: '24px',
            lineHeight: '1.5',
          }}
        >
          Se o problema persistir, entre em contato com o suporte técnico.
        </p>
      </div>
    </div>
  );
}
