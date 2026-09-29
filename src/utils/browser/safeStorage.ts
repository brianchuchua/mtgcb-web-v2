// Web Storage throws a SecurityError when the browser denies it (all cookies blocked, sandboxed
// in-app browsers) — and it throws on the `window.sessionStorage` property read itself, not just
// on getItem. Callers treat unavailable storage as empty and writes as best-effort.
export const safeSessionStorage = createSafeStorage(() => window.sessionStorage);
export const safeLocalStorage = createSafeStorage(() => window.localStorage);

function createSafeStorage(getStorage: () => Storage) {
  return {
    getItem: (key: string): string | null => {
      try {
        return getStorage().getItem(key);
      } catch {
        return null;
      }
    },
    setItem: (key: string, value: string): void => {
      try {
        getStorage().setItem(key, value);
      } catch {
        // Storage unavailable or full; the value just won't persist.
      }
    },
    removeItem: (key: string): void => {
      try {
        getStorage().removeItem(key);
      } catch {
        // Storage unavailable; nothing to remove.
      }
    },
  };
}
