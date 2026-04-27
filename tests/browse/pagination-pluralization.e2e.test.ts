import { expect, test } from '@playwright/test';

const API_BASE = 'http://local.mtgcb.com:5000';

test.describe('Pagination "Showing X-Y of Z" pluralization', () => {
  test('singular set: "1 set" not "1 sets"', async ({ page }) => {
    // Mock sets browse to return exactly 1 set so totalItems === 1.
    await page.route(`${API_BASE}/sets/search**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            sets: [
              {
                id: '1',
                code: 'TST',
                name: 'Test Set',
                slug: 'test-set',
                releasedAt: '2026-01-01',
                cardCount: '1',
                category: 'expansion',
                setType: 'expansion',
              },
            ],
            totalCount: 1,
          },
        }),
      });
    });

    await page.goto('/browse');
    await page.waitForLoadState('networkidle');

    const pageInfo = page.getByTestId('page-info').first();
    await expect(pageInfo).toContainText(/Showing 1-1 of 1 set\b/);
    await expect(pageInfo).not.toContainText(/of 1 sets/);
  });

  test('singular card: "1 card" not "1 cards"', async ({ page }) => {
    await page.route(`${API_BASE}/cards/search**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            cards: [
              {
                id: '1',
                name: 'Test Card',
                setId: '1',
                setName: 'Test Set',
                setSlug: 'test-set',
                rarity: 'common',
              },
            ],
            totalCount: 1,
          },
        }),
      });
    });

    await page.goto('/browse?contentType=cards');
    await page.waitForLoadState('networkidle');

    const pageInfo = page.getByTestId('page-info').first();
    await expect(pageInfo).toContainText(/Showing 1-1 of 1 card\b/);
    await expect(pageInfo).not.toContainText(/of 1 cards/);
  });

  test('plural still says "N cards" for N > 1', async ({ page }) => {
    await page.route(`${API_BASE}/cards/search**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            cards: Array.from({ length: 5 }, (_, i) => ({
              id: String(i + 1),
              name: `Card ${i + 1}`,
              setId: '1',
              setName: 'Test Set',
              setSlug: 'test-set',
              rarity: 'common',
            })),
            totalCount: 5,
          },
        }),
      });
    });

    await page.goto('/browse?contentType=cards');
    await page.waitForLoadState('networkidle');

    const pageInfo = page.getByTestId('page-info').first();
    await expect(pageInfo).toContainText(/of 5 cards/);
  });
});
