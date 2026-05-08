import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

const BUILD_SHA =
  process.env.RENDER_GIT_COMMIT ||
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.SOURCE_VERSION ||
  process.env.GIT_SHA ||
  '';

const nextConfig: NextConfig = {
  reactCompiler: true,
  compiler: {
    emotion: true,
  },
  env: {
    NEXT_PUBLIC_BUILD_SHA: BUILD_SHA,
  },
  allowedDevOrigins: ['local.mtgcb.com'],
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  org: 'brian-chuchua',
  project: 'mtgcb-web-v2',

  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Print logs in build output
  silent: false,

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Note: disableLogger and automaticVercelMonitors are Webpack-only and were removed
  // when migrating to Turbopack-default in Next.js 16. Re-add under a `webpack: {}` block
  // if we ever switch back to Webpack.
});
