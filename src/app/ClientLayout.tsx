'use client';

import { useEffect } from 'react';
import NoSSRWrapper from '@/components/providers/NoSSRWrapper';
import { DisplaySettingsProvider } from '@/contexts/DisplaySettingsContext';
import { ShareTokenProvider } from '@/contexts/ShareTokenContext';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log(
        `%c
      ███╗   ███╗████████╗ ██████╗      ██████╗██████╗ 
      ████╗ ████║╚══██╔══╝██╔════╝     ██╔════╝██╔══██╗
      ██╔████╔██║   ██║   ██║  ███╗    ██║     ██████╔╝
      ██║╚██╔╝██║   ██║   ██║   ██║    ██║     ██╔══██╗
      ██║ ╚═╝ ██║   ██║   ╚██████╔╝    ╚██████╗██████╔╝
      ╚═╝     ╚═╝   ╚═╝    ╚═════╝      ╚═════╝╚═════╝     
Hello fellow dev! Feel free to check out MTG CB on GitHub. :)
         https://github.com/brianchuchua/mtgcb-web-v2         
`,
        'font-family:monospace;color:#1976d2;font-size:12px;',
      );
    }
  }, []);

  return (
    <NoSSRWrapper>
      <ShareTokenProvider>
        <DisplaySettingsProvider>{children}</DisplaySettingsProvider>
      </ShareTokenProvider>
    </NoSSRWrapper>
  );
}
