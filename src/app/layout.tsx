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
            __html: `(function(){var STATE_KEY='mtgcb:chunk-recovery',OUR_RELOAD_KEY='mtgcb:chunk-our-reload',SCHEDULED_FLAG='__mtgcbChunkScheduled',MAX_ATTEMPTS=4,SCHEDULES=[0,3000,10000,30000],RESET_AFTER_MS=30000,P=/Loading chunk \\d+ failed|Failed to load chunk|ChunkLoadError|Loading CSS chunk \\d+ failed|Failed to fetch dynamically imported module|module factory is not available/i;function isErr(v){if(!v)return false;if(typeof v==='object'){if(v.name==='ChunkLoadError')return true;if(typeof v.message==='string'&&P.test(v.message))return true;}if(typeof v==='string'&&P.test(v))return true;return false;}function readState(){try{var raw=window.sessionStorage.getItem(STATE_KEY);if(!raw)return{attempts:0};var s=JSON.parse(raw);return{attempts:s.attempts||0};}catch(e){return{attempts:0};}}function writeState(s){try{window.sessionStorage.setItem(STATE_KEY,JSON.stringify(s));}catch(e){}}try{var ourReload=window.sessionStorage.getItem(OUR_RELOAD_KEY);window.sessionStorage.removeItem(OUR_RELOAD_KEY);if(!ourReload)writeState({attempts:0});}catch(e){}function ensureKeyframes(){if(document.getElementById('mtgcb-chunk-style'))return;var style=document.createElement('style');style.id='mtgcb-chunk-style';style.textContent='@keyframes mtgcb-spin{to{transform:rotate(360deg)}}';if(document.head)document.head.appendChild(style);}function showLoading(){if(document.getElementById('mtgcb-chunk-loading'))return;ensureKeyframes();var el=document.createElement('div');el.id='mtgcb-chunk-loading';el.setAttribute('role','status');el.setAttribute('aria-live','polite');el.style.cssText='position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:2147483646;display:flex;align-items:center;gap:12px;padding:16px 20px;background:rgba(0,0,0,0.85);color:#fff;font:14px/1.4 -apple-system,Roboto,sans-serif;border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,0.3);max-width:90vw;box-sizing:border-box';el.innerHTML='<div style="width:18px;height:18px;border:2px solid rgba(255,255,255,0.25);border-top-color:#fff;border-radius:50%;animation:mtgcb-spin 0.8s linear infinite;flex-shrink:0"></div><span>Loading the latest version&hellip;</span>';function add(){if(document.body&&!document.getElementById('mtgcb-chunk-loading'))document.body.appendChild(el);}if(document.body)add();else document.addEventListener('DOMContentLoaded',add);}function showBanner(){if(document.getElementById('mtgcb-chunk-banner'))return;var b=document.createElement('div');b.id='mtgcb-chunk-banner';b.style.cssText='position:fixed;top:0;left:0;right:0;z-index:2147483647;padding:12px 16px;background:#b71c1c;color:#fff;font:14px/1.4 -apple-system,Roboto,sans-serif;text-align:center;box-shadow:0 2px 4px rgba(0,0,0,.3)';b.innerHTML='We had trouble loading the latest version. <a href="javascript:window.location.reload()" style="color:#fff;text-decoration:underline;font-weight:bold">Refresh the page</a> to try again.';function add(){if(document.body)document.body.appendChild(b);}if(document.body)add();else document.addEventListener('DOMContentLoaded',add);}function go(){if(window[SCHEDULED_FLAG])return;var state=readState();if(state.attempts>=MAX_ATTEMPTS){showBanner();return;}var delay=SCHEDULES[state.attempts]!=null?SCHEDULES[state.attempts]:SCHEDULES[SCHEDULES.length-1];state.attempts+=1;writeState(state);window[SCHEDULED_FLAG]=true;showLoading();setTimeout(function(){try{window.sessionStorage.setItem(OUR_RELOAD_KEY,'1');}catch(e){}window.location.reload();},delay);}setTimeout(function(){if(window[SCHEDULED_FLAG])return;var state=readState();if(state.attempts>0)writeState({attempts:0});},RESET_AFTER_MS);window.addEventListener('error',function(e){if(e&&e.target&&e.target.tagName==='SCRIPT'){var s=e.target.src||'';if(/\\/_next\\/static\\/chunks\\//.test(s)){go();return;}}if(isErr(e.error||e.message))go();},true);window.addEventListener('unhandledrejection',function(e){if(isErr(e.reason))go();});})();`,
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
