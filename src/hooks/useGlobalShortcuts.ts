import { useEffect } from 'react';
import { isModifierPressed } from '../utils/keyboard';

export interface GlobalShortcut {
  key: string;
  action: () => void;
  requireModifier?: boolean;
  requireShift?: boolean;
  preventDefault?: boolean;
  description?: string;
}

/**
 * Hook to register global keyboard shortcuts
 * @param shortcuts - Array of shortcut configurations
 * @param enabled - Whether shortcuts are enabled (default: true)
 */
export function useGlobalShortcuts(shortcuts: GlobalShortcut[], enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) return;

      for (const shortcut of shortcuts) {
        const {
          key,
          action,
          requireModifier = true,
          requireShift = false,
          preventDefault = true,
        } = shortcut;

        // Check if the key matches
        const keyMatches = event.key.toLowerCase() === key.toLowerCase();
        
        // Check if modifier requirement is met
        const modifierMatches = requireModifier ? isModifierPressed(event) : true;
        
        // Check if shift requirement is met
        const shiftMatches = requireShift ? event.shiftKey : !event.shiftKey;

        if (keyMatches && modifierMatches && shiftMatches) {
          if (preventDefault) {
            event.preventDefault();
          }
          action();
          break; // Execute only the first matching shortcut
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts, enabled]);
}
