/**
 * Test Suite for useOfflineSync Hook
 *
 * This test suite covers the offline-first functionality provided by the
 * OfflineSyncProvider and useOfflineSync hook. It tests:
 *
 * - Online/offline state detection
 * - Mutation queuing when offline
 * - Direct execution when online
 * - Auto-sync when connection is restored
 * - Error handling during sync operations
 * - IndexedDB persistence
 *
 * Coverage Target: 60%+ of critical business logic
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useOfflineSync, OfflineSyncProvider } from '../contexts/OfflineSyncContext';
import * as idbKeyval from 'idb-keyval';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

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
      upsert: vi.fn(),
      delete: vi.fn(() => ({
        match: vi.fn(),
      })),
    })),
  },
}));

describe('useOfflineSync Hook', () => {
  // Mock navigator.onLine
  let onlineStatus = true;

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset online status
    onlineStatus = true;
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      get: () => onlineStatus,
    });

    // Mock idb-keyval to return empty queue by default
    vi.mocked(idbKeyval.get).mockResolvedValue([]);
    vi.mocked(idbKeyval.set).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with online status from navigator.onLine', () => {
      onlineStatus = true;

      const { result } = renderHook(() => useOfflineSync(), {
        wrapper: ({ children }) => <OfflineSyncProvider>{children}</OfflineSyncProvider>,
      });

      expect(result.current.isOnline).toBe(true);
    });

    it('should initialize with offline status when navigator.onLine is false', () => {
      onlineStatus = false;

      const { result } = renderHook(() => useOfflineSync(), {
        wrapper: ({ children }) => <OfflineSyncProvider>{children}</OfflineSyncProvider>,
      });

      expect(result.current.isOnline).toBe(false);
    });

    it('should attempt initial sync on mount if there are pending items', async () => {
      const mockQueue = [
        {
          table: 'animais',
          payload: { id: '1', brinco: '12345' },
          operation: 'INSERT',
          timestamp: new Date().toISOString(),
        },
      ];

      vi.mocked(idbKeyval.get).mockResolvedValue(mockQueue);
      const mockUpsert = vi.fn().mockResolvedValue({ data: {}, error: null });
      vi.mocked(supabase.from).mockReturnValue({
        upsert: mockUpsert,
      } as any);

      renderHook(() => useOfflineSync(), {
        wrapper: ({ children }) => <OfflineSyncProvider>{children}</OfflineSyncProvider>,
      });

      // Wait for initial sync to complete
      await waitFor(() => {
        expect(idbKeyval.get).toHaveBeenCalledWith('offline_mutation_queue');
      });

      await waitFor(() => {
        expect(mockUpsert).toHaveBeenCalledWith({ id: '1', brinco: '12345' });
      });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Sincronização offline concluída!', {
          id: 'offline-sync',
        });
      });
    });
  });

  describe('Online/Offline Event Listeners', () => {
    it('should update isOnline to false when offline event fires', async () => {
      const { result } = renderHook(() => useOfflineSync(), {
        wrapper: ({ children }) => <OfflineSyncProvider>{children}</OfflineSyncProvider>,
      });

      expect(result.current.isOnline).toBe(true);

      // Simulate going offline
      act(() => {
        onlineStatus = false;
        window.dispatchEvent(new Event('offline'));
      });

      await waitFor(() => {
        expect(result.current.isOnline).toBe(false);
      });

      expect(toast.error).toHaveBeenCalledWith(
        'Você está offline. O sistema entrou em modo agritech.',
        { duration: 5000 }
      );
    });

    it('should update isOnline to true when online event fires', async () => {
      onlineStatus = false;

      const { result } = renderHook(() => useOfflineSync(), {
        wrapper: ({ children }) => <OfflineSyncProvider>{children}</OfflineSyncProvider>,
      });

      expect(result.current.isOnline).toBe(false);

      // Mock empty queue for sync
      vi.mocked(idbKeyval.get).mockResolvedValue([]);

      // Simulate coming back online
      act(() => {
        onlineStatus = true;
        window.dispatchEvent(new Event('online'));
      });

      await waitFor(() => {
        expect(result.current.isOnline).toBe(true);
      });

      expect(toast.success).toHaveBeenCalledWith('Conexão restabelecida. Sincronizando dados...', {
        duration: 4000,
      });
    });

    it('should trigger sync when coming back online', async () => {
      onlineStatus = false;

      const mockQueue = [
        {
          table: 'animais',
          payload: { id: '1', brinco: '12345' },
          operation: 'INSERT',
          timestamp: new Date().toISOString(),
        },
      ];

      vi.mocked(idbKeyval.get).mockResolvedValue(mockQueue);
      const mockUpsert = vi.fn().mockResolvedValue({ data: {}, error: null });
      vi.mocked(supabase.from).mockReturnValue({
        upsert: mockUpsert,
      } as any);

      renderHook(() => useOfflineSync(), {
        wrapper: ({ children }) => <OfflineSyncProvider>{children}</OfflineSyncProvider>,
      });

      // Simulate coming back online
      act(() => {
        onlineStatus = true;
        window.dispatchEvent(new Event('online'));
      });

      // Wait for sync to complete
      await waitFor(() => {
        expect(mockUpsert).toHaveBeenCalledWith({ id: '1', brinco: '12345' });
      });

      await waitFor(() => {
        expect(idbKeyval.set).toHaveBeenCalledWith('offline_mutation_queue', []);
      });
    });
  });

  describe('queueMutation - Online Behavior', () => {
    it('should execute INSERT directly when online', async () => {
      const mockUpsert = vi.fn().mockResolvedValue({ data: {}, error: null });
      vi.mocked(supabase.from).mockReturnValue({
        upsert: mockUpsert,
      } as any);

      const { result } = renderHook(() => useOfflineSync(), {
        wrapper: ({ children }) => <OfflineSyncProvider>{children}</OfflineSyncProvider>,
      });

      await act(async () => {
        await result.current.queueMutation('animais', { brinco: '12345' }, 'INSERT');
      });

      expect(supabase.from).toHaveBeenCalledWith('animais');
      expect(mockUpsert).toHaveBeenCalledWith({ brinco: '12345' });
      expect(idbKeyval.set).not.toHaveBeenCalled();
    });

    it('should execute UPDATE directly when online', async () => {
      const mockUpsert = vi.fn().mockResolvedValue({ data: {}, error: null });
      vi.mocked(supabase.from).mockReturnValue({
        upsert: mockUpsert,
      } as any);

      const { result } = renderHook(() => useOfflineSync(), {
        wrapper: ({ children }) => <OfflineSyncProvider>{children}</OfflineSyncProvider>,
      });

      await act(async () => {
        await result.current.queueMutation('animais', { id: '1', peso: 450 }, 'UPDATE');
      });

      expect(supabase.from).toHaveBeenCalledWith('animais');
      expect(mockUpsert).toHaveBeenCalledWith({ id: '1', peso: 450 });
      expect(idbKeyval.set).not.toHaveBeenCalled();
    });

    it('should execute DELETE directly when online', async () => {
      const mockMatch = vi.fn().mockResolvedValue({ data: {}, error: null });
      const mockDelete = vi.fn().mockReturnValue({ match: mockMatch });
      vi.mocked(supabase.from).mockReturnValue({
        delete: mockDelete,
      } as any);

      const { result } = renderHook(() => useOfflineSync(), {
        wrapper: ({ children }) => <OfflineSyncProvider>{children}</OfflineSyncProvider>,
      });

      await act(async () => {
        await result.current.queueMutation('animais', { id: '1' }, 'DELETE');
      });

      expect(supabase.from).toHaveBeenCalledWith('animais');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockMatch).toHaveBeenCalledWith({ id: '1' });
      expect(idbKeyval.set).not.toHaveBeenCalled();
    });
  });

  describe('queueMutation - Offline Behavior', () => {
    it('should queue INSERT operation to IndexedDB when offline', async () => {
      onlineStatus = false;

      const { result } = renderHook(() => useOfflineSync(), {
        wrapper: ({ children }) => <OfflineSyncProvider>{children}</OfflineSyncProvider>,
      });

      await act(async () => {
        await result.current.queueMutation('animais', { brinco: '12345' }, 'INSERT');
      });

      expect(idbKeyval.get).toHaveBeenCalledWith('offline_mutation_queue');
      expect(idbKeyval.set).toHaveBeenCalledWith(
        'offline_mutation_queue',
        expect.arrayContaining([
          expect.objectContaining({
            table: 'animais',
            payload: { brinco: '12345' },
            operation: 'INSERT',
            timestamp: expect.any(String),
          }),
        ])
      );
      expect(toast.success).toHaveBeenCalledWith(
        'Ação salva offline. Será sincronizada assim que a rede voltar.'
      );
    });

    it('should queue UPDATE operation to IndexedDB when offline', async () => {
      onlineStatus = false;

      const { result } = renderHook(() => useOfflineSync(), {
        wrapper: ({ children }) => <OfflineSyncProvider>{children}</OfflineSyncProvider>,
      });

      await act(async () => {
        await result.current.queueMutation('animais', { id: '1', peso: 450 }, 'UPDATE');
      });

      expect(idbKeyval.set).toHaveBeenCalledWith(
        'offline_mutation_queue',
        expect.arrayContaining([
          expect.objectContaining({
            table: 'animais',
            payload: { id: '1', peso: 450 },
            operation: 'UPDATE',
          }),
        ])
      );
    });

    it('should queue DELETE operation to IndexedDB when offline', async () => {
      onlineStatus = false;

      const { result } = renderHook(() => useOfflineSync(), {
        wrapper: ({ children }) => <OfflineSyncProvider>{children}</OfflineSyncProvider>,
      });

      await act(async () => {
        await result.current.queueMutation('animais', { id: '1' }, 'DELETE');
      });

      expect(idbKeyval.set).toHaveBeenCalledWith(
        'offline_mutation_queue',
        expect.arrayContaining([
          expect.objectContaining({
            table: 'animais',
            payload: { id: '1' },
            operation: 'DELETE',
          }),
        ])
      );
    });

    it('should append to existing queue when multiple operations are queued', async () => {
      onlineStatus = false;

      const existingQueue = [
        {
          table: 'animais',
          payload: { brinco: '11111' },
          operation: 'INSERT' as const,
          timestamp: new Date().toISOString(),
        },
      ];

      vi.mocked(idbKeyval.get).mockResolvedValue(existingQueue);

      const { result } = renderHook(() => useOfflineSync(), {
        wrapper: ({ children }) => <OfflineSyncProvider>{children}</OfflineSyncProvider>,
      });

      await act(async () => {
        await result.current.queueMutation('animais', { brinco: '22222' }, 'INSERT');
      });

      expect(idbKeyval.set).toHaveBeenCalledWith(
        'offline_mutation_queue',
        expect.arrayContaining([
          existingQueue[0],
          expect.objectContaining({
            table: 'animais',
            payload: { brinco: '22222' },
            operation: 'INSERT',
          }),
        ])
      );
    });
  });

  describe('Sync Queue - Success Scenarios', () => {
    it('should sync INSERT operations from queue', async () => {
      const mockQueue = [
        {
          table: 'animais',
          payload: { brinco: '12345' },
          operation: 'INSERT' as const,
          timestamp: new Date().toISOString(),
        },
      ];

      vi.mocked(idbKeyval.get).mockResolvedValue(mockQueue);
      const mockUpsert = vi.fn().mockResolvedValue({ data: {}, error: null });
      vi.mocked(supabase.from).mockReturnValue({
        upsert: mockUpsert,
      } as any);

      renderHook(() => useOfflineSync(), {
        wrapper: ({ children }) => <OfflineSyncProvider>{children}</OfflineSyncProvider>,
      });

      await waitFor(() => {
        expect(mockUpsert).toHaveBeenCalledWith({ brinco: '12345' });
      });

      await waitFor(() => {
        expect(idbKeyval.set).toHaveBeenCalledWith('offline_mutation_queue', []);
      });
    });

    it('should sync UPDATE operations from queue', async () => {
      const mockQueue = [
        {
          table: 'animais',
          payload: { id: '1', peso: 450 },
          operation: 'UPDATE' as const,
          timestamp: new Date().toISOString(),
        },
      ];

      vi.mocked(idbKeyval.get).mockResolvedValue(mockQueue);
      const mockUpsert = vi.fn().mockResolvedValue({ data: {}, error: null });
      vi.mocked(supabase.from).mockReturnValue({
        upsert: mockUpsert,
      } as any);

      renderHook(() => useOfflineSync(), {
        wrapper: ({ children }) => <OfflineSyncProvider>{children}</OfflineSyncProvider>,
      });

      await waitFor(() => {
        expect(mockUpsert).toHaveBeenCalledWith({ id: '1', peso: 450 });
      });
    });

    it('should sync DELETE operations from queue', async () => {
      const mockQueue = [
        {
          table: 'animais',
          payload: { id: '1' },
          operation: 'DELETE' as const,
          timestamp: new Date().toISOString(),
        },
      ];

      vi.mocked(idbKeyval.get).mockResolvedValue(mockQueue);
      const mockMatch = vi.fn().mockResolvedValue({ data: {}, error: null });
      const mockDelete = vi.fn().mockReturnValue({ match: mockMatch });
      vi.mocked(supabase.from).mockReturnValue({
        delete: mockDelete,
      } as any);

      renderHook(() => useOfflineSync(), {
        wrapper: ({ children }) => <OfflineSyncProvider>{children}</OfflineSyncProvider>,
      });

      await waitFor(() => {
        expect(mockDelete).toHaveBeenCalled();
        expect(mockMatch).toHaveBeenCalledWith({ id: '1' });
      });
    });

    it('should sync multiple operations from queue in order', async () => {
      const mockQueue = [
        {
          table: 'animais',
          payload: { brinco: '11111' },
          operation: 'INSERT' as const,
          timestamp: new Date().toISOString(),
        },
        {
          table: 'animais',
          payload: { id: '1', peso: 450 },
          operation: 'UPDATE' as const,
          timestamp: new Date().toISOString(),
        },
        {
          table: 'abastecimentos',
          payload: { id: '2' },
          operation: 'DELETE' as const,
          timestamp: new Date().toISOString(),
        },
      ];

      vi.mocked(idbKeyval.get).mockResolvedValue(mockQueue);

      const mockUpsert = vi.fn().mockResolvedValue({ data: {}, error: null });
      const mockMatch = vi.fn().mockResolvedValue({ data: {}, error: null });
      const mockDelete = vi.fn().mockReturnValue({ match: mockMatch });

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'abastecimentos') {
          return { delete: mockDelete } as any;
        }
        return { upsert: mockUpsert } as any;
      });

      renderHook(() => useOfflineSync(), {
        wrapper: ({ children }) => <OfflineSyncProvider>{children}</OfflineSyncProvider>,
      });

      await waitFor(() => {
        expect(mockUpsert).toHaveBeenCalledTimes(2);
        expect(mockUpsert).toHaveBeenNthCalledWith(1, { brinco: '11111' });
        expect(mockUpsert).toHaveBeenNthCalledWith(2, { id: '1', peso: 450 });
        expect(mockDelete).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(idbKeyval.set).toHaveBeenCalledWith('offline_mutation_queue', []);
      });
    });

    it('should not attempt sync if queue is empty', async () => {
      vi.mocked(idbKeyval.get).mockResolvedValue([]);

      renderHook(() => useOfflineSync(), {
        wrapper: ({ children }) => <OfflineSyncProvider>{children}</OfflineSyncProvider>,
      });

      await waitFor(() => {
        expect(idbKeyval.get).toHaveBeenCalledWith('offline_mutation_queue');
      });

      // Should not call toast.loading or supabase operations
      expect(toast.loading).not.toHaveBeenCalled();
      expect(supabase.from).not.toHaveBeenCalled();
    });
  });

  describe('Sync Queue - Error Handling', () => {
    it('should handle sync errors gracefully', async () => {
      const mockQueue = [
        {
          table: 'animais',
          payload: { brinco: '12345' },
          operation: 'INSERT' as const,
          timestamp: new Date().toISOString(),
        },
      ];

      vi.mocked(idbKeyval.get).mockResolvedValue(mockQueue);
      const mockUpsert = vi.fn().mockRejectedValue(new Error('Network error'));
      vi.mocked(supabase.from).mockReturnValue({
        upsert: mockUpsert,
      } as any);

      // Mock console.error to avoid test output pollution
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      renderHook(() => useOfflineSync(), {
        wrapper: ({ children }) => <OfflineSyncProvider>{children}</OfflineSyncProvider>,
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Erro ao sincronizar dados offline. Tentaremos novamente depois.',
          { id: 'offline-sync' }
        );
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to sync offline data',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should not clear queue if sync fails', async () => {
      const mockQueue = [
        {
          table: 'animais',
          payload: { brinco: '12345' },
          operation: 'INSERT' as const,
          timestamp: new Date().toISOString(),
        },
      ];

      vi.mocked(idbKeyval.get).mockResolvedValue(mockQueue);
      const mockUpsert = vi.fn().mockRejectedValue(new Error('Network error'));
      vi.mocked(supabase.from).mockReturnValue({
        upsert: mockUpsert,
      } as any);

      vi.spyOn(console, 'error').mockImplementation(() => {});

      renderHook(() => useOfflineSync(), {
        wrapper: ({ children }) => <OfflineSyncProvider>{children}</OfflineSyncProvider>,
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });

      // Verify queue was NOT cleared
      expect(idbKeyval.set).not.toHaveBeenCalledWith('offline_mutation_queue', []);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null queue from IndexedDB', async () => {
      vi.mocked(idbKeyval.get).mockResolvedValue(null);

      const mockUpsert = vi.fn().mockResolvedValue({ data: {}, error: null });
      vi.mocked(supabase.from).mockReturnValue({
        upsert: mockUpsert,
      } as any);

      const { result } = renderHook(() => useOfflineSync(), {
        wrapper: ({ children }) => <OfflineSyncProvider>{children}</OfflineSyncProvider>,
      });

      // Should not throw error
      await act(async () => {
        await result.current.queueMutation('animais', { brinco: '12345' }, 'INSERT');
      });

      expect(result.current.isOnline).toBe(true);
      expect(mockUpsert).toHaveBeenCalledWith({ brinco: '12345' });
    });

    it('should handle undefined queue from IndexedDB', async () => {
      vi.mocked(idbKeyval.get).mockResolvedValue(undefined);

      onlineStatus = false;

      const { result } = renderHook(() => useOfflineSync(), {
        wrapper: ({ children }) => <OfflineSyncProvider>{children}</OfflineSyncProvider>,
      });

      await act(async () => {
        await result.current.queueMutation('animais', { brinco: '12345' }, 'INSERT');
      });

      // Should create new queue
      expect(idbKeyval.set).toHaveBeenCalledWith(
        'offline_mutation_queue',
        expect.arrayContaining([
          expect.objectContaining({
            table: 'animais',
            payload: { brinco: '12345' },
            operation: 'INSERT',
          }),
        ])
      );
    });

    it('should handle default operation parameter (UPSERT)', async () => {
      const mockUpsert = vi.fn().mockResolvedValue({ data: {}, error: null });
      vi.mocked(supabase.from).mockReturnValue({
        upsert: mockUpsert,
      } as any);

      const { result } = renderHook(() => useOfflineSync(), {
        wrapper: ({ children }) => <OfflineSyncProvider>{children}</OfflineSyncProvider>,
      });

      // Call without operation parameter
      await act(async () => {
        await result.current.queueMutation('animais', { brinco: '12345' });
      });

      expect(mockUpsert).toHaveBeenCalledWith({ brinco: '12345' });
    });
  });

  describe('Cleanup', () => {
    it('should remove event listeners on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useOfflineSync(), {
        wrapper: ({ children }) => <OfflineSyncProvider>{children}</OfflineSyncProvider>,
      });

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });
  });
});
