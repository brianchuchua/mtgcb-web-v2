import { useCallback, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

/**
 * Manages view mode (grid/table) for cards and sets
 * Persists preferences in local storage
 */
export function useViewMode(view: string) {
  const [preferredCardViewMode, setPreferredCardViewMode] = useLocalStorage<'grid' | 'table'>(
    'preferredCardViewMode',
    'grid',
  );
  const [preferredSetViewMode, setPreferredSetViewMode] = useLocalStorage<'grid' | 'table'>(
    'preferredSetViewMode',
    'grid',
  );

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
