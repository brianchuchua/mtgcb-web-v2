'use client';

import { createContext, useContext, ReactNode, useMemo, useCallback, useEffect } from 'react';
import { setShareModeConfig } from '@/utils/collectionUrls';

interface ShareModeContextType {
  isTokenOnlyMode: boolean;
  shareToken: string | null;
  getCollectionUrl: (path?: string) => string;
}

const ShareModeContext = createContext<ShareModeContextType>({
  isTokenOnlyMode: false,
  shareToken: null,
  getCollectionUrl: (path) => path || '/',
});

export const useShareMode = () => useContext(ShareModeContext);

interface ShareModeProviderProps {
  children: ReactNode;
  token: string | null;
  isTokenOnlyMode: boolean;
}

export function ShareModeProvider({ 
  children, 
  token, 
  isTokenOnlyMode 
}: ShareModeProviderProps) {
  // Update the global share mode config when the context changes
  useEffect(() => {
    setShareModeConfig(isTokenOnlyMode, token);
    
    // Cleanup on unmount
    return () => {
      setShareModeConfig(false, null);
    };
  }, [isTokenOnlyMode, token]);

  const getCollectionUrl = useCallback((path?: string) => {
    if (!isTokenOnlyMode || !token) {
      return path || '/';
    }

    const basePath = `/shared/${token}`;
    
    if (!path) {
      return basePath;
    }

    if (path.startsWith('/')) {
      return `${basePath}${path}`;
    }

    return `${basePath}/${path}`;
  }, [isTokenOnlyMode, token]);

  const value = useMemo(() => ({
    isTokenOnlyMode,
    shareToken: token,
    getCollectionUrl,
  }), [isTokenOnlyMode, token, getCollectionUrl]);

  return (
    <ShareModeContext.Provider value={value}>
      {children}
    </ShareModeContext.Provider>
  );
}