import { type Page, type Route, expect, test } from '@playwright/test';

// The collection search responses are mocked to the API's 403 COLLECTION_PRIVATE shape, so
// these tests do not depend on (or change) any real user's privacy setting.
const FAKE_TOKEN = 'e2eFakeShareToken456';
const PRIVATE_USER_ID = 1337;

const PRIVATE_BODY = {
  success: false,
  data: null,
  error: { message: "This user's collection is private", code: 'COLLECTION_PRIVATE' },
};

const fulfillJson = (route: Route, status: number, body: unknown) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

const mockCollectionSearchesPrivate = async (page: Page) => {
  const handler = async (route: Route) => {
    const body = route.request().postDataJSON();
    if (route.request().method() === 'POST' && body?.userId) return fulfillJson(route, 403, PRIVATE_BODY);
    return route.continue();
  };
  await page.route('**/sets/search*', handler);
  await page.route('**/cards/search*', handler);
};

test.describe('Private collections', () => {
  test('without a share token, a private collection shows the privacy banner', async ({ page }) => {
    await mockCollectionSearchesPrivate(page);

    await page.goto(`/collections/${PRIVATE_USER_ID}?contentType=sets`);

    await expect(page.getByRole('heading', { name: 'Collection is Private' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('If you know the user, ask them to set their collection to public', { exact: false })).toBeVisible();
    await expect(page.getByText('Invalid Share Link')).toHaveCount(0);
  });

  test('without a share token, the cards view of a private collection shows the privacy banner', async ({ page }) => {
    await mockCollectionSearchesPrivate(page);

    await page.goto(`/collections/${PRIVATE_USER_ID}?contentType=cards`);

    await expect(page.getByRole('heading', { name: 'Collection is Private' })).toBeVisible({ timeout: 15000 });
  });

  test('with a share token that no longer grants access, it shows the invalid share link banner instead', async ({
    page,
  }) => {
    await page.route('**/users/resolve-share-token*', (route) =>
      fulfillJson(route, 200, {
        success: true,
        data: { isValid: true, userId: String(PRIVATE_USER_ID), username: 'Manath', expiresAt: null },
        error: null,
      }),
    );
    await mockCollectionSearchesPrivate(page);

    await page.goto(`/shared/${FAKE_TOKEN}?contentType=sets`);

    await expect(page.getByText('Invalid Share Link')).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('heading', { name: 'Collection is Private' })).toHaveCount(0);
    await expect(page.getByText('Viewing Shared Collection')).toHaveCount(0);
  });
});
