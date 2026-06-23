import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { monitoredQuery } from './supabase';

describe('monitoredQuery', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should execute query successfully and return result', async () => {
    const mockResult = { data: [{ id: 1, name: 'Test' }], error: null };
    const mockQueryFn = vi.fn().mockResolvedValue(mockResult);

    const result = await monitoredQuery(mockQueryFn, 'test-query');

    expect(result).toEqual(mockResult);
    expect(mockQueryFn).toHaveBeenCalledOnce();
  });

  it('should log warning for queries taking more than 1 second', async () => {
    const mockResult = { data: [], error: null };
    const mockQueryFn = vi.fn(async () => {
      // Simulate 1500ms delay
      await new Promise((resolve) => {
        setTimeout(resolve, 1500);
      });
      return mockResult;
    });

    const promise = monitoredQuery(mockQueryFn, 'slow-query');

    // Advance time by 1500ms
    await vi.advanceTimersByTimeAsync(1500);

    const result = await promise;

    expect(result).toEqual(mockResult);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('Slow query detected: slow-query'),
      expect.objectContaining({
        query: 'slow-query',
        threshold: '1000ms',
      })
    );
  });

  it('should not log warning for queries taking less than 1 second', async () => {
    const mockResult = { data: [], error: null };
    const mockQueryFn = vi.fn(async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, 500);
      });
      return mockResult;
    });

    const promise = monitoredQuery(mockQueryFn, 'fast-query');

    await vi.advanceTimersByTimeAsync(500);

    await promise;

    expect(console.warn).not.toHaveBeenCalled();
  });

  it('should handle query errors and rethrow them', async () => {
    const mockError = new Error('Database connection failed');
    const mockQueryFn = vi.fn().mockRejectedValue(mockError);

    await expect(monitoredQuery(mockQueryFn, 'failing-query')).rejects.toThrow(
      'Database connection failed'
    );

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Query failed: failing-query'),
      mockError
    );
  });

  it('should send metrics to PostHog in production for slow queries', async () => {
    // Mock production environment
    const originalEnv = import.meta.env.PROD;
    vi.stubEnv('PROD', true);

    const mockPostHog = {
      capture: vi.fn(),
    };
    // @ts-ignore - Mocking window.posthog
    global.window = { posthog: mockPostHog } as any;

    const mockResult = { data: [], error: null };
    const mockQueryFn = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return mockResult;
    });

    const promise = monitoredQuery(mockQueryFn, 'slow-production-query');
    await vi.advanceTimersByTimeAsync(1500);
    await promise;

    expect(mockPostHog.capture).toHaveBeenCalledWith(
      'api_slow_response',
      expect.objectContaining({
        endpoint: 'slow-production-query',
        type: 'database_query',
      })
    );

    // Restore
    vi.unstubAllEnvs();
  });

  it('should track query duration accurately', async () => {
    const mockResult = { data: [], error: null };
    const mockQueryFn = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 750));
      return mockResult;
    });

    const startTime = performance.now();
    const promise = monitoredQuery(mockQueryFn, 'timed-query');

    await vi.advanceTimersByTimeAsync(750);
    await promise;

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Duration should be approximately 750ms (with some tolerance)
    expect(duration).toBeGreaterThanOrEqual(700);
    expect(duration).toBeLessThanOrEqual(800);
  });

  it('should work with generic return types', async () => {
    interface Animal {
      id: string;
      name: string;
      species: string;
    }

    const mockAnimals: Animal[] = [
      { id: '1', name: 'Bella', species: 'Nelore' },
      { id: '2', name: 'Bob', species: 'Angus' },
    ];

    const mockQueryFn = vi.fn().mockResolvedValue(mockAnimals);

    const result = await monitoredQuery<Animal[]>(mockQueryFn, 'fetch-animals');

    expect(result).toEqual(mockAnimals);
    expect(result).toHaveLength(2);
    expect(result[0].species).toBe('Nelore');
  });

  it('should log in development for queries taking more than 500ms', async () => {
    // Mock development environment
    vi.stubEnv('DEV', true);
    vi.stubEnv('PROD', false);

    const mockResult = { data: [], error: null };
    const mockQueryFn = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 600));
      return mockResult;
    });

    const promise = monitoredQuery(mockQueryFn, 'dev-slow-query');
    await vi.advanceTimersByTimeAsync(600);
    await promise;

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('dev-slow-query: 600'));

    vi.unstubAllEnvs();
  });
});
