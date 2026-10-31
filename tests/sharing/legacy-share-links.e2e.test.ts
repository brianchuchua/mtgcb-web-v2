import { type Page, type Route, expect, test } from '@playwright/test';

// Old share links (/collections/<id>?share=<token>) now redirect to /shared/<token>. The
// resolve call is mocked to user 1337 (Manath, public locally), so nothing is created or
// changed; the collection data itself is real and read-only.
const RESOLVE_URL = '**/users/resolve-share-token*';
const HEX_TOKEN = 'ffb676098ccc57db3c965976c4bb1515b7122fb086fe5db5562cdfa3cc832bd9';
const SET_SLUG = 'limited-edition-alpha';

const fulfillJson = (route: Route, status: number, body: unknown) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

const mockResolveValid = async (page: Page) => {
  const tokens: string[] = [];
  await page.route(RESOLVE_URL, async (route) => {
    tokens.push(route.request().postDataJSON()?.shareToken);
    await fulfillJson(route, 200, {
      success: true,
      data: { isValid: true, userId: '1337', username: 'Manath', expiresAt: null },
      error: null,
    });
  });
  return tokens;
};

const sharedPath = (url: string) => new URL(url).pathname;

test.describe('Old ?share= links', () => {
  test('a collection link moves to /shared/<token> and keeps the token in the address', async ({ page }) => {
    const tokens = await mockResolveValid(page);

    await page.goto(`/collections/1337?share=${HEX_TOKEN}&contentType=cards&name=Lightning`);

    await expect(page.getByText('Viewing Shared Collection')).toBeVisible({ timeout: 15000 });
    await page.waitForLoadState('networkidle');
    expect(sharedPath(page.url())).toMatch(/^\/shared\/[0-9A-Za-z]+$/);
    expect(new URL(page.url()).searchParams.get('name')).toBe('Lightning');
    expect(page.url()).not.toContain('share=');
    expect(tokens).toContain(HEX_TOKEN);
  });

  test('a set link moves to the shared set page', async ({ page }) => {
    await mockResolveValid(page);

    await page.goto(`/collections/1337/${SET_SLUG}?share=${HEX_TOKEN}`);

    await expect(page.getByText('Viewing Shared Collection')).toBeVisible({ timeout: 15000 });
    expect(sharedPath(page.url())).toMatch(new RegExp(`^/shared/[0-9A-Za-z]+/${SET_SLUG}$`));
  });

  test('links without share are left alone', async ({ page }) => {
    await page.goto('/collections/1337?contentType=sets');
    await page.waitForLoadState('networkidle');
    expect(sharedPath(page.url())).toBe('/collections/1337');
  });
});

test.describe('Shared set pages', () => {
  test('load as a set page: no sets-view URL on the way, no contentType at the end', async ({ page }) => {
    await mockResolveValid(page);
    const urls: string[] = [];
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) urls.push(frame.url());
    });

    await page.goto(`/shared/e2eFakeShareToken123/${SET_SLUG}`);
    await expect(page.getByText('Viewing Shared Collection')).toBeVisible({ timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    expect(urls.filter((u) => u.includes('contentType=sets'))).toEqual([]);
    expect(new URL(page.url()).searchParams.has('contentType')).toBe(false);
    expect(new URL(page.url()).searchParams.has('includeSets')).toBe(false);
  });
});
