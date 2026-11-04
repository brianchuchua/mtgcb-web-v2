import { Page, Request, expect, test } from '@playwright/test';

// "Price (Owned)" sort (ticket "Sorting Collection by Price"): ranks a collection by the
// price of the finish the user owns. Collection pages only; read-only searches on a public collection.
const CARDS_SEARCH_URL = 'http://local.mtgcb.com:5000/cards/search';
const PUBLIC_COLLECTION_USER = 1337;

type Body = Record<string, unknown>;

const bodyOf = (request: Request): Body | null => {
  try {
    return request.postDataJSON();
  } catch {
    return null;
  }
};

const openAndCaptureSearch = async (page: Page, path: string) => {
  const request = page.waitForRequest(
    (r) => r.url() === CARDS_SEARCH_URL && r.method() === 'POST' && !!bodyOf(r)?.limit,
    { timeout: 30000 },
  );
  await page.goto(path);
  return bodyOf(await request) as Body;
};

test.describe('Price (Owned) sort', () => {
  test('a collection link sorted by owned finish sends that sort and shows its label', async ({ page }) => {
    const body = await openAndCaptureSearch(
      page,
      `/collections/${PUBLIC_COLLECTION_USER}?contentType=cards&cardsSortBy=ownedValue&cardsSortOrder=desc`,
    );
    expect(body).toMatchObject({ userId: PUBLIC_COLLECTION_USER, sortBy: 'ownedValue', sortDirection: 'desc' });
    await expect(page.getByRole('combobox').filter({ hasText: 'Price (Owned)' }).first()).toBeVisible();
  });

  test('public browse ignores it, like the quantity sorts', async ({ page }) => {
    const body = await openAndCaptureSearch(page, '/browse?contentType=cards&cardsSortBy=ownedValue&cardsSortOrder=desc');
    expect(body.sortBy).not.toBe('ownedValue');
    expect(body).not.toHaveProperty('userId');
  });
});
