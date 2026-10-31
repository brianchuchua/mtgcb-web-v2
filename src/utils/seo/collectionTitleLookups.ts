/**
 * Server-side name lookups for collection page titles.
 *
 * Each lookup is cached by Next for an hour (keyed on the request, share token included),
 * so most page views and preview crawlers never reach the API. Any failure returns null
 * and the page falls back to its old title.
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_MTGCB_API_BASE_URL || '';
const CACHE_SECONDS = 3600;
const TIMEOUT_MS = 3000;

const postJson = async (path: string, body: unknown, shareToken?: string): Promise<any> => {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (shareToken) headers['X-Share-Token'] = shareToken;

    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      next: { revalidate: CACHE_SECONDS },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
};

const isId = (id: number) => Number.isInteger(id) && id > 0;

const nonEmpty = (value: unknown): string | null => (typeof value === 'string' && value.trim() ? value : null);

/** The collection owner's username, or null for private collections (without a valid share token) and errors. */
export const fetchCollectionOwnerName = async (userId: number, shareToken?: string): Promise<string | null> => {
  if (!isId(userId)) return null;
  const json = await postJson('/sets/search', { userId, limit: 1, offset: 0, priceType: 'market' }, shareToken);
  return nonEmpty(json?.data?.username);
};

/** A card's real name (punctuation intact). Card data is public, so no user is involved. */
export const fetchCardName = async (cardId: number): Promise<string | null> => {
  if (!isId(cardId)) return null;
  const json = await postJson('/cards/by-ids', { ids: [cardId] });
  return nonEmpty(json?.data?.cards?.[0]?.name);
};

/** "teferi-hero-of-dominaria" -> "Teferi Hero Of Dominaria". Used when a lookup fails. */
export const titleFromSlug = (slug: string): string => slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
