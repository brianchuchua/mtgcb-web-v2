/**
 * Cache policy for generated Open Graph images.
 *
 * These routes render a 1200x630 PNG on demand (~100 KB, ~0.6s of CPU). Next.js
 * defaults dynamic route handlers to `max-age=0, must-revalidate`, which told every
 * cache in the chain not to help — so each preview crawler fetch was a fresh render
 * billed as origin egress.
 *
 * The images are derived from collection state, which changes slowly and is not
 * correctness-critical in a link preview. Callers already append a `v=` param
 * (NEXT_PUBLIC_IMAGE_CACHE_DATE) when they need to bust it explicitly.
 */
export const OG_IMAGE_CACHE_CONTROL = 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800';

export const OG_IMAGE_HEADERS = {
  'Cache-Control': OG_IMAGE_CACHE_CONTROL,
} as const;
