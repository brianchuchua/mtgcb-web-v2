import { type Page, type Route, expect, test } from '@playwright/test';

// Every test mocks POST /users/resolve-share-token, so no real share link is created,
// read or revoked. The "valid" cases resolve the fake token to user 1337 (Manath), whose
// collection is public in the local DB; the API ignores an unknown ?share= for a public
// collection, so the collection data itself is real and read-only.
const RESOLVE_URL = '**/users/resolve-share-token*';
const FAKE_TOKEN = 'e2eFakeShareToken123';
const SHARED_USER_ID = 1337;
const SHARED_USERNAME = 'Manath';
const SET_SLUG = 'limited-edition-alpha';
const CARD_PATH = 'cards/black-lotus/18';

const fulfillJson = (route: Route, status: number, body: unknown) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

const mockResolveValid = async (page: Page) => {
  const requestedTokens: string[] = [];
  await page.route(RESOLVE_URL, async (route) => {
    requestedTokens.push(route.request().postDataJSON()?.shareToken);
    await fulfillJson(route, 200, {
      success: true,
      data: { isValid: true, userId: String(SHARED_USER_ID), username: SHARED_USERNAME, expiresAt: null },
      error: null,
    });
  });
  return { requestedTokens };
};

const INVALID_RESPONSES: { label: string; status: number; body: unknown }[] = [
  {
    label: 'a 404 from the API',
    status: 404,
    body: { success: false, data: null, error: { message: 'Invalid share token', code: 'NOT_FOUND' } },
  },
  {
    label: 'success:false in a 200',
    status: 200,
    body: { success: false, data: null, error: { message: 'Share link revoked', code: 'REVOKED' } },
  },
  {
    label: 'a success with no user id',
    status: 200,
    body: { success: true, data: { isValid: false }, error: null },
  },
];

const SHARED_PATHS = [
  { label: 'collection', path: `/shared/${FAKE_TOKEN}` },
  { label: 'set', path: `/shared/${FAKE_TOKEN}/${SET_SLUG}` },
  { label: 'card', path: `/shared/${FAKE_TOKEN}/${CARD_PATH}` },
];

test.describe('Invalid or revoked share links', () => {
  for (const { label: pageLabel, path } of SHARED_PATHS) {
    for (const response of INVALID_RESPONSES) {
      test(`${pageLabel} page shows "Invalid Share Link" for ${response.label}`, async ({ page }) => {
        await page.route(RESOLVE_URL, (route) => fulfillJson(route, response.status, response.body));

        await page.goto(path);

        await expect(page.getByText('Invalid Share Link')).toBeVisible({ timeout: 15000 });
        await expect(page.getByText('This share link is invalid or has been replaced.', { exact: false })).toBeVisible();
        await expect(page.getByText('Viewing Shared Collection')).toHaveCount(0);
      });
    }
  }
});

test.describe('Valid share links', () => {
  test('collection page shows the shared banner and keeps set links under /shared/<token>/', async ({ page }) => {
    const resolve = await mockResolveValid(page);

    await page.goto(`/shared/${FAKE_TOKEN}?contentType=sets`);

    await expect(page.getByText('Viewing Shared Collection')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(`Owner: ${SHARED_USERNAME}`)).toBeVisible();
    await expect(page.getByText('Read-only access')).toBeVisible();
    expect(resolve.requestedTokens.length).toBeGreaterThan(0);

    const sharedSetLinks = page.locator(`a[href^="/shared/${FAKE_TOKEN}/"]`);
    await expect(sharedSetLinks.first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator(`a[href^="/collections/${SHARED_USER_ID}/"]`)).toHaveCount(0);

    const href = await sharedSetLinks.first().getAttribute('href');
    await sharedSetLinks.first().click();
    await page.waitForURL((url) => url.pathname === href?.split('?')[0], { timeout: 15000 });
    await expect(page.getByText('Viewing Shared Collection')).toBeVisible({ timeout: 15000 });
  });

  test('set page shows the shared banner', async ({ page }) => {
    await mockResolveValid(page);

    await page.goto(`/shared/${FAKE_TOKEN}/${SET_SLUG}`);

    await expect(page.getByText('Viewing Shared Collection')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(`Owner: ${SHARED_USERNAME}`)).toBeVisible();
    expect(new URL(page.url()).pathname).toBe(`/shared/${FAKE_TOKEN}/${SET_SLUG}`);
  });

  test('card page shows the shared banner', async ({ page }) => {
    await mockResolveValid(page);

    await page.goto(`/shared/${FAKE_TOKEN}/${CARD_PATH}`);

    await expect(page.getByText('Viewing Shared Collection')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(`Owner: ${SHARED_USERNAME}`)).toBeVisible();
  });

  test('collection requests carry the share token while resolve-share-token does not', async ({ page }) => {
    const resolveUrls: string[] = [];
    await page.route(RESOLVE_URL, async (route) => {
      resolveUrls.push(route.request().url());
      await fulfillJson(route, 200, {
        success: true,
        data: { isValid: true, userId: String(SHARED_USER_ID), username: SHARED_USERNAME, expiresAt: null },
        error: null,
      });
    });

    const searchRequest = page.waitForRequest(
      (req) => /\/sets\/search/.test(req.url()) && req.method() === 'POST' && req.url().includes('share='),
      { timeout: 15000 },
    );
    await page.goto(`/shared/${FAKE_TOKEN}?contentType=sets`);
    const request = await searchRequest;

    expect(new URL(request.url()).searchParams.get('share')).toBeTruthy();
    expect(request.postDataJSON().userId).toBe(SHARED_USER_ID);
    expect(resolveUrls.length).toBeGreaterThan(0);
    for (const url of resolveUrls) expect(url).not.toContain('share=');
  });
});
