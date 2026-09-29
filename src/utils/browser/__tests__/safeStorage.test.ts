import { getShareTokenFromWindow } from '@/api/utils/shareTokenUtils';
import { safeLocalStorage, safeSessionStorage } from '@/utils/browser/safeStorage';

/**
 * MTGCB-WEB-V2-6H: with storage denied (all cookies blocked, some in-app browsers), Chrome throws
 * on the `window.sessionStorage` property read itself, before getItem is ever called.
 */
const denyStorage = (name: 'sessionStorage' | 'localStorage') => {
  const original = Object.getOwnPropertyDescriptor(window, name)!;
  Object.defineProperty(window, name, {
    configurable: true,
    get() {
      throw new DOMException(
        `Failed to read the '${name}' property from 'Window': Access is denied for this document.`,
        'SecurityError',
      );
    },
  });
  return () => Object.defineProperty(window, name, original);
};

describe('safeStorage with storage available', () => {
  afterEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  it('reads, writes and removes like the real storage', () => {
    safeSessionStorage.setItem('k', 'v');
    expect(window.sessionStorage.getItem('k')).toBe('v');
    expect(safeSessionStorage.getItem('k')).toBe('v');

    safeSessionStorage.removeItem('k');
    expect(safeSessionStorage.getItem('k')).toBeNull();

    safeLocalStorage.setItem('k', 'v');
    expect(window.localStorage.getItem('k')).toBe('v');
  });
});

describe.each(['sessionStorage', 'localStorage'] as const)('safeStorage with %s denied', (name) => {
  let restore: () => void;
  const safe = name === 'sessionStorage' ? safeSessionStorage : safeLocalStorage;

  beforeEach(() => {
    restore = denyStorage(name);
  });

  afterEach(() => restore());

  it('reproduces the browser error on direct access', () => {
    expect(() => window[name].getItem('k')).toThrow('Access is denied for this document');
  });

  it('treats storage as empty and ignores writes instead of throwing', () => {
    expect(safe.getItem('k')).toBeNull();
    expect(() => safe.setItem('k', 'v')).not.toThrow();
    expect(() => safe.removeItem('k')).not.toThrow();
  });
});

describe('getShareTokenFromWindow with sessionStorage denied', () => {
  it('returns null instead of throwing, so API requests still go out', () => {
    const restore = denyStorage('sessionStorage');
    try {
      expect(getShareTokenFromWindow()).toBeNull();
    } finally {
      restore();
    }
  });
});
