'use client';

import { useDisplaySettings } from '@/contexts/DisplaySettingsContext';
import { PriceType } from '@/types/pricing';

/**
 * Hook to get and monitor the current price type preference
 * Now uses the centralized DisplaySettingsContext to avoid re-renders
 * 
 * @deprecated Use useDisplaySettings().settings.priceType or the convenience hook from DisplaySettingsContext
 */
export function usePriceType(): PriceType {
  const { settings } = useDisplaySettings();
  return settings.priceType;
}
