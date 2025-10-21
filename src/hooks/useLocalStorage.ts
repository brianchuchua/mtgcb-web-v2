'use client';

import { useEffect, useRef, useState } from 'react';

const createStorageEvent = (key: string, newValue: string) => {
  return new StorageEvent('localStorage', {
    key,
    newValue,
    storageArea: localStorage,
    url: window.location.href,
  });
};

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void, boolean] {
  const readValue = (): T => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  };

  const hasHydrated = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const isUpdatingRef = useRef(false); // Track when this instance is updating

  const getInitialState = () => {
    if (typeof window === 'undefined' || !hasHydrated.current) {
      return initialValue;
    }
    return readValue();
  };

  const [storedValue, setStoredValue] = useState<T>(getInitialState);

  useEffect(() => {
    if (hasHydrated.current) return;

    hasHydrated.current = true;

    const valueFromStorage = readValue();
    if (JSON.stringify(valueFromStorage) !== JSON.stringify(storedValue)) {
      setStoredValue(valueFromStorage);
    }
    
    // Mark as ready after hydration
    setIsReady(true);
  }, []);

  // Listen for changes to this localStorage key from any component
  useEffect(() => {
    // Create a custom handler that only responds to our custom events
    const handleStorageChange = (e: StorageEvent) => {
      // Ignore events dispatched by this instance to prevent duplicate updates
      if (isUpdatingRef.current) return;

      if (e.key === key && e.newValue) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.warn(`Error parsing localStorage value:`, error);
        }
      }
    };

    // Also listen for standard storage events (for changes in other tabs)
    const handleWindowStorageChange = (e: StorageEvent) => {
      // Ignore events dispatched by this instance to prevent duplicate updates
      if (isUpdatingRef.current) return;

      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.warn(`Error parsing localStorage value:`, error);
        }
      }
    };

    // Add event listeners
    window.addEventListener('localStorage', handleStorageChange as EventListener);
    window.addEventListener('storage', handleWindowStorageChange);

    // Clean up
    return () => {
      window.removeEventListener('localStorage', handleStorageChange as EventListener);
      window.removeEventListener('storage', handleWindowStorageChange);
    };
  }, [key]);

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;

      // Save state
      setStoredValue(valueToStore);

      // Save to localStorage
      if (typeof window !== 'undefined') {
        const newValueStr = JSON.stringify(valueToStore);
        window.localStorage.setItem(key, newValueStr);

        // Mark that this instance is updating to prevent circular event handling
        isUpdatingRef.current = true;
        try {
          // Dispatch custom event to notify other components
          window.dispatchEvent(createStorageEvent(key, newValueStr));
        } finally {
          // Use setTimeout to clear the flag after event handlers have run
          // This ensures event handlers from OTHER components can still process the event
          setTimeout(() => {
            isUpdatingRef.current = false;
          }, 0);
        }
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue, isReady];
}
