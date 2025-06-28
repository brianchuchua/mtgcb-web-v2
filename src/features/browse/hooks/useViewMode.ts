import { useCallback } from 'react';
import { usePreferredCardViewMode, usePreferredSetViewMode } from '@/contexts/DisplaySettingsContext';

/**
 * Manages view mode (grid/table) for cards and sets
 * Now uses the centralized DisplaySettingsContext
 */
export function useViewMode(view: string) {
  const [preferredCardViewMode, setPreferredCardViewMode] = usePreferredCardViewMode();
  const [preferredSetViewMode, setPreferredSetViewMode] = usePreferredSetViewMode();

  const viewMode = view === 'cards' ? preferredCardViewMode : preferredSetViewMode;

  const changeViewMode = useCallback(
    (mode: 'grid' | 'table') => {
      if (view === 'cards') {
        setPreferredCardViewMode(mode);
      } else {
        setPreferredSetViewMode(mode);
      }
    },
    [view, setPreferredCardViewMode, setPreferredSetViewMode],
  );

  return {
    viewMode,
    changeViewMode,
  };
}