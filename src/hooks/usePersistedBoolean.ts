import { useCallback, useEffect, useState } from 'react';

/**
 * Boolean state persisted to localStorage. Useful for UI preferences like
 * "is this section expanded?" that should survive page reloads.
 *
 * Initial render uses `defaultValue` (matches SSR), then a client-side effect
 * reads localStorage and applies the stored value if present. This produces a
 * brief flash on first paint when the stored value differs from the default,
 * which is consistent with how other localStorage-backed prefs in this repo
 * behave (e.g. `useGoalsPagination`).
 */
export const usePersistedBoolean = (
  storageKey: string,
  defaultValue = false,
): readonly [boolean, () => void, (value: boolean) => void] => {
  const [value, setValue] = useState<boolean>(defaultValue);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (typeof parsed === 'boolean') setValue(parsed);
      }
    } catch (err) {
      // Bad JSON or storage quota issues — fall back to the default we already set.
      console.error(`usePersistedBoolean: failed to read ${storageKey}`, err);
    }
  }, [storageKey]);

  const writeValue = useCallback(
    (next: boolean) => {
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(storageKey, JSON.stringify(next));
        }
      } catch (err) {
        console.error(`usePersistedBoolean: failed to write ${storageKey}`, err);
      }
    },
    [storageKey],
  );

  const toggle = useCallback(() => {
    setValue((prev) => {
      const next = !prev;
      writeValue(next);
      return next;
    });
  }, [writeValue]);

  const set = useCallback(
    (next: boolean) => {
      setValue(next);
      writeValue(next);
    },
    [writeValue],
  );

  return [value, toggle, set] as const;
};
