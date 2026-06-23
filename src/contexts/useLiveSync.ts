import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { queryClient } from './QueryProvider';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

export const useLiveSync = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      return;
    }

    // Listen to ALL tables in the public schema
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
        },
        (payload) => {
          // Whenever ANY table changes, invalidate queries related to reports and pagination.
          // In a highly optimized system, we would check payload.table and invalidate specific keys.
          // But invalidating 'report' globally ensures ALL screens are instantly up-to-date.

          if (import.meta.env.DEV) {
            console.log('[Live Sync] Database change detected on table:', payload.table);
          }

          // Invalidate React Query caches
          queryClient.invalidateQueries({ queryKey: ['report'] });

          // Also dispatch a custom event for screens not yet migrated to React Query
          window.dispatchEvent(new CustomEvent('live_sync_update', { detail: payload.table }));
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED' && import.meta.env.DEV) {
          console.log('[Live Sync] Connected to Supabase Realtime');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
};
