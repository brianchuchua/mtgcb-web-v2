import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = { title: 'Reset Collection' };

export default function ResetCollectionLayout({ children }: { children: ReactNode }) {
  return children;
}
