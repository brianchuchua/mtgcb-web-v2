/**
 * @jest-environment node
 *
 * Route-level regression pins for the 2026-08-31 outage. Every server→API auth
 * proxy route must survive a Cloudflare challenge page (non-JSON upstream body)
 * without collapsing into an opaque 500, and must propagate the API's real
 * status and error when the hop is healthy.
 */
import { NextRequest } from 'next/server';
import { POST as forgotPassword } from '../forgot-password/route';
import { POST as forgotUsername } from '../forgot-username/route';
import { POST as register } from '../register/route';
import { POST as resetPassword } from '../reset-password/route';
import { POST as validatePasswordReset } from '../validate-password-reset/route';
import { GET as apiHopCanary } from '../../health/api-hop/route';

jest.mock('@sentry/nextjs', () => ({
  captureMessage: jest.fn(),
  captureException: jest.fn(),
}));

const CHALLENGE_HTML = '<!DOCTYPE html><html><head><title>Just a moment...</title></head></html>';

const cloudflareChallengeResponse = () =>
  new Response(CHALLENGE_HTML, {
    status: 403,
    headers: { 'content-type': 'text/html; charset=UTF-8', 'cf-mitigated': 'challenge' },
  });

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

const postRequest = (path: string, body: Record<string, unknown>) =>
  new NextRequest(`http://localhost:3000${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

const routes = [
  { name: 'register', handler: register, path: '/api/auth/register', apiPath: '/auth/register' },
  {
    name: 'forgot-password',
    handler: forgotPassword,
    path: '/api/auth/forgot-password',
    apiPath: '/auth/forgot-password',
  },
  {
    name: 'forgot-username',
    handler: forgotUsername,
    path: '/api/auth/forgot-username',
    apiPath: '/auth/forgot-username',
  },
  {
    name: 'reset-password',
    handler: resetPassword,
    path: '/api/auth/reset-password',
    apiPath: '/auth/reset-password',
  },
  {
    name: 'validate-password-reset',
    handler: validatePasswordReset,
    path: '/api/auth/validate-password-reset',
    apiPath: '/auth/validate-password-reset',
  },
] as const;

const originalFetch = global.fetch;
const originalPrivateKey = process.env.MTGCB_API_PRIVATE_KEY;

beforeEach(() => {
  process.env.MTGCB_API_PRIVATE_KEY = 'test-private-key';
});

afterEach(() => {
  global.fetch = originalFetch;
  process.env.MTGCB_API_PRIVATE_KEY = originalPrivateKey;
  jest.clearAllMocks();
});

describe.each(routes)('$name route', ({ handler, path, apiPath }) => {
  it('returns 502 UPSTREAM_UNAVAILABLE (not an opaque 500) for a challenge page', async () => {
    global.fetch = jest.fn().mockResolvedValue(cloudflareChallengeResponse());

    const response = await handler(postRequest(path, { token: 'x' }));

    expect(response.status).toBe(502);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UPSTREAM_UNAVAILABLE');
    expect(body.error.message).not.toBe('An unexpected error occurred');
  });

  it("propagates the API's real error status when the hop is healthy", async () => {
    global.fetch = jest.fn().mockResolvedValue(
      jsonResponse(404, {
        success: false,
        error: { message: 'Invalid or expired reset token', code: 'NOT_FOUND' },
      }),
    );

    const response = await handler(postRequest(path, { token: 'x' }));

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error.message).toBe('Invalid or expired reset token');
  });

  it('injects the private key and calls the matching API path', async () => {
    const fetchMock = jest.fn().mockResolvedValue(jsonResponse(200, { success: true }));
    global.fetch = fetchMock;

    await handler(postRequest(path, { token: 'x' }));

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain(apiPath);
    expect(JSON.parse(init.body as string).privateKey).toBe('test-private-key');
  });

  it('returns 400 for an unparseable request body without calling the API', async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock;

    const response = await handler(
      new NextRequest(`http://localhost:3000${path}`, { method: 'POST', body: 'not json' }),
    );

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('api-hop canary', () => {
  it("reports healthy when the API's own 4xx answer makes it through the hop", async () => {
    global.fetch = jest.fn().mockResolvedValue(
      jsonResponse(404, {
        success: false,
        error: { message: 'Invalid or expired reset token', code: 'NOT_FOUND' },
      }),
    );

    const response = await apiHopCanary();

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toEqual({ hop: 'ok', upstreamStatus: 404 });
  });

  it('reports broken (503) when the hop returns a challenge page', async () => {
    global.fetch = jest.fn().mockResolvedValue(cloudflareChallengeResponse());

    const response = await apiHopCanary();

    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.error.code).toBe('API_HOP_BROKEN');
  });

  it('reports broken (503) when the hop times out', async () => {
    const timeoutError = new Error('timeout');
    timeoutError.name = 'TimeoutError';
    global.fetch = jest.fn().mockRejectedValue(timeoutError);

    const response = await apiHopCanary();

    expect(response.status).toBe(503);
  });
});
