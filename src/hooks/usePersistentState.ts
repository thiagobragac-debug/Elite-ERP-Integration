import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

/**
 * A custom hook that works exactly like useState, but persists the state in sessionStorage
 * AND syncs automatically to the cloud (user_drafts) for Enterprise Auto-Save.
 * 
 * @param key Unique key for sessionStorage/Cloud Draft
 * @param initialValue Default value if nothing is saved
 */
export function usePersistentState<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const isComplex = typeof initialValue === 'object' && !Array.isArray(initialValue) && initialValue !== null;
  const isInitialMount = useRef(true);
  const skipNextCloudSave = useRef(false);

  const [state, setState] = useState<T>(() => {
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading sessionStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Local Storage Sync
  useEffect(() => {
    try {
      if (state === undefined || state === null) {
        sessionStorage.removeItem(key);
      } else {
        sessionStorage.setItem(key, JSON.stringify(state));
      }
    } catch (error) {
      console.warn(`Error setting sessionStorage key "${key}":`, error);
    }
  }, [key, state]);

  // Phase 2: Enterprise Cloud Draft - Cloud Hydration
  useEffect(() => {
    if (!isComplex) return;
    
    let isMounted = true;
    const fetchCloudDraft = async () => {
      try {
        const { data, error } = await supabase
          .from('user_drafts')
          .select('payload')
          .eq('draft_key', key)
          .maybeSingle();
          
        if (error && error.code !== 'PGRST116') {
          // PGRST116 is 0 rows returned
          console.warn('Failed to fetch cloud draft:', error);
          return;
        }

        if (data && data.payload && isMounted) {
          // If we found a cloud draft, we restore it.
          // We set the flag to skip the next immediate save to avoid looping back what we just downloaded
          skipNextCloudSave.current = true;
          setState(data.payload as T);
        }
      } catch (err) {
        console.error('Error hydrating draft:', err);
      }
    };

    fetchCloudDraft();

    return () => { isMounted = false; };
  }, [key, isComplex]);

  // Phase 2: Enterprise Cloud Draft - Auto-Save
  useEffect(() => {
    if (state === undefined || state === null) return;
    if (!isComplex) return;

    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (skipNextCloudSave.current) {
      skipNextCloudSave.current = false;
      return;
    }

    // Debounce to avoid flooding the database on every keystroke
    const timeoutId = setTimeout(async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) return; // Only save if logged in

        await supabase.from('user_drafts').upsert({
          user_id: userData.user.id,
          draft_key: key,
          payload: state,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id, draft_key' });
      } catch (error) {
        console.warn('Failed to auto-save cloud draft:', error);
      }
    }, 3000); // 3 seconds debounce for snappy cloud save

    return () => clearTimeout(timeoutId);
  }, [key, state, isComplex]);

  return [state, setState];
}
