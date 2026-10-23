import { expect, test, type Page, type Route } from '@playwright/test';
import { LOCAL_TEST_USER_ID, authenticateAsLocalTestUser, getLocalTestJwt } from '../utils/auth';

// The goal list and each goal's progress are mocked, so the page shows a fixed set of goals
// regardless of what user 1337 really has.

const API_ORIGIN = 'http://local.mtgcb.com:5000';
const GOALS_LIST_PATH = `/goals/${LOCAL_TEST_USER_ID}`;

const buildGoal = (id: number, name: string, overrides: Record<string, unknown> = {}) => ({
  id,
  userId: LOCAL_TEST_USER_ID,
  name,
  description: null,
  searchCriteria: { conditions: {} },
  targetQuantityAll: 1,
  targetQuantityReg: null,
  targetQuantityFoil: null,
  onePrintingPerPureName: true,
  includeSetsOutsideGoal: false,
  isActive: true,
  createdAt: '2026-04-26T00:00:00.000Z',
  updatedAt: '2026-04-26T00:00:00.000Z',
  ...overrides,
});

const ACTIVE_GOAL = buildGoal(9101, 'Active Goal', { description: 'Collect the basics' });
const INACTIVE_GOAL = buildGoal(9102, 'Paused Goal', { isActive: false, onePrintingPerPureName: false });
const THIRD_GOAL = buildGoal(9103, 'Third Goal', { onePrintingPerPureName: false });
const GOALS = [ACTIVE_GOAL, INACTIVE_GOAL, THIRD_GOAL];

const PROGRESS = { totalCards: 10, collectedCards: 3, percentageCollected: 30, totalValue: 12.5, costToComplete: 7.25 };

const fulfillJson = (route: Route, body: unknown, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

const mockGoals = async (page: Page, goals = GOALS) => {
  const deletedIds: number[] = [];
  await page.route(
    (url) => url.origin === API_ORIGIN && url.pathname.startsWith(GOALS_LIST_PATH),
    async (route) => {
      const url = new URL(route.request().url());
      const method = route.request().method();
      if (url.pathname === GOALS_LIST_PATH) {
        return fulfillJson(route, {
          success: true,
          data: { goals, totalCount: goals.length, limit: 500, offset: 0 },
        });
      }
      const goalId = Number(url.pathname.split('/').pop());
      const goal = goals.find((g) => g.id === goalId);
      if (method === 'DELETE') {
        deletedIds.push(goalId);
        return fulfillJson(route, { success: true, data: { message: 'Deleted' } });
      }
      if (!goal) return fulfillJson(route, { success: false, error: { message: 'Not found' } }, 404);
      return fulfillJson(route, { success: true, data: { ...goal, progress: PROGRESS } });
    },
  );
  return { deletedIds };
};

const goalCard = (page: Page, name: string) => page.locator('.MuiCard-root').filter({ hasText: name });

const expectedViewHref = (goalId: number, onePerName: boolean) =>
  `/collections/${LOCAL_TEST_USER_ID}?contentType=cards&goalId=${goalId}&oneResultPerCardName=${onePerName}`;

test.describe('Goals list', () => {
  test.beforeEach(async ({ context }) => {
    test.skip(!getLocalTestJwt(), 'Set E2E_TEST_JWT_1337 to run (see tests/utils/auth.ts)');
    await authenticateAsLocalTestUser(context);
  });

  test('an active goal links to the collection filtered by its id', async ({ page }) => {
    await mockGoals(page);
    await page.goto('/goals');

    const card = goalCard(page, 'Active Goal');
    await expect(card).toBeVisible({ timeout: 15000 });
    await expect(card.getByText('Collect the basics')).toBeVisible();
    await expect(card.getByText('Inactive', { exact: true })).toHaveCount(0);

    const href = expectedViewHref(ACTIVE_GOAL.id, true);
    await expect(card.getByRole('link', { name: 'View goal', exact: true })).toHaveAttribute('href', href);
    await expect(card.getByRole('link', { name: 'Active Goal' })).toHaveAttribute('href', href);
    await expect(card.getByRole('button', { name: 'Edit goal' })).toBeVisible();
    await expect(card.getByRole('button', { name: 'Delete goal' })).toBeVisible();
  });

  test('view link carries oneResultPerCardName=false when the goal counts every printing', async ({ page }) => {
    await mockGoals(page);
    await page.goto('/goals');

    const card = goalCard(page, 'Third Goal');
    await expect(card.getByRole('link', { name: 'View goal', exact: true })).toHaveAttribute(
      'href',
      expectedViewHref(THIRD_GOAL.id, false),
    );
  });

  test('an inactive goal shows the Inactive chip and no view link', async ({ page }) => {
    await mockGoals(page);
    await page.goto('/goals');

    const card = goalCard(page, 'Paused Goal');
    await expect(card).toBeVisible({ timeout: 15000 });
    await expect(card.getByText('Inactive', { exact: true })).toBeVisible();
    await expect(card.getByLabel('View goal (Inactive)')).toBeVisible();
    await expect(card.getByLabel('View goal (Inactive)').getByRole('button')).toBeDisabled();
    await expect(card.getByRole('link')).toHaveCount(0);
    await expect(card.getByRole('button', { name: 'Edit goal' })).toBeEnabled();
    await expect(card.getByRole('button', { name: 'Delete goal' })).toBeEnabled();
  });

  test('Edit goal opens the edit page for that goal', async ({ page }) => {
    await mockGoals(page);
    await page.goto('/goals');

    await goalCard(page, 'Paused Goal').getByRole('button', { name: 'Edit goal' }).click();
    await page.waitForURL(`**/goals/edit/${INACTIVE_GOAL.id}`);
    await expect(page.getByRole('heading', { name: 'Editing Paused Goal' })).toBeVisible();
  });

  test('Delete goal deletes the goal in that card', async ({ page }) => {
    const { deletedIds } = await mockGoals(page);
    await page.goto('/goals');

    await goalCard(page, 'Third Goal').getByRole('button', { name: 'Delete goal' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('"Third Goal"');
    await dialog.getByRole('button', { name: 'Delete', exact: true }).click();

    await expect(page.getByText('Goal deleted', { exact: true })).toBeVisible();
    expect(deletedIds).toEqual([THIRD_GOAL.id]);
  });

  test('hydrated progress shows counts, value and cost to complete', async ({ page }) => {
    await mockGoals(page, [ACTIVE_GOAL]);
    await page.goto('/goals');

    const card = goalCard(page, 'Active Goal');
    await expect(card.getByText('3 / 10 cards')).toBeVisible({ timeout: 15000 });
    await expect(card.getByText('$12.50')).toBeVisible();
    await expect(card.getByText('$7.25')).toBeVisible();
  });

  test('empty list shows the first-goal prompt', async ({ page }) => {
    await mockGoals(page, []);
    await page.goto('/goals');

    await expect(page.getByText('No goals yet')).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: 'Create Your First Goal' })).toBeVisible();
  });

  test('pagination splits goals by the stored page size', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('mtgcb-goals-pagination', JSON.stringify({ pageSize: 2 }));
    });
    await mockGoals(page);
    await page.goto('/goals');

    await expect(goalCard(page, 'Active Goal')).toBeVisible({ timeout: 15000 });
    await expect(goalCard(page, 'Paused Goal')).toBeVisible();
    await expect(goalCard(page, 'Third Goal')).toHaveCount(0);

    await page.getByTestId('pagination-top').getByTestId('pagination-next').click();

    await expect(goalCard(page, 'Third Goal')).toBeVisible();
    await expect(goalCard(page, 'Active Goal')).toHaveCount(0);
    await expect(goalCard(page, 'Paused Goal')).toHaveCount(0);
  });
});
