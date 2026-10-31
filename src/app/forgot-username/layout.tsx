import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = { title: 'Forgot Username' };

export default function ForgotUsernameLayout({ children }: { children: ReactNode }) {
  return children;
}
