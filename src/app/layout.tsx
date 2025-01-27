import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import type { Metadata } from 'next';
import { Roboto } from 'next/font/google';
import { ReactNode } from 'react';
import Dashboard from '@/components/layout/Dashboard';
import ReCaptchaProvider from '@/components/providers/ReCaptchaProvider';
import SnackbarProvider from '@/components/providers/NotistackProvider';
import StoreProvider from '@/redux/StoreProvider';
import darkTheme from '@/styles/darkTheme';

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
        <link
          href="//cdn.jsdelivr.net/npm/mana-font@latest/css/mana.css"
          rel="stylesheet"
          type="text/css"
        />
        <link
          href="//cdn.jsdelivr.net/npm/keyrune@latest/css/keyrune.css"
          rel="stylesheet"
          type="text/css"
        />
      </head>
      <body className={roboto.variable}>
        <AppRouterCacheProvider>
          <ThemeProvider theme={darkTheme}>
            <CssBaseline enableColorScheme />
            <StoreProvider>
              <ReCaptchaProvider>
                <SnackbarProvider>
                  <Dashboard>{children}</Dashboard>
                </SnackbarProvider>
              </ReCaptchaProvider>
            </StoreProvider>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}