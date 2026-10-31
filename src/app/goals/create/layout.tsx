import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = { title: 'Create Goal' };

export default function GoalsCreateLayout({ children }: { children: ReactNode }) {
  return children;
}
