import { expect, test } from '@playwright/test';

// Reads the server-rendered <head>, the part search engines and link previews see.
const SITE = 'MTG Collection Builder';
const ORIGIN = 'https://www.mtgcollectionbuilder.com';

const PUBLIC_PAGES: Array<[path: string, title: string]> = [
  ['/', SITE],
  ['/browse', `Browse - ${SITE}`],
  ['/news', `News - ${SITE}`],
  ['/changelog', `Changelog - ${SITE}`],
  ['/roadmap', `Roadmap - ${SITE}`],
  ['/faq', `FAQ - ${SITE}`],
  ['/patrons', `Patrons - ${SITE}`],
  ['/binder-templates', `Binder Templates - ${SITE}`],
  ['/draft-cubes', `Draft Cubes - ${SITE}`],
  ['/draft-helper', `Draft Helper - ${SITE}`],
  ['/iconic-impact', `Iconic Impact - ${SITE}`],
  ['/contact', `Contact - ${SITE}`],
  ['/terms-and-privacy', `Terms and Privacy - ${SITE}`],
];

const readHead = async (request: import('@playwright/test').APIRequestContext, path: string) => {
  // Next streams slow metadata into <body> for browsers; preview bots like Discord's get it in <head>
  const html = await (await request.get(path, { headers: { 'User-Agent': 'Discordbot/2.0' } })).text();
  const head = html.slice(0, html.indexOf('</head>'));
  const decode = (s: string) => s.replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');
  const titles = [...head.matchAll(/<title>(.*?)<\/title>/g)].map((m) => decode(m[1]));
  const meta = (key: string) => {
    const value = head.match(new RegExp(`<meta (?:name|property)="${key}" content="([^"]*)"`))?.[1];
    return value === undefined ? null : decode(value);
  };
  const canonical = head.match(/<link rel="canonical" href="([^"]*)"/)?.[1] ?? null;
  return { titles, meta, canonical };
};

test.describe('Page titles and preview tags', () => {
  for (const [path, title] of PUBLIC_PAGES) {
    test(`${path} has its own title, canonical link and preview tags`, async ({ request }) => {
      const head = await readHead(request, path);

      expect(head.titles).toEqual([title]);
      expect(head.canonical).toBe(`${ORIGIN}${path === '/' ? '' : path}`);
      expect(head.meta('description')).toBeTruthy();
      expect(head.meta('og:title')).toBe(title);
      expect(head.meta('og:url')).toBe(head.canonical);
      expect(head.meta('og:site_name')).toBe(SITE);
      expect(head.meta('og:image')).toMatch(/^https:\/\//);
      expect(head.meta('twitter:card')).toBe('summary');
    });
  }

  for (const [path, title] of [
    ['/goals', 'Goals'],
    ['/goals/create', 'Create Goal'],
    ['/locations', 'Locations'],
    ['/locations/create', 'Create Location'],
    ['/collections/edit-cards', 'Add or Remove Cards'],
    ['/login', 'Log In'],
  ]) {
    test(`${path} gets a tab title but no canonical link`, async ({ request }) => {
      const head = await readHead(request, path);
      expect(head.titles).toEqual([`${title} - ${SITE}`]);
      expect(head.canonical).toBeNull();
    });
  }

  test('collection pages keep their own titles and preview images', async ({ request }) => {
    const head = await readHead(request, '/collections/1337/dominaria');
    expect(head.titles).toEqual([`Dominaria - ${SITE}`]);
    expect(head.meta('og:image')).toContain('/api/og/');
    expect(head.meta('twitter:card')).toBe('summary_large_image');
  });

  test("a public collection's title names its owner", async ({ request }) => {
    const head = await readHead(request, '/collections/1337');
    expect(head.titles).toEqual([`Manath's Collection - ${SITE}`]);
    expect(head.meta('og:title')).toBe(`Manath's Collection - ${SITE}`);
  });

  test("a private collection's title doesn't give away the owner", async ({ request }) => {
    const head = await readHead(request, '/collections/69');
    expect(head.titles).toEqual([SITE]);
  });

  test('a card page title uses the real card name, not the web address', async ({ request }) => {
    const head = await readHead(request, '/collections/1337/cards/teferi-hero-of-dominaria/35089');
    expect(head.titles).toEqual([`Teferi, Hero of Dominaria - ${SITE}`]);
    expect(head.meta('og:title')).toBe(`Teferi, Hero of Dominaria - ${SITE}`);
  });
});
