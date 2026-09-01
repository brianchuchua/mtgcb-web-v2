import { NextResponse } from 'next/server';
import { postToMtgcbApi, reportUpstreamFailure } from '@/utils/server/mtgcbApiServer';

// Synthetic canary for the server→API hop that broke on 2026-08-31 (Cloudflare
// Managed Challenge intercepting Node-runtime fetches). Sends a garbage reset
// token through the exact same path the auth routes use: no writes, no email,
// no reCAPTCHA. Healthy means the API's own JSON answer (expected: a specific
// 4xx) made it back through the hop. Point an external uptime monitor here and
// alert on any non-200.

export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await postToMtgcbApi('/auth/validate-password-reset', {
    token: 'synthetic-canary-token-never-a-real-reset-token',
    privateKey: process.env.MTGCB_API_PRIVATE_KEY,
  });

  if (result.kind === 'json' && result.status < 500) {
    return NextResponse.json({
      success: true,
      data: { hop: 'ok', upstreamStatus: result.status },
    });
  }

  if (result.kind !== 'json') {
    reportUpstreamFailure('/auth/validate-password-reset (canary)', result);
  }

  return NextResponse.json(
    {
      success: false,
      error: {
        message: 'Server→API hop is not returning API responses',
        code: 'API_HOP_BROKEN',
        details:
          result.kind === 'json'
            ? { kind: 'api-error', upstreamStatus: result.status }
            : { kind: result.kind },
      },
    },
    { status: 503 },
  );
}
