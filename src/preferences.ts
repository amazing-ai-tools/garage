export type LanguageCode = 'en' | 'fr-CA' | 'pt' | 'es';
export type CountryCode = 'CA' | 'US' | 'FR' | 'BR' | 'PT' | 'ES' | 'MX';
export type CurrencyCode = 'CAD' | 'USD' | 'EUR' | 'BRL' | 'MXN';

export type UserPreferences = {
  language: LanguageCode;
  country: CountryCode;
  currency: CurrencyCode;
};

export const preferenceStorageKey = 'garage.preferences';

export const defaultPreferences: UserPreferences = {
  language: 'fr-CA',
  country: 'CA',
  currency: 'CAD',
};

export const languageOptions: Array<{ value: LanguageCode; label: string }> = [
  { value: 'en', label: 'English' },
  { value: 'fr-CA', label: 'Français (Québec)' },
  { value: 'pt', label: 'Português' },
  { value: 'es', label: 'Español' },
];

export const countryOptions: Array<{ value: CountryCode; label: string; defaultCurrency: CurrencyCode }> = [
  { value: 'CA', label: 'Canada', defaultCurrency: 'CAD' },
  { value: 'US', label: 'United States', defaultCurrency: 'USD' },
  { value: 'FR', label: 'France', defaultCurrency: 'EUR' },
  { value: 'BR', label: 'Brasil', defaultCurrency: 'BRL' },
  { value: 'PT', label: 'Portugal', defaultCurrency: 'EUR' },
  { value: 'ES', label: 'España', defaultCurrency: 'EUR' },
  { value: 'MX', label: 'México', defaultCurrency: 'MXN' },
];

export const currencyOptions: Array<{ value: CurrencyCode; label: string }> = [
  { value: 'CAD', label: 'CAD' },
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'BRL', label: 'BRL' },
  { value: 'MXN', label: 'MXN' },
];

const supportedLanguages = new Set(languageOptions.map((option) => option.value));
const supportedCountries = new Set(countryOptions.map((option) => option.value));
const supportedCurrencies = new Set(currencyOptions.map((option) => option.value));

function isUserPreferences(value: unknown): value is UserPreferences {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.language === 'string' &&
    typeof candidate.country === 'string' &&
    typeof candidate.currency === 'string' &&
    supportedLanguages.has(candidate.language as LanguageCode) &&
    supportedCountries.has(candidate.country as CountryCode) &&
    supportedCurrencies.has(candidate.currency as CurrencyCode)
  );
}

export function getInitialPreferences(savedValue: string | null): UserPreferences {
  if (!savedValue) {
    return defaultPreferences;
  }

  try {
    const parsed = JSON.parse(savedValue);
    return isUserPreferences(parsed) ? parsed : defaultPreferences;
  } catch {
    return defaultPreferences;
  }
}

export function serializePreferences(preferences: UserPreferences): string {
  return JSON.stringify(preferences);
}

export function localeForLanguage(language: LanguageCode): string {
  if (language === 'fr-CA') {
    return 'fr-CA';
  }

  return language;
}

export function formatCurrency(
  value: string | number | null | undefined,
  preferences: UserPreferences,
): string {
  return new Intl.NumberFormat(localeForLanguage(preferences.language), {
    style: 'currency',
    currency: preferences.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

export function formatDistance(value: number | null | undefined, preferences: Pick<UserPreferences, 'language'>): string {
  return `${Number(value || 0).toLocaleString(localeForLanguage(preferences.language))} km`;
}

export function formatCostPerKm(
  totalExpenses: string | number,
  odometerKm: number,
  preferences: UserPreferences,
  unavailableLabel: string,
): string {
  if (!odometerKm) {
    return unavailableLabel;
  }

  return `${formatCurrency(Number(totalExpenses) / odometerKm, preferences)}/km`;
}
