'use client';

import { useEffect, useState } from 'react';
import { PriceType } from '@/types/pricing';

/**
 * Hook to get and monitor the current set price type preference used for cost to complete
 * Uses the same localStorage value as the card price type for consistency
 * Can be used at a high level in the component tree to avoid multiple event listeners
 */
export function useSetPriceType(): PriceType {
  const [priceType, setPriceType] = useState<PriceType>(PriceType.Market);

  useEffect(() => {
    // Initialize from localStorage - using the same key as cards for consistency
    const getPriceTypeFromStorage = (): PriceType => {
      try {
        const storedValue = window.localStorage.getItem('displayPriceType');
        return storedValue ? JSON.parse(storedValue) : PriceType.Market;
      } catch (error) {
        console.warn('Error reading price type from localStorage:', error);
        return PriceType.Market;
      }
    };

    setPriceType(getPriceTypeFromStorage());

    // Listen for changes to this localStorage key
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'displayPriceType' && e.newValue) {
        try {
          setPriceType(JSON.parse(e.newValue));
        } catch (error) {
          console.warn('Error parsing localStorage value:', error);
        }
      }
    };

    // Custom event for same-page updates
    const handleCustomEvent = (e: Event) => {
      const storageEvent = e as StorageEvent;
      if (storageEvent.key === 'displayPriceType' && storageEvent.newValue) {
        try {
          setPriceType(JSON.parse(storageEvent.newValue));
        } catch (error) {
          console.warn('Error parsing localStorage value:', error);
        }
      }
    };

    // Add event listeners
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('localStorage', handleCustomEvent as EventListener);

    // Clean up
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorage', handleCustomEvent as EventListener);
    };
  }, []);

  return priceType;
}