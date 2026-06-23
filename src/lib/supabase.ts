import { createClient } from '@supabase/supabase-js';
import { analytics } from './analytics';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validação de credenciais (redundante com validateEnv, mas mantém segurança)
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase credentials. Please check your .env file.\n' +
      'Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * Query performance monitoring wrapper
 * Tracks query duration and logs warnings for slow queries (>1s)
 * Sends metrics to analytics for performance monitoring
 *
 * @param queryFn - Function that executes the database query
 * @param queryName - Descriptive name for the query (e.g., 'fetch-animals', 'update-payment')
 * @returns Promise with query result
 *
 * @example
 * const animals = await monitoredQuery(
 *   () => supabase.from('animais').select('*').eq('tenant_id', tenantId),
 *   'fetch-animals'
 * );
 */
export async function monitoredQuery<T>(queryFn: () => Promise<T>, queryName: string): Promise<T> {
  const start = performance.now();

  try {
    const result = await queryFn();
    const duration = performance.now() - start;

    // Log slow queries (>1000ms)
    if (duration > 1000) {
      console.warn(
        `[Query Performance] Slow query detected: ${queryName} took ${duration.toFixed(2)}ms`,
        {
          query: queryName,
          duration: Math.round(duration),
          threshold: '1000ms',
          recommendation: 'Consider adding indexes or optimizing query',
        }
      );

      // Send to analytics in production
      if (import.meta.env.PROD) {
        sendSlowQueryMetrics(queryName, duration);
      }
    }

    // Log in development for visibility
    if (import.meta.env.DEV && duration > 500) {
      console.log(`[Query Performance] ${queryName}: ${duration.toFixed(2)}ms`);
    }

    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.error(
      `[Query Performance] Query failed: ${queryName} after ${duration.toFixed(2)}ms`,
      error
    );
    throw error;
  }
}

/**
 * Send slow query metrics to analytics service
 * Uses the centralized analytics module for consistency
 */
function sendSlowQueryMetrics(queryName: string, duration: number) {
  // Send to PostHog via analytics module (respects opt-out, production-only)
  analytics.apiSlowResponse({
    endpoint: queryName,
    duration: Math.round(duration),
    method: 'database_query',
  });

  // Send to custom analytics endpoint if configured
  if (import.meta.env.VITE_ANALYTICS_ENDPOINT) {
    fetch(import.meta.env.VITE_ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'slow_query',
        endpoint: queryName,
        duration: Math.round(duration),
        timestamp: new Date().toISOString(),
        type: 'database_query',
      }),
      keepalive: true,
    }).catch(() => {
      // Fail silently to avoid affecting user experience
    });
  }
}
