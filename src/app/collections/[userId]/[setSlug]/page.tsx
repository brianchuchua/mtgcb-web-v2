import { CollectionSetClient } from './CollectionSetClient';

interface CollectionSetPageProps {
  params: Promise<{
    userId: string;
    setSlug: string;
  }>;
}

export default async function CollectionSetPage({ params }: CollectionSetPageProps) {
  const { userId: userIdParam, setSlug } = await params;
  const userId = parseInt(userIdParam, 10);
  
  if (isNaN(userId)) {
    return <div>Invalid user ID</div>;
  }

  return <CollectionSetClient userId={userId} setSlug={setSlug} />;
}