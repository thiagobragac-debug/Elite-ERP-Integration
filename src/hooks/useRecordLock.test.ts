import { renderHook, waitFor } from '@testing-library/react';
import { useRecordLock } from './useRecordLock';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { supabase } from '../lib/supabase';

// Mock AuthContext
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-123', email: 'test@example.com' }
  })
}));

// Mock Supabase client
vi.mock('../lib/supabase', () => {
  return {
    supabase: {
      from: vi.fn()
    }
  };
});

describe('useRecordLock hook', () => {
  let mockChain: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create a chainable builder mock
    mockChain = {
      select: vi.fn().mockImplementation(() => mockChain),
      upsert: vi.fn().mockImplementation(() => Promise.resolve({ error: null })),
      delete: vi.fn().mockImplementation(() => mockChain),
      eq: vi.fn().mockImplementation(() => mockChain),
      maybeSingle: vi.fn().mockImplementation(() => Promise.resolve({ data: null, error: null })),
      then: vi.fn().mockImplementation((cb) => {
        if (cb) cb();
        return Promise.resolve();
      })
    };

    (supabase.from as any).mockReturnValue(mockChain);
  });

  it('should acquire lock when record is free', async () => {
    mockChain.maybeSingle.mockResolvedValue({ data: null, error: null });

    const { result } = renderHook(() => useRecordLock('lotes', 'lot-abc'));

    await waitFor(() => {
      expect(result.current.isLocked).toBe(false);
      expect(result.current.lockedBy).toBe(null);
    });

    expect(supabase.from).toHaveBeenCalledWith('record_locks');
    expect(mockChain.upsert).toHaveBeenCalled();
  });

  it('should detect lock when already locked by another user', async () => {
    const inOneMinute = new Date(Date.now() + 60000).toISOString();
    mockChain.maybeSingle.mockResolvedValue({
      data: {
        table_name: 'lotes',
        record_id: 'lot-abc',
        user_id: 'other-user',
        user_name: 'other@example.com',
        expires_at: inOneMinute
      },
      error: null
    });

    const { result } = renderHook(() => useRecordLock('lotes', 'lot-abc'));

    await waitFor(() => {
      expect(result.current.isLocked).toBe(true);
      expect(result.current.lockedBy).toBe('other@example.com');
    });

    expect(mockChain.upsert).not.toHaveBeenCalled();
  });
});
