import { describe, expect, it } from 'vitest';
import { unavailableServiceCopy } from './uiCopy';

describe('interface copy', () => {
  it('does not expose technical connection status as a dashboard field', () => {
    const visibleCopy = Object.values(unavailableServiceCopy).join(' ');

    expect(visibleCopy).not.toMatch(/backend|serveur|synchronisation/i);
  });
});
