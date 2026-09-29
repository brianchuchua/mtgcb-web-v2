// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/
import * as Sentry from '@sentry/nextjs';
import { filterSentryNoise } from '@/utils/sentryNoiseFilter';

if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: 'https://5f8a870814949b413c99e524c3ded043@o128795.ingest.us.sentry.io/4509821372661760',

    // Add optional integrations for additional features
    integrations: [Sentry.replayIntegration()],

    // 1% sampling. Quota is 5M spans/month shared with mtgcb-api-v3 and
    // PAYG is disabled. At 10% the org burned its cap in 13 days.
    tracesSampleRate: 0.01,
    // Enable logs to be sent to Sentry
    enableLogs: true,

    // Replay quota is 50/month with PAYG disabled. Background sampling is off;
    // we only capture a small fraction of sessions that hit an error.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0.05,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,

    beforeSend: filterSentryNoise,
  });
}
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
