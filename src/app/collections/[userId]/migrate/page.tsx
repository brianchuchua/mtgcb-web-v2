import { Metadata } from 'next';
import MigrateClient from './MigrateClient';

export const metadata: Metadata = {
  title: 'Update Cards - MTG Collection Builder',
  description: 'Apply card data updates to the entries in your collection.',
};

export default async function MigratePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId: userIdParam } = await params;
  const userId = parseInt(userIdParam, 10);

  if (!Number.isInteger(userId) || userId < 1) {
    return <div>Invalid user ID</div>;
  }

  return <MigrateClient userId={userId} />;
}
