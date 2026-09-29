import * as Sentry from '@sentry/nextjs';
import type { ErrorEvent, EventHint } from '@sentry/nextjs';
import { filterSentryNoise } from '@/utils/sentryNoiseFilter';

/**
 * Frames below are copied from real production events, already rewritten by the SDK the way
 * beforeSend receives them. Frames run oldest → newest; the last real one is where it threw.
 */
describe('filterSentryNoise', () => {
  it('drops an injected script (MTGCB-WEB-V2-8A)', () => {
    const event = errorEvent("Cannot read properties of undefined (reading 'M_ID')", [
      'app:///executors/200.js',
      'app:///executors/200.js',
    ]);
    expect(filterSentryNoise(event)).toBeNull();
  });

  it('drops a browser extension content script (MTGCB-WEB-V2-E)', () => {
    const event = errorEvent("Failed to execute 'appendChild' on 'Node': Unexpected identifier 'API'", [
      'app:///content/neweggagent.js',
      '<anonymous>',
      'app:///content/neweggagent.js',
    ]);
    expect(filterSentryNoise(event)).toBeNull();
  });

  it("drops reCAPTCHA's own errors even when Sentry's wrapper frame is in our bundle (MTGCB-WEB-V2-8J)", () => {
    const event = errorEvent("Cannot read properties of undefined (reading 'DM')", [
      'app:///_next/static/chunks/0f3a9c1e2b.js',
      'app:///recaptcha/releases/8x-4t2pegToiW8KmThtO4AQt/recaptcha__en.js',
      'app:///recaptcha/releases/8x-4t2pegToiW8KmThtO4AQt/recaptcha__en.js',
    ]);
    expect(filterSentryNoise(event)).toBeNull();
  });

  it('drops the selnor.fun data-harvesting extension (MTGCB-WEB-V2-8S)', () => {
    const event = errorEvent('Failed to fetch (selnor.fun)', [
      '<anonymous>',
      '<anonymous>',
      '<anonymous>',
      'app:///_next/static/chunks/0f3a9c1e2b.js',
    ]);
    expect(filterSentryNoise(event)).toBeNull();
  });

  it.each([
    'Load failed (r2.mtgcollectionbuilder.com)',
    'Failed to fetch (www.google-analytics.com)',
  ])('drops the fetch failure %p', (message) => {
    // The SDK appends the host to the thrown error's own message, so it is in the hint too.
    const event = errorEvent(message, ['app:///_next/static/chunks/0f3a9c1e2b.js']);
    expect(filterSentryNoise(event)).toBeNull();
    expect(filterSentryNoise(event, { originalException: new TypeError(message) })).toBeNull();
  });

  it.each([
    'Error invoking postMessage: Java object is gone',
    'Error invoking postMessage: Java exception was raised during method invocation',
    'The WKWebView was deallocated before the message was delivered',
  ])('drops the in-app browser bridge error %p', (message) => {
    expect(filterSentryNoise(errorEvent(message, []))).toBeNull();
  });

  it('keeps an error thrown by our own code', () => {
    const event = errorEvent('RangeError: Maximum call stack size exceeded.', [
      'app:///_next/static/chunks/0f3a9c1e2b.js',
      '[native code]',
      'app:///_next/static/chunks/0f3a9c1e2b.js',
    ]);
    expect(filterSentryNoise(event)).toBe(event);
  });

  it('keeps an error from our inline scripts, which report the page URL', () => {
    const event = errorEvent('Something broke', ['app:///collections/65960']);
    expect(filterSentryNoise(event)).toBe(event);
  });

  it('keeps a failed fetch to our own API', () => {
    const event = errorEvent('Failed to fetch (mtgcb-api-v3.mtgcollectionbuilder.com)', [
      'app:///_next/static/chunks/0f3a9c1e2b.js',
    ]);
    expect(filterSentryNoise(event)).toBe(event);
  });

  it('keeps an error with no stack', () => {
    const event = errorEvent('Something broke', []);
    expect(filterSentryNoise(event)).toBe(event);
  });
});

/**
 * Runs raw browser stack traces through the real SDK so the frame rewriting that happens
 * before beforeSend is part of the test, not an assumption.
 */
describe('filterSentryNoise inside the Sentry SDK', () => {
  const seen: { filenames: string[]; kept: boolean }[] = [];

  beforeAll(() => {
    Sentry.init({
      dsn: 'https://public@o0.ingest.sentry.io/0',
      // jsdom has no Performance timeline for web-vitals; tracing is irrelevant here.
      integrations: (defaults) => defaults.filter((integration) => integration.name !== 'BrowserTracing'),
      beforeSend: (event, hint) => {
        const frames = event.exception?.values?.[0]?.stacktrace?.frames ?? [];
        seen.push({
          filenames: frames.map((frame) => frame.filename ?? ''),
          kept: filterSentryNoise(event, hint) !== null,
        });
        return null;
      },
    });
  });

  afterAll(() => Sentry.close());

  beforeEach(() => {
    seen.length = 0;
  });

  it('rewrites our chunks to app:///_next/ and keeps their errors', async () => {
    await capture("TypeError: Cannot read properties of null (reading 'id')", [
      'https://www.mtgcollectionbuilder.com/_next/static/chunks/0f3a9c1e2b.js:1:1442',
    ]);

    expect(seen[0].filenames).toEqual(['app:///_next/static/chunks/0f3a9c1e2b.js']);
    expect(seen[0].kept).toBe(true);
  });

  it("rewrites Google's reCAPTCHA script to app:///recaptcha/ and drops its errors", async () => {
    await capture("TypeError: Cannot read properties of undefined (reading 'DM')", [
      'https://www.gstatic.com/recaptcha/releases/8x-4t2pegToiW8KmThtO4AQt/recaptcha__en.js:1642:261',
      'https://www.mtgcollectionbuilder.com/_next/static/chunks/0f3a9c1e2b.js:1:900',
    ]);

    expect(seen[0].filenames).toEqual([
      'app:///_next/static/chunks/0f3a9c1e2b.js',
      'app:///recaptcha/releases/8x-4t2pegToiW8KmThtO4AQt/recaptcha__en.js',
    ]);
    expect(seen[0].kept).toBe(false);
  });

  it('keeps errors from inline scripts in our HTML', async () => {
    await capture('Error: inline script failed', [`${window.location.origin}/collections/65960:12:5`]);

    expect(seen[0].filenames).toEqual(['app:///collections/65960']);
    expect(seen[0].kept).toBe(true);
  });
});

const errorEvent = (message: string, filenames: string[]): ErrorEvent => ({
  type: undefined,
  exception: {
    values: [{ type: 'Error', value: message, stacktrace: { frames: filenames.map((filename) => ({ filename })) } }],
  },
});

// Chrome stack format, newest frame first, as the browser produces it.
const capture = async (firstLine: string, locations: string[]) => {
  const error = new Error(firstLine.replace(/^\w+: /, ''));
  error.stack = [firstLine, ...locations.map((location) => `    at fn (${location})`)].join('\n');
  Sentry.captureException(error, {} as EventHint);
  await Sentry.flush(1000);
};
