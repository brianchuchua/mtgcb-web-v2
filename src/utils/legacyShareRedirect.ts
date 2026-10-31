import { smartEncodeToken } from '@/utils/tokenEncoder';

type PageSearchParams = Record<string, string | string[] | undefined>;

/**
 * Old share links look like /collections/123?share=<token>. The page lost `share` from the
 * address bar on load, so a copied address no longer shared anything. Send them to the
 * current /shared/<token> form instead, keeping the rest of the query.
 * @param sharedSubPath What follows /shared/<token>: '' for the collection, '/<setSlug>' for a set
 * @returns The /shared/ URL, or null when there's no share param
 */
export const legacyShareRedirect = (sharedSubPath: string, searchParams: PageSearchParams): string | null => {
  const share = searchParams.share;
  const token = Array.isArray(share) ? share[0] : share;
  if (!token) return null;

  const rest = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (key === 'share' || value === undefined) continue;
    for (const item of Array.isArray(value) ? value : [value]) rest.append(key, item);
  }
  const query = rest.toString();

  return `/shared/${encodeURIComponent(smartEncodeToken(token))}${sharedSubPath}${query ? `?${query}` : ''}`;
};
