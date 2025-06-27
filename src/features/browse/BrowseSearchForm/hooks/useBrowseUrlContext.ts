import { usePathname } from 'next/navigation';

export const useBrowseUrlContext = () => {
  const pathname = usePathname();

  const isSetPage =
    pathname?.includes('/browse/sets/') ||
    (pathname?.includes('/collections/') && pathname?.split('/').length > 3) ||
    false;

  const isCollectionPage = pathname?.startsWith('/collections/') || false;

  const isCollectionSetPage = pathname?.includes('/collections/') && pathname?.split('/').length > 3;

  const getUserIdFromPath = (): number | null => {
    if (!pathname?.startsWith('/collections/')) return null;
    const parts = pathname.split('/');
    if (parts.length >= 3) {
      const userId = parseInt(parts[2], 10);
      return isNaN(userId) ? null : userId;
    }
    return null;
  };

  const userId = getUserIdFromPath();

  return {
    pathname,
    isSetPage,
    isCollectionPage,
    isCollectionSetPage,
    userId,
  };
};