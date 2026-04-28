// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/
import * as Sentry from '@sentry/nextjs';

if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: 'https://5f8a870814949b413c99e524c3ded043@o128795.ingest.us.sentry.io/4509821372661760',

    // Add optional integrations for additional features
    integrations: [Sentry.replayIntegration()],

    // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
    tracesSampleRate: 0.1,
    // Enable logs to be sent to Sentry
    enableLogs: true,

    // Define how likely Replay events are sampled.
    // This sets the sample rate to be 10%. You may want this to be 100% while
    // in development and sample at a lower rate in production
    replaysSessionSampleRate: 0.1,

    // Define how likely Replay events are sampled when an error occurs.
    replaysOnErrorSampleRate: 1.0,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,

    // Drop browser-extension / in-app-browser / malware noise.
    // Rationale and pattern → issue mapping in
    // docs/techdebt/sentry-noise-filter-plan.md.
    beforeSend(event, hint) {
      const err = hint?.originalException as Error | undefined;
      const msg = err?.message ?? event.message ?? '';
      const frames = event.exception?.values?.[0]?.stacktrace?.frames ?? [];
      const topFrame = frames[frames.length - 1]?.filename ?? '';

      if (/^(chrome-extension|moz-extension|safari-extension|safari-web-extension):/.test(topFrame)) return null;
      if (/injected\.bundle\.js|injectedScript|content_script/.test(topFrame)) return null;

      if (/ethereum|MetaMask|web3|setExternalProvider/.test(msg)) return null;

      if (/(removeChild|insertBefore).*not a child of this node/.test(msg)) return null;
      if (/expected a <body> element/.test(msg)) return null;

      if (/runtime\.sendMessage|Tab not found|postEvent.*Method not found/.test(msg)) return null;
      if (/window\.webkit\.messageHandlers|window\.setDgResult/.test(msg)) return null;

      if (/sevendata\.fun/.test(msg)) return null;

      if (/BodyStreamBuffer was aborted/.test(msg)) return null;

      // Stale-deploy chunk-load errors. ChunkLoadErrorRecovery auto-reloads
      // the page when these fire, so Sentry has no useful signal here.
      if (
        /Loading chunk \d+ failed|Failed to load chunk|ChunkLoadError|Loading CSS chunk \d+ failed|Failed to fetch dynamically imported module|module factory is not available/i.test(
          msg,
        )
      )
        return null;

      // reCAPTCHA v3 script-load timeouts. The provider is mounted at the
      // root layout so the Google script loads on every page, but only auth
      // pages (login/signup/forgot-*) ever call executeRecaptcha. Timeouts
      // on non-auth pages don't block any user action — pure background noise.
      if (/reCAPTCHA Timeout|Verification timed out/i.test(msg)) return null;

      return event;
    },
  });
}
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
