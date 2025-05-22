import CardBrowseClient from './CardBrowseClient';

interface CardBrowsePageProps {
  params: {
    cardSlug: string;
    cardId: string;
  };
}

export default function CardBrowsePage({ params }: CardBrowsePageProps) {
  return <CardBrowseClient cardId={params.cardId} cardSlug={params.cardSlug} />;
}