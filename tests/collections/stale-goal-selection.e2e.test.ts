import { expect, Page, test } from '@playwright/test';
import { LOCAL_TEST_USER_ID, authenticateAsLocalTestUser, getLocalTestJwt } from '../utils/auth';

// Regressions for two Notion tickets:
//   "deleting a goal still has it selected in the search form" (29be7f6b51f280f0aeebcfb72b0b7026)
//   "bug - browse view can retain goal selection" (34fe7f6b51f2801bb152ddf90b18cc2f)
//
// A selected goal used to live on in the URL and sessionStorage after it was deleted, after
// leaving the collection for Browse, and when opening another collection. The collection then
// asked the API for a goal that wasn't there ("Unable to load cards"), and Browse hid the
// "Hide duplicate printings" toggle. Read-only for user 1337: the one delete is mocked.

const API = 'http://local.mtgcb.com:5000';
const MISSING_GOAL_ID = 999999999;

const trackGoalSearches = (page: Page) => {
  const goalIds: number[] = [];
  const failures: string[] = [];
  page.on('request', (r) => {
    if (!/\/(cards|sets)\/search/.test(r.url())) return;
    const m = (r.postData() ?? '').match(/"goalId":(\d+)/);
    if (m) goalIds.push(Number(m[1]));
  });
  page.on('response', (r) => {
    if (/\/(cards|sets)\/search/.test(r.url()) && r.status() >= 400) failures.push(`${r.status()} ${r.url()}`);
  });
  return { goalIds, failures };
};

const storedGoalIds = (page: Page) =>
  page.evaluate(() =>
    ['cards', 'sets'].map((v) => JSON.parse(sessionStorage.getItem(`mtgcb_search_state_${v}`) ?? '{}').selectedGoalId ?? null),
  );

const settle = async (page: Page) => {
  await page.waitForLoadState('networkidle');
  // Debounced Redux -> URL sync (100ms) plus margin
  await page.waitForTimeout(600);
};

const firstGoalId = async (page: Page): Promise<number | null> => {
  const res = await page.request.get(`${API}/goals/${LOCAL_TEST_USER_ID}?limit=500`, {
    headers: { cookie: `MTGCB_AuthToken=${getLocalTestJwt()}` },
  });
  const goals = (await res.json()).data?.goals ?? [];
  return goals.find((g: { isActive: boolean }) => g.isActive)?.id ?? null;
};

test.describe('Collection goal selection does not go stale', () => {
  test.beforeEach(async ({ context }) => {
    test.skip(!getLocalTestJwt(), 'Set E2E_TEST_JWT_1337 to run (see tests/utils/auth.ts)');
    await authenticateAsLocalTestUser(context);
  });

  test('a link to a goal that no longer exists shows the plain collection', async ({ page }) => {
    const searches = trackGoalSearches(page);

    await page.goto(`/collections/${LOCAL_TEST_USER_ID}?contentType=cards&goalId=${MISSING_GOAL_ID}`);
    await settle(page);

    expect(new URL(page.url()).searchParams.get('goalId')).toBeNull();
    expect(searches.goalIds).not.toContain(MISSING_GOAL_ID);
    expect(searches.failures).toEqual([]);
    await expect(page.getByText(/Unable to load cards/)).toHaveCount(0);
    expect(await storedGoalIds(page)).toEqual([null, null]);
  });

  test('going to Browse drops the goal, and it does not come back in the collection', async ({ page }) => {
    const goalId = await firstGoalId(page);
    test.skip(goalId === null, 'No active goals for user 1337');

    await page.goto(`/collections/${LOCAL_TEST_USER_ID}?contentType=cards&goalId=${goalId}`);
    await settle(page);
    expect(new URL(page.url()).searchParams.get('goalId')).toBe(String(goalId));

    await page.getByRole('link', { name: 'Browse', exact: true }).first().click();
    await page.waitForURL(/\/browse/);
    await settle(page);

    expect(new URL(page.url()).searchParams.get('goalId')).toBeNull();
    expect(await storedGoalIds(page)).toEqual([null, null]);
    await expect(page.getByText('Hide duplicate printings')).toBeVisible();

    const searches = trackGoalSearches(page);
    await page.getByRole('link', { name: 'Collection', exact: true }).first().click();
    await page.waitForURL(new RegExp(`/collections/${LOCAL_TEST_USER_ID}`));
    await settle(page);

    expect(new URL(page.url()).searchParams.get('goalId')).toBeNull();
    expect(searches.goalIds).toEqual([]);
    await expect(page.getByLabel('Collection Goal').first()).toContainText(/Default \(all cards\)/i);
  });

  test('an old Browse link with a goal loads clean', async ({ page }) => {
    const goalId = await firstGoalId(page);
    test.skip(goalId === null, 'No active goals for user 1337');

    await page.goto(`/browse?contentType=cards&goalId=${goalId}`);
    await settle(page);

    expect(new URL(page.url()).searchParams.get('goalId')).toBeNull();
    await expect(page.getByText('Hide duplicate printings')).toBeVisible();
  });

  test('deleting the selected goal clears it from the collection', async ({ page }) => {
    const goalId = await firstGoalId(page);
    test.skip(goalId === null, 'No active goals for user 1337');

    // Don't really delete Manath's goal
    await page.route(`${API}/goals/${LOCAL_TEST_USER_ID}/${goalId}`, async (route) => {
      if (route.request().method() !== 'DELETE') return route.fallback();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { message: 'Goal deleted successfully' }, error: null }),
      });
    });

    await page.goto(`/collections/${LOCAL_TEST_USER_ID}?contentType=cards&goalId=${goalId}`);
    await settle(page);
    expect(await storedGoalIds(page)).toEqual([goalId, goalId]);

    await page.goto(`/goals/edit/${goalId}`);
    await page.getByRole('button', { name: /Delete/ }).first().click();
    await page.getByRole('dialog').getByRole('button', { name: /^Delete$/ }).click();
    await expect(page.getByText('Goal deleted')).toBeVisible();
    await page.waitForURL(/\/goals$/);

    expect(await storedGoalIds(page)).toEqual([null, null]);

    const searches = trackGoalSearches(page);
    await page.goto(`/collections/${LOCAL_TEST_USER_ID}?contentType=cards`);
    await settle(page);
    expect(new URL(page.url()).searchParams.get('goalId')).toBeNull();
    expect(searches.goalIds).toEqual([]);
  });
});
