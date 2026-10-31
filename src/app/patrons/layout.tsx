import { ReactNode } from 'react';
import { pageMetadata } from '@/utils/seo/pageMetadata';

export const metadata = pageMetadata({
  title: 'Patrons',
  description: 'Join fellow Patrons in keeping MTG Collection Builder ad-free!',
  path: '/patrons',
});

export default function PatronsLayout({ children }: { children: ReactNode }) {
  return children;
}
