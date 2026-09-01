/**
 * @jest-environment node
 *
 * Regression pins for the 2026-08-31 outage: Cloudflare's Managed Challenge
 * intercepted server→API fetches with an HTML interstitial, and `.json()`
 * before the status check turned it into an opaque 500 that Sentry never saw.
 * These tests replay that exact response shape.
 */
import * as Sentry from '@sentry/nextjs';
import {
  getServerApiBaseUrl,
  postToMtgcbApi,
  proxyPostToMtgcbApi,
} from '../mtgcbApiServer';

jest.mock('@sentry/nextjs', () => ({
  captureMessage: jest.fn(),
  captureException: jest.fn(),
}));

const CHALLENGE_HTML =
  '<!DOCTYPE html><html><head><title>Just a moment...</title></head>' +
  "<body>window._cf_chl_opt = { cType: 'managed' }</body></html>";

const cloudflareChallengeResponse = () =>
  new Response(CHALLENGE_HTML, {
    status: 403,
    headers: {
      'content-type': 'text/html; charset=UTF-8',
      'cf-mitigated': 'challenge',
    },
  });

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  delete process.env.MTGCB_API_SERVER_URL;
  jest.clearAllMocks();
});

describe('getServerApiBaseUrl', () => {
  it('prefers the server-only URL over the browser-bundle URL', () => {
    process.env.MTGCB_API_SERVER_URL = 'http://mtgcb-api-v3:10000';
    expect(getServerApiBaseUrl()).toBe('http://mtgcb-api-v3:10000');
  });

  it('falls back to the public URL when the server-only URL is unset', () => {
    expect(getServerApiBaseUrl()).toBe(process.env.NEXT_PUBLIC_MTGCB_API_BASE_URL);
  });
});

describe('postToMtgcbApi', () => {
  it('returns the parsed envelope for a JSON response', async () => {
    global.fetch = jest.fn().mockResolvedValue(jsonResponse(200, { success: true, data: { userId: 1 } }));

    const result = await postToMtgcbApi('/auth/register', { username: 'x' });

    expect(result).toEqual({
      kind: 'json',
      status: 200,
      data: { success: true, data: { userId: 1 } },
    });
  });

  it('classifies a Cloudflare challenge page as non-json with the cf-mitigated header', async () => {
    global.fetch = jest.fn().mockResolvedValue(cloudflareChallengeResponse());

    const result = await postToMtgcbApi('/auth/register', {});

    expect(result.kind).toBe('non-json');
    if (result.kind !== 'non-json') return;
    expect(result.status).toBe(403);
    expect(result.cfMitigated).toBe('challenge');
    expect(result.bodySnippet).toContain('Just a moment');
  });

  it('classifies a body that claims JSON but does not parse as non-json', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      new Response('<!DOCTYPE html>', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const result = await postToMtgcbApi('/auth/register', {});

    expect(result.kind).toBe('non-json');
  });

  it('classifies a timeout distinctly from other network errors', async () => {
    const timeoutError = new Error('The operation was aborted due to timeout');
    timeoutError.name = 'TimeoutError';
    global.fetch = jest.fn().mockRejectedValue(timeoutError);

    const result = await postToMtgcbApi('/auth/register', {});

    expect(result).toMatchObject({ kind: 'network-error', reason: 'timeout' });
  });

  it('classifies a connection failure as fetch-failed', async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError('fetch failed'));

    const result = await postToMtgcbApi('/auth/register', {});

    expect(result).toMatchObject({ kind: 'network-error', reason: 'fetch-failed' });
  });

  it('sends the request to the server-only URL when configured', async () => {
    process.env.MTGCB_API_SERVER_URL = 'http://mtgcb-api-v3:10000';
    const fetchMock = jest.fn().mockResolvedValue(jsonResponse(200, { success: true }));
    global.fetch = fetchMock;

    await postToMtgcbApi('/auth/register', {});

    expect(fetchMock).toHaveBeenCalledWith(
      'http://mtgcb-api-v3:10000/auth/register',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});

describe('proxyPostToMtgcbApi', () => {
  it('passes through a successful API response', async () => {
    global.fetch = jest.fn().mockResolvedValue(jsonResponse(200, { success: true, data: { ok: 1 } }));

    const response = await proxyPostToMtgcbApi('/auth/register', {});

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, data: { ok: 1 } });
  });

  it("propagates the API's own error status and message", async () => {
    global.fetch = jest.fn().mockResolvedValue(
      jsonResponse(401, {
        success: false,
        error: { message: 'Recaptcha verification failed', code: 'UNAUTHORIZED' },
      }),
    );

    const response = await proxyPostToMtgcbApi('/auth/register', {});

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error.message).toBe('Recaptcha verification failed');
  });

  it('never returns an opaque 500 for a Cloudflare challenge page', async () => {
    global.fetch = jest.fn().mockResolvedValue(cloudflareChallengeResponse());

    const response = await proxyPostToMtgcbApi('/auth/register', {});

    expect(response.status).toBe(502);
    const body = await response.json();
    expect(body.error.code).toBe('UPSTREAM_UNAVAILABLE');
    expect(body.error.code).not.toBe('INTERNAL_SERVER_ERROR');
  });

  it('reports a challenge interception to Sentry tagged as edge-challenge', async () => {
    global.fetch = jest.fn().mockResolvedValue(cloudflareChallengeResponse());

    await proxyPostToMtgcbApi('/auth/register', {});

    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      expect.stringContaining('edge-challenge'),
      expect.objectContaining({
        level: 'error',
        tags: expect.objectContaining({ hop: 'server-to-api', reason: 'edge-challenge' }),
      }),
    );
  });

  it('reports non-challenge HTML bodies to Sentry tagged as non-json-body', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      new Response('<html>Bad gateway</html>', {
        status: 502,
        headers: { 'content-type': 'text/html' },
      }),
    );

    await proxyPostToMtgcbApi('/auth/register', {});

    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      expect.stringContaining('non-json-body'),
      expect.objectContaining({
        tags: expect.objectContaining({ reason: 'non-json-body' }),
      }),
    );
  });

  it('returns 504 on upstream timeout', async () => {
    const timeoutError = new Error('timeout');
    timeoutError.name = 'TimeoutError';
    global.fetch = jest.fn().mockRejectedValue(timeoutError);

    const response = await proxyPostToMtgcbApi('/auth/register', {});

    expect(response.status).toBe(504);
    const body = await response.json();
    expect(body.error.code).toBe('UPSTREAM_UNAVAILABLE');
    expect(Sentry.captureMessage).toHaveBeenCalled();
  });
});
