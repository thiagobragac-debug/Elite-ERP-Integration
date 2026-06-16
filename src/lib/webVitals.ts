/**
 * Web Vitals monitoring
 * Coleta métricas de performance do usuário real (RUM)
 * 
 * Core Web Vitals:
 * - LCP (Largest Contentful Paint): < 2.5s
 * - FID (First Input Delay): < 100ms  
 * - CLS (Cumulative Layout Shift): < 0.1
 * 
 * Outras métricas:
 * - FCP (First Contentful Paint): < 1.8s
 * - TTFB (Time to First Byte): < 600ms
 */

import { onCLS, onFID, onLCP, onFCP, onTTFB, type Metric } from 'web-vitals';

interface AnalyticsEvent {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  id: string;
  navigationType: string;
}

function sendToAnalytics(metric: Metric) {
  // Determinar rating baseado nos thresholds do Google
  const rating = getRating(metric);

  const event: AnalyticsEvent = {
    name: metric.name,
    value: Math.round(metric.value),
    rating,
    id: metric.id,
    navigationType: metric.navigationType,
  };

  // Log em desenvolvimento
  if (import.meta.env.DEV) {
    console.log(`[Web Vitals] ${metric.name}:`, {
      value: `${event.value}ms`,
      rating: event.rating,
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
      non_interaction: true,
    });
  }

  // Enviar para PostHog (se configurado)
  if (window.posthog) {
    window.posthog.capture('web_vital', {
      metric_name: metric.name,
      value: event.value,
      rating: event.rating,
      navigation_type: event.navigationType,
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

function getRating(metric: Metric): 'good' | 'needs-improvement' | 'poor' {
  // Thresholds oficiais do Google Core Web Vitals
  const thresholds: Record<string, [number, number]> = {
    LCP: [2500, 4000],
    FID: [100, 300],
    CLS: [0.1, 0.25],
    FCP: [1800, 3000],
    TTFB: [600, 1500],
  };

  const [good, poor] = thresholds[metric.name] || [0, 0];
  
  if (metric.value <= good) return 'good';
  if (metric.value <= poor) return 'needs-improvement';
  return 'poor';
}

function getThreshold(metricName: string): string {
  const thresholds: Record<string, string> = {
    LCP: '< 2.5s (good), < 4s (ok), > 4s (poor)',
    FID: '< 100ms (good), < 300ms (ok), > 300ms (poor)',
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
  onFID(sendToAnalytics);
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
    
    if (duration > 16) { // > 16ms = pode causar jank (60fps)
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
