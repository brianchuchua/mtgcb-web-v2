import { ReactNode } from 'react';
import { pageMetadata } from '@/utils/seo/pageMetadata';

export const metadata = pageMetadata({
  title: 'Roadmap',
  description: "MTG Collection Builder's roadmap.",
  path: '/roadmap',
});

export default function RoadmapLayout({ children }: { children: ReactNode }) {
  return children;
}
