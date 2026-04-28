import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

const BUILD_SHA =
  process.env.RENDER_GIT_COMMIT ||
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.SOURCE_VERSION ||
  process.env.GIT_SHA ||
  '';

const nextConfig: NextConfig = {
  experimental: {
    reactCompiler: true,
  },
  compiler: {
    emotion: true,
  },
  ...(BUILD_SHA ? { deploymentId: BUILD_SHA } : {}),
  env: {
    NEXT_PUBLIC_BUILD_SHA: BUILD_SHA,
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: 'brian-chuchua',
  project: 'mtgcb-web-v2',

  // Print logs in heroku build output
  silent: false,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: "/monitoring",

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true,
});
