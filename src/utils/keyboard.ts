/**
 * Keyboard utility functions for cross-platform keyboard shortcuts
 */

/**
 * Detects if the user is on macOS
 */
export function isMac(): boolean {
  return typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform);
}

/**
 * Returns the appropriate modifier key symbol based on platform
 * @returns '⌘' on Mac, 'Ctrl' on Windows/Linux
 */
export function getModifierKey(): string {
  return isMac() ? '⌘' : 'Ctrl';
}

/**
 * Formats a keyboard shortcut for display based on platform
 * @param key - The key combination (e.g., '⌘+K', 'Ctrl+K')
 * @returns Platform-specific formatted shortcut
 */
export function formatShortcut(shortcut: string): string {
  if (isMac()) {
    // Already has ⌘, return as-is
    if (shortcut.includes('⌘')) {
      return shortcut;
    }
    // Replace Ctrl with ⌘
    return shortcut.replace(/Ctrl/gi, '⌘');
  } else {
    // Replace ⌘ with Ctrl
    return shortcut.replace(/⌘/g, 'Ctrl');
  }
}

/**
 * Checks if the modifier key is pressed in an event
 * @param event - Keyboard event
 * @returns true if the appropriate modifier key is pressed
 */
export function isModifierPressed(event: KeyboardEvent): boolean {
  return isMac() ? event.metaKey : event.ctrlKey;
}

/**
 * Creates a keyboard shortcut matcher
 * @param key - The key to match (e.g., 'k', 'n', '1')
 * @param requireModifier - Whether the modifier key is required (default: true)
 * @returns Function that checks if event matches the shortcut
 */
export function createShortcutMatcher(
  key: string,
  requireModifier: boolean = true
): (event: KeyboardEvent) => boolean {
  return (event: KeyboardEvent): boolean => {
    const keyMatch = event.key.toLowerCase() === key.toLowerCase();
    const modifierMatch = requireModifier ? isModifierPressed(event) : true;
    return keyMatch && modifierMatch;
  };
}
