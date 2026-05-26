import { describe, expect, it } from 'vitest';
import { getInitialTheme, toggleTheme, type ThemeMode } from './theme';

describe('theme preference', () => {
  it('uses a saved light or dark preference first', () => {
    expect(getInitialTheme('light', true)).toBe('light');
    expect(getInitialTheme('dark', false)).toBe('dark');
  });

  it('falls back to the system preference when no saved value exists', () => {
    expect(getInitialTheme(null, true)).toBe('dark');
    expect(getInitialTheme(null, false)).toBe('light');
  });

  it('ignores invalid saved values', () => {
    expect(getInitialTheme('garage' as ThemeMode, true)).toBe('dark');
  });

  it('toggles between light and dark', () => {
    expect(toggleTheme('light')).toBe('dark');
    expect(toggleTheme('dark')).toBe('light');
  });
});
