'use client';

import { DisplaySettingsProvider } from '@/contexts/DisplaySettingsContext';
import NoSSRWrapper from '@/components/providers/NoSSRWrapper';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <NoSSRWrapper>
      <DisplaySettingsProvider>
        {children}
      </DisplaySettingsProvider>
    </NoSSRWrapper>
  );
}