import { ReactNode } from 'react';
import { pageMetadata } from '@/utils/seo/pageMetadata';

export const metadata = pageMetadata({
  title: 'News',
  description: 'Major features and announcements for MTG Collection Builder.',
  path: '/news',
});

export default function NewsLayout({ children }: { children: ReactNode }) {
  return children;
}
