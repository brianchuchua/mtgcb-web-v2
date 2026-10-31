import { ReactNode } from 'react';
import { pageMetadata } from '@/utils/seo/pageMetadata';

export const metadata = pageMetadata({
  title: 'FAQ',
  description: 'FAQ for MTG Collection Builder.',
  path: '/faq',
});

export default function FaqLayout({ children }: { children: ReactNode }) {
  return children;
}
