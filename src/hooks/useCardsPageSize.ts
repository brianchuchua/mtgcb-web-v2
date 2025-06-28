import { useCardsPageSize as useContextCardsPageSize } from '@/contexts/DisplaySettingsContext';

/**
 * Hook for managing the page size for card browsing
 * Now uses the centralized DisplaySettingsContext
 */
export function useCardsPageSize(): [number, (pageSize: number) => void, boolean] {
  const [cardsPageSize, setCardsPageSize] = useContextCardsPageSize();
  
  // Always return true for isReady since context handles initialization
  return [cardsPageSize, setCardsPageSize, true];
}