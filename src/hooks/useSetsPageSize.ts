import { useSetsPageSize as useContextSetsPageSize } from '@/contexts/DisplaySettingsContext';

/**
 * Hook for managing the page size for set browsing
 * Now uses the centralized DisplaySettingsContext
 */
export function useSetsPageSize(): [number, (pageSize: number) => void, boolean] {
  const [setsPageSize, setSetsPageSize] = useContextSetsPageSize();
  
  // Always return true for isReady since context handles initialization
  return [setsPageSize, setSetsPageSize, true];
}