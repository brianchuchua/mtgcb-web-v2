import { expect, test } from '@playwright/test';

test.describe('userId validation (Sentry MTGCB-API-V3-C, Bug A)', () => {
  test.describe('/collections/[userId] page handler', () => {
    test('rejects /collections/0 instead of calling /sets/search with userId=0', async ({ page }) => {
      const offendingApiCalls: string[] = [];
      page.on('request', (request) => {
        const url = request.url();
        if (url.includes('/sets/search') || url.includes('/cards/search')) {
          const post = request.postData();
          if (post && post.includes('"userId":0')) {
            offendingApiCalls.push(`${request.method()} ${url} -> ${post}`);
          }
        }
      });

      await page.goto('/collections/0');
      await expect(page.getByText('Invalid user ID')).toBeVisible();
      expect(offendingApiCalls).toEqual([]);
    });

    test('rejects /collections/-1', async ({ page }) => {
      await page.goto('/collections/-1');
      await expect(page.getByText('Invalid user ID')).toBeVisible();
    });

    test('rejects /collections/abc', async ({ page }) => {
      await page.goto('/collections/abc');
      await expect(page.getByText('Invalid user ID')).toBeVisible();
    });

    test('rejects /collections/0/lea (set slug)', async ({ page }) => {
      const offendingApiCalls: string[] = [];
      page.on('request', (request) => {
        const url = request.url();
        if (url.includes('/sets/search') || url.includes('/cards/search')) {
          const post = request.postData();
          if (post && post.includes('"userId":0')) {
            offendingApiCalls.push(`${request.method()} ${url} -> ${post}`);
          }
        }
      });

      await page.goto('/collections/0/lea');
      await expect(page.getByText('Invalid user ID')).toBeVisible();
      expect(offendingApiCalls).toEqual([]);
    });
  });

  test.describe('OG image route handlers', () => {
    test('/api/og/collection rejects userId=0', async ({ request }) => {
      const response = await request.get('/api/og/collection?userId=0');
      expect(response.status()).toBe(400);
    });

    test('/api/og/collection rejects userId=-1', async ({ request }) => {
      const response = await request.get('/api/og/collection?userId=-1');
      expect(response.status()).toBe(400);
    });

    test('/api/og/collection rejects userId=abc', async ({ request }) => {
      const response = await request.get('/api/og/collection?userId=abc');
      expect(response.status()).toBe(400);
    });

    test('/api/og/set rejects userId=0', async ({ request }) => {
      const response = await request.get('/api/og/set?userId=0&setSlug=lea');
      expect(response.status()).toBe(400);
    });

    test('/api/og/card rejects userId=0', async ({ request }) => {
      const response = await request.get('/api/og/card?userId=0&cardId=42');
      expect(response.status()).toBe(400);
    });

    test('/api/og/goal rejects userId=0', async ({ request }) => {
      const response = await request.get('/api/og/goal?userId=0&goalId=1');
      expect(response.status()).toBe(400);
    });

    test('/api/og/goal rejects goalId=0 (same defense)', async ({ request }) => {
      const response = await request.get('/api/og/goal?userId=42&goalId=0');
      expect(response.status()).toBe(400);
    });
  });
});
