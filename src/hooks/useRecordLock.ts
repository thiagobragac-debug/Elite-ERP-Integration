import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function useRecordLock(tableName: string, recordId: string | null | undefined) {
  const { user } = useAuth();
  const [lockedBy, setLockedBy] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    if (!recordId || !tableName || !user) return;

    let heartbeatInterval: any;

    const acquireLock = async () => {
      // 1. Check if it's locked by someone else
      const { data: lockData } = await supabase
        .from('record_locks')
        .select('*')
        .eq('table_name', tableName)
        .eq('record_id', recordId)
        .maybeSingle();

      const now = new Date();
      
      if (lockData && new Date(lockData.expires_at) > now && lockData.user_id !== user.id) {
        setIsLocked(true);
        setLockedBy(lockData.user_name);
        return;
      }

      // 2. It's free or lock expired. Acquire it for 2 minutes.
      const expiresAt = new Date(now.getTime() + 2 * 60000).toISOString();
      await supabase.from('record_locks').upsert({
        table_name: tableName,
        record_id: recordId,
        user_id: user.id,
        user_name: user.email,
        expires_at: expiresAt
      });
      
      setIsLocked(false);
      setLockedBy(null);

      // 3. Heartbeat: renew lock every 1 minute
      heartbeatInterval = setInterval(async () => {
        const newExpiresAt = new Date(new Date().getTime() + 2 * 60000).toISOString();
        await supabase.from('record_locks').upsert({
          table_name: tableName,
          record_id: recordId,
          user_id: user.id,
          user_name: user.email,
          expires_at: newExpiresAt
        });
      }, 60000);
    };

    acquireLock();

    return () => {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      // Release lock when component unmounts
      supabase
        .from('record_locks')
        .delete()
        .eq('table_name', tableName)
        .eq('record_id', recordId)
        .eq('user_id', user.id)
        .then();
    };
  }, [tableName, recordId, user]);

  return { isLocked, lockedBy };
}
