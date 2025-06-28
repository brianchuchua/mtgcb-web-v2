import { useLocalStorage } from './useLocalStorage';

const DEFAULT_PAGE_SIZE = 24;

/**
 * Hook for managing the page size for set browsing
 * Includes fallback to default value when localStorage is unavailable
 */
export function useSetsPageSize(): [number, (pageSize: number) => void, boolean] {
  const [setsPageSize, setSetsPageSize, isReady] = useLocalStorage<number>('setsPageSize', DEFAULT_PAGE_SIZE);

  // Ensure we always have a valid page size
  const validPageSize =
    typeof setsPageSize === 'number' && !isNaN(setsPageSize) && setsPageSize > 0 ? setsPageSize : DEFAULT_PAGE_SIZE;

  // Wrapper for the setter to validate input
  const setValidPageSize = (size: number | ((val: number) => number)) => {
    try {
      if (typeof size === 'function') {
        setSetsPageSize((current) => {
          const newSize = size(current);
          return typeof newSize === 'number' && !isNaN(newSize) && newSize > 0 ? newSize : DEFAULT_PAGE_SIZE;
        });
      } else {
        const newSize = typeof size === 'number' && !isNaN(size) && size > 0 ? size : DEFAULT_PAGE_SIZE;
        setSetsPageSize(newSize);
      }
    } catch (error) {
      console.warn('Error setting sets page size:', error);
      setSetsPageSize(DEFAULT_PAGE_SIZE);
    }
  };

  return [validPageSize, setValidPageSize, isReady];
}
