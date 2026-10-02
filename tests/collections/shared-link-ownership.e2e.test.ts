import { type APIRequestContext, type Page, type Request, expect, test } from '@playwright/test';
import { authenticateAsLocalTestUser, getLocalTestJwt } from '../utils/auth';

// Repro for: "Shared collection link: 'Owned' filter does nothing on View Sets (+ default to Owned)"
// (Notion ticket 3ede7f6b51f28137890fc71129a24b43).
//
// Share links live at /shared/{token}. The collection-context check only recognised
// /collections/, so a share link was treated as the public browser and collection-only
// params (completionStatus, % Collected sort, ...) were stripped before the sets query.
// Share links also now open on "Owned" for both Sets and Cards.
//
// Assertions read the first-page search request (offset 0) the page sends after each step;
// the grid also prefetches the next page, which would otherwise race the assertions.

const API = 'http://local.mtgcb.com:5000';
const OWNED_SETS = { OR: ['complete', 'partial'] };

let shareToken = '';

test.describe('Shared collection link: ownership filters', () => {
  test.describe.configure({ mode: 'default' });

  test.beforeAll(async ({ request }) => {
    test.skip(!getLocalTestJwt(), 'Set E2E_TEST_JWT_1337 to run (see tests/utils/auth.ts)');
    shareToken = await createShareToken(request);
  });

  test.afterAll(async ({ request }) => {
    if (shareToken) await revokeShareToken(request);
  });

  test('Owned on the Sets view sends the completion filter and narrows the list', async ({ page }) => {
    // Start from Missing so neither the All nor the Owned query is served from cache.
    await searchAfter(page, 'sets', () => openShareLink(page, '?contentType=sets&includeCompletionStatus=empty'));
    const ownership = ownershipToggle(page);

    const all = await searchAfter(page, 'sets', () => ownership.getByRole('button', { name: 'All' }).click());
    expect(all.postDataJSON().completionStatus).toBeUndefined();

    const owned = await searchAfter(page, 'sets', () => ownership.getByRole('button', { name: 'Owned' }).click());
    expect(owned.postDataJSON().completionStatus).toEqual(OWNED_SETS);
    expect(await totalCount(owned)).toBeLessThan(await totalCount(all));
  });

  test('opens on Owned for Sets and Cards', async ({ page }) => {
    const sets = await searchAfter(page, 'sets', () => openShareLink(page, '?contentType=sets'));
    expect(sets.postDataJSON().completionStatus).toEqual(OWNED_SETS);
    await expect(ownershipToggle(page).getByRole('button', { name: 'Owned' })).toHaveAttribute('aria-pressed', 'true');

    const cards = await searchAfter(page, 'cards', () => page.getByTestId('content-type-toggle-cards').click());
    expect(JSON.stringify(cards.postDataJSON())).toContain('quantityAll');
    await expect(ownershipToggle(page).getByRole('button', { name: 'Owned' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('Cards still opens on Owned after a reload on the Sets view', async ({ page }) => {
    await searchAfter(page, 'sets', () => openShareLink(page, '?contentType=sets'));
    await page.reload();
    await expect(ownershipToggle(page).getByRole('button', { name: 'Owned' })).toHaveAttribute('aria-pressed', 'true');

    const cards = await searchAfter(page, 'cards', () => page.getByTestId('content-type-toggle-cards').click());
    expect(JSON.stringify(cards.postDataJSON())).toContain('quantityAll');
    await expect(ownershipToggle(page).getByRole('button', { name: 'Owned' })).toHaveAttribute('aria-pressed', 'true');
  });

  test("keeps the viewer's All choice after a reload", async ({ page }) => {
    await searchAfter(page, 'sets', () => openShareLink(page, '?contentType=sets'));
    await ownershipToggle(page).getByRole('button', { name: 'All' }).click();
    await expect.poll(() => new URL(page.url()).searchParams.has('includeCompletionStatus')).toBe(false);

    const reloaded = await searchAfter(page, 'sets', () => page.reload());
    expect(reloaded.postDataJSON().completionStatus).toBeUndefined();
    await expect(ownershipToggle(page).getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('an ownership filter already in the link wins over the default', async ({ page }) => {
    const sets = await searchAfter(page, 'sets', () => openShareLink(page, '?contentType=sets&includeCompletionStatus=empty'));
    expect(sets.postDataJSON().completionStatus).toEqual({ OR: ['empty'] });
    await expect(ownershipToggle(page).getByRole('button', { name: 'Missing' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('collection-only set sorts are sent on share links', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('mtgcb_preferred_sort_by_sets', JSON.stringify('percentageCollected'));
    });
    const sets = await searchAfter(page, 'sets', () => openShareLink(page, '?contentType=sets'));
    expect(sets.postDataJSON().sortBy).toBe('percentageCollected');
  });

  test('the default does not follow a logged-in viewer into their own collection', async ({ page, context }) => {
    await authenticateAsLocalTestUser(context);
    await searchAfter(page, 'sets', () => openShareLink(page, '?contentType=sets'));
    await expect(ownershipToggle(page).getByRole('button', { name: 'Owned' })).toHaveAttribute('aria-pressed', 'true');
    await waitForUrlToSettle(page);

    await page.locator('a[href="/collections/1337"]').first().click();
    await page.waitForURL(/\/collections\/1337(\?|$)/);

    // A leak shows up as Owned still selected (served from the share page's cached query).
    await expect(ownershipToggle(page).getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText('Searching sets: all')).toBeVisible();
    await expect.poll(() => new URL(page.url()).searchParams.has('includeCompletionStatus')).toBe(false);
  });
});

async function openShareLink(page: Page, query: string): Promise<void> {
  await page.goto(`/shared/${shareToken}${query}`);
}

/**
 * The browse sync rewrites the URL shortly after any collection page loads (debounced), and a
 * click that lands before that rewrite can be undone by it. Same on /collections pages; not
 * specific to share links. Wait until the URL has stopped changing.
 */
async function waitForUrlToSettle(page: Page): Promise<void> {
  let last = '';
  let stableSince = Date.now();
  await expect
    .poll(
      () => {
        if (page.url() !== last) {
          last = page.url();
          stableSince = Date.now();
        }
        return Date.now() - stableSince;
      },
      { timeout: 10000, intervals: [100] },
    )
    .toBeGreaterThan(750);
}

function ownershipToggle(page: Page) {
  return page.locator('fieldset, div').filter({ has: page.getByText('Ownership Status', { exact: true }) }).last();
}

/**
 * Runs the action and returns the next first-page search request for user 1337.
 */
async function searchAfter(
  page: Page,
  kind: 'sets' | 'cards',
  action: () => Promise<unknown>,
): Promise<Request> {
  const request = page.waitForRequest(
    (req) => {
      if (searchKind(req) !== kind) return false;
      const body = req.postDataJSON();
      return body?.userId === 1337 && (body.offset ?? 0) === 0;
    },
    { timeout: 20000 },
  );
  await action();
  return request;
}

async function totalCount(request: Request): Promise<number> {
  const response = await request.response();
  return (await response!.json()).data.totalCount;
}

function searchKind(req: Request): 'sets' | 'cards' | null {
  if (req.method() !== 'POST') return null;
  const url = new URL(req.url());
  if (url.origin !== API) return null;
  if (url.pathname === '/sets/search') return 'sets';
  if (url.pathname === '/cards/search') return 'cards';
  return null;
}

async function createShareToken(request: APIRequestContext): Promise<string> {
  const response = await request.post(`${API}/user/share-link`, {
    data: {},
    headers: { 'content-type': 'application/json', cookie: `MTGCB_AuthToken=${getLocalTestJwt()}` },
  });
  if (!response.ok()) throw new Error(`share-link create failed (${response.status()}): ${await response.text()}`);
  const body = await response.json();
  return body.data.token;
}

async function revokeShareToken(request: APIRequestContext): Promise<void> {
  await request.delete(`${API}/user/share-link`, {
    headers: { cookie: `MTGCB_AuthToken=${getLocalTestJwt()}` },
  });
}
