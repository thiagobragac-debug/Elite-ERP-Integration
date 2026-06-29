import * as Sentry from '@sentry/react';

/**
 * Sentry Error Tracking Configuration
 * 
 * Initializes Sentry with comprehensive error tracking, context enrichment,
 * and sensitive data filtering for multi-tenant production monitoring.
 * 
 * Features:
 * - Automatic error capture with full stack traces
 * - Tenant and user context enrichment
 * - Sensitive data filtering (passwords, tokens, API keys)
 * - Module/page tagging for error location tracking
 * - Performance monitoring integration
 * - Session replay for error reproduction
 * 
 * @example
 * // In main.tsx:
 * import { initSentry } from './lib/sentry';
 * initSentry();
 */

/**
 * List of sensitive field names to filter from error reports
 * Supports exact matches and pattern matching
 */
const SENSITIVE_FIELD_PATTERNS = [
  // Authentication & Passwords
  'password',
  'senha',
  'pass',
  'pwd',
  'secret',
  'passphrase',
  
  // Tokens & Keys
  'token',
  'jwt',
  'bearer',
  'auth',
  'api_key',
  'apikey',
  'api-key',
  'access_token',
  'refresh_token',
  'session_token',
  
  // Credit Card & Payment
  'credit_card',
  'creditcard',
  'card_number',
  'cvv',
  'cvc',
  'card_cvv',
  'card_cvc',
  'pan',
  
  // Personal Identifiable Information
  'ssn',
  'cpf',
  'cnpj',
  'rg',
  'social_security',
  
  // Encryption Keys
  'private_key',
  'public_key',
  'encryption_key',
  'decrypt',
  'cipher',
];

/**
 * Check if a field name matches sensitive patterns
 * @param fieldName - Field name to check
 * @returns true if field is sensitive
 */
function isSensitiveField(fieldName: string): boolean {
  const lowerField = fieldName.toLowerCase();
  return SENSITIVE_FIELD_PATTERNS.some(pattern => 
    lowerField.includes(pattern.toLowerCase())
  );
}

/**
 * Recursively filter sensitive data from an object
 * Replaces sensitive values with [FILTERED] placeholder
 * 
 * @param data - Object to filter
 * @returns Filtered object with sensitive data removed
 */
function filterSensitiveData(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => filterSensitiveData(item));
  }

  const filtered: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (isSensitiveField(key)) {
      filtered[key] = '[FILTERED]';
    } else if (typeof value === 'object' && value !== null) {
      filtered[key] = filterSensitiveData(value);
    } else {
      filtered[key] = value;
    }
  }

  return filtered;
}

/**
 * Set user context in Sentry for error enrichment
 * Should be called after successful authentication
 * 
 * @param user - User object with id, email, and role
 * @param tenantId - Current tenant ID for multi-tenant context
 * 
 * @example
 * import { setUserContext } from './lib/sentry';
 * setUserContext(
 *   { id: 'user123', email: 'user@example.com', role: 'admin' },
 *   'tenant456'
 * );
 */
export function setUserContext(
  user: { id: string; email: string; role: string } | null,
  tenantId: string | null
): void {
  if (!user) {
    Sentry.setUser(null);
    return;
  }

  Sentry.setUser({
    id: user.id,
    email: user.email,
    role: user.role,
    tenant_id: tenantId || undefined,
  });
}

/**
 * Set tenant context in Sentry
 * Should be called when switching tenants or after authentication
 * 
 * @param tenantId - Current tenant ID
 * @param tenantName - Optional tenant name for better context
 * 
 * @example
 * import { setTenantContext } from './lib/sentry';
 * setTenantContext('tenant123', 'Acme Corp');
 */
export function setTenantContext(
  tenantId: string | null,
  tenantName?: string
): void {
  if (!tenantId) {
    Sentry.setTag('tenant_id', 'none');
    Sentry.setContext('tenant', null);
    return;
  }

  Sentry.setTag('tenant_id', tenantId);
  Sentry.setContext('tenant', {
    id: tenantId,
    name: tenantName || 'Unknown',
  });
}

/**
 * Set module/page context for error location tracking
 * Should be called when navigating to different modules
 * 
 * @param module - Module name (e.g., 'Bovinocultura', 'Financeiro', 'Estoque')
 * @param page - Page name within the module (e.g., 'AnimalManagement', 'AccountsPayable')
 * 
 * @example
 * import { setModuleContext } from './lib/sentry';
 * setModuleContext('Bovinocultura', 'AnimalManagement');
 */
export function setModuleContext(module: string, page?: string): void {
  Sentry.setTag('module', module);
  
  if (page) {
    Sentry.setTag('page', page);
    Sentry.setContext('navigation', {
      module,
      page,
    });
  }
}

/**
 * Clear all Sentry contexts
 * Should be called on logout to prevent context leakage
 */
export function clearSentryContext(): void {
  Sentry.setUser(null);
  Sentry.setTag('tenant_id', 'none');
  Sentry.setTag('module', 'none');
  Sentry.setTag('page', 'none');
  Sentry.setContext('tenant', null);
  Sentry.setContext('navigation', null);
}

/**
 * Initialize Sentry error tracking
 * Should be called once at application startup, before rendering React
 * 
 * Only initializes in production environment to avoid noise in development
 * Requires VITE_SENTRY_DSN environment variable
 * 
 * @example
 * // In main.tsx:
 * import { initSentry } from './lib/sentry';
 * initSentry();
 */
export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.MODE;
  const isProduction = import.meta.env.PROD;

  // Skip initialization if DSN not configured
  if (!dsn) {
    if (isProduction) {
      console.warn(
        '[Sentry] DSN not configured. Error tracking is disabled.\n' +
        'Set VITE_SENTRY_DSN in your environment variables to enable Sentry.'
      );
    }
    return;
  }

  // Only initialize in production to avoid noise
  if (!isProduction) {
    console.log('[Sentry] Skipping initialization in development mode');
    return;
  }

  try {
    Sentry.init({
      dsn,
      environment,
      
      // Set release version for error tracking
      release: import.meta.env.VITE_SENTRY_RELEASE || 'unknown',
      
      // Integrations
      integrations: [
        // Performance monitoring with BrowserTracing
        Sentry.browserTracingIntegration(),
        
        // Session replay for error reproduction
        Sentry.replayIntegration({
          // Mask all text and input content for privacy
          maskAllText: true,
          blockAllMedia: true,
        }),
        
        // React Router v6 tracing — initialized via Sentry.browserTracingIntegration above
      ],

      // Performance Monitoring
      tracesSampleRate: 0.1,
      tracePropagationTargets: [
        'localhost',
        /^https:\/\/.*\.supabase\.co/,
        /^https:\/\/api\./,
      ],
      
      // Session Replay
      replaysSessionSampleRate: 0.1, // 10% of normal sessions
      replaysOnErrorSampleRate: 1.0, // 100% of error sessions
      
      // Data filtering and enrichment
      beforeSend(event, hint) {
        // Filter sensitive data from event
        if (event.request) {
          // Filter request body
          if (event.request.data) {
            event.request.data = filterSensitiveData(event.request.data);
          }
          
          // Filter request headers (remove Authorization, cookies)
          if (event.request.headers) {
            const filteredHeaders = { ...event.request.headers };
            delete filteredHeaders['Authorization'];
            delete filteredHeaders['authorization'];
            delete filteredHeaders['Cookie'];
            delete filteredHeaders['cookie'];
            event.request.headers = filteredHeaders;
          }
          
          // Filter query parameters
          if (event.request.query_string) {
            event.request.query_string = filterSensitiveData(
              event.request.query_string
            );
          }
        }

        // Filter extra context data
        if (event.extra) {
          event.extra = filterSensitiveData(event.extra);
        }

        // Filter breadcrumbs (console logs, network calls)
        if (event.breadcrumbs) {
          event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
            if (breadcrumb.data) {
              breadcrumb.data = filterSensitiveData(breadcrumb.data);
            }
            return breadcrumb;
          });
        }

        // Add custom tags based on error type
        if (hint.originalException) {
          const error = hint.originalException;
          
          if (error instanceof Error) {
            // Tag network errors
            if (error.message.includes('fetch') || error.message.includes('network')) {
              event.tags = { ...event.tags, error_type: 'network' };
            }
            
            // Tag authentication errors
            if (error.message.includes('auth') || error.message.includes('unauthorized')) {
              event.tags = { ...event.tags, error_type: 'authentication' };
            }
            
            // Tag validation errors
            if (error.message.includes('validation') || error.message.includes('invalid')) {
              event.tags = { ...event.tags, error_type: 'validation' };
            }
          }
        }

        return event;
      },

      // Ignore common non-critical errors
      ignoreErrors: [
        // Browser extension errors
        'top.GLOBALS',
        'originalCreateNotification',
        'canvas.contentDocument',
        'MyApp_RemoveAllHighlights',
        
        // Network errors that are expected
        'Non-Error promise rejection captured',
        'ResizeObserver loop limit exceeded',
        
        // Third-party script errors
        /^Script error\.?$/,
        /^Javascript error: Script error\.? on line 0$/,
      ],

      // Don't send events for these URLs
      denyUrls: [
        // Browser extensions
        /extensions\//i,
        /^chrome:\/\//i,
        /^moz-extension:\/\//i,
      ],
    });

    console.log('[Sentry] Initialized successfully in', environment, 'mode');
  } catch (error) {
    console.error('[Sentry] Failed to initialize:', error);
  }
}
