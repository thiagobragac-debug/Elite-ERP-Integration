import { useState, useEffect } from 'react';

/**
 * Hook to persist the user's preferred view mode (list or grid) in localStorage.
 * @param moduleKey A unique key for the module (e.g. 'company-management', 'users')
 * @param defaultMode The default mode if none is saved (usually 'grid')
 */
export function useViewMode(moduleKey: string, defaultMode: 'list' | 'grid' = 'grid') {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => {
    try {
      const stored = localStorage.getItem(`tauze_view_mode_${moduleKey}`);
      if (stored === 'list' || stored === 'grid') {
        return stored;
      }
    } catch (e) {
      console.error('Failed to read viewMode from localStorage', e);
    }
    return defaultMode;
  });

  useEffect(() => {
    try {
      localStorage.setItem(`tauze_view_mode_${moduleKey}`, viewMode);
    } catch (e) {
      console.error('Failed to save viewMode to localStorage', e);
    }
  }, [viewMode, moduleKey]);

  return [viewMode, setViewMode] as const;
}
