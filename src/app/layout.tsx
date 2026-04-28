import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { GoogleAnalytics } from '@next/third-parties/google';
import type { Metadata } from 'next';
import { Roboto } from 'next/font/google';
import { ReactNode } from 'react';
import ClientLayout from './ClientLayout';
import Dashboard from '@/components/layout/Dashboard';
import ChunkLoadErrorRecovery from '@/components/providers/ChunkLoadErrorRecovery';
import NewVersionAvailable from '@/components/providers/NewVersionAvailable';
import SnackbarProvider from '@/components/providers/NotistackProvider';
import ReCaptchaProvider from '@/components/providers/ReCaptchaProvider';
import { TCGPlayerProvider } from '@/context/TCGPlayerContext';
import { SessionMessagesProvider } from '@/contexts/SessionMessagesContext';
import StoreProvider from '@/redux/StoreProvider';
import darkTheme from '@/styles/darkTheme';

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto',
});

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const ENABLE_GA = process.env.NEXT_PUBLIC_ENABLE_GA === 'true';

export const metadata: Metadata = {
  title: 'MTG Collection Builder',
  description: "Track your Magic: the Gathering collection's value for free!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link href="//cdn.jsdelivr.net/npm/mana-font@latest/css/mana.css" rel="stylesheet" type="text/css" />
        <link href="//cdn.jsdelivr.net/npm/keyrune@latest/css/keyrune.css" rel="stylesheet" type="text/css" />
        <meta name="apple-mobile-web-app-title" content="MTG CB" />
        <script
          id="chunk-load-recovery"
          dangerouslySetInnerHTML={{
            __html: `(function(){var KEY='mtgcb:chunk-reload',COOLDOWN=60000,P=/Loading chunk \\d+ failed|Failed to load chunk|ChunkLoadError|Loading CSS chunk \\d+ failed|Failed to fetch dynamically imported module|module factory is not available/i;function isErr(v){if(!v)return false;if(typeof v==='object'){if(v.name==='ChunkLoadError')return true;if(typeof v.message==='string'&&P.test(v.message))return true;}if(typeof v==='string'&&P.test(v))return true;return false;}function recent(){try{var l=window.sessionStorage.getItem(KEY);return!!l&&Date.now()-Number(l)<COOLDOWN;}catch(e){return false;}}function go(){if(recent())return;try{window.sessionStorage.setItem(KEY,String(Date.now()));}catch(e){}window.location.reload();}window.addEventListener('error',function(e){if(e&&e.target&&e.target.tagName==='SCRIPT'){var s=e.target.src||'';if(/\\/_next\\/static\\/chunks\\//.test(s)){go();return;}}if(isErr(e.error||e.message))go();},true);window.addEventListener('unhandledrejection',function(e){if(isErr(e.reason))go();});})();`,
          }}
        />
      </head>
      <body className={roboto.variable}>
        <AppRouterCacheProvider>
          <ThemeProvider theme={darkTheme}>
            <CssBaseline enableColorScheme />
            <StoreProvider>
              <ClientLayout>
                <ReCaptchaProvider>
                  <SnackbarProvider>
                    <ChunkLoadErrorRecovery />
                    <NewVersionAvailable />
                    <TCGPlayerProvider>
                      <SessionMessagesProvider>
                        <Dashboard>{children}</Dashboard>
                      </SessionMessagesProvider>
                    </TCGPlayerProvider>
                  </SnackbarProvider>
                </ReCaptchaProvider>
              </ClientLayout>
            </StoreProvider>
          </ThemeProvider>
        </AppRouterCacheProvider>
        {ENABLE_GA && GA_ID && <GoogleAnalytics gaId={GA_ID} />}
      </body>
    </html>
  );
}
