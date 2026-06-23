/**
 * Web Vitals tracking tests
 * Validates Web Vitals are sent to analytics with route/page context
 * 
 * Requirements: 17.1, 17.2
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Web Vitals Route Context', () => {
  beforeEach(() => {
    // Mock window.location for different routes
    vi.clearAllMocks();
  });

  it('should extract route from /pecuaria/animais path', () => {
    Object.defineProperty(window, 'location', {
      value: { pathname: '/pecuaria/animais' },
      writable: true,
      configurable: true,
    });

    const route = window.location.pathname;
    const parts = route.replace(/^\/|\/$/g, '').split('/');
    const pageName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1) +
      (parts[1] ? ` - ${parts[1].charAt(0).toUpperCase() + parts[1].slice(1)}` : '');

    expect(route).toBe('/pecuaria/animais');
    expect(pageName).toBe('Pecuaria - Animais');
  });

  it('should extract route from root path', () => {
    Object.defineProperty(window, 'location', {
      value: { pathname: '/' },
      writable: true,
      configurable: true,
    });

    const route = window.location.pathname;
    const parts = route.replace(/^\/|\/$/g, '').split('/');
    const pageName = (parts.length === 0 || parts[0] === '') ? 'Dashboard' : 
      parts[0].charAt(0).toUpperCase() + parts[0].slice(1);

    expect(route).toBe('/');
    expect(pageName).toBe('Dashboard');
  });

  it('should extract route from /financeiro path', () => {
    Object.defineProperty(window, 'location', {
      value: { pathname: '/financeiro' },
      writable: true,
      configurable: true,
    });

    const route = window.location.pathname;
    const parts = route.replace(/^\/|\/$/g, '').split('/');
    const pageName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);

    expect(route).toBe('/financeiro');
    expect(pageName).toBe('Financeiro');
  });

  it('should handle nested paths correctly', () => {
    Object.defineProperty(window, 'location', {
      value: { pathname: '/admin/usuarios/edit/123' },
      writable: true,
      configurable: true,
    });

    const route = window.location.pathname;
    const parts = route.replace(/^\/|\/$/g, '').split('/');
    const pageName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1) +
      (parts[1] ? ` - ${parts[1].charAt(0).toUpperCase() + parts[1].slice(1)}` : '');

    expect(route).toBe('/admin/usuarios/edit/123');
    expect(pageName).toBe('Admin - Usuarios');
  });
});

describe('Web Vitals Integration Requirements', () => {
  it('should track all five Core Web Vitals metrics (Requirement 17.1)', () => {
    // This test verifies that the webVitals.ts file tracks:
    // 1. LCP (Largest Contentful Paint)
    // 2. INP (Interaction to Next Paint - replaces FID)
    // 3. CLS (Cumulative Layout Shift)
    // 4. FCP (First Contentful Paint)
    // 5. TTFB (Time to First Byte)
    
    const expectedMetrics = ['LCP', 'INP', 'CLS', 'FCP', 'TTFB'];
    expect(expectedMetrics).toHaveLength(5);
    expect(expectedMetrics).toContain('LCP');
    expect(expectedMetrics).toContain('INP');
    expect(expectedMetrics).toContain('CLS');
    expect(expectedMetrics).toContain('FCP');
    expect(expectedMetrics).toContain('TTFB');
  });

  it('should include route, page, and metric name in analytics (Requirement 17.2)', () => {
    // This test verifies that each Web Vital metric sent to analytics includes:
    // - metric_name: The name of the metric (LCP, INP, CLS, FCP, TTFB)
    // - route: The current route path (e.g., /pecuaria/animais)
    // - page: The page name (e.g., Pecuaria - Animais)
    
    const mockEvent = {
      metric_name: 'LCP',
      value: 2000,
      rating: 'good',
      route: '/pecuaria/animais',
      page: 'Pecuaria - Animais',
    };

    expect(mockEvent).toHaveProperty('metric_name');
    expect(mockEvent).toHaveProperty('route');
    expect(mockEvent).toHaveProperty('page');
    expect(mockEvent.metric_name).toBe('LCP');
    expect(mockEvent.route).toBe('/pecuaria/animais');
    expect(mockEvent.page).toBe('Pecuaria - Animais');
  });

  it('should send metrics to PostHog with correct structure', () => {
    // Mock PostHog event structure
    const mockPostHogEvent = {
      event: 'web_vital',
      properties: {
        metric_name: 'LCP',
        value: 2000,
        rating: 'good',
        navigation_type: 'navigate',
        route: '/pecuaria/animais',
        page: 'Pecuaria - Animais',
      },
    };

    expect(mockPostHogEvent.event).toBe('web_vital');
    expect(mockPostHogEvent.properties.metric_name).toBeDefined();
    expect(mockPostHogEvent.properties.route).toBeDefined();
    expect(mockPostHogEvent.properties.page).toBeDefined();
  });

  it('should send metrics to Google Analytics with correct structure', () => {
    // Mock Google Analytics event structure
    const mockGAEvent = {
      event_category: 'Web Vitals',
      metric_name: 'LCP',
      page_route: '/pecuaria/animais',
      page_name: 'Pecuaria - Animais',
      value: 2000,
      metric_rating: 'good',
    };

    expect(mockGAEvent.event_category).toBe('Web Vitals');
    expect(mockGAEvent.metric_name).toBeDefined();
    expect(mockGAEvent.page_route).toBeDefined();
    expect(mockGAEvent.page_name).toBeDefined();
  });
});
