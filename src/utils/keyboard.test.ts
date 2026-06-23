import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isMac,
  getModifierKey,
  formatShortcut,
  isModifierPressed,
  createShortcutMatcher,
} from './keyboard';

describe('keyboard utilities', () => {
  describe('isMac', () => {
    it('should return true on macOS platform', () => {
      // Mock navigator.platform
      Object.defineProperty(window.navigator, 'platform', {
        value: 'MacIntel',
        configurable: true,
      });
      expect(isMac()).toBe(true);
    });

    it('should return false on Windows platform', () => {
      Object.defineProperty(window.navigator, 'platform', {
        value: 'Win32',
        configurable: true,
      });
      expect(isMac()).toBe(false);
    });

    it('should return false on Linux platform', () => {
      Object.defineProperty(window.navigator, 'platform', {
        value: 'Linux x86_64',
        configurable: true,
      });
      expect(isMac()).toBe(false);
    });
  });

  describe('getModifierKey', () => {
    it('should return ⌘ on macOS', () => {
      Object.defineProperty(window.navigator, 'platform', {
        value: 'MacIntel',
        configurable: true,
      });
      expect(getModifierKey()).toBe('⌘');
    });

    it('should return Ctrl on Windows', () => {
      Object.defineProperty(window.navigator, 'platform', {
        value: 'Win32',
        configurable: true,
      });
      expect(getModifierKey()).toBe('Ctrl');
    });
  });

  describe('formatShortcut', () => {
    it('should format shortcut for macOS', () => {
      Object.defineProperty(window.navigator, 'platform', {
        value: 'MacIntel',
        configurable: true,
      });
      expect(formatShortcut('Ctrl+K')).toBe('⌘+K');
      expect(formatShortcut('⌘+K')).toBe('⌘+K');
    });

    it('should format shortcut for Windows', () => {
      Object.defineProperty(window.navigator, 'platform', {
        value: 'Win32',
        configurable: true,
      });
      expect(formatShortcut('⌘+K')).toBe('Ctrl+K');
      expect(formatShortcut('Ctrl+K')).toBe('Ctrl+K');
    });
  });

  describe('isModifierPressed', () => {
    it('should detect metaKey on macOS', () => {
      Object.defineProperty(window.navigator, 'platform', {
        value: 'MacIntel',
        configurable: true,
      });
      const event = new KeyboardEvent('keydown', { metaKey: true });
      expect(isModifierPressed(event)).toBe(true);
    });

    it('should detect ctrlKey on Windows', () => {
      Object.defineProperty(window.navigator, 'platform', {
        value: 'Win32',
        configurable: true,
      });
      const event = new KeyboardEvent('keydown', { ctrlKey: true });
      expect(isModifierPressed(event)).toBe(true);
    });

    it('should return false when no modifier is pressed', () => {
      const event = new KeyboardEvent('keydown', {});
      expect(isModifierPressed(event)).toBe(false);
    });
  });

  describe('createShortcutMatcher', () => {
    it('should match key with modifier', () => {
      Object.defineProperty(window.navigator, 'platform', {
        value: 'MacIntel',
        configurable: true,
      });
      const matcher = createShortcutMatcher('k', true);
      const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
      expect(matcher(event)).toBe(true);
    });

    it('should not match when modifier is required but not pressed', () => {
      const matcher = createShortcutMatcher('k', true);
      const event = new KeyboardEvent('keydown', { key: 'k' });
      expect(matcher(event)).toBe(false);
    });

    it('should match key without modifier when not required', () => {
      const matcher = createShortcutMatcher('k', false);
      const event = new KeyboardEvent('keydown', { key: 'k' });
      expect(matcher(event)).toBe(true);
    });

    it('should be case insensitive', () => {
      Object.defineProperty(window.navigator, 'platform', {
        value: 'MacIntel',
        configurable: true,
      });
      const matcher = createShortcutMatcher('k', true);
      const event = new KeyboardEvent('keydown', { key: 'K', metaKey: true });
      expect(matcher(event)).toBe(true);
    });
  });
});
