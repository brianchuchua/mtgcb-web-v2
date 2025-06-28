import { useLocalStorage } from './useLocalStorage';

const DEFAULT_PAGE_SIZE = 24;

/**
 * Hook for managing the page size for card browsing
 * Includes fallback to default value when localStorage is unavailable
 */
export function useCardsPageSize(): [number, (pageSize: number) => void, boolean] {
  const [cardsPageSize, setCardsPageSize, isReady] = useLocalStorage<number>('cardsPageSize', DEFAULT_PAGE_SIZE);

  // Ensure we always have a valid page size
  const validPageSize =
    typeof cardsPageSize === 'number' && !isNaN(cardsPageSize) && cardsPageSize > 0 ? cardsPageSize : DEFAULT_PAGE_SIZE;

  // Wrapper for the setter to validate input
  const setValidPageSize = (size: number | ((val: number) => number)) => {
    try {
      if (typeof size === 'function') {
        setCardsPageSize((current) => {
          const newSize = size(current);
          return typeof newSize === 'number' && !isNaN(newSize) && newSize > 0 ? newSize : DEFAULT_PAGE_SIZE;
        });
      } else {
        const newSize = typeof size === 'number' && !isNaN(size) && size > 0 ? size : DEFAULT_PAGE_SIZE;
        setCardsPageSize(newSize);
      }
    } catch (error) {
      console.warn('Error setting cards page size:', error);
      setCardsPageSize(DEFAULT_PAGE_SIZE);
    }
  };

  return [validPageSize, setValidPageSize, isReady];
}
