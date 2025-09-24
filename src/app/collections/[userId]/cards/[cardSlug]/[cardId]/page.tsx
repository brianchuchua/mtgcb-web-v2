import { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import CollectionCardClient from './CollectionCardClient';

interface CollectionCardPageProps {
  params: Promise<{
    userId: string;
    cardSlug: string;
    cardId: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: CollectionCardPageProps): Promise<Metadata> {
  const { userId, cardId, cardSlug } = await params;
  const resolvedSearchParams = await searchParams;
  const shareToken = resolvedSearchParams.shareToken as string | undefined;

  // Dynamically construct the OG image URL
  const headersList = await headers();
  const host = headersList.get('host');
  let ogImageUrl: string | undefined;

  if (host) {
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const imageUrl = new URL(`${protocol}://${host}/api/og/card`);
    imageUrl.searchParams.set('userId', userId);
    imageUrl.searchParams.set('cardId', cardId);
    if (shareToken) {
      imageUrl.searchParams.set('shareToken', shareToken);
    }
    if (process.env.NEXT_PUBLIC_IMAGE_CACHE_DATE) {
      imageUrl.searchParams.set('v', process.env.NEXT_PUBLIC_IMAGE_CACHE_DATE);
    }
    ogImageUrl = imageUrl.toString();
  }

  const title = `${cardSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} - MTG Collection Builder`;
  const description = `View collection details for this Magic: The Gathering card`;

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
            alt: 'MTG Card Collection',
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

export default async function CollectionCardPage({ params }: CollectionCardPageProps) {
  const { userId, cardId, cardSlug } = await params;
  
  const numericUserId = parseInt(userId, 10);
  if (isNaN(numericUserId)) {
    redirect('/');
  }

  return (
    <CollectionCardClient 
      userId={numericUserId} 
      cardId={cardId} 
      cardSlug={cardSlug} 
    />
  );
}