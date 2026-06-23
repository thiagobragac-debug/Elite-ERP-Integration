/**
 * Web Vitals monitoring
 * Coleta métricas de performance do usuário real (RUM)
 *
 * Core Web Vitals:
 * - LCP (Largest Contentful Paint): < 2.5s
 * - INP (Interaction to Next Paint): < 200ms (replaces FID)
 * - CLS (Cumulative Layout Shift): < 0.1
 *
 * Outras métricas:
 * - FCP (First Contentful Paint): < 1.8s
 * - TTFB (Time to First Byte): < 600ms
 */

import { onCLS, onINP, onLCP, onFCP, onTTFB, type Metric } from 'web-vitals';
import * as Sentry from '@sentry/react';

interface AnalyticsEvent {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  id: string;
  navigationType: string;
  route: string;
  page: string;
}

/**
 * Get current route/page from window.location
 * Returns pathname for route tracking
 */
function getCurrentRoute(): string {
  return window.location.pathname || '/';
}

/**
 * Get page name from route
 * Converts pathname to readable page name
 */
function getPageName(pathname: string): string {
  // Remove leading/trailing slashes and split by /
  const parts = pathname.replace(/^\/|\/$/g, '').split('/');
  
  if (parts.length === 0 || parts[0] === '') {
    return 'Dashboard';
  }
  
  // Capitalize first part as page name
  const pageName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  
  // Add subpage if exists
  if (parts.length > 1 && parts[1]) {
    return `${pageName} - ${parts[1].charAt(0).toUpperCase() + parts[1].slice(1)}`;
  }
  
  return pageName;
}

function sendToAnalytics(metric: Metric) {
  // Determinar rating baseado nos thresholds do Google
  const rating = getRating(metric);
  
  // Get current route/page context (Requirements 17.1, 17.2)
  const route = getCurrentRoute();
  const page = getPageName(route);

  const event: AnalyticsEvent = {
    name: metric.name,
    value: Math.round(metric.value),
    rating,
    id: metric.id,
    navigationType: metric.navigationType,
    route, // Include route context (Requirement 17.2)
    page,  // Include page context (Requirement 17.2)
  };

  // Alert on poor Web Vitals thresholds (Requirement 17.4)
  alertOnPoorMetrics(metric, event.rating, route, page);

  // Log em desenvolvimento
  if (import.meta.env.DEV) {
    console.log(`[Web Vitals] ${metric.name}:`, {
      value: `${event.value}ms`,
      rating: event.rating,
      route: event.route,
      page: event.page,
      threshold: getThreshold(metric.name),
    });
  }

  // Enviar para analytics (Google Analytics, PostHog, etc.)
  if (window.gtag) {
    window.gtag('event', metric.name, {
      event_category: 'Web Vitals',
      value: event.value,
      event_label: event.id,
      metric_rating: event.rating,
      metric_name: metric.name, // Include metric name (Requirement 17.2)
      page_route: event.route,  // Include route context (Requirement 17.2)
      page_name: event.page,    // Include page context (Requirement 17.2)
      non_interaction: true,
    });
  }

  // Enviar para PostHog (se configurado)
  if (window.posthog) {
    window.posthog.capture('web_vital', {
      metric_name: metric.name,  // Include metric name (Requirement 17.2)
      value: event.value,
      rating: event.rating,
      navigation_type: event.navigationType,
      route: event.route,        // Include route context (Requirement 17.2)
      page: event.page,          // Include page context (Requirement 17.2)
    });
  }

  // Enviar para endpoint customizado (opcional)
  if (import.meta.env.VITE_ANALYTICS_ENDPOINT) {
    fetch(import.meta.env.VITE_ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
      keepalive: true, // Garante envio mesmo se página fechar
    }).catch(() => {
      // Fail silently
    });
  }
}

/**
 * Alert on poor Web Vitals thresholds (Requirement 17.4)
 * Logs warnings and sends alerts to monitoring services for metrics exceeding thresholds
 * 
 * Thresholds:
 * - LCP > 2.5s (2500ms)
 * - INP > 200ms (replaces FID)
 * - CLS > 0.1
 * 
 * @param metric - Web Vitals metric object
 * @param rating - Metric rating (good, needs-improvement, poor)
 * @param route - Current route/page
 * @param page - Page name
 */
function alertOnPoorMetrics(
  metric: Metric,
  rating: 'good' | 'needs-improvement' | 'poor',
  route: string,
  page: string
): void {
  const metricValue = Math.round(metric.value);
  const metricName = metric.name;

  // Alert thresholds (Requirement 17.4)
  // Alert when metrics exceed "good" thresholds, not just when "poor"
  const shouldAlert = 
    (metricName === 'LCP' && metricValue > 2500) ||  // LCP > 2.5s
    (metricName === 'INP' && metricValue > 200) ||   // INP > 200ms (replaces FID)
    (metricName === 'CLS' && metric.value > 0.1);    // CLS > 0.1

  if (!shouldAlert) {
    return;
  }

  // Log warning (Requirement 17.4)
  const warningMessage = `[Web Vitals] POOR ${metricName}: ${
    metricName === 'CLS' ? metric.value.toFixed(3) : `${metricValue}ms`
  } on ${page} (${route})`;
  
  console.warn(warningMessage, {
    metric: metricName,
    value: metricValue,
    threshold: getThreshold(metricName),
    rating,
    route,
    page,
    id: metric.id,
    navigationType: metric.navigationType,
  });

  // Send alert to Sentry for poor metrics (Requirement 17.4)
  if (import.meta.env.PROD && typeof Sentry !== 'undefined') {
    try {
      Sentry.captureMessage(warningMessage, {
        level: 'warning',
        tags: {
          metric_name: metricName,
          metric_rating: rating,
          page_route: route,
          page_name: page,
          web_vitals: 'poor_performance',
        },
        contexts: {
          web_vitals: {
            metric: metricName,
            value: metricValue,
            rating,
            threshold: getThreshold(metricName),
            navigation_type: metric.navigationType,
          },
          page: {
            route,
            name: page,
          },
        },
      });
    } catch (error) {
      // Fail silently if Sentry is not available
    }
  }

  // Send alert to PostHog analytics (Requirement 17.4)
  if (window.posthog) {
    try {
      window.posthog.capture('web_vitals_poor_performance', {
        metric_name: metricName,
        value: metricValue,
        rating,
        threshold_exceeded: true,
        route,
        page,
        navigation_type: metric.navigationType,
      });
    } catch (error) {
      // Fail silently if PostHog is not available
    }
  }
}

function getRating(metric: Metric): 'good' | 'needs-improvement' | 'poor' {
  // Thresholds oficiais do Google Core Web Vitals
  const thresholds: Record<string, [number, number]> = {
    LCP: [2500, 4000],
    INP: [200, 500], // Replaces FID
    CLS: [0.1, 0.25],
    FCP: [1800, 3000],
    TTFB: [600, 1500],
  };

  const [good, poor] = thresholds[metric.name] || [0, 0];

  if (metric.value <= good) {
    return 'good';
  }
  if (metric.value <= poor) {
    return 'needs-improvement';
  }
  return 'poor';
}

function getThreshold(metricName: string): string {
  const thresholds: Record<string, string> = {
    LCP: '< 2.5s (good), < 4s (ok), > 4s (poor)',
    INP: '< 200ms (good), < 500ms (ok), > 500ms (poor)',
    CLS: '< 0.1 (good), < 0.25 (ok), > 0.25 (poor)',
    FCP: '< 1.8s (good), < 3s (ok), > 3s (poor)',
    TTFB: '< 600ms (good), < 1.5s (ok), > 1.5s (poor)',
  };

  return thresholds[metricName] || 'Unknown';
}

/**
 * Inicializa coleta de Web Vitals
 * Apenas em produção para não poluir analytics com dados de dev
 */
export function initWebVitals() {
  // Apenas em produção
  if (!import.meta.env.PROD) {
    console.log('[Web Vitals] Monitoring disabled in development');
    return;
  }

  // Core Web Vitals
  onLCP(sendToAnalytics);
  onINP(sendToAnalytics);
  onCLS(sendToAnalytics);

  // Outras métricas úteis
  onFCP(sendToAnalytics);
  onTTFB(sendToAnalytics);

  console.log('[Web Vitals] Monitoring initialized');
}

/**
 * Hook para monitorar performance de componentes específicos
 */
export function measureComponentRender(componentName: string) {
  const startTime = performance.now();

  return () => {
    const duration = performance.now() - startTime;

    if (duration > 16) {
      // > 16ms = pode causar jank (60fps)
      console.warn(`[Performance] ${componentName} render took ${duration.toFixed(2)}ms`);

      // Enviar para analytics se muito lento (> 100ms)
      if (duration > 100 && import.meta.env.PROD) {
        if (window.posthog) {
          window.posthog.capture('slow_component_render', {
            component: componentName,
            duration: Math.round(duration),
          });
        }
      }
    }
  };
}

// Type augmentation para window
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    posthog?: {
      capture: (event: string, properties?: Record<string, any>) => void;
    };
  }
}
