import { CollectionSetClient } from './CollectionSetClient';

interface CollectionSetPageProps {
  params: {
    userId: string;
    setSlug: string;
  };
}

export default async function CollectionSetPage({ params }: CollectionSetPageProps) {
  const userId = parseInt(params.userId, 10);
  
  if (isNaN(userId)) {
    return <div>Invalid user ID</div>;
  }

  return <CollectionSetClient userId={userId} setSlug={params.setSlug} />;
}