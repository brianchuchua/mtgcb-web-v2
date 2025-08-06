import { redirect } from 'next/navigation';
import CollectionCardClient from './CollectionCardClient';

interface CollectionCardPageProps {
  params: Promise<{
    userId: string;
    cardSlug: string;
    cardId: string;
  }>;
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