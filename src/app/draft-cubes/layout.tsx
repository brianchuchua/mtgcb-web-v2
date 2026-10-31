import { ReactNode } from 'react';
import { pageMetadata } from '@/utils/seo/pageMetadata';

export const metadata = pageMetadata({
  title: 'Draft Cubes',
  description: 'A guide on Draft Cubes - a way to draft the same set over and over for free.',
  path: '/draft-cubes',
});

export default function DraftCubesLayout({ children }: { children: ReactNode }) {
  return children;
}
