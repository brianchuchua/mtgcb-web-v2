/**
 * Hook to detect if we're in a collection context
 *
 * Returns true when viewing a user's collection (/collections/{userId}/...)
 * Returns false when browsing without collection context (/browse)
 */

import { usePathname } from 'next/navigation';

export function useIsCollectionContext(): boolean {
  const pathname = usePathname();

  // We're in collection context if the URL starts with /collections/
  return pathname?.startsWith('/collections/') ?? false;
}

/**
 * Non-hook version for use in non-component contexts
 * (e.g., Redux initialization, utility functions)
 */
export function isCollectionContext(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.location.pathname.startsWith('/collections/');
}
