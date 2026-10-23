const FALLBACK_PATH = '/';
const PLACEHOLDER_ORIGIN = 'http://placeholder.invalid';

/**
 * Turns a ?redirectTo= value into a path on this site, or '/' if it points anywhere else.
 * Blocks absolute URLs, protocol-relative URLs ("//evil.com") and backslash tricks ("/\evil.com").
 */
export const getSafeRedirectPath = (raw: string | null | undefined): string => {
  if (!raw) return FALLBACK_PATH;

  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return FALLBACK_PATH;
  }

  if (!decoded.startsWith('/') || decoded.startsWith('//') || decoded.includes('\\')) return FALLBACK_PATH;
  if (/[\u0000-\u001f]/.test(decoded)) return FALLBACK_PATH;

  try {
    const url = new URL(decoded, PLACEHOLDER_ORIGIN);
    if (url.origin !== PLACEHOLDER_ORIGIN) return FALLBACK_PATH;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return FALLBACK_PATH;
  }
};
