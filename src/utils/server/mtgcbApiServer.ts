import * as Sentry from '@sentry/nextjs';
import { NextResponse } from 'next/server';

// Server-side calls to the MTG CB API. Never parse the upstream body before
// checking it is JSON: on 2026-08-31 Cloudflare's Managed Challenge intercepted
// this hop and returned an HTML interstitial, and a bare `.json()` turned that
// into an opaque 500 that Sentry never saw. See tests for the pinned behavior.

const DEFAULT_TIMEOUT_MS = 10_000;

export type MtgcbApiResult =
  | { kind: 'json'; status: number; data: MtgcbApiEnvelope }
  | {
      kind: 'non-json';
      status: number;
      contentType: string;
      cfMitigated: string | null;
      bodySnippet: string;
    }
  | { kind: 'network-error'; reason: 'timeout' | 'fetch-failed'; message: string };

export interface MtgcbApiEnvelope {
  success?: boolean;
  data?: unknown;
  error?: unknown;
}

// MTGCB_API_SERVER_URL is the Render private-network address (server-only, no
// Cloudflare in the path). NEXT_PUBLIC_MTGCB_API_BASE_URL is inlined into the
// browser bundle and must keep pointing at the public hostname.
export const getServerApiBaseUrl = (): string =>
  process.env.MTGCB_API_SERVER_URL || process.env.NEXT_PUBLIC_MTGCB_API_BASE_URL || '';

export const proxyPostToMtgcbApi = async (
  path: string,
  body: Record<string, unknown>,
): Promise<NextResponse> => {
  const result = await postToMtgcbApi(path, body);

  if (result.kind === 'json') {
    if (result.status >= 200 && result.status < 300) {
      return NextResponse.json(result.data, { status: result.status });
    }
    return NextResponse.json(
      { success: false, error: result.data.error },
      { status: result.status },
    );
  }

  reportUpstreamFailure(path, result);

  const status = result.kind === 'network-error' && result.reason === 'timeout' ? 504 : 502;
  return NextResponse.json(
    {
      success: false,
      error: {
        message: 'MTG CB could not reach its API. Please try again in a few minutes.',
        code: 'UPSTREAM_UNAVAILABLE',
      },
    },
    { status },
  );
};

export const postToMtgcbApi = async (
  path: string,
  body: Record<string, unknown>,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<MtgcbApiResult> => {
  let response: Response;
  try {
    response = await fetch(`${getServerApiBaseUrl()}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === 'TimeoutError';
    return {
      kind: 'network-error',
      reason: isTimeout ? 'timeout' : 'fetch-failed',
      message: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
    };
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return {
      kind: 'non-json',
      status: response.status,
      contentType,
      cfMitigated: response.headers.get('cf-mitigated'),
      bodySnippet: (await readBodySafely(response)).slice(0, 300),
    };
  }

  try {
    return { kind: 'json', status: response.status, data: (await response.json()) as MtgcbApiEnvelope };
  } catch {
    return {
      kind: 'non-json',
      status: response.status,
      contentType,
      cfMitigated: response.headers.get('cf-mitigated'),
      bodySnippet: '(body claimed JSON but did not parse)',
    };
  }
};

export const reportUpstreamFailure = (
  path: string,
  result: Exclude<MtgcbApiResult, { kind: 'json' }>,
): void => {
  const reason =
    result.kind === 'non-json'
      ? result.cfMitigated === 'challenge'
        ? 'edge-challenge'
        : 'non-json-body'
      : result.reason;

  console.error(`Server→API hop failed on ${path} (${reason})`, result);
  Sentry.captureMessage(`Server→API hop failed: ${path} (${reason})`, {
    level: 'error',
    tags: { hop: 'server-to-api', reason },
    extra: { path, result },
  });
};

const readBodySafely = async (response: Response): Promise<string> => {
  try {
    return await response.text();
  } catch {
    return '(unreadable body)';
  }
};
