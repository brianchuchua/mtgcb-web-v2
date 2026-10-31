import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = { title: 'Reset Password' };

export default function ResetPasswordLayout({ children }: { children: ReactNode }) {
  return children;
}
