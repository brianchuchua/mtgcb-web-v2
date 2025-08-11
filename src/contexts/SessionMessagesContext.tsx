'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

interface SessionMessage {
  id: string;
  severity: 'error' | 'warning' | 'info' | 'success';
  title?: string;
  message: string;
  dismissable?: boolean;
  icon?: React.ReactNode;
  displayType?: 'banner' | 'modal' | 'both';
}

interface SessionMessagesContextType {
  messages: SessionMessage[];
  dismissBanner: (id: string) => void;
  dismissModal: (id: string) => void;
  isBannerDismissed: (id: string) => boolean;
  isModalDismissed: (id: string) => boolean;
  isLoaded: boolean;
}

const SessionMessagesContext = createContext<SessionMessagesContextType | undefined>(undefined);

const DISMISSED_BANNERS_KEY = 'mtgcb_dismissed_session_banners';
const DISMISSED_MODALS_KEY = 'mtgcb_dismissed_session_modals';

export const SessionMessagesProvider = ({ children }: { children: React.ReactNode }) => {
  const [dismissedBannerIds, setDismissedBannerIds] = useState<Set<string>>(new Set());
  const [dismissedModalIds, setDismissedModalIds] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load dismissed banners from sessionStorage
    const storedBanners = sessionStorage.getItem(DISMISSED_BANNERS_KEY);
    if (storedBanners) {
      try {
        const ids = JSON.parse(storedBanners);
        setDismissedBannerIds(new Set(ids));
      } catch (e) {
        console.error('Failed to parse dismissed banners', e);
      }
    }
    
    // Load dismissed modals from sessionStorage
    const storedModals = sessionStorage.getItem(DISMISSED_MODALS_KEY);
    if (storedModals) {
      try {
        const ids = JSON.parse(storedModals);
        setDismissedModalIds(new Set(ids));
      } catch (e) {
        console.error('Failed to parse dismissed modals', e);
      }
    }
    
    setIsLoaded(true);
  }, []);

  const dismissBanner = useCallback((id: string) => {
    setDismissedBannerIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      // Save to sessionStorage
      sessionStorage.setItem(DISMISSED_BANNERS_KEY, JSON.stringify(Array.from(next)));
      return next;
    });
  }, []);

  const dismissModal = useCallback((id: string) => {
    setDismissedModalIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      // Save to sessionStorage
      sessionStorage.setItem(DISMISSED_MODALS_KEY, JSON.stringify(Array.from(next)));
      return next;
    });
  }, []);

  const isBannerDismissed = useCallback(
    (id: string) => {
      return dismissedBannerIds.has(id);
    },
    [dismissedBannerIds],
  );

  const isModalDismissed = useCallback(
    (id: string) => {
      return dismissedModalIds.has(id);
    },
    [dismissedModalIds],
  );

  // Define static messages here
  const messages: SessionMessage[] = [
    {
      id: 'beta-environment-warning',
      severity: 'warning',
      title: 'Beta Test Environment',
      message:
        'Do not make real updates to your collection here as any changes made will not be saved permanently. Just play around and feel free to share feedback.',
      dismissable: true,
      displayType: 'both', // Show as both banner and modal
    },
  ];

  return (
    <SessionMessagesContext.Provider value={{ messages, dismissBanner, dismissModal, isBannerDismissed, isModalDismissed, isLoaded }}>
      {children}
    </SessionMessagesContext.Provider>
  );
};

export const useSessionMessages = () => {
  const context = useContext(SessionMessagesContext);
  if (!context) {
    throw new Error('useSessionMessages must be used within SessionMessagesProvider');
  }
  return context;
};
