import { expect, test } from '@playwright/test';

test.describe('GET /api/version', () => {
  test('returns the deployed version as JSON and is never cached', async ({ request }) => {
    const response = await request.get('/api/version');

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');

    const cacheControl = response.headers()['cache-control'] ?? '';
    expect(cacheControl).toContain('no-store');
    expect(cacheControl).toContain('max-age=0');

    // The value is the deploy's git SHA, or '' when no commit env var is set (local builds).
    const body = await response.json();
    expect(Object.keys(body)).toEqual(['version']);
    expect(typeof body.version).toBe('string');
  });
});
