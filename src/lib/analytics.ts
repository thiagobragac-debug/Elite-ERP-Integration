import posthog from 'posthog-js';

/**
 * PostHog Analytics Configuration
 * 
 * Initializes PostHog with business event tracking and performance monitoring
 * for multi-tenant production analytics.
 * 
 * Features:
 * - Manual event tracking (autocapture disabled)
 * - Business event tracking (animal_registered, sale_completed, payment_received)
 * - Performance event tracking (page_load_time, api_slow_response)
 * - User identification with tenant context
 * - Privacy-first with opt-out support
 * 
 * @example
 * // In main.tsx:
 * import { initAnalytics } from './lib/analytics';
 * initAnalytics();
 */

/**
 * Initialize PostHog analytics
 * Should be called once at application startup, before rendering React
 * 
 * Only initializes in production environment to avoid noise in development
 * Requires VITE_POSTHOG_KEY environment variable
 * 
 * @example
 * // In main.tsx:
 * import { initAnalytics } from './lib/analytics';
 * initAnalytics();
 */
export function initAnalytics(): void {
  const apiKey = import.meta.env.VITE_POSTHOG_KEY;
  const isProduction = import.meta.env.PROD;

  // Skip initialization if API key not configured
  if (!apiKey) {
    if (isProduction) {
      console.warn(
        '[PostHog] API key not configured. Analytics is disabled.\n' +
        'Set VITE_POSTHOG_KEY in your environment variables to enable PostHog.'
      );
    }
    return;
  }

  // Only initialize in production to avoid noise
  if (!isProduction) {
    // Silent skip in development
    return;
  }

  // Check if user has opted out
  const hasOptedOut = localStorage.getItem('analytics_opted_out') === 'true';
  if (hasOptedOut) {
    // User opted out - silent skip
    return;
  }

  try {
    posthog.init(apiKey, {
      api_host: 'https://app.posthog.com',
      
      // Manual events only - no automatic event capture
      autocapture: false,
      
      // Enable page view and page leave tracking
      capture_pageview: true,
      capture_pageleave: true,
      
      // Privacy settings
      respect_dnt: true, // Respect Do Not Track browser setting
      
      // Session recording disabled for privacy
      disable_session_recording: true,
      
      // Persistence
      persistence: 'localStorage',
      
      // Advanced settings
      loaded: (_ph) => {
        // PostHog loaded successfully
      },
    });
  } catch (error) {
    console.error('[PostHog] Failed to initialize:', error);
  }
}

/**
 * Track business events and performance metrics
 * 
 * All tracking functions check if PostHog is initialized and if user has opted out
 * before sending events. Safe to call even if PostHog is not configured.
 */
export const analytics = {
  /**
   * Track animal registration
   * @param data - Animal data including race and weight
   */
  animalRegistered: (data: { raca: string; peso: number; sexo?: string }) => {
    if (!posthog.__loaded || localStorage.getItem('analytics_opted_out') === 'true') {
      return;
    }
    
    posthog.capture('animal_registered', {
      raca: data.raca,
      peso: data.peso,
      sexo: data.sexo,
    });
  },

  /**
   * Track sale completion
   * @param data - Sale data including value and customer
   */
  saleCompleted: (data: { valor: number; cliente: string; tipo?: string }) => {
    if (!posthog.__loaded || localStorage.getItem('analytics_opted_out') === 'true') {
      return;
    }
    
    posthog.capture('sale_completed', {
      valor: data.valor,
      cliente: data.cliente,
      tipo: data.tipo,
    });
  },

  /**
   * Track payment received
   * @param data - Payment data including value and method
   */
  paymentReceived: (data: { valor: number; metodo: string; tipo?: string }) => {
    if (!posthog.__loaded || localStorage.getItem('analytics_opted_out') === 'true') {
      return;
    }
    
    posthog.capture('payment_received', {
      valor: data.valor,
      metodo: data.metodo,
      tipo: data.tipo,
    });
  },

  /**
   * Track slow API responses (>3 seconds)
   * @param data - API endpoint and duration
   */
  apiSlowResponse: (data: { endpoint: string; duration: number; method?: string }) => {
    if (!posthog.__loaded || localStorage.getItem('analytics_opted_out') === 'true') {
      return;
    }
    
    // Only track if response took more than 3 seconds
    if (data.duration > 3000) {
      posthog.capture('api_slow_response', {
        endpoint: data.endpoint,
        duration: data.duration,
        method: data.method,
      });
    }
  },

  /**
   * Track page load time
   * @param data - Route and load duration
   */
  pageLoadTime: (data: { route: string; duration: number; metric?: string }) => {
    if (!posthog.__loaded || localStorage.getItem('analytics_opted_out') === 'true') {
      return;
    }
    
    posthog.capture('page_load_time', {
      route: data.route,
      duration: data.duration,
      metric: data.metric,
    });
  },
};

/**
 * Set user identity in PostHog for event enrichment
 * Should be called after successful authentication
 * 
 * @param user - User object with id, email, and tenant_id
 * 
 * @example
 * import { identifyUser } from './lib/analytics';
 * identifyUser({
 *   id: 'user123',
 *   email: 'user@example.com',
 *   tenant_id: 'tenant456'
 * });
 */
export function identifyUser(user: { id: string; email: string; tenant_id: string }): void {
  if (!posthog.__loaded || localStorage.getItem('analytics_opted_out') === 'true') {
    return;
  }

  try {
    posthog.identify(user.id, {
      email: user.email,
      tenant_id: user.tenant_id,
    });
  } catch (error) {
    console.error('[PostHog] Failed to identify user:', error);
  }
}

/**
 * Reset user identity
 * Should be called on logout to prevent event attribution to wrong user
 * 
 * @example
 * import { resetUser } from './lib/analytics';
 * resetUser();
 */
export function resetUser(): void {
  if (!posthog.__loaded) {
    return;
  }

  try {
    posthog.reset();
  } catch (error) {
    console.error('[PostHog] Failed to reset user:', error);
  }
}

/**
 * Opt out of analytics tracking
 * Stops sending events and stores preference in localStorage
 * 
 * @example
 * import { optOutAnalytics } from './lib/analytics';
 * optOutAnalytics();
 */
export function optOutAnalytics(): void {
  localStorage.setItem('analytics_opted_out', 'true');
  
  if (posthog.__loaded) {
    try {
      posthog.opt_out_capturing();
    } catch (error) {
      console.error('[PostHog] Failed to opt out:', error);
    }
  }
}

/**
 * Opt in to analytics tracking
 * Re-enables event tracking and removes opt-out preference
 * 
 * @example
 * import { optInAnalytics } from './lib/analytics';
 * optInAnalytics();
 */
export function optInAnalytics(): void {
  localStorage.removeItem('analytics_opted_out');
  
  if (posthog.__loaded) {
    try {
      posthog.opt_in_capturing();
    } catch (error) {
      console.error('[PostHog] Failed to opt in:', error);
    }
  }
}

/**
 * Check if user has opted out of analytics
 * @returns true if user has opted out
 */
export function hasOptedOut(): boolean {
  return localStorage.getItem('analytics_opted_out') === 'true';
}
