import { CollectionClient } from './CollectionClient';

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId: userIdParam } = await params;
  const userId = parseInt(userIdParam, 10);
  
  if (isNaN(userId)) {
    return <div>Invalid user ID</div>;
  }

  return <CollectionClient userId={userId} />;
}
