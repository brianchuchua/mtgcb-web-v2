import { Metadata } from 'next';
import { headers } from 'next/headers';
import { CollectionClient } from './CollectionClient';

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const { userId } = await params;
  const resolvedSearchParams = await searchParams;
  const shareToken = resolvedSearchParams.shareToken as string | undefined;
  const goalId = resolvedSearchParams.goalId as string | undefined;

  // Dynamically construct the OG image URL
  const headersList = await headers();
  const host = headersList.get('host');
  let ogImageUrl: string | undefined;

  if (host) {
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    // Use goal-specific OG image if goalId is present
    const endpoint = goalId ? 'goal' : 'collection';
    const imageUrl = new URL(`${protocol}://${host}/api/og/${endpoint}`);
    imageUrl.searchParams.set('userId', userId);
    if (goalId) {
      imageUrl.searchParams.set('goalId', goalId);
    }
    if (shareToken) {
      imageUrl.searchParams.set('shareToken', shareToken);
    }
    if (process.env.NEXT_PUBLIC_IMAGE_CACHE_DATE) {
      imageUrl.searchParams.set('v', process.env.NEXT_PUBLIC_IMAGE_CACHE_DATE);
    }
    ogImageUrl = imageUrl.toString();
  }

  const title = 'MTG Collection Builder';
  const description = 'Track and manage your Magic: The Gathering collection!';

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
            alt: 'MTG Collection Builder',
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

export default async function CollectionPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId: userIdParam } = await params;
  const userId = parseInt(userIdParam, 10);

  if (isNaN(userId)) {
    return <div>Invalid user ID</div>;
  }

  return <CollectionClient userId={userId} />;
}
