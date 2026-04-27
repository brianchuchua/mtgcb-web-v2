import { expect, test, type Page } from '@playwright/test';
import { LOCAL_TEST_USER_ID, authenticateAsLocalTestUser, getLocalTestJwt } from '../utils/auth';

const API_BASE = 'http://local.mtgcb.com:5000';

const GOAL_ID = 9999;

const MOCK_GOAL = {
  id: GOAL_ID,
  userId: LOCAL_TEST_USER_ID,
  name: 'My Test Goal',
  description: 'A test goal',
  searchCriteria: { conditions: {} },
  targetQuantityAll: 1,
  onePrintingPerPureName: true,
  includeSetsOutsideGoal: false,
  isActive: true,
  createdAt: '2026-04-26T00:00:00.000Z',
  updatedAt: '2026-04-26T00:00:00.000Z',
};

const fulfillJson = async (route: any, body: unknown, status = 200) => {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
};

test.describe('Goals CRUD', () => {
  test.beforeEach(async ({ context }) => {
    test.skip(!getLocalTestJwt(), 'Set E2E_TEST_JWT_1337 to run (see tests/utils/auth.ts)');
    await authenticateAsLocalTestUser(context);
  });

  test('creates a goal and shows "Goal created" toast', async ({ page }) => {
    let createCalled = false;
    let createBody: any = null;

    await page.route(`${API_BASE}/goals`, async (route) => {
      if (route.request().method() === 'POST') {
        createCalled = true;
        createBody = route.request().postDataJSON();
        await fulfillJson(route, { success: true, data: MOCK_GOAL });
      } else {
        await route.continue();
      }
    });

    await page.goto('/goals/create');
    await page.waitForLoadState('networkidle');

    await page.getByLabel('Goal Name').fill('My Test Goal');

    // Default quantity mode is "Any Type" with targetQuantityAll = 1, so the
    // form is already valid for submission.
    await page.getByRole('button', { name: 'Create Goal' }).click();

    await expect(page.getByText('Goal created', { exact: true })).toBeVisible();
    await expect(page.getByText(/successfully/i)).toHaveCount(0);
    expect(createCalled).toBe(true);
    expect(createBody?.name).toBe('My Test Goal');
  });

  test('deletes a goal via confirm dialog and shows "Goal deleted" toast', async ({ page }) => {
    let deleteCalled = false;

    // List endpoint returns one goal so the GoalsList renders a delete button.
    // Use a glob ** so DELETE /goals/{userId}/{goalId} also matches.
    await page.route(`${API_BASE}/goals/**`, async (route) => {
      const url = route.request().url();
      const method = route.request().method();
      if (method === 'DELETE' && url.includes(`/${GOAL_ID}`)) {
        deleteCalled = true;
        await fulfillJson(route, { success: true, data: { message: 'Deleted' } });
      } else if (method === 'GET') {
        await fulfillJson(route, {
          success: true,
          data: { goals: [MOCK_GOAL], totalCount: 1 },
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/goals');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('My Test Goal')).toBeVisible();

    await page.getByRole('button', { name: 'Delete goal' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText(/My Test Goal/)).toBeVisible();
    await dialog.getByRole('button', { name: 'Delete' }).click();

    await expect(page.getByText('Goal deleted')).toBeVisible();
    await expect(page.getByText(/successfully/i)).toHaveCount(0);
    expect(deleteCalled).toBe(true);
  });

  test('cancels delete from dialog without calling API', async ({ page }) => {
    let deleteCalled = false;

    await page.route(`${API_BASE}/goals/**`, async (route) => {
      const url = route.request().url();
      const method = route.request().method();
      if (method === 'DELETE') {
        deleteCalled = true;
        await fulfillJson(route, { success: true, data: { message: 'Deleted' } });
      } else if (method === 'GET') {
        await fulfillJson(route, {
          success: true,
          data: { goals: [MOCK_GOAL], totalCount: 1 },
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/goals');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Delete goal' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();

    await expect(page.getByRole('dialog')).not.toBeVisible();
    expect(deleteCalled).toBe(false);
  });
});
