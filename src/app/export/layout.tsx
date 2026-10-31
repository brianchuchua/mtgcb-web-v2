import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = { title: 'Export' };

export default function ExportLayout({ children }: { children: ReactNode }) {
  return children;
}
