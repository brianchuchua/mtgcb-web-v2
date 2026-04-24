import type { APIRequestContext, BrowserContext } from '@playwright/test';

/**
 * Injects a valid JWT for local test user 1337 (username "Manath") into the
 * browser context so tests exercise the real local API instead of relying on
 * heavy request mocking.
 *
 * Setup (once per shell):
 *   - Generate a token from the API repo:
 *       cd C:/github/mtgcb-api-v3
 *       node scripts/gen_token.js 1337
 *   - Export it before running e2e:
 *       export E2E_TEST_JWT_1337=<token>     (bash)
 *       setx  E2E_TEST_JWT_1337 <token>      (Windows persistent)
 *
 * Tests that call this helper will `test.skip()` cleanly when the env var is
 * missing rather than fail with a cryptic "cookie not set" error.
 */
export const LOCAL_TEST_USER_ID = 1337;
export const LOCAL_TEST_USERNAME = 'Manath';

const COOKIE_NAME = 'MTGCB_AuthToken';
const COOKIE_DOMAIN = 'local.mtgcb.com';

export function getLocalTestJwt(): string | undefined {
  return process.env.E2E_TEST_JWT_1337;
}

export async function authenticateAsLocalTestUser(context: BrowserContext): Promise<void> {
  const jwt = getLocalTestJwt();
  if (!jwt) {
    throw new Error(
      'E2E_TEST_JWT_1337 env var is not set. Generate a token with ' +
        '`node scripts/gen_token.js 1337` from mtgcb-api-v3 and export it.',
    );
  }

  await context.addCookies([
    {
      name: COOKIE_NAME,
      value: jwt,
      domain: COOKIE_DOMAIN,
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    },
  ]);
}

/**
 * Reset a card's collection quantities to 0/0 for user 1337 via the real API.
 * Use in beforeEach/afterEach for tests that mutate collection state, so tests
 * run independently and leave the DB clean.
 *
 * Sends the JWT cookie explicitly via headers since APIRequestContext's
 * inherited cookie handling doesn't always attach the cookie on cross-port
 * requests (web on :3000 → api on :5000).
 */
export async function resetCollectionEntry(
  request: APIRequestContext,
  cardId: number,
  overrides: { quantityReg?: number; quantityFoil?: number } = {},
): Promise<void> {
  const jwt = getLocalTestJwt();
  if (!jwt) throw new Error('E2E_TEST_JWT_1337 is required for resetCollectionEntry');

  const response = await request.post('http://local.mtgcb.com:5000/collection/update', {
    data: {
      mode: 'set',
      cards: [
        {
          cardId,
          quantityReg: overrides.quantityReg ?? 0,
          quantityFoil: overrides.quantityFoil ?? 0,
        },
      ],
    },
    headers: {
      'content-type': 'application/json',
      cookie: `MTGCB_AuthToken=${jwt}`,
    },
  });

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`resetCollectionEntry failed (${response.status()}): ${body}`);
  }
}
