import { ReactNode } from 'react';
import { pageMetadata } from '@/utils/seo/pageMetadata';

export const metadata = pageMetadata({
  title: 'Add or Remove Cards',
  description: 'A page to quickly add individual cards into your collection.',
});

export default function CollectionsEditCardsLayout({ children }: { children: ReactNode }) {
  return children;
}
