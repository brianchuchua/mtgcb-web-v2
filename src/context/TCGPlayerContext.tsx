'use client';

import { createContext, useCallback, useContext, ReactNode } from 'react';

const TCGPLAYER_AFFILIATE_URL = 'https://partner.tcgplayer.com/c/5252996/1830156/21018';

interface TCGPlayerContextType {
  submitToTCGPlayer: (importString: string, target?: string) => void;
}

const TCGPlayerContext = createContext<TCGPlayerContextType | null>(null);

interface TCGPlayerProviderProps {
  children: ReactNode;
}

export const TCGPlayerProvider = ({ children }: TCGPlayerProviderProps) => {
  const submitToTCGPlayer = useCallback((importString: string, target: string = '_blank') => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    
    const tempForm = document.createElement('form');
    tempForm.method = 'post';
    tempForm.action = 'https://store.tcgplayer.com/massentry';
    tempForm.target = target;
    tempForm.style.display = 'none';
    
    const inputC = document.createElement('input');
    inputC.type = 'hidden';
    inputC.name = 'c';
    inputC.value = importString;
    
    const inputAffiliateUrl = document.createElement('input');
    inputAffiliateUrl.type = 'hidden';
    inputAffiliateUrl.name = 'affiliateurl';
    inputAffiliateUrl.value = TCGPLAYER_AFFILIATE_URL;
    
    tempForm.appendChild(inputC);
    tempForm.appendChild(inputAffiliateUrl);
    document.body.appendChild(tempForm);
    
    try {
      tempForm.submit();
    } catch (error) {
      // Ignore errors
    }
    
    setTimeout(() => {
      if (document.body.contains(tempForm)) {
        document.body.removeChild(tempForm);
      }
    }, 1000);
  }, []);

  return (
    <TCGPlayerContext.Provider value={{ submitToTCGPlayer }}>
      {children}
    </TCGPlayerContext.Provider>
  );
};

export const useTCGPlayer = (): TCGPlayerContextType => {
  const context = useContext(TCGPlayerContext);
  
  if (!context) {
    throw new Error('useTCGPlayer must be used within a TCGPlayerProvider');
  }
  
  return context;
};