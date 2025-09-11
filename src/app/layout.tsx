import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import type { Metadata } from 'next';
import { Roboto } from 'next/font/google';
import { ReactNode } from 'react';
import Dashboard from '@/components/layout/Dashboard';
import SnackbarProvider from '@/components/providers/NotistackProvider';
import ReCaptchaProvider from '@/components/providers/ReCaptchaProvider';
import ClientLayout from './ClientLayout';
import { TCGPlayerProvider } from '@/context/TCGPlayerContext';
import StoreProvider from '@/redux/storeProvider';
import darkTheme from '@/styles/darkTheme';
import { SessionMessagesProvider } from '@/contexts/SessionMessagesContext';

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto',
});

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
      </body>
    </html>
  );
}
