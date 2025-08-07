'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useShareToken } from '@/hooks/useShareToken';

interface ShareTokenContextValue {
  shareToken: string | null;
  shareUserId: string | null;
  isViewingSharedCollection: (userId: string | number) => boolean;
  clearShareToken: () => void;
  appendShareParam: (url: string) => string;
  getShareParams: () => Record<string, string>;
}

const ShareTokenContext = createContext<ShareTokenContextValue | undefined>(undefined);

export const ShareTokenProvider = ({ children }: { children: ReactNode }) => {
  const shareTokenData = useShareToken();

  return (
    <ShareTokenContext.Provider value={shareTokenData}>
      {children}
    </ShareTokenContext.Provider>
  );
};

export const useShareTokenContext = () => {
  const context = useContext(ShareTokenContext);
  if (!context) {
    throw new Error('useShareTokenContext must be used within a ShareTokenProvider');
  }
  return context;
};