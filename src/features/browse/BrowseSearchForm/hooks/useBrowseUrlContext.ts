import { usePathname } from 'next/navigation';
import { useSessionStorage } from '@/hooks/useSessionStorage';

export const useBrowseUrlContext = () => {
  const pathname = usePathname();
  const isSharedPage = pathname?.startsWith('/shared/') || false;
  
  // Use sessionStorage hook to automatically get userId when it's available
  // Note: We store as string in sessionStorage but parse it here
  const [sharedUserIdStr] = useSessionStorage<string | null>('mtgcb_share_user', null);
  const sharedUserId = sharedUserIdStr ? parseInt(sharedUserIdStr, 10) : null;

  // Check if we're on a set-specific page (viewing cards within a specific set)
  const isSetPage =
    pathname?.includes('/browse/sets/') ||
    (pathname?.includes('/collections/') && pathname?.split('/').length > 3 && !pathname?.includes('/cards/')) ||
    (pathname?.includes('/shared/') && pathname?.split('/').length > 3 && !pathname?.includes('/cards/')) ||
    false;

  // Treat shared pages as collection pages
  const isCollectionPage = pathname?.startsWith('/collections/') || isSharedPage;

  // Check if we're on a collection-specific set page (including shared)
  const isCollectionSetPage = 
    (pathname?.includes('/collections/') && pathname?.split('/').length > 3 && !pathname?.includes('/cards/')) ||
    (pathname?.includes('/shared/') && pathname?.split('/').length > 3 && !pathname?.includes('/cards/'));

  const getUserIdFromPath = (): number | null => {
    // For shared pages, use the userId from sessionStorage
    if (isSharedPage) {
      return !isNaN(sharedUserId || NaN) ? sharedUserId : null;
    }
    
    // For regular collection pages
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