import type { Metadata } from 'next';

export const SITE_URL = 'https://www.mtgcollectionbuilder.com';
export const SITE_NAME = 'MTG Collection Builder';
export const SITE_DESCRIPTION = "Track your Magic: The Gathering collection's value for free!";

const DEFAULT_SHARE_IMAGE = {
  url: 'https://r2.mtgcollectionbuilder.com/images/mtgcb-logo.png',
  width: 1000,
  height: 1000,
  alt: SITE_NAME,
};

interface PageMetadataOptions {
  title?: string;
  description?: string;
  path?: string;
}

/**
 * Title, description, canonical link and link-preview tags for one page.
 *
 * Next.js replaces a parent's `openGraph` object instead of merging it, so every page
 * gets the full set here. `title` is the page's own part; the root layout's template
 * adds " - MTG Collection Builder". Pass `path` only for public pages search engines
 * should index: it becomes the canonical URL and the preview URL.
 */
export const pageMetadata = ({ title, description = SITE_DESCRIPTION, path }: PageMetadataOptions = {}): Metadata => {
  const fullTitle = title ? `${title} - ${SITE_NAME}` : SITE_NAME;

  return {
    ...(title && { title }),
    description,
    ...(path && { alternates: { canonical: path } }),
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      locale: 'en_US',
      title: fullTitle,
      description,
      ...(path && { url: path }),
      images: [DEFAULT_SHARE_IMAGE],
    },
    twitter: {
      card: 'summary',
      title: fullTitle,
      description,
      images: [DEFAULT_SHARE_IMAGE.url],
    },
  };
};
