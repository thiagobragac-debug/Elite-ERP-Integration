import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { resetUser } from '../lib/analytics';
import { clearSentryContext } from '../lib/sentry';

// Mock dependencies
vi.mock('../lib/analytics');
vi.mock('../lib/sentry');
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      signOut: vi.fn(() => Promise.resolve({ error: null })),
      signInWithPassword: vi.fn(),
      signInWithOAuth: vi.fn(),
      signUp: vi.fn(),
      mfa: {
        getAuthenticatorAssuranceLevel: vi.fn(() => 
          Promise.resolve({ data: { currentLevel: 'aal1' }, error: null })
        ),
      },
    },
    from: vi.fn(),
  },
}));

describe('AuthContext - Analytics Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call resetUser when logging out', async () => {
    const { supabase } = await import('../lib/supabase');
    
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Wait for initial auth state
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Call logout
    await act(async () => {
      await result.current.logout();
    });

    // Verify that resetUser was called
    expect(resetUser).toHaveBeenCalled();
    expect(clearSentryContext).toHaveBeenCalled();
    expect(supabase.auth.signOut).toHaveBeenCalled();
  });

  it('should clear user state after logout', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.logout();
    });

    // User should be null after logout
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});
