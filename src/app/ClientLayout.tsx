'use client';

import { DisplaySettingsProvider } from '@/contexts/DisplaySettingsContext';
import { ShareTokenProvider } from '@/contexts/ShareTokenContext';
import NoSSRWrapper from '@/components/providers/NoSSRWrapper';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <NoSSRWrapper>
      <ShareTokenProvider>
        <DisplaySettingsProvider>
          {children}
        </DisplaySettingsProvider>
      </ShareTokenProvider>
    </NoSSRWrapper>
  );
}