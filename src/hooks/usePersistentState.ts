import { useState, useEffect } from 'react';

/**
 * A custom hook that works exactly like useState, but persists the state in sessionStorage.
 * This ensures that if the user navigates away to another page and comes back,
 * or refreshes the page, their draft data and modal open states are preserved.
 * 
 * @param key Unique key for sessionStorage
 * @param initialValue Default value if nothing is saved
 */
export function usePersistentState<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading sessionStorage key "${key}":`, error);
      return initialValue;
    }
  });

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

  return [state, setState];
}
