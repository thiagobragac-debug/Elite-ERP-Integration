/**
 * Test Suite for Enhanced OfflineSyncContext
 * 
 * Tests the enhanced offline sync functionality including:
 * - IndexedDB storage with dedicated store
 * - Pending operations count tracking
 * - Manual retry/discard operations
 * - Exponential backoff (implicit through retry count)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useOfflineSync, OfflineSyncProvider } from './OfflineSyncContext';
import * as idbKeyval from 'idb-keyval';
import { supabase } from '../lib/supabase';

// Mock dependencies
vi.mock('idb-keyval', () => ({
  get: vi.fn(),
  set: vi.fn(),
  createStore: vi.fn(() => 'mockStore'),
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
  },
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      upsert: vi.fn().mockResolvedValue({ data: {}, error: null }),
      delete: vi.fn(() => ({
        match: vi.fn().mockResolvedValue({ data: {}, error: null }),
      })),
    })),
  },
}));

describe('OfflineSyncContext - Enhanced Features', () => {
  let onlineStatus = true;

  beforeEach(() => {
    vi.clearAllMocks();

    onlineStatus = true;
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      get: () => onlineStatus,
    });

    vi.mocked(idbKeyval.get).mockResolvedValue([]);
    vi.mocked(idbKeyval.set).mockResolvedValue(undefined);
  });

  describe('Pending Count Tracking', () => {
    it('should expose pendingCount in context', () => {
      const { result } = renderHook(() => useOfflineSync(), {
        wrapper: ({ children }) => <OfflineSyncProvider>{children}</OfflineSyncProvider>,
      });

      expect(result.current.pendingCount).toBe(0);
    });

    it('should track pendingCount when operations are queued', async () => {
      onlineStatus = false;

      const { result } = renderHook(() => useOfflineSync(), {
        wrapper: ({ children }) => <OfflineSyncProvider>{children}</OfflineSyncProvider>,
      });

      await act(async () => {
        await result.current.queueMutation('animais', { brinco: '123' }, 'INSERT');
      });

      await waitFor(() => {
        expect(result.current.pendingCount).toBe(1);
      });
    });
  });

  describe('Queued Operations Exposure', () => {
    it('should expose queuedOperations array', async () => {
      const mockQueue = [
        {
          id: 'test-123',
          table: 'animais',
          payload: { brinco: '123' },
          operation: 'INSERT' as const,
          timestamp: new Date().toISOString(),
          retries: 0,
        },
      ];

      vi.mocked(idbKeyval.get).mockResolvedValue(mockQueue);

      const { result } = renderHook(() => useOfflineSync(), {
        wrapper: ({ children }) => <OfflineSyncProvider>{children}</OfflineSyncProvider>,
      });

      await waitFor(() => {
        expect(result.current.queuedOperations).toHaveLength(1);
      });

      expect(result.current.queuedOperations[0].id).toBe('test-123');
      expect(result.current.queuedOperations[0].table).toBe('animais');
    });
  });

  describe('Manual Operation Management', () => {
    it('should expose retryOperation method', () => {
      const { result } = renderHook(() => useOfflineSync(), {
        wrapper: ({ children }) => <OfflineSyncProvider>{children}</OfflineSyncProvider>,
      });

      expect(typeof result.current.retryOperation).toBe('function');
    });

    it('should expose discardOperation method', () => {
      const { result } = renderHook(() => useOfflineSync(), {
        wrapper: ({ children }) => <OfflineSyncProvider>{children}</OfflineSyncProvider>,
      });

      expect(typeof result.current.discardOperation).toBe('function');
    });

    it('should discard operation and update queue', async () => {
      const mockQueue = [
        {
          id: 'test-123',
          table: 'animais',
          payload: { brinco: '123' },
          operation: 'INSERT' as const,
          timestamp: new Date().toISOString(),
          retries: 0,
        },
        {
          id: 'test-456',
          table: 'animais',
          payload: { brinco: '456' },
          operation: 'INSERT' as const,
          timestamp: new Date().toISOString(),
          retries: 0,
        },
      ];

      vi.mocked(idbKeyval.get).mockResolvedValue(mockQueue);

      const { result } = renderHook(() => useOfflineSync(), {
        wrapper: ({ children }) => <OfflineSyncProvider>{children}</OfflineSyncProvider>,
      });

      await waitFor(() => {
        expect(result.current.queuedOperations).toHaveLength(2);
      });

      await act(async () => {
        await result.current.discardOperation('test-123');
      });

      await waitFor(() => {
        expect(result.current.pendingCount).toBe(1);
      });

      expect(result.current.queuedOperations.find(op => op.id === 'test-123')).toBeUndefined();
    });

    it('should expose clearQueue method', () => {
      const { result } = renderHook(() => useOfflineSync(), {
        wrapper: ({ children }) => <OfflineSyncProvider>{children}</OfflineSyncProvider>,
      });

      expect(typeof result.current.clearQueue).toBe('function');
    });
  });

  describe('IndexedDB with Custom Store', () => {
    it('should use createStore for dedicated IndexedDB store', async () => {
      renderHook(() => useOfflineSync(), {
        wrapper: ({ children }) => <OfflineSyncProvider>{children}</OfflineSyncProvider>,
      });

      await waitFor(() => {
        expect(idbKeyval.createStore).toHaveBeenCalledWith('offline-sync-db', 'operations');
      });
    });

    it('should pass custom store to get/set operations', async () => {
      onlineStatus = false;

      const { result } = renderHook(() => useOfflineSync(), {
        wrapper: ({ children }) => <OfflineSyncProvider>{children}</OfflineSyncProvider>,
      });

      await act(async () => {
        await result.current.queueMutation('animais', { brinco: '123' }, 'INSERT');
      });

      await waitFor(() => {
        expect(idbKeyval.set).toHaveBeenCalledWith(
          'offline_mutation_queue',
          expect.any(Array),
          'mockStore'
        );
      });
    });
  });

  describe('Retry Count Tracking', () => {
    it('should initialize operations with retries: 0', async () => {
      onlineStatus = false;

      const { result } = renderHook(() => useOfflineSync(), {
        wrapper: ({ children }) => <OfflineSyncProvider>{children}</OfflineSyncProvider>,
      });

      await act(async () => {
        await result.current.queueMutation('animais', { brinco: '123' }, 'INSERT');
      });

      await waitFor(() => {
        const savedQueue = vi.mocked(idbKeyval.set).mock.calls[0]?.[1] as any[];
        expect(savedQueue[0]?.retries).toBe(0);
      });
    });

    it('should include unique id for each operation', async () => {
      onlineStatus = false;

      const { result } = renderHook(() => useOfflineSync(), {
        wrapper: ({ children }) => <OfflineSyncProvider>{children}</OfflineSyncProvider>,
      });

      await act(async () => {
        await result.current.queueMutation('animais', { brinco: '123' }, 'INSERT');
      });

      await waitFor(() => {
        const savedQueue = vi.mocked(idbKeyval.set).mock.calls[0]?.[1] as any[];
        expect(savedQueue[0]?.id).toBeDefined();
        expect(typeof savedQueue[0]?.id).toBe('string');
      });
    });
  });

  describe('Context Provider API', () => {
    it('should provide all required context methods and properties', () => {
      const { result } = renderHook(() => useOfflineSync(), {
        wrapper: ({ children }) => <OfflineSyncProvider>{children}</OfflineSyncProvider>,
      });

      expect(result.current).toHaveProperty('isOnline');
      expect(result.current).toHaveProperty('pendingCount');
      expect(result.current).toHaveProperty('queuedOperations');
      expect(result.current).toHaveProperty('queueMutation');
      expect(result.current).toHaveProperty('syncQueue');
      expect(result.current).toHaveProperty('retryOperation');
      expect(result.current).toHaveProperty('discardOperation');
      expect(result.current).toHaveProperty('clearQueue');
    });
  });
});
