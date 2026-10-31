import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = { title: 'Log In' };

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children;
}
