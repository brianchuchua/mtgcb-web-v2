import { CollectionClient } from './CollectionClient';

export default async function CollectionPage({
  params,
}: {
  params: { userId: string };
}) {
  const userId = parseInt(params.userId, 10);
  
  if (isNaN(userId)) {
    return <div>Invalid user ID</div>;
  }

  return <CollectionClient userId={userId} />;
}
