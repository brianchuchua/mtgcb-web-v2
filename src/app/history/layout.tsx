import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = { title: 'History' };

export default function HistoryLayout({ children }: { children: ReactNode }) {
  return children;
}
