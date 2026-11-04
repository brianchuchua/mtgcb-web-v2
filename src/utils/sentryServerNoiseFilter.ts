import type { ErrorEvent, EventHint } from '@sentry/nextjs';

// Server-side counterpart to sentryNoiseFilter.ts.
//
// "The destination stream closed early." (MTGCB-WEB-V2-90) is React's message when the visitor
// leaves or navigates on before a server render finishes streaming. The visitor is already gone,
// so there is nothing to fix. Newer Next.js releases catch it as ResponseAborted; ours (16.3.3)
// doesn't, so drop it here. Remove this once Next is upgraded past that change.
export const filterServerSentryNoise = (event: ErrorEvent, hint?: EventHint): ErrorEvent | null => {
  const err = hint?.originalException as Error | undefined;
  const msg = err?.message ?? event.exception?.values?.[0]?.value ?? event.message ?? '';

  if (msg === 'The destination stream closed early.') return null;

  return event;
};
