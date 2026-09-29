import type { ErrorEvent, EventHint } from '@sentry/nextjs';

// Drops browser-extension / in-app-browser / malware noise before it reaches Sentry.
// Rationale and pattern → issue mapping in docs/techdebt/sentry-noise-filter-plan.md.
export const filterSentryNoise = (event: ErrorEvent, hint?: EventHint): ErrorEvent | null => {
  const err = hint?.originalException as Error | undefined;
  const msg = err?.message ?? event.exception?.values?.[0]?.value ?? event.message ?? '';
  const frames = event.exception?.values?.[0]?.stacktrace?.frames ?? [];

  if (isThrownFromThirdPartyScript(frames)) return null;
  const topFrame = frames[frames.length - 1]?.filename ?? '';
  if (/injected\.bundle\.js|injectedScript|content_script/.test(topFrame)) return null;

  if (/ethereum|MetaMask|web3|setExternalProvider/.test(msg)) return null;

  if (/(removeChild|insertBefore).*not a child of this node/.test(msg)) return null;
  if (/expected a <body> element/.test(msg)) return null;

  if (/runtime\.sendMessage|Tab not found|postEvent.*Method not found/.test(msg)) return null;
  if (/window\.webkit\.messageHandlers|window\.setDgResult/.test(msg)) return null;
  if (/Java object is gone|Java exception was raised|WKWebView was deallocated/.test(msg)) return null;

  if (/sevendata\.fun|selnor\.fun/.test(msg)) return null;

  // Ad blockers cancelling analytics, and Opera on iOS fetching our image CDN itself.
  if (/^(Load failed|Failed to fetch) \((www\.google-analytics\.com|r2\.mtgcollectionbuilder\.com)\)$/.test(msg)) {
    return null;
  }

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
};

type StackFrame = { filename?: string };

// By the time beforeSend runs, the Next.js SDK has rewritten every frame's origin to `app://`,
// so an extension's `chrome-extension://<id>/content.js` arrives as `app:///content.js` and
// Google's reCAPTCHA as `app:///recaptcha/...`. Our bundle is always under `app:///_next/`.
// Inline scripts in our HTML report the page URL, which has no `.js` ending, so they are kept.
const isThrownFromThirdPartyScript = (frames: StackFrame[]): boolean => {
  const thrownAt = [...frames].reverse().find((frame) => hasRealFilename(frame.filename));
  const filename = thrownAt?.filename;
  if (!filename) return false;
  if (filename.startsWith('app:///_next/')) return false;
  return /\.m?js(\?.*)?$/.test(filename);
};

const hasRealFilename = (filename?: string): filename is string =>
  !!filename && filename !== '<anonymous>' && filename !== '[native code]';
