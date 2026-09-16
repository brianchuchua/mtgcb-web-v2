/**
 * Site-authored notes link to `/browse/...` because that is the canonical public path for a
 * set or a card. A reader who has a collection almost always wants the same set or card in
 * their own collection context instead, where quantities and progress are shown, so a note's
 * browse links are rewritten to the collection equivalents before they are rendered.
 *
 * The note text itself is never edited — only the href handed to the link. Anything that is
 * not a recognised browse path (an https link, an unrecognised site path) is returned as-is.
 */
import { getCollectionCardUrl, getCollectionSetUrl, getCollectionUrl } from '@/utils/collectionUrls';
import { isValidUserId } from '@/utils/sanitizeUserId';

const BROWSE_SET_PATH = /^\/browse\/sets\/([^/]+)$/;
const BROWSE_CARD_PATH = /^\/browse\/cards\/([^/]+)\/([^/]+)$/;

/**
 * Rewrites a note's `/browse` link to the equivalent collection link.
 *
 * @param href - The href as authored in the note.
 * @param collectionUserId - Whose collection to point at, or null/undefined to leave `href` alone.
 */
export function resolveNoteHref(href: string, collectionUserId: number | null | undefined): string {
  if (!isValidUserId(collectionUserId)) return href;

  const { path, search, hash } = splitHref(href);
  const normalizedPath = path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;

  const setMatch = BROWSE_SET_PATH.exec(normalizedPath);
  if (setMatch) {
    return withSearch(getCollectionSetUrl(collectionUserId, setMatch[1]), search, hash);
  }

  const cardMatch = BROWSE_CARD_PATH.exec(normalizedPath);
  if (cardMatch) {
    return withSearch(getCollectionCardUrl(collectionUserId, cardMatch[1], cardMatch[2]), search, hash);
  }

  if (normalizedPath === '/browse/sets') {
    return withSearch(getCollectionUrl({ userId: collectionUserId, contentType: 'sets' }), search, hash);
  }

  if (normalizedPath === '/browse/cards') {
    return withSearch(getCollectionUrl({ userId: collectionUserId, contentType: 'cards' }), search, hash);
  }

  if (normalizedPath === '/browse') {
    return withSearch(getCollectionUrl({ userId: collectionUserId }), search, hash);
  }

  return href;
}

interface HrefParts {
  path: string;
  /** Query string without the leading `?`, empty when there is none. */
  search: string;
  /** Fragment including the leading `#`, empty when there is none. */
  hash: string;
}

function splitHref(href: string): HrefParts {
  const hashIndex = href.indexOf('#');
  const hash = hashIndex === -1 ? '' : href.slice(hashIndex);
  const withoutHash = hashIndex === -1 ? href : href.slice(0, hashIndex);

  const queryIndex = withoutHash.indexOf('?');
  const search = queryIndex === -1 ? '' : withoutHash.slice(queryIndex + 1);
  const path = queryIndex === -1 ? withoutHash : withoutHash.slice(0, queryIndex);

  return { path, search, hash };
}

/** The collection URL builders may already carry a query (goal id, content type), so merge rather than append. */
function withSearch(base: string, search: string, hash: string): string {
  if (!search) return `${base}${hash}`;
  return `${base}${base.includes('?') ? '&' : '?'}${search}${hash}`;
}
