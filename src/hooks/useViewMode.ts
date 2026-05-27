import { useState, useCallback } from 'react';

/**
 * Module-level cache that persists across component unmounts/remounts within the
 * same browser session. Acts as primary store; localStorage is used as backup
 * for cross-session persistence.
 */
const viewModeCache: Record<string, 'list' | 'grid'> = {};

/**
 * Hook to persist the user's preferred view mode (list or grid).
 * @param moduleKey A unique key for the module (e.g. 'saas-admin', 'company-management')
 * @param defaultMode The default mode if none is saved (usually 'grid')
 */
export function useViewMode(moduleKey: string, defaultMode: 'list' | 'grid' = 'grid') {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => {
    // 1. Check in-memory module cache first (survives unmounts in same session)
    if (viewModeCache[moduleKey]) {
      return viewModeCache[moduleKey];
    }

    // 2. Fall back to localStorage for cross-session persistence
    try {
      const stored = localStorage.getItem(`tauze_view_mode_${moduleKey}`);
      if (stored === 'list' || stored === 'grid') {
        viewModeCache[moduleKey] = stored; // warm the in-memory cache
        return stored;
      }
    } catch (e) {
      console.warn('[useViewMode] Failed to read from localStorage:', e);
    }

    return defaultMode;
  });

  const setViewModeWithPersistence = useCallback((mode: 'list' | 'grid') => {
    // Update in-memory cache immediately
    viewModeCache[moduleKey] = mode;

    // Persist to localStorage for next session
    try {
      localStorage.setItem(`tauze_view_mode_${moduleKey}`, mode);
    } catch (e) {
      console.warn('[useViewMode] Failed to save to localStorage:', e);
    }

    // Update React state
    setViewMode(mode);
  }, [moduleKey]);

  return [viewMode, setViewModeWithPersistence] as const;
}

