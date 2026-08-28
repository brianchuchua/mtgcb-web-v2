import { MetadataRoute } from 'next';

const SITE_URL = 'https://www.mtgcollectionbuilder.com';

/**
 * Deliberately limited to canonical public pages.
 *
 * We do NOT enumerate card or set pages here. A sitemap listing tens of thousands
 * of card URLs would invite exactly the catalogue-walking that drove the August 2026
 * bandwidth overage — crawlers follow sitemaps eagerly. Card pages remain crawlable
 * via in-site links for anything that finds them organically; we just don't hand
 * out the index.
 */
const PUBLIC_ROUTES: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
  priority: number;
}> = [
  { path: '/', changeFrequency: 'daily', priority: 1.0 },
  { path: '/browse', changeFrequency: 'daily', priority: 0.9 },
  { path: '/news', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/changelog', changeFrequency: 'weekly', priority: 0.6 },
  { path: '/roadmap', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/faq', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/patrons', changeFrequency: 'weekly', priority: 0.5 },
  { path: '/binder-templates', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/draft-cubes', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/draft-helper', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/iconic-impact', changeFrequency: 'monthly', priority: 0.4 },
  { path: '/contact', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/terms-and-privacy', changeFrequency: 'yearly', priority: 0.2 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return PUBLIC_ROUTES.map(({ path, changeFrequency, priority }) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
