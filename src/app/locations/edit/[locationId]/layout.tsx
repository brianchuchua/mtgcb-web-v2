import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = { title: 'Edit Location' };

export default function LocationsEditLayout({ children }: { children: ReactNode }) {
  return children;
}
