import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { SITE_NAME } from '@/utils/seo/pageMetadata';

// A plain title here would drop the root template for the create/edit pages below.
export const metadata: Metadata = {
  title: { absolute: `Locations - ${SITE_NAME}`, template: `%s - ${SITE_NAME}` },
};

export default function LocationsLayout({ children }: { children: ReactNode }) {
  return children;
}
