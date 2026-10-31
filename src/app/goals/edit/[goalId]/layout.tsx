import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = { title: 'Edit Goal' };

export default function GoalsEditLayout({ children }: { children: ReactNode }) {
  return children;
}
