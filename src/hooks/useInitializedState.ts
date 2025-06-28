import { useState, useRef, useEffect } from 'react';

/**
 * A hook that initializes state from a source (localStorage, URL params, etc.) 
 * without causing re-renders. The initial value is computed synchronously.
 * 
 * @param key - The key to use for the value (e.g., localStorage key)
 * @param initializer - Function that returns the initial value
 * @param options - Configuration options
 * @returns [value, setValue, isInitialized]
 */
export function useInitializedState<T>(
  key: string,
  initializer: () => T,
  options?: {
    storageType?: 'localStorage' | 'sessionStorage' | 'none';
    syncAcrossTabs?: boolean;
    syncWithUrl?: boolean;
  }
): [T, (value: T | ((prev: T) => T)) => void, boolean] {
  const { 
    storageType = 'localStorage', 
    syncAcrossTabs = true,
    syncWithUrl = false 
  } = options || {};

  // Initialize state synchronously to avoid re-renders
  const [state, setState] = useState<T>(() => {
    try {
      if (typeof window === 'undefined') {
        return initializer();
      }

      // Try to read from storage first
      if (storageType !== 'none') {
        const storage = storageType === 'localStorage' ? window.localStorage : window.sessionStorage;
        const storedValue = storage.getItem(key);
        if (storedValue !== null) {
          return JSON.parse(storedValue);
        }
      }

      // Fall back to initializer
      return initializer();
    } catch (error) {
      console.warn(`Error initializing state for key "${key}":`, error);
      return initializer();
    }
  });

  const isInitialized = useRef(true);

  // Update storage when state changes
  useEffect(() => {
    if (storageType !== 'none' && typeof window !== 'undefined') {
      try {
        const storage = storageType === 'localStorage' ? window.localStorage : window.sessionStorage;
        storage.setItem(key, JSON.stringify(state));
        
        // Dispatch custom event for same-tab updates
        if (syncAcrossTabs) {
          window.dispatchEvent(new StorageEvent('storage', {
            key,
            newValue: JSON.stringify(state),
            storageArea: storage
          }));
        }
      } catch (error) {
        console.warn(`Error saving state for key "${key}":`, error);
      }
    }
  }, [state, key, storageType, syncAcrossTabs]);

  // Listen for storage changes from other tabs
  useEffect(() => {
    if (storageType === 'none' || !syncAcrossTabs || typeof window === 'undefined') {
      return;
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          const newValue = JSON.parse(e.newValue);
          setState(newValue);
        } catch (error) {
          console.warn(`Error parsing storage value for key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, storageType, syncAcrossTabs]);

  return [state, setState, isInitialized.current];
}

/**
 * Specialized version for price type that ensures proper initialization
 */
export function useInitializedPriceType() {
  return useInitializedState('displayPriceType', () => 'market', {
    storageType: 'localStorage',
    syncAcrossTabs: true
  });
}