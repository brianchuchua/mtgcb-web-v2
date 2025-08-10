'use client';

import { ReactNode, useEffect, useState } from 'react';
import { ShareModeProvider } from '@/contexts/ShareModeContext';

interface SharedLayoutProps {
  children: ReactNode;
  params: Promise<{
    token: string;
  }>;
}

export default function SharedLayout({ children, params }: SharedLayoutProps) {
  const [token, setToken] = useState<string>('');

  useEffect(() => {
    params.then((p) => {
      setToken(p.token);
    });
  }, [params]);

  if (!token) {
    return null;
  }

  return (
    <ShareModeProvider token={token} isTokenOnlyMode={true}>
      {children}
    </ShareModeProvider>
  );
}