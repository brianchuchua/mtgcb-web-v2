import { SITE_DESCRIPTION, SITE_NAME, pageMetadata } from '@/utils/seo/pageMetadata';

describe('pageMetadata', () => {
  it('gives a public page its title, description, canonical link and preview tags', () => {
    const meta = pageMetadata({ title: 'FAQ', description: 'Answers.', path: '/faq' });

    expect(meta.title).toBe('FAQ');
    expect(meta.description).toBe('Answers.');
    expect(meta.alternates).toEqual({ canonical: '/faq' });
    expect(meta.openGraph).toMatchObject({
      siteName: SITE_NAME,
      title: `FAQ - ${SITE_NAME}`,
      description: 'Answers.',
      url: '/faq',
    });
    expect(meta.twitter).toMatchObject({ card: 'summary', title: `FAQ - ${SITE_NAME}`, description: 'Answers.' });
  });

  it('falls back to the site name and description', () => {
    const meta = pageMetadata();

    expect(meta.title).toBeUndefined();
    expect(meta.description).toBe(SITE_DESCRIPTION);
    expect(meta.alternates).toBeUndefined();
    expect(meta.openGraph).toMatchObject({ title: SITE_NAME });
    expect(meta.openGraph).not.toHaveProperty('url');
  });

  it('always includes a preview image, since a page-level openGraph replaces the root one', () => {
    const og = pageMetadata({ title: 'News', path: '/news' }).openGraph as { images: unknown[] };
    expect(og.images).toHaveLength(1);
  });
});
