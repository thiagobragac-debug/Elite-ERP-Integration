import { describe, it, expect, vi, beforeEach } from 'vitest';
import posthog from 'posthog-js';
import {
  initAnalytics,
  analytics,
  identifyUser,
  resetUser,
  optOutAnalytics,
  optInAnalytics,
  hasOptedOut,
} from './analytics';

// Mock PostHog module
vi.mock('posthog-js', () => ({
  default: {
    init: vi.fn(),
    capture: vi.fn(),
    identify: vi.fn(),
    reset: vi.fn(),
    opt_out_capturing: vi.fn(),
    opt_in_capturing: vi.fn(),
    __loaded: false,
  },
}));

describe('PostHog Analytics Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variables
    import.meta.env.VITE_POSTHOG_KEY = '';
    import.meta.env.PROD = false;
    // Clear localStorage
    localStorage.clear();
    // Reset __loaded flag
    (posthog as any).__loaded = false;
  });

  describe('initAnalytics', () => {
    it('should not initialize when API key is not configured', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      import.meta.env.VITE_POSTHOG_KEY = '';
      
      initAnalytics();
      
      expect(posthog.init).not.toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });

    it('should not initialize in development mode', () => {
      import.meta.env.VITE_POSTHOG_KEY = 'phc_test_key_123';
      import.meta.env.PROD = false;
      
      initAnalytics();
      
      expect(posthog.init).not.toHaveBeenCalled();
    });

    it('should warn in production when API key is not configured', () => {
      import.meta.env.VITE_POSTHOG_KEY = '';
      import.meta.env.PROD = true;
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      initAnalytics();
      
      expect(posthog.init).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('API key not configured')
      );
      consoleWarnSpy.mockRestore();
    });

    it('should not initialize if user has opted out', () => {
      import.meta.env.VITE_POSTHOG_KEY = 'phc_test_key_123';
      import.meta.env.PROD = true;
      localStorage.setItem('analytics_opted_out', 'true');
      
      initAnalytics();
      
      expect(posthog.init).not.toHaveBeenCalled();
    });

    it('should initialize in production with correct configuration', () => {
      import.meta.env.VITE_POSTHOG_KEY = 'phc_test_key_123';
      import.meta.env.PROD = true;
      
      initAnalytics();
      
      expect(posthog.init).toHaveBeenCalledWith('phc_test_key_123', {
        api_host: 'https://app.posthog.com',
        autocapture: false,
        capture_pageview: true,
        capture_pageleave: true,
        respect_dnt: true,
        disable_session_recording: true,
        persistence: 'localStorage',
        loaded: expect.any(Function),
      });
    });
  });

  describe('analytics.animalRegistered', () => {
    it('should not capture event when PostHog is not loaded', () => {
      (posthog as any).__loaded = false;
      
      analytics.animalRegistered({ raca: 'Nelore', peso: 350 });
      
      expect(posthog.capture).not.toHaveBeenCalled();
    });

    it('should not capture event when user has opted out', () => {
      (posthog as any).__loaded = true;
      localStorage.setItem('analytics_opted_out', 'true');
      
      analytics.animalRegistered({ raca: 'Nelore', peso: 350 });
      
      expect(posthog.capture).not.toHaveBeenCalled();
    });

    it('should capture event with correct data', () => {
      (posthog as any).__loaded = true;
      
      analytics.animalRegistered({ raca: 'Nelore', peso: 350, sexo: 'Macho' });
      
      expect(posthog.capture).toHaveBeenCalledWith('animal_registered', {
        raca: 'Nelore',
        peso: 350,
        sexo: 'Macho',
      });
    });
  });

  describe('analytics.saleCompleted', () => {
    it('should not capture event when PostHog is not loaded', () => {
      (posthog as any).__loaded = false;
      
      analytics.saleCompleted({ valor: 5000, cliente: 'Fazenda XYZ' });
      
      expect(posthog.capture).not.toHaveBeenCalled();
    });

    it('should capture event with correct data', () => {
      (posthog as any).__loaded = true;
      
      analytics.saleCompleted({ valor: 5000, cliente: 'Fazenda XYZ', tipo: 'Bovino' });
      
      expect(posthog.capture).toHaveBeenCalledWith('sale_completed', {
        valor: 5000,
        cliente: 'Fazenda XYZ',
        tipo: 'Bovino',
      });
    });
  });

  describe('analytics.paymentReceived', () => {
    it('should capture event with correct data', () => {
      (posthog as any).__loaded = true;
      
      analytics.paymentReceived({ valor: 3000, metodo: 'PIX', tipo: 'Venda' });
      
      expect(posthog.capture).toHaveBeenCalledWith('payment_received', {
        valor: 3000,
        metodo: 'PIX',
        tipo: 'Venda',
      });
    });
  });

  describe('analytics.apiSlowResponse', () => {
    it('should not capture event for fast responses (<3s)', () => {
      (posthog as any).__loaded = true;
      
      analytics.apiSlowResponse({ endpoint: '/api/animais', duration: 2000 });
      
      expect(posthog.capture).not.toHaveBeenCalled();
    });

    it('should capture event for slow responses (>3s)', () => {
      (posthog as any).__loaded = true;
      
      analytics.apiSlowResponse({ 
        endpoint: '/api/animais', 
        duration: 3500,
        method: 'GET' 
      });
      
      expect(posthog.capture).toHaveBeenCalledWith('api_slow_response', {
        endpoint: '/api/animais',
        duration: 3500,
        method: 'GET',
      });
    });
  });

  describe('analytics.pageLoadTime', () => {
    it('should capture event with correct data', () => {
      (posthog as any).__loaded = true;
      
      analytics.pageLoadTime({ route: '/bovinocultura', duration: 1500, metric: 'LCP' });
      
      expect(posthog.capture).toHaveBeenCalledWith('page_load_time', {
        route: '/bovinocultura',
        duration: 1500,
        metric: 'LCP',
      });
    });
  });

  describe('identifyUser', () => {
    it('should not identify user when PostHog is not loaded', () => {
      (posthog as any).__loaded = false;
      
      identifyUser({
        id: 'user123',
        email: 'test@example.com',
        tenant_id: 'tenant456',
      });
      
      expect(posthog.identify).not.toHaveBeenCalled();
    });

    it('should not identify user when user has opted out', () => {
      (posthog as any).__loaded = true;
      localStorage.setItem('analytics_opted_out', 'true');
      
      identifyUser({
        id: 'user123',
        email: 'test@example.com',
        tenant_id: 'tenant456',
      });
      
      expect(posthog.identify).not.toHaveBeenCalled();
    });

    it('should identify user with correct data', () => {
      (posthog as any).__loaded = true;
      
      identifyUser({
        id: 'user123',
        email: 'test@example.com',
        tenant_id: 'tenant456',
      });
      
      expect(posthog.identify).toHaveBeenCalledWith('user123', {
        email: 'test@example.com',
        tenant_id: 'tenant456',
      });
    });
  });

  describe('resetUser', () => {
    it('should not reset when PostHog is not loaded', () => {
      (posthog as any).__loaded = false;
      
      resetUser();
      
      expect(posthog.reset).not.toHaveBeenCalled();
    });

    it('should reset user identity', () => {
      (posthog as any).__loaded = true;
      
      resetUser();
      
      expect(posthog.reset).toHaveBeenCalled();
    });
  });

  describe('optOutAnalytics', () => {
    it('should set localStorage opt-out flag', () => {
      optOutAnalytics();
      
      expect(localStorage.getItem('analytics_opted_out')).toBe('true');
    });

    it('should call PostHog opt_out_capturing when loaded', () => {
      (posthog as any).__loaded = true;
      
      optOutAnalytics();
      
      expect(posthog.opt_out_capturing).toHaveBeenCalled();
      expect(localStorage.getItem('analytics_opted_out')).toBe('true');
    });

    it('should not fail when PostHog is not loaded', () => {
      (posthog as any).__loaded = false;
      
      expect(() => optOutAnalytics()).not.toThrow();
      expect(localStorage.getItem('analytics_opted_out')).toBe('true');
    });
  });

  describe('optInAnalytics', () => {
    it('should remove localStorage opt-out flag', () => {
      localStorage.setItem('analytics_opted_out', 'true');
      
      optInAnalytics();
      
      expect(localStorage.getItem('analytics_opted_out')).toBeNull();
    });

    it('should call PostHog opt_in_capturing when loaded', () => {
      (posthog as any).__loaded = true;
      localStorage.setItem('analytics_opted_out', 'true');
      
      optInAnalytics();
      
      expect(posthog.opt_in_capturing).toHaveBeenCalled();
      expect(localStorage.getItem('analytics_opted_out')).toBeNull();
    });

    it('should not fail when PostHog is not loaded', () => {
      (posthog as any).__loaded = false;
      
      expect(() => optInAnalytics()).not.toThrow();
      expect(localStorage.getItem('analytics_opted_out')).toBeNull();
    });
  });

  describe('hasOptedOut', () => {
    it('should return true when user has opted out', () => {
      localStorage.setItem('analytics_opted_out', 'true');
      
      expect(hasOptedOut()).toBe(true);
    });

    it('should return false when user has not opted out', () => {
      expect(hasOptedOut()).toBe(false);
    });

    it('should return false when localStorage value is not "true"', () => {
      localStorage.setItem('analytics_opted_out', 'false');
      
      expect(hasOptedOut()).toBe(false);
    });
  });
});
