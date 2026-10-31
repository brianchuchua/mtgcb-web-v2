import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = { title: 'Import' };

export default function ImportLayout({ children }: { children: ReactNode }) {
  return children;
}
