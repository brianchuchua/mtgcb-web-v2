import { ReactNode } from 'react';
import { pageMetadata } from '@/utils/seo/pageMetadata';

export const metadata = pageMetadata({
  title: 'Binder Templates',
  description: 'Printable binder covers and spine labels for Magic: The Gathering sets.',
  path: '/binder-templates',
});

export default function BinderTemplatesLayout({ children }: { children: ReactNode }) {
  return children;
}
