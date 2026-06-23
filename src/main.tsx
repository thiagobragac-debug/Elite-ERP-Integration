import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import './index.css';
import App from './App.tsx';
import { QueryProvider } from './contexts/QueryProvider';
import { validateEnv } from './lib/validateEnv';
import { initWebVitals } from './lib/webVitals';
import { initSentry } from './lib/sentry';
import { initAnalytics } from './lib/analytics';
import { SentryErrorFallback } from './components/Feedback/SentryErrorFallback';

// Validar variáveis de ambiente antes de iniciar o app
validateEnv();

// Inicializar Sentry para rastreamento de erros (apenas produção)
initSentry();

// Inicializar PostHog para analytics de negócio (apenas produção)
initAnalytics();

// Inicializar monitoramento de Web Vitals (apenas produção)
initWebVitals();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Sentry.ErrorBoundary
      fallback={({ error, componentStack, eventId, resetError }) => (
        <SentryErrorFallback
          error={error as Error}
          componentStack={componentStack}
          eventId={eventId}
          resetError={resetError}
        />
      )}
      showDialog={false}
    >
      <QueryProvider>
        <App />
      </QueryProvider>
    </Sentry.ErrorBoundary>
  </StrictMode>
);
