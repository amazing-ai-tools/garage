export type ThemeMode = 'light' | 'dark';

export const themeStorageKey = 'garage-theme';

export function getInitialTheme(savedTheme: string | null, prefersDark: boolean): ThemeMode {
  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme;
  }

  return prefersDark ? 'dark' : 'light';
}

export function toggleTheme(theme: ThemeMode): ThemeMode {
  return theme === 'dark' ? 'light' : 'dark';
}
