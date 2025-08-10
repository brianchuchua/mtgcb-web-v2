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
  dismissMessage: (id: string) => void;
  isDismissed: (id: string) => boolean;
  isLoaded: boolean;
}

const SessionMessagesContext = createContext<SessionMessagesContextType | undefined>(undefined);

const DISMISSED_MESSAGES_KEY = 'mtgcb_dismissed_session_messages';

export const SessionMessagesProvider = ({ children }: { children: React.ReactNode }) => {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load dismissed messages from sessionStorage
    const stored = sessionStorage.getItem(DISMISSED_MESSAGES_KEY);
    if (stored) {
      try {
        const ids = JSON.parse(stored);
        setDismissedIds(new Set(ids));
      } catch (e) {
        console.error('Failed to parse dismissed messages', e);
      }
    }
    setIsLoaded(true);
  }, []);

  const dismissMessage = useCallback((id: string) => {
    setDismissedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      // Save to sessionStorage
      sessionStorage.setItem(DISMISSED_MESSAGES_KEY, JSON.stringify(Array.from(next)));
      return next;
    });
  }, []);

  const isDismissed = useCallback(
    (id: string) => {
      return dismissedIds.has(id);
    },
    [dismissedIds],
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
    <SessionMessagesContext.Provider value={{ messages, dismissMessage, isDismissed, isLoaded }}>
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
