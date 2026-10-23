import { expect, test, type Page, type Request, type Route } from '@playwright/test';
import { LOCAL_TEST_USER_ID, authenticateAsLocalTestUser, getLocalTestJwt } from '../utils/auth';

// Every goal write here is mocked: the edit page loads a fake goal (id 9999) and the
// PUT / DELETE never reach the real API, so user 1337's goals are untouched.

const API_ORIGIN = 'http://local.mtgcb.com:5000';
const GOAL_ID = 9999;
const GOAL_PATH = `/goals/${LOCAL_TEST_USER_ID}/${GOAL_ID}`;
const GOALS_LIST_PATH = `/goals/${LOCAL_TEST_USER_ID}`;

const SAVED_CONDITIONS = {
  rarityNumeric: { OR: ['=4'] },
  colors_array: { atLeast: ['U'] },
};

const buildGoal = (overrides: Record<string, unknown> = {}) => ({
  id: GOAL_ID,
  userId: LOCAL_TEST_USER_ID,
  name: 'Blue Rares',
  description: 'Every blue rare',
  searchCriteria: { conditions: SAVED_CONDITIONS },
  targetQuantityAll: 2,
  targetQuantityReg: null,
  targetQuantityFoil: null,
  onePrintingPerPureName: true,
  flexibleFinishes: false,
  includeSetsOutsideGoal: false,
  isActive: true,
  createdAt: '2026-04-26T00:00:00.000Z',
  updatedAt: '2026-04-26T00:00:00.000Z',
  ...overrides,
});

const fulfillJson = (route: Route, body: unknown, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

const isApiPath = (path: string) => (url: URL) => url.origin === API_ORIGIN && url.pathname === path;

interface GoalMocks {
  putBodies: unknown[];
  deleteRequests: Request[];
}

const mockGoalEndpoints = async (
  page: Page,
  goal: Record<string, unknown> | null,
  { getBody }: { getBody?: unknown } = {},
): Promise<GoalMocks> => {
  const mocks: GoalMocks = { putBodies: [], deleteRequests: [] };

  await page.route(isApiPath(GOAL_PATH), async (route) => {
    const method = route.request().method();
    if (method === 'PUT') {
      const body = route.request().postDataJSON();
      mocks.putBodies.push(body);
      return fulfillJson(route, { success: true, data: { ...goal, ...body } });
    }
    if (method === 'DELETE') {
      mocks.deleteRequests.push(route.request());
      return fulfillJson(route, { success: true, data: { message: 'Deleted' } });
    }
    return fulfillJson(route, getBody ?? { success: true, data: goal });
  });

  await page.route(isApiPath(GOALS_LIST_PATH), (route) =>
    fulfillJson(route, {
      success: true,
      data: { goals: goal ? [goal] : [], totalCount: goal ? 1 : 0, limit: 500, offset: 0 },
    }),
  );

  return mocks;
};

const openEditPage = async (page: Page) => {
  await page.goto(`/goals/edit/${GOAL_ID}`);
  await expect(page.getByRole('heading', { name: /^Editing / })).toBeVisible({ timeout: 15000 });
};

test.describe('Edit goal - saving', () => {
  test.beforeEach(async ({ context }) => {
    test.skip(!getLocalTestJwt(), 'Set E2E_TEST_JWT_1337 to run (see tests/utils/auth.ts)');
    await authenticateAsLocalTestUser(context);
  });

  test('Any Type mode sends targetQuantityAll, isActive and the saved criteria in the PUT body', async ({
    page,
  }) => {
    const mocks = await mockGoalEndpoints(page, buildGoal());
    await openEditPage(page);

    await expect(page.getByLabel('Goal Name')).toHaveValue('Blue Rares');
    await expect(page.getByLabel('Description (optional)')).toHaveValue('Every blue rare');
    await expect(page.getByTestId('target-quantity-all')).toHaveValue('2');
    await expect(page.getByLabel('Active')).toBeChecked();

    await page.getByLabel('Goal Name').fill('  Blue Rares x3  ');
    await page.getByTestId('target-quantity-all').fill('3');
    await page.getByLabel('Active').uncheck();

    const putRequest = page.waitForRequest((r) => r.method() === 'PUT' && new URL(r.url()).pathname === GOAL_PATH);
    await page.getByRole('button', { name: 'Update Goal' }).click();
    await putRequest;

    await expect(page.getByText('Goal updated', { exact: true })).toBeVisible();
    expect(mocks.putBodies).toHaveLength(1);
    expect(mocks.putBodies[0]).toEqual({
      name: 'Blue Rares x3',
      description: 'Every blue rare',
      searchCriteria: { conditions: SAVED_CONDITIONS },
      isActive: false,
      onePrintingPerPureName: true,
      includeSetsOutsideGoal: false,
      targetQuantityAll: 3,
    });
  });

  test('Separate Regular/Foil mode sends reg/foil targets with flexibleFinishes and drops targetQuantityAll', async ({
    page,
  }) => {
    const mocks = await mockGoalEndpoints(page, buildGoal());
    await openEditPage(page);

    await page.getByText('Separate Regular/Foil', { exact: true }).click();
    await page.getByTestId('target-quantity-reg').fill('4');
    await page.getByTestId('target-quantity-foil').fill('1');

    const flexibleSwitch = page.getByRole('checkbox', { name: /Flexible Finishes/ });
    await expect(flexibleSwitch).not.toBeChecked();
    await flexibleSwitch.check();

    await page.getByRole('button', { name: 'Update Goal' }).click();
    await expect(page.getByText('Goal updated', { exact: true })).toBeVisible();

    expect(mocks.putBodies).toHaveLength(1);
    const body = mocks.putBodies[0] as Record<string, unknown>;
    expect(body).toMatchObject({
      name: 'Blue Rares',
      isActive: true,
      targetQuantityReg: 4,
      targetQuantityFoil: 1,
      flexibleFinishes: true,
    });
    expect(body).not.toHaveProperty('targetQuantityAll');
  });

  test('Separate mode with only a regular target omits foil and flexibleFinishes', async ({ page }) => {
    const mocks = await mockGoalEndpoints(
      page,
      buildGoal({ targetQuantityAll: null, targetQuantityReg: 2, targetQuantityFoil: null }),
    );
    await openEditPage(page);

    await expect(page.getByTestId('target-quantity-reg')).toHaveValue('2');
    await expect(page.getByTestId('target-quantity-all')).toHaveCount(0);

    await page.getByRole('button', { name: 'Update Goal' }).click();
    await expect(page.getByText('Goal updated', { exact: true })).toBeVisible();

    const body = mocks.putBodies[0] as Record<string, unknown>;
    expect(body.targetQuantityReg).toBe(2);
    expect(body).not.toHaveProperty('targetQuantityFoil');
    expect(body).not.toHaveProperty('targetQuantityAll');
    expect(body).not.toHaveProperty('flexibleFinishes');
  });

  test('re-activating an inactive goal sends isActive: true', async ({ page }) => {
    const mocks = await mockGoalEndpoints(page, buildGoal({ isActive: false }));
    await openEditPage(page);

    const activeSwitch = page.getByLabel('Active');
    await expect(activeSwitch).not.toBeChecked();
    await activeSwitch.check();

    await page.getByRole('button', { name: 'Update Goal' }).click();
    await expect(page.getByText('Goal updated', { exact: true })).toBeVisible();
    expect((mocks.putBodies[0] as Record<string, unknown>).isActive).toBe(true);
  });

  test('after saving it redirects to the collection filtered by the goal', async ({ page }) => {
    await mockGoalEndpoints(page, buildGoal({ onePrintingPerPureName: false }));
    await openEditPage(page);

    // The collection may normalise its URL after landing, so keep the first URL the redirect produced.
    const visitedUrls: string[] = [];
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) visitedUrls.push(frame.url());
    });

    await page.getByRole('button', { name: 'Update Goal' }).click();
    await page.waitForURL((url) => url.pathname === `/collections/${LOCAL_TEST_USER_ID}`, { timeout: 15000 });

    const redirect = new URL(visitedUrls.find((u) => new URL(u).pathname.startsWith('/collections/'))!);
    expect(redirect.searchParams.get('contentType')).toBe('cards');
    expect(redirect.searchParams.get('goalId')).toBe(String(GOAL_ID));
    expect(redirect.searchParams.get('oneResultPerCardName')).toBe('false');
  });

  test('a failed save shows the API error and stays on the edit page', async ({ page }) => {
    const goal = buildGoal();
    await mockGoalEndpoints(page, goal);
    await page.route(isApiPath(GOAL_PATH), async (route) => {
      if (route.request().method() !== 'PUT') return route.fallback();
      return fulfillJson(route, { success: false, error: { message: 'Goal name already used' } }, 400);
    });
    await openEditPage(page);

    await page.getByRole('button', { name: 'Update Goal' }).click();

    await expect(page.getByText('Goal name already used')).toBeVisible();
    expect(new URL(page.url()).pathname).toBe(`/goals/edit/${GOAL_ID}`);
  });

  test('a goal the API reports as missing redirects to /goals', async ({ page }) => {
    await mockGoalEndpoints(page, null, {
      getBody: { success: false, data: null, error: { message: 'Goal not found' } },
    });

    await page.goto(`/goals/edit/${GOAL_ID}`);
    await page.waitForURL((url) => url.pathname === '/goals', { timeout: 15000 });
  });

  test('deleting from the edit page calls DELETE and returns to /goals', async ({ page }) => {
    const mocks = await mockGoalEndpoints(page, buildGoal());
    await openEditPage(page);

    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Are you sure you want to delete "Blue Rares"?', { exact: false })).toBeVisible();
    await dialog.getByRole('button', { name: 'Delete', exact: true }).click();

    await expect(page.getByText('Goal deleted', { exact: true })).toBeVisible();
    await page.waitForURL((url) => url.pathname === '/goals', { timeout: 15000 });
    expect(mocks.deleteRequests).toHaveLength(1);
    expect(mocks.putBodies).toHaveLength(0);
  });
});
