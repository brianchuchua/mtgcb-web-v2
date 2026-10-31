import { ReactNode } from 'react';
import { pageMetadata } from '@/utils/seo/pageMetadata';

export const metadata = pageMetadata({
  title: 'Draft Helper',
  description: 'A standalone website that helps you make draft picks using 17Lands data.',
  path: '/draft-helper',
});

export default function DraftHelperLayout({ children }: { children: ReactNode }) {
  return children;
}
