import { ReactNode } from 'react';
import { pageMetadata } from '@/utils/seo/pageMetadata';

export const metadata = pageMetadata({
  title: 'Changelog',
  description: 'A changelog of every little change and update to MTG Collection Builder.',
  path: '/changelog',
});

export default function ChangelogLayout({ children }: { children: ReactNode }) {
  return children;
}
