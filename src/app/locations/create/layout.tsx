import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = { title: 'Create Location' };

export default function LocationsCreateLayout({ children }: { children: ReactNode }) {
  return children;
}
