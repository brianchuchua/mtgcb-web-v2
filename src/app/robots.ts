import { MetadataRoute } from 'next';

const SITE_URL = 'https://www.mtgcollectionbuilder.com';

/**
 * Declined crawlers.
 *
 * The bar for landing here is *measured cost*, not category. Assistant and AI-search
 * crawlers are a discovery channel for a niche tool like this one, so being cited by
 * ChatGPT, Claude or Perplexity is worth more than the bandwidth it costs — they stay
 * welcome unless and until they show up as a real load.
 *
 * Both entries below were measured in Cloudflare over 24h on 2026-08-26.
 * GPTBot, ClaudeBot, PerplexityBot, CCBot, Amazonbot, meta-externalagent and
 * Bytespider did not appear in that traffic at all, so they are deliberately absent.
 */
const DECLINED_CRAWLERS = [
  'ExaSearchBot', // 152k req/day — ~7% of all frontend load, on its own
  'SERankingBacklinkAnalyzer', // 24k req/day — SEO backlink product mining the site
];

/**
 * Routes with no search value. Either per-user (unbounded URL space, private data),
 * transactional (auth flows), or internal (test/example pages).
 */
const DISALLOWED_PATHS = [
  '/api/',
  '/account',
  '/collections/', // per-user pages: thousands of them, nothing to index
  '/shared/', // share tokens must never be indexed
  '/goals',
  '/locations',
  '/history',
  '/import',
  '/export',
  '/reset-collection',
  '/login',
  '/signup',
  '/forgot-password',
  '/forgot-username',
  '/reset-password',
  '/test-og',
  '/sentry-example-page',
  '/example',
  '/*?', // any URL with a query string: filter/pagination permutations are combinatorial
];

/**
 * Link-preview (unfurl) crawlers. These must reach BOTH the page — to read its
 * `og:image` meta tag — and `/api/og/*` to fetch the generated image itself, so they
 * get a blanket allow rather than the shared disallow list. Without this, pasting a
 * collection or card link into Discord/Slack/iMessage renders a bare URL.
 *
 * They are individually low-volume and fetch one page per shared link, so allowing
 * them costs nothing against the crawl budget we are actually defending.
 */
const PREVIEW_CRAWLERS = [
  'Twitterbot',
  'facebookexternalhit',
  'Facebot',
  'Discordbot',
  'Slackbot-LinkExpanding',
  'Slackbot',
  'LinkedInBot',
  'WhatsApp',
  'TelegramBot',
  'redditbot',
  'Applebot', // powers iMessage previews and Spotlight
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: PREVIEW_CRAWLERS,
        allow: '/',
      },
      {
        // Search engines we want indexing us. No crawl delay — Googlebot ignores it
        // anyway, and Bing's own rate limiting is reasonable.
        userAgent: ['Googlebot', 'Bingbot'],
        allow: '/',
        disallow: DISALLOWED_PATHS,
      },
      {
        userAgent: DECLINED_CRAWLERS,
        disallow: '/',
      },
      {
        // Everyone else: welcome, but paced.
        userAgent: '*',
        allow: '/',
        disallow: DISALLOWED_PATHS,
        crawlDelay: 10,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
