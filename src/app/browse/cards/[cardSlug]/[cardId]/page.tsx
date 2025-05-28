import CardBrowseClient from './CardBrowseClient';

interface CardBrowsePageProps {
  params: Promise<{
    cardSlug: string;
    cardId: string;
  }>;
}

export default async function CardBrowsePage({ params }: CardBrowsePageProps) {
  const { cardId, cardSlug } = await params;
  return <CardBrowseClient cardId={cardId} cardSlug={cardSlug} />;
}