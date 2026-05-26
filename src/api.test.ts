import { describe, expect, it } from 'vitest';
import { buildApiUrl, createApiRequest, formatEuros, getCostPerKm } from './garage';

describe('garage helpers', () => {
  it('builds API URLs without duplicate slashes', () => {
    expect(buildApiUrl('https://garage-api.example.com/', '/api/summary')).toBe(
      'https://garage-api.example.com/api/summary',
    );
  });

  it('formats decimal totals as French euros', () => {
    expect(formatEuros('129.90')).toBe('129,90 EUR');
  });

  it('calculates cost per kilometer when odometer data exists', () => {
    expect(getCostPerKm('250.00', 10000)).toBe('0,03 EUR/km');
    expect(getCostPerKm('250.00', 0)).toBe('Non disponible');
  });

  it('sends credentials with API requests for the session cookie', () => {
    expect(createApiRequest({ method: 'POST' }).credentials).toBe('include');
  });
});
