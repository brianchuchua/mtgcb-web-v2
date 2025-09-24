import { Metadata } from 'next';
import { headers } from 'next/headers';
import { CollectionSetClient } from './CollectionSetClient';

interface CollectionSetPageProps {
  params: Promise<{
    userId: string;
    setSlug: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: CollectionSetPageProps): Promise<Metadata> {
  const { userId, setSlug } = await params;
  const resolvedSearchParams = await searchParams;
  const shareToken = resolvedSearchParams.shareToken as string | undefined;

  // Dynamically construct the OG image URL
  const headersList = await headers();
  const host = headersList.get('host');
  let ogImageUrl: string | undefined;

  if (host) {
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const imageUrl = new URL(`${protocol}://${host}/api/og/set`);
    imageUrl.searchParams.set('userId', userId);
    imageUrl.searchParams.set('setSlug', setSlug);
    if (shareToken) {
      imageUrl.searchParams.set('shareToken', shareToken);
    }
    if (process.env.NEXT_PUBLIC_IMAGE_CACHE_DATE) {
      imageUrl.searchParams.set('v', process.env.NEXT_PUBLIC_IMAGE_CACHE_DATE);
    }
    ogImageUrl = imageUrl.toString();
  }

  const title = `${setSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} - MTG Collection Builder`;
  const description = `View collection details for this Magic: The Gathering set`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      ...(ogImageUrl && {
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: 'MTG Set Collection',
          },
        ],
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(ogImageUrl && { images: [ogImageUrl] }),
    },
  };
}

export default async function CollectionSetPage({ params }: CollectionSetPageProps) {
  const { userId: userIdParam, setSlug } = await params;
  const userId = parseInt(userIdParam, 10);
  
  if (isNaN(userId)) {
    return <div>Invalid user ID</div>;
  }

  return <CollectionSetClient userId={userId} setSlug={setSlug} />;
}