'use client';

import { useDisplaySettings } from '@/contexts/DisplaySettingsContext';
import { PriceType } from '@/types/pricing';

/**
 * Hook to get and monitor the current set price type preference used for cost to complete
 * Uses the same value as the card price type for consistency
 * Now uses the centralized DisplaySettingsContext to avoid re-renders
 * 
 * @deprecated Use useDisplaySettings().settings.priceType or the convenience hook from DisplaySettingsContext
 */
export function useSetPriceType(): PriceType {
  const { settings } = useDisplaySettings();
  return settings.priceType;
}