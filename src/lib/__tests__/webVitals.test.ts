import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as Sentry from '@sentry/react';

// Mock Sentry
vi.mock('@sentry/react', () => ({
  captureMessage: vi.fn(),
}));

// Mock web-vitals
vi.mock('web-vitals', () => ({
  onCLS: vi.fn((callback) => {
    // Store callback for testing
    (global as any).__webVitalsCallbacks = (global as any).__webVitalsCallbacks || {};
    (global as any).__webVitalsCallbacks.onCLS = callback;
  }),
  onINP: vi.fn((callback) => {
    (global as any).__webVitalsCallbacks = (global as any).__webVitalsCallbacks || {};
    (global as any).__webVitalsCallbacks.onINP = callback;
  }),
  onLCP: vi.fn((callback) => {
    (global as any).__webVitalsCallbacks = (global as any).__webVitalsCallbacks || {};
    (global as any).__webVitalsCallbacks.onLCP = callback;
  }),
  onFID: vi.fn((callback) => {
    (global as any).__webVitalsCallbacks = (global as any).__webVitalsCallbacks || {};
    (global as any).__webVitalsCallbacks.onFID = callback;
  }),
  onFCP: vi.fn(),
  onTTFB: vi.fn(),
}));

describe('Web Vitals Alerting (Requirement 17.4)', () => {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let mockPostHog: any;

  beforeEach(() => {
    // Spy on console.warn
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    // Mock PostHog
    mockPostHog = {
      capture: vi.fn(),
    };
    (window as any).posthog = mockPostHog;

    // Mock production environment
    vi.stubEnv('PROD', true);
    
    // Clear previous mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    delete (window as any).posthog;
    vi.unstubAllEnvs();
  });

  describe('LCP (Largest Contentful Paint)', () => {
    it('should log warning when LCP > 2.5s', async () => {
      // Import after mocks are set up
      const { initWebVitals } = await import('../webVitals');
      
      initWebVitals();

      // Simulate poor LCP metric
      const poorLCPMetric = {
        name: 'LCP',
        value: 3000, // 3s > 2.5s threshold
        id: 'test-lcp-1',
        navigationType: 'navigate',
        rating: 'poor' as const,
        delta: 3000,
        entries: [],
      };

      // Get the callback and invoke it
      const callback = (global as any).__webVitalsCallbacks.onLCP;
      callback(poorLCPMetric);

      // Verify warning was logged
      expect(consoleWarnSpy).toHaveBeenCalled();
      const warningCall = consoleWarnSpy.mock.calls.find(call => 
        call[0].includes('POOR LCP')
      );
      expect(warningCall).toBeDefined();
      expect(warningCall?.[0]).toContain('3000ms');
    });

    it('should send alert to Sentry when LCP > 2.5s', async () => {
      const { initWebVitals } = await import('../webVitals');
      
      initWebVitals();

      const poorLCPMetric = {
        name: 'LCP',
        value: 4000,
        id: 'test-lcp-2',
        navigationType: 'navigate',
        rating: 'poor' as const,
        delta: 4000,
        entries: [],
      };

      const callback = (global as any).__webVitalsCallbacks.onLCP;
      callback(poorLCPMetric);

      // Verify Sentry.captureMessage was called
      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        expect.stringContaining('POOR LCP'),
        expect.objectContaining({
          level: 'warning',
          tags: expect.objectContaining({
            metric_name: 'LCP',
            web_vitals: 'poor_performance',
          }),
        })
      );
    });

    it('should send alert to PostHog when LCP > 2.5s', async () => {
      const { initWebVitals } = await import('../webVitals');
      
      initWebVitals();

      const poorLCPMetric = {
        name: 'LCP',
        value: 3500,
        id: 'test-lcp-3',
        navigationType: 'navigate',
        rating: 'poor' as const,
        delta: 3500,
        entries: [],
      };

      const callback = (global as any).__webVitalsCallbacks.onLCP;
      callback(poorLCPMetric);

      // Verify PostHog capture was called
      expect(mockPostHog.capture).toHaveBeenCalledWith(
        'web_vitals_poor_performance',
        expect.objectContaining({
          metric_name: 'LCP',
          value: 3500,
          threshold_exceeded: true,
        })
      );
    });

    it('should NOT alert when LCP <= 2.5s', async () => {
      const { initWebVitals } = await import('../webVitals');
      
      initWebVitals();

      const goodLCPMetric = {
        name: 'LCP',
        value: 2000, // 2s <= 2.5s threshold
        id: 'test-lcp-4',
        navigationType: 'navigate',
        rating: 'good' as const,
        delta: 2000,
        entries: [],
      };

      const callback = (global as any).__webVitalsCallbacks.onLCP;
      callback(goodLCPMetric);

      // Verify no poor performance warning
      const poorWarnings = consoleWarnSpy.mock.calls.filter(call => 
        call[0].includes('POOR LCP')
      );
      expect(poorWarnings).toHaveLength(0);
    });
  });

  describe('FID (First Input Delay)', () => {
    it('should log warning when FID > 100ms', async () => {
      const { initWebVitals } = await import('../webVitals');
      
      initWebVitals();

      const poorFIDMetric = {
        name: 'FID',
        value: 150, // 150ms > 100ms threshold
        id: 'test-fid-1',
        navigationType: 'navigate',
        rating: 'poor' as const,
        delta: 150,
        entries: [],
      };

      const callback = (global as any).__webVitalsCallbacks.onFID;
      callback(poorFIDMetric);

      // Verify warning was logged
      expect(consoleWarnSpy).toHaveBeenCalled();
      const warningCall = consoleWarnSpy.mock.calls.find(call => 
        call[0].includes('POOR FID')
      );
      expect(warningCall).toBeDefined();
      expect(warningCall?.[0]).toContain('150ms');
    });

    it('should send alert to monitoring services when FID > 100ms', async () => {
      const { initWebVitals } = await import('../webVitals');
      
      initWebVitals();

      const poorFIDMetric = {
        name: 'FID',
        value: 200,
        id: 'test-fid-2',
        navigationType: 'navigate',
        rating: 'poor' as const,
        delta: 200,
        entries: [],
      };

      const callback = (global as any).__webVitalsCallbacks.onFID;
      callback(poorFIDMetric);

      // Verify Sentry alert
      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        expect.stringContaining('POOR FID'),
        expect.objectContaining({
          level: 'warning',
        })
      );

      // Verify PostHog alert
      expect(mockPostHog.capture).toHaveBeenCalledWith(
        'web_vitals_poor_performance',
        expect.objectContaining({
          metric_name: 'FID',
          threshold_exceeded: true,
        })
      );
    });

    it('should NOT alert when FID <= 100ms', async () => {
      const { initWebVitals } = await import('../webVitals');
      
      initWebVitals();

      const goodFIDMetric = {
        name: 'FID',
        value: 80, // 80ms <= 100ms threshold
        id: 'test-fid-3',
        navigationType: 'navigate',
        rating: 'good' as const,
        delta: 80,
        entries: [],
      };

      const callback = (global as any).__webVitalsCallbacks.onFID;
      callback(goodFIDMetric);

      // Verify no poor performance warning
      const poorWarnings = consoleWarnSpy.mock.calls.filter(call => 
        call[0].includes('POOR FID')
      );
      expect(poorWarnings).toHaveLength(0);
    });
  });

  describe('CLS (Cumulative Layout Shift)', () => {
    it('should log warning when CLS > 0.1', async () => {
      const { initWebVitals } = await import('../webVitals');
      
      initWebVitals();

      const poorCLSMetric = {
        name: 'CLS',
        value: 0.25, // 0.25 > 0.1 threshold
        id: 'test-cls-1',
        navigationType: 'navigate',
        rating: 'poor' as const,
        delta: 0.25,
        entries: [],
      };

      const callback = (global as any).__webVitalsCallbacks.onCLS;
      callback(poorCLSMetric);

      // Verify warning was logged
      expect(consoleWarnSpy).toHaveBeenCalled();
      const warningCall = consoleWarnSpy.mock.calls.find(call => 
        call[0].includes('POOR CLS')
      );
      expect(warningCall).toBeDefined();
      expect(warningCall?.[0]).toContain('0.250');
    });

    it('should send alert to monitoring services when CLS > 0.1', async () => {
      const { initWebVitals } = await import('../webVitals');
      
      initWebVitals();

      const poorCLSMetric = {
        name: 'CLS',
        value: 0.3,
        id: 'test-cls-2',
        navigationType: 'navigate',
        rating: 'poor' as const,
        delta: 0.3,
        entries: [],
      };

      const callback = (global as any).__webVitalsCallbacks.onCLS;
      callback(poorCLSMetric);

      // Verify Sentry alert
      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        expect.stringContaining('POOR CLS'),
        expect.objectContaining({
          level: 'warning',
          tags: expect.objectContaining({
            metric_name: 'CLS',
          }),
        })
      );

      // Verify PostHog alert
      expect(mockPostHog.capture).toHaveBeenCalledWith(
        'web_vitals_poor_performance',
        expect.objectContaining({
          metric_name: 'CLS',
          threshold_exceeded: true,
        })
      );
    });

    it('should NOT alert when CLS <= 0.1', async () => {
      const { initWebVitals } = await import('../webVitals');
      
      initWebVitals();

      const goodCLSMetric = {
        name: 'CLS',
        value: 0.05, // 0.05 <= 0.1 threshold
        id: 'test-cls-3',
        navigationType: 'navigate',
        rating: 'good' as const,
        delta: 0.05,
        entries: [],
      };

      const callback = (global as any).__webVitalsCallbacks.onCLS;
      callback(goodCLSMetric);

      // Verify no poor performance warning
      const poorWarnings = consoleWarnSpy.mock.calls.filter(call => 
        call[0].includes('POOR CLS')
      );
      expect(poorWarnings).toHaveLength(0);
    });
  });

  describe('Alert message format', () => {
    it('should include route and page context in alerts', async () => {
      const { initWebVitals } = await import('../webVitals');
      
      // Mock window.location
      Object.defineProperty(window, 'location', {
        value: {
          pathname: '/pecuaria/animals',
        },
        writable: true,
      });

      initWebVitals();

      const poorLCPMetric = {
        name: 'LCP',
        value: 3000,
        id: 'test-lcp-route',
        navigationType: 'navigate',
        rating: 'poor' as const,
        delta: 3000,
        entries: [],
      };

      const callback = (global as any).__webVitalsCallbacks.onLCP;
      callback(poorLCPMetric);

      // Verify route context in warning
      const warningCall = consoleWarnSpy.mock.calls.find(call => 
        call[0].includes('POOR LCP')
      );
      expect(warningCall?.[0]).toContain('/pecuaria/animals');

      // Verify route context in Sentry alert
      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          tags: expect.objectContaining({
            page_route: '/pecuaria/animals',
          }),
          contexts: expect.objectContaining({
            page: expect.objectContaining({
              route: '/pecuaria/animals',
            }),
          }),
        })
      );
    });
  });
});
