import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { GoogleAnalytics } from '@next/third-parties/google';
import type { Metadata } from 'next';
import { Roboto } from 'next/font/google';
import { ReactNode } from 'react';
import ClientLayout from './ClientLayout';
import Dashboard from '@/components/layout/Dashboard';
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
      </head>
      <body className={roboto.variable}>
        <AppRouterCacheProvider>
          <ThemeProvider theme={darkTheme}>
            <CssBaseline enableColorScheme />
            <StoreProvider>
              <ClientLayout>
                <ReCaptchaProvider>
                  <SnackbarProvider>
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
