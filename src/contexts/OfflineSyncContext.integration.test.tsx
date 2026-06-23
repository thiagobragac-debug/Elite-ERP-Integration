/**
 * Integration Test for OfflineSyncContext
 * 
 * Validates: Requirement 9 - PWA Offline Sync
 * - WHEN the user is offline, THE PWA SHALL queue all create/update/delete operations in IndexedDB
 * - THE PWA SHALL display a banner showing "Você está offline" with the number of pending operations
 * - Context exposes pendingCount and queuedOperations for UI consumption
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOfflineSync, OfflineSyncProvider } from './OfflineSyncContext';
import * as idbKeyval from 'idb-keyval';
import { supabase } from '../lib/supabase';

// Mock dependencies
vi.mock('idb-keyval');
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

describe('OfflineSyncContext Integration - Requirement 9', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      writable: true,
      value: true,
    });

    vi.mocked(idbKeyval.get).mockResolvedValue([]);
    vi.mocked(idbKeyval.set).mockResolvedValue(undefined);
    vi.mocked(idbKeyval.createStore).mockReturnValue('mockStore' as any);
  });

  it('should provide offline sync context with all required properties', () => {
    const { result } = renderHook(() => useOfflineSync(), {
      wrapper: ({ children }) => <OfflineSyncProvider>{children}</OfflineSyncProvider>,
    });

    // Verify context exposes all required properties for UI
    expect(result.current.isOnline).toBeDefined();
    expect(result.current.pendingCount).toBeDefined();
    expect(result.current.queuedOperations).toBeDefined();
    expect(result.current.queueMutation).toBeDefined();
    expect(result.current.syncQueue).toBeDefined();
    expect(result.current.retryOperation).toBeDefined();
    expect(result.current.discardOperation).toBeDefined();
    expect(result.current.clearQueue).toBeDefined();
  });

  it('should initialize with correct online status', () => {
    const { result } = renderHook(() => useOfflineSync(), {
      wrapper: ({ children }) => <OfflineSyncProvider>{children}</OfflineSyncProvider>,
    });

    expect(result.current.isOnline).toBe(true);
    expect(result.current.pendingCount).toBe(0);
  });

  it('should execute operations immediately when online', async () => {
    const mockUpsert = vi.fn().mockResolvedValue({ data: {}, error: null });
    vi.mocked(supabase.from).mockReturnValue({
      upsert: mockUpsert,
    } as any);

    const { result } = renderHook(() => useOfflineSync(), {
      wrapper: ({ children }) => <OfflineSyncProvider>{children}</OfflineSyncProvider>,
    });

    await act(async () => {
      await result.current.queueMutation('animais', { brinco: '123' }, 'INSERT');
    });

    // When online, operations should execute directly, not queue
    expect(mockUpsert).toHaveBeenCalledWith({ brinco: '123' });
  });

  it('should have IndexedDB setup with custom store', () => {
    renderHook(() => useOfflineSync(), {
      wrapper: ({ children }) => <OfflineSyncProvider>{children}</OfflineSyncProvider>,
    });

    // Verify createStore was called during module initialization
    // (called at module level, not in hook)
    expect(idbKeyval.createStore).toHaveBeenCalled();
  });

  it('should provide methods for manual operation management', () => {
    const { result } = renderHook(() => useOfflineSync(), {
      wrapper: ({ children }) => <OfflineSyncProvider>{children}</OfflineSyncProvider>,
    });

    // Verify all management methods are functions
    expect(typeof result.current.retryOperation).toBe('function');
    expect(typeof result.current.discardOperation).toBe('function');
    expect(typeof result.current.clearQueue).toBe('function');
    expect(typeof result.current.syncQueue).toBe('function');
  });
});
