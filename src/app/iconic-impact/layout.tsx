import { ReactNode } from 'react';
import { pageMetadata } from '@/utils/seo/pageMetadata';

export const metadata = pageMetadata({
  title: 'Iconic Impact',
  description: 'A fan-made game for learning Magic: The Gathering set icons. Requires a physical keyboard.',
  path: '/iconic-impact',
});

export default function IconicImpactLayout({ children }: { children: ReactNode }) {
  return children;
}
