'use client';

import { useBrowseUrlContext } from '@/features/browse/BrowseSearchForm/hooks/useBrowseUrlContext';
import { useAuth } from '@/hooks/useAuth';
import { isValidUserId } from '@/utils/sanitizeUserId';

/**
 * Whose collection the `/browse` links inside a site-authored note should point at.
 *
 * On a collection or shared page the note stays in the collection already being viewed, so a
 * note on someone else's collection keeps linking into that collection. Anywhere else (the
 * browse pages), a signed-in reader is sent to their own collection. Returns null when there
 * is no collection to point at, which leaves the note's links on `/browse`.
 */
export function useNoteLinkUserId(): number | null {
  const { isCollectionPage, userId: viewedCollectionUserId } = useBrowseUrlContext();
  const { user } = useAuth();

  if (isCollectionPage) return viewedCollectionUserId;

  return isValidUserId(user?.userId) ? user.userId : null;
}
