import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as Sentry from '@sentry/react';
import {
  initSentry,
  setUserContext,
  setTenantContext,
  setModuleContext,
  clearSentryContext,
} from './sentry';

// Mock Sentry module
vi.mock('@sentry/react', () => ({
  init: vi.fn(),
  setUser: vi.fn(),
  setTag: vi.fn(),
  setContext: vi.fn(),
  browserTracingIntegration: vi.fn(() => 'browserTracingIntegration'),
  replayIntegration: vi.fn(() => 'replayIntegration'),
  reactRouterV6BrowserTracingIntegration: vi.fn(() => 'reactRouterIntegration'),
}));

describe('Sentry Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variables
    import.meta.env.VITE_SENTRY_DSN = undefined;
    import.meta.env.MODE = 'test';
    import.meta.env.PROD = false;
  });

  describe('initSentry', () => {
    it('should not initialize when DSN is not configured', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      initSentry();
      
      expect(Sentry.init).not.toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });

    it('should not initialize in development mode', () => {
      import.meta.env.VITE_SENTRY_DSN = 'https://test@sentry.io/123';
      import.meta.env.PROD = false;
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      initSentry();
      
      expect(Sentry.init).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Skipping initialization in development')
      );
      consoleLogSpy.mockRestore();
    });

    it('should initialize in production with correct configuration', () => {
      import.meta.env.VITE_SENTRY_DSN = 'https://test@sentry.io/123';
      import.meta.env.PROD = true;
      import.meta.env.MODE = 'production';
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      initSentry();
      
      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          dsn: 'https://test@sentry.io/123',
          environment: 'production',
          tracesSampleRate: 0.1,
          replaysSessionSampleRate: 0.1,
          replaysOnErrorSampleRate: 1.0,
        })
      );
      consoleLogSpy.mockRestore();
    });

    it('should warn in production when DSN is not configured', () => {
      import.meta.env.VITE_SENTRY_DSN = undefined;
      import.meta.env.PROD = true;
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      initSentry();
      
      expect(Sentry.init).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('DSN not configured')
      );
      consoleWarnSpy.mockRestore();
    });
  });

  describe('setUserContext', () => {
    it('should set user context with all required fields', () => {
      const user = {
        id: 'user123',
        email: 'test@example.com',
        role: 'admin',
      };
      const tenantId = 'tenant456';
      
      setUserContext(user, tenantId);
      
      expect(Sentry.setUser).toHaveBeenCalledWith({
        id: 'user123',
        email: 'test@example.com',
        role: 'admin',
        tenant_id: 'tenant456',
      });
    });

    it('should set user context without tenant_id when null', () => {
      const user = {
        id: 'user123',
        email: 'test@example.com',
        role: 'admin',
      };
      
      setUserContext(user, null);
      
      expect(Sentry.setUser).toHaveBeenCalledWith({
        id: 'user123',
        email: 'test@example.com',
        role: 'admin',
        tenant_id: undefined,
      });
    });

    it('should clear user context when user is null', () => {
      setUserContext(null, null);
      
      expect(Sentry.setUser).toHaveBeenCalledWith(null);
    });
  });

  describe('setTenantContext', () => {
    it('should set tenant context with id and name', () => {
      setTenantContext('tenant123', 'Acme Corp');
      
      expect(Sentry.setTag).toHaveBeenCalledWith('tenant_id', 'tenant123');
      expect(Sentry.setContext).toHaveBeenCalledWith('tenant', {
        id: 'tenant123',
        name: 'Acme Corp',
      });
    });

    it('should set tenant context with id only', () => {
      setTenantContext('tenant123');
      
      expect(Sentry.setTag).toHaveBeenCalledWith('tenant_id', 'tenant123');
      expect(Sentry.setContext).toHaveBeenCalledWith('tenant', {
        id: 'tenant123',
        name: 'Unknown',
      });
    });

    it('should clear tenant context when tenantId is null', () => {
      setTenantContext(null);
      
      expect(Sentry.setTag).toHaveBeenCalledWith('tenant_id', 'none');
      expect(Sentry.setContext).toHaveBeenCalledWith('tenant', null);
    });
  });

  describe('setModuleContext', () => {
    it('should set module and page context', () => {
      setModuleContext('Bovinocultura', 'AnimalManagement');
      
      expect(Sentry.setTag).toHaveBeenCalledWith('module', 'Bovinocultura');
      expect(Sentry.setTag).toHaveBeenCalledWith('page', 'AnimalManagement');
      expect(Sentry.setContext).toHaveBeenCalledWith('navigation', {
        module: 'Bovinocultura',
        page: 'AnimalManagement',
      });
    });

    it('should set module context without page', () => {
      setModuleContext('Financeiro');
      
      expect(Sentry.setTag).toHaveBeenCalledWith('module', 'Financeiro');
      expect(Sentry.setTag).not.toHaveBeenCalledWith('page', expect.anything());
    });
  });

  describe('clearSentryContext', () => {
    it('should clear all Sentry contexts', () => {
      clearSentryContext();
      
      expect(Sentry.setUser).toHaveBeenCalledWith(null);
      expect(Sentry.setTag).toHaveBeenCalledWith('tenant_id', 'none');
      expect(Sentry.setTag).toHaveBeenCalledWith('module', 'none');
      expect(Sentry.setTag).toHaveBeenCalledWith('page', 'none');
      expect(Sentry.setContext).toHaveBeenCalledWith('tenant', null);
      expect(Sentry.setContext).toHaveBeenCalledWith('navigation', null);
    });
  });

  describe('Sensitive Data Filtering', () => {
    it('should filter password fields from event data', () => {
      import.meta.env.VITE_SENTRY_DSN = 'https://test@sentry.io/123';
      import.meta.env.PROD = true;
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      initSentry();
      
      const initCall = (Sentry.init as any).mock.calls[0][0];
      const beforeSend = initCall.beforeSend;
      
      const event = {
        request: {
          data: {
            username: 'testuser',
            password: 'secret123',
            email: 'test@example.com',
          },
        },
      };
      
      const filtered = beforeSend(event, {});
      
      expect(filtered.request.data.password).toBe('[FILTERED]');
      expect(filtered.request.data.username).toBe('testuser');
      expect(filtered.request.data.email).toBe('test@example.com');
      
      consoleLogSpy.mockRestore();
    });

    it('should filter token fields from event data', () => {
      import.meta.env.VITE_SENTRY_DSN = 'https://test@sentry.io/123';
      import.meta.env.PROD = true;
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      initSentry();
      
      const initCall = (Sentry.init as any).mock.calls[0][0];
      const beforeSend = initCall.beforeSend;
      
      const event = {
        request: {
          data: {
            user_id: '123',
            access_token: 'abc123',
            api_key: 'secret_key',
          },
        },
      };
      
      const filtered = beforeSend(event, {});
      
      expect(filtered.request.data.access_token).toBe('[FILTERED]');
      expect(filtered.request.data.api_key).toBe('[FILTERED]');
      expect(filtered.request.data.user_id).toBe('123');
      
      consoleLogSpy.mockRestore();
    });

    it('should filter sensitive headers', () => {
      import.meta.env.VITE_SENTRY_DSN = 'https://test@sentry.io/123';
      import.meta.env.PROD = true;
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      initSentry();
      
      const initCall = (Sentry.init as any).mock.calls[0][0];
      const beforeSend = initCall.beforeSend;
      
      const event = {
        request: {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer secret_token',
            'Cookie': 'session=abc123',
          },
        },
      };
      
      const filtered = beforeSend(event, {});
      
      expect(filtered.request.headers.Authorization).toBeUndefined();
      expect(filtered.request.headers.Cookie).toBeUndefined();
      expect(filtered.request.headers['Content-Type']).toBe('application/json');
      
      consoleLogSpy.mockRestore();
    });

    it('should filter nested sensitive data', () => {
      import.meta.env.VITE_SENTRY_DSN = 'https://test@sentry.io/123';
      import.meta.env.PROD = true;
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      initSentry();
      
      const initCall = (Sentry.init as any).mock.calls[0][0];
      const beforeSend = initCall.beforeSend;
      
      const event = {
        extra: {
          user: {
            name: 'John Doe',
            credentials: {
              password: 'secret',
              api_key: 'key123',
            },
          },
        },
      };
      
      const filtered = beforeSend(event, {});
      
      expect(filtered.extra.user.name).toBe('John Doe');
      expect(filtered.extra.user.credentials.password).toBe('[FILTERED]');
      expect(filtered.extra.user.credentials.api_key).toBe('[FILTERED]');
      
      consoleLogSpy.mockRestore();
    });

    it('should filter sensitive data from breadcrumbs', () => {
      import.meta.env.VITE_SENTRY_DSN = 'https://test@sentry.io/123';
      import.meta.env.PROD = true;
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      initSentry();
      
      const initCall = (Sentry.init as any).mock.calls[0][0];
      const beforeSend = initCall.beforeSend;
      
      const event = {
        breadcrumbs: [
          {
            message: 'User login',
            data: {
              username: 'testuser',
              password: 'secret',
            },
          },
        ],
      };
      
      const filtered = beforeSend(event, {});
      
      expect(filtered.breadcrumbs[0].data.username).toBe('testuser');
      expect(filtered.breadcrumbs[0].data.password).toBe('[FILTERED]');
      
      consoleLogSpy.mockRestore();
    });

    it('should add error_type tags based on error message', () => {
      import.meta.env.VITE_SENTRY_DSN = 'https://test@sentry.io/123';
      import.meta.env.PROD = true;
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      initSentry();
      
      const initCall = (Sentry.init as any).mock.calls[0][0];
      const beforeSend = initCall.beforeSend;
      
      const networkError = new Error('fetch failed: network error');
      const event = { tags: {} };
      
      const filtered = beforeSend(event, { originalException: networkError });
      
      expect(filtered.tags.error_type).toBe('network');
      
      consoleLogSpy.mockRestore();
    });

    it('should tag authentication errors', () => {
      import.meta.env.VITE_SENTRY_DSN = 'https://test@sentry.io/123';
      import.meta.env.PROD = true;
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      initSentry();
      
      const initCall = (Sentry.init as any).mock.calls[0][0];
      const beforeSend = initCall.beforeSend;
      
      const authError = new Error('unauthorized access');
      const event = { tags: {} };
      
      const filtered = beforeSend(event, { originalException: authError });
      
      expect(filtered.tags.error_type).toBe('authentication');
      
      consoleLogSpy.mockRestore();
    });
  });
});
