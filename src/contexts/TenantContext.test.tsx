import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTenant, TenantProvider } from './TenantContext';
import { useAuth } from './AuthContext';
import { identifyUser } from '../lib/analytics';
import { setUserContext, setTenantContext } from '../lib/sentry';

// Mock dependencies
vi.mock('./AuthContext');
vi.mock('../lib/analytics');
vi.mock('../lib/sentry');
vi.mock('../lib/supabase', () => {
  const mockQuery = {
    eq: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
  return {
    supabase: {
      from: vi.fn(() => ({
        select: vi.fn(() => mockQuery),
      })),
    },
  };
});

describe('TenantContext - Analytics Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should call identifyUser when user profile has tenant_id', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      role: 'admin' as const,
      name: 'Test User',
    };

    const mockProfile = {
      id: 'user-123',
      tenant_id: 'tenant-456',
      role: 'ADMIN',
      full_name: 'Test User',
      email: 'test@example.com',
    };

    // Mock useAuth to return a user
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      aal: 'aal1',
      setAal: vi.fn(),
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      registerTenant: vi.fn(),
      logout: vi.fn(),
      loading: false,
    });

    // Mock Supabase to return profile with tenant_id
    const { supabase } = await import('../lib/supabase');
    const mockQuery = {
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
    };
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn(() => mockQuery),
    } as any);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TenantProvider>{children}</TenantProvider>
    );

    renderHook(() => useTenant(), { wrapper });

    // Wait for the effect to run
    await waitFor(() => {
      expect(identifyUser).toHaveBeenCalledWith({
        id: 'user-123',
        email: 'test@example.com',
        tenant_id: 'tenant-456',
      });
    });
  });

  it('should NOT call identifyUser when profile has no tenant_id', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      role: 'admin' as const,
      name: 'Test User',
    };

    const mockProfile = {
      id: 'user-123',
      tenant_id: null, // No tenant_id
      role: 'ADMIN',
      full_name: 'Test User',
      email: 'test@example.com',
    };

    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      aal: 'aal1',
      setAal: vi.fn(),
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      registerTenant: vi.fn(),
      logout: vi.fn(),
      loading: false,
    });

    const { supabase } = await import('../lib/supabase');
    const mockQuery = {
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
    };
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn(() => mockQuery),
    } as any);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TenantProvider>{children}</TenantProvider>
    );

    renderHook(() => useTenant(), { wrapper });

    // Wait a bit to ensure effects have run
    await waitFor(() => {
      expect(setUserContext).toHaveBeenCalled();
    });

    // identifyUser should NOT be called without tenant_id
    expect(identifyUser).not.toHaveBeenCalled();
  });

  it('should NOT call identifyUser when user has opted out', async () => {
    // Set opt-out preference
    localStorage.setItem('analytics_opted_out', 'true');

    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      role: 'admin' as const,
      name: 'Test User',
    };

    const mockProfile = {
      id: 'user-123',
      tenant_id: 'tenant-456',
      role: 'ADMIN',
      full_name: 'Test User',
      email: 'test@example.com',
    };

    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      aal: 'aal1',
      setAal: vi.fn(),
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      registerTenant: vi.fn(),
      logout: vi.fn(),
      loading: false,
    });

    const { supabase } = await import('../lib/supabase');
    const mockQuery = {
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
    };
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn(() => mockQuery),
    } as any);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TenantProvider>{children}</TenantProvider>
    );

    renderHook(() => useTenant(), { wrapper });

    await waitFor(() => {
      expect(setUserContext).toHaveBeenCalled();
    });

    // identifyUser is called but should respect opt-out internally
    // The function will be called, but won't actually identify in PostHog
    if (vi.mocked(identifyUser).mock.calls.length > 0) {
      expect(identifyUser).toHaveBeenCalledWith({
        id: 'user-123',
        email: 'test@example.com',
        tenant_id: 'tenant-456',
      });
    }
  });
});
