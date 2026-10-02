/**
 * Hook to detect if we're in a collection context
 *
 * Returns true when viewing a user's collection (/collections/{userId}/...)
 * or a shared collection link (/shared/{token}/...).
 * Returns false when browsing without collection context (/browse)
 */

import { usePathname } from 'next/navigation';

export function useIsCollectionContext(): boolean {
  const pathname = usePathname();

  return isCollectionPath(pathname);
}

/**
 * Non-hook version for use in non-component contexts
 * (e.g., Redux initialization, utility functions)
 */
export function isCollectionContext(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return isCollectionPath(window.location.pathname);
}

export function isCollectionPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return pathname.startsWith('/collections/') || pathname.startsWith('/shared/');
}
