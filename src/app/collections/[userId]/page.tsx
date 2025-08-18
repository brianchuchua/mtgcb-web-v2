import { Metadata } from 'next';
import { CollectionClient } from './CollectionClient';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mtgcb.app';

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

  const ogImageUrl = new URL(`${APP_URL}/api/og/collection`);
  ogImageUrl.searchParams.set('userId', userId);
  if (shareToken) {
    ogImageUrl.searchParams.set('shareToken', shareToken);
  }

  const title = 'Collection | MTG Collection Builder';
  const description = 'Track and manage your Magic: The Gathering card collection for free!';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: [
        {
          url: ogImageUrl.toString(),
          width: 1200,
          height: 630,
          alt: 'MTG Collection',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl.toString()],
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
