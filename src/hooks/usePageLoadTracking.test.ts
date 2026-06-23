import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { usePageLoadTracking } from './usePageLoadTracking';
import * as analyticsModule from '../lib/analytics';

// Mock the analytics module
vi.mock('../lib/analytics', () => ({
  analytics: {
    pageLoadTime: vi.fn(),
  },
}));

// Mock useLocation to control route changes
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useLocation: vi.fn(),
  };
});

describe('usePageLoadTracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should track page load time on mount', () => {
    // Mock location
    const mockLocation = { pathname: '/pecuaria/animal' };
    vi.mocked(useLocation).mockReturnValue(mockLocation as any);

    // Render hook
    renderHook(() => usePageLoadTracking(), {
      wrapper: BrowserRouter,
    });

    // Fast-forward timers to trigger the setTimeout
    vi.runAllTimers();

    // Verify analytics was called
    expect(analyticsModule.analytics.pageLoadTime).toHaveBeenCalledWith({
      route: '/pecuaria/animal',
      duration: expect.any(Number),
      metric: 'component_mount',
    });
  });

  it('should track page load time on route change', () => {
    // Start with initial route
    const mockLocation = { pathname: '/pecuaria/animal' };
    vi.mocked(useLocation).mockReturnValue(mockLocation as any);

    const { rerender } = renderHook(() => usePageLoadTracking(), {
      wrapper: BrowserRouter,
    });

    // Fast-forward timers
    vi.runAllTimers();
    vi.clearAllMocks();

    // Change route
    mockLocation.pathname = '/financeiro/pagar';
    rerender();

    // Fast-forward timers again
    vi.runAllTimers();

    // Verify analytics was called with new route
    expect(analyticsModule.analytics.pageLoadTime).toHaveBeenCalledWith({
      route: '/financeiro/pagar',
      duration: expect.any(Number),
      metric: 'component_mount',
    });
  });

  it('should capture duration correctly', () => {
    const mockLocation = { pathname: '/test' };
    vi.mocked(useLocation).mockReturnValue(mockLocation as any);

    renderHook(() => usePageLoadTracking(), {
      wrapper: BrowserRouter,
    });

    vi.runAllTimers();

    // Verify duration is a positive number (can't mock Date.now with fake timers)
    const callArgs = vi.mocked(analyticsModule.analytics.pageLoadTime).mock.calls[0][0];
    expect(callArgs.route).toBe('/test');
    expect(callArgs.duration).toBeGreaterThanOrEqual(0);
    expect(callArgs.metric).toBe('component_mount');
  });

  it('should handle dashboard route', () => {
    const mockLocation = { pathname: '/painel' };
    vi.mocked(useLocation).mockReturnValue(mockLocation as any);

    renderHook(() => usePageLoadTracking(), {
      wrapper: BrowserRouter,
    });

    vi.runAllTimers();

    expect(analyticsModule.analytics.pageLoadTime).toHaveBeenCalledWith({
      route: '/painel',
      duration: expect.any(Number),
      metric: 'component_mount',
    });
  });

  it('should handle nested routes', () => {
    const mockLocation = { pathname: '/pecuaria/animal/123' };
    vi.mocked(useLocation).mockReturnValue(mockLocation as any);

    renderHook(() => usePageLoadTracking(), {
      wrapper: BrowserRouter,
    });

    vi.runAllTimers();

    expect(analyticsModule.analytics.pageLoadTime).toHaveBeenCalledWith({
      route: '/pecuaria/animal/123',
      duration: expect.any(Number),
      metric: 'component_mount',
    });
  });

  it('should reset timer on each route change', () => {
    const mockLocation = { pathname: '/route1' };
    vi.mocked(useLocation).mockReturnValue(mockLocation as any);

    const { rerender } = renderHook(() => usePageLoadTracking(), {
      wrapper: BrowserRouter,
    });

    // First route
    vi.runAllTimers();
    const firstCallArgs = vi.mocked(analyticsModule.analytics.pageLoadTime).mock.calls[0][0];

    vi.clearAllMocks();

    // Change route after some time
    vi.advanceTimersByTime(500);
    mockLocation.pathname = '/route2';
    rerender();
    vi.runAllTimers();

    const secondCallArgs = vi.mocked(analyticsModule.analytics.pageLoadTime).mock.calls[0][0];

    // Both should have been called
    expect(firstCallArgs.route).toBe('/route1');
    expect(secondCallArgs.route).toBe('/route2');
    
    // Duration should be fresh for second route (not cumulative)
    expect(secondCallArgs.duration).toBeLessThan(500);
  });

  it('should cleanup timeout on unmount', () => {
    const mockLocation = { pathname: '/test' };
    vi.mocked(useLocation).mockReturnValue(mockLocation as any);

    const { unmount } = renderHook(() => usePageLoadTracking(), {
      wrapper: BrowserRouter,
    });

    // Unmount before timer fires
    unmount();

    // Fast-forward timers
    vi.runAllTimers();

    // Analytics should not be called
    expect(analyticsModule.analytics.pageLoadTime).not.toHaveBeenCalled();
  });

  it('should handle root route', () => {
    const mockLocation = { pathname: '/' };
    vi.mocked(useLocation).mockReturnValue(mockLocation as any);

    renderHook(() => usePageLoadTracking(), {
      wrapper: BrowserRouter,
    });

    vi.runAllTimers();

    expect(analyticsModule.analytics.pageLoadTime).toHaveBeenCalledWith({
      route: '/',
      duration: expect.any(Number),
      metric: 'component_mount',
    });
  });
});
