import { describe, expect, it } from 'vitest';
import { connectionStatusCopy } from './uiCopy';

describe('interface copy', () => {
  it('uses product language for the connection status', () => {
    expect(connectionStatusCopy.label).toBe('Synchronisation');
    expect(connectionStatusCopy.value).toBe('Serveur securise');
    expect(connectionStatusCopy.label).not.toMatch(/backend/i);
  });
});
