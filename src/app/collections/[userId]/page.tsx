import { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { CollectionClient } from './CollectionClient';
import { legacyShareRedirect } from '@/utils/legacyShareRedirect';
import { fetchCollectionOwnerName } from '@/utils/seo/collectionTitleLookups';

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

  const ownerName = await fetchCollectionOwnerName(parseInt(userId, 10), shareToken);
  const title = ownerName ? `${ownerName}'s Collection - MTG Collection Builder` : 'MTG Collection Builder';
  const description = 'Track and manage your Magic: The Gathering collection!';

  return {
    title: { absolute: title },
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

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sharedUrl = legacyShareRedirect('', await searchParams);
  if (sharedUrl) redirect(sharedUrl);

  const { userId: userIdParam } = await params;
  const userId = parseInt(userIdParam, 10);

  if (!Number.isInteger(userId) || userId < 1) {
    return <div>Invalid user ID</div>;
  }

  return <CollectionClient userId={userId} />;
}
