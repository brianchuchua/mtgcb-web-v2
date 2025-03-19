'use client';

import { useEffect, useState } from 'react';

const createStorageEvent = (key: string, newValue: string) => {
  return new StorageEvent('localStorage', {
    key,
    newValue,
    storageArea: localStorage,
    url: window.location.href,
  });
};

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((val: T) => T)) => void] {
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

  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Listen for changes to this localStorage key from any component
  useEffect(() => {
    // Set initial value
    setStoredValue(readValue());

    // Create a custom handler that only responds to our custom events
    const handleStorageChange = (e: StorageEvent) => {
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

        // Dispatch custom event to notify other components
        window.dispatchEvent(createStorageEvent(key, newValueStr));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}
