import { describe, expect, it } from 'vitest';
import {
  defaultPreferences,
  formatCurrency,
  getInitialPreferences,
  languageOptions,
  preferenceStorageKey,
  serializePreferences,
} from './preferences';

describe('user preferences', () => {
  it('defaults to French Quebec, Canada, and CAD', () => {
    expect(defaultPreferences).toEqual({
      language: 'fr-CA',
      country: 'CA',
      currency: 'CAD',
    });
  });

  it('supports English, French Quebec, Portuguese, and Spanish', () => {
    expect(languageOptions.map((option) => option.value)).toEqual(['en', 'fr-CA', 'pt', 'es']);
  });

  it('loads saved preferences when they are valid', () => {
    const saved = serializePreferences({ language: 'pt', country: 'BR', currency: 'BRL' });

    expect(getInitialPreferences(saved)).toEqual({
      language: 'pt',
      country: 'BR',
      currency: 'BRL',
    });
  });

  it('falls back when saved preferences are invalid', () => {
    expect(getInitialPreferences('{"language":"xx","country":"ZZ","currency":"NOPE"}')).toEqual(
      defaultPreferences,
    );
    expect(getInitialPreferences('not-json')).toEqual(defaultPreferences);
  });

  it('formats money with the selected currency and language', () => {
    expect(formatCurrency('129.9', { language: 'en', country: 'US', currency: 'USD' })).toBe('$129.90');
    expect(formatCurrency('129.9', { language: 'fr-CA', country: 'CA', currency: 'CAD' })).toBe(
      '129,90 $',
    );
    expect(formatCurrency('129.9', { language: 'pt', country: 'BR', currency: 'BRL' })).toBe(
      'R$ 129,90',
    );
  });

  it('uses a stable storage key', () => {
    expect(preferenceStorageKey).toBe('garage.preferences');
  });
});
