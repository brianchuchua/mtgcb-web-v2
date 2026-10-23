import { expect, test, type Page, type Route } from '@playwright/test';
import { LOCAL_TEST_USER_ID, authenticateAsLocalTestUser, getLocalTestJwt } from '../utils/auth';

// POST /goals is always mocked so no real goal is created for user 1337.
// Basic "Any Type" creation is covered by goals-crud.e2e.test.ts.

const API_ORIGIN = 'http://local.mtgcb.com:5000';
const CREATED_GOAL_ID = 9998;

const fulfillJson = (route: Route, body: unknown, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

const isCreateGoal = (url: URL) => url.origin === API_ORIGIN && url.pathname === '/goals';

type CreateResponder = (route: Route, body: Record<string, unknown>) => Promise<void>;

const respondCreated: CreateResponder = (route, body) =>
  fulfillJson(route, {
    success: true,
    data: {
      id: CREATED_GOAL_ID,
      userId: LOCAL_TEST_USER_ID,
      isActive: true,
      createdAt: '2026-04-26T00:00:00.000Z',
      updatedAt: '2026-04-26T00:00:00.000Z',
      ...body,
    },
  });

const mockCreateGoal = async (page: Page, respond: CreateResponder = respondCreated) => {
  const bodies: Record<string, unknown>[] = [];
  await page.route(isCreateGoal, async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    const body = route.request().postDataJSON();
    bodies.push(body);
    return respond(route, body);
  });
  return bodies;
};

const openCreatePage = async (page: Page) => {
  await page.goto('/goals/create');
  await expect(page.getByLabel('Goal Name')).toBeVisible({ timeout: 15000 });
};

// Colour buttons are sized by the mana-font CDN stylesheet, so before it loads they have no box to
// click; dispatch the click instead. A selected colour is drawn at full opacity, so retry until it is.
const selectColor = async (page: Page, color: 'w' | 'u' | 'b' | 'r' | 'g') => {
  const button = page.locator('form').locator(`button:has(i.ms-${color})`);
  const opacity = () => button.evaluate((el) => getComputedStyle(el).opacity);
  await expect(async () => {
    if ((await opacity()) !== '1') await button.dispatchEvent('click');
    expect(await opacity()).toBe('1');
  }).toPass({ timeout: 10000 });
};

const goalSummary = (page: Page) => page.getByText('Goal Summary', { exact: true }).locator('..');

test.describe('Create goal - separate quantities and criteria', () => {
  test.beforeEach(async ({ context }) => {
    test.skip(!getLocalTestJwt(), 'Set E2E_TEST_JWT_1337 to run (see tests/utils/auth.ts)');
    await authenticateAsLocalTestUser(context);
  });

  test('Separate mode sends reg/foil targets, flexibleFinishes and the chosen criteria', async ({ page }) => {
    const bodies = await mockCreateGoal(page);
    await openCreatePage(page);

    await page.getByLabel('Goal Name').fill('Blue Rare Bolts');
    await page.getByLabel('Description (optional)').fill('  test description  ');

    await selectColor(page, 'u');
    await page.getByLabel('Rarities').fill('Rare');
    await page.getByRole('option', { name: 'Rare', exact: true }).click();

    // The search form only reports criteria upward once its option lists have loaded. Check colour
    // and rarity reached the summary before adding a name: a goal summary with a card name drops them.
    await expect(goalSummary(page)).toContainText('only Blue');
    await expect(goalSummary(page)).toContainText('Rare');

    await page.getByLabel('Card Name').fill('Bolt');

    await page.getByText('Separate Regular/Foil', { exact: true }).click();
    await expect(page.getByTestId('target-quantity-all')).toHaveCount(0);
    await page.getByTestId('target-quantity-reg').fill('2');
    await page.getByTestId('target-quantity-foil').fill('1');
    await page.getByRole('checkbox', { name: /Flexible Finishes/ }).check();

    await expect(goalSummary(page)).toContainText('2x regular and 1x foil of');
    await expect(goalSummary(page)).toContainText('Bolt');
    await expect(goalSummary(page)).toContainText('(flexible finishes)');

    await page.getByRole('button', { name: 'Create Goal' }).click();
    await expect(page.getByText('Goal created', { exact: true })).toBeVisible();

    expect(bodies).toHaveLength(1);
    expect(bodies[0]).toEqual({
      name: 'Blue Rare Bolts',
      description: 'test description',
      searchCriteria: {
        conditions: {
          name: 'Bolt',
          colors_array: { exactly: ['U'] },
          rarityNumeric: { OR: ['=4'] },
        },
      },
      onePrintingPerPureName: true,
      includeSetsOutsideGoal: false,
      targetQuantityReg: 2,
      targetQuantityFoil: 1,
      flexibleFinishes: true,
    });
  });

  test('a foil-only target omits targetQuantityReg and flexibleFinishes', async ({ page }) => {
    const bodies = await mockCreateGoal(page);
    await openCreatePage(page);

    await page.getByLabel('Goal Name').fill('Foil Only');
    await page.getByText('Separate Regular/Foil', { exact: true }).click();
    await page.getByTestId('target-quantity-foil').fill('3');
    await expect(page.getByRole('checkbox', { name: /Flexible Finishes/ })).toHaveCount(0);
    await expect(goalSummary(page)).toContainText('3x foil of');

    await page.getByRole('button', { name: 'Create Goal' }).click();
    await expect(page.getByText('Goal created', { exact: true })).toBeVisible();

    const body = bodies[0];
    expect(body.targetQuantityFoil).toBe(3);
    expect(body).not.toHaveProperty('targetQuantityReg');
    expect(body).not.toHaveProperty('targetQuantityAll');
    expect(body).not.toHaveProperty('flexibleFinishes');
    expect(body).not.toHaveProperty('description');
  });

  test('"At Least These Colors" writes colors under atLeast', async ({ page }) => {
    const bodies = await mockCreateGoal(page);
    await openCreatePage(page);

    await page.getByLabel('Goal Name').fill('Izzet');
    await selectColor(page, 'u');
    await selectColor(page, 'r');
    await page.getByRole('combobox').filter({ hasText: 'Only These Colors' }).click();
    await page.getByRole('option', { name: 'At Least These Colors' }).click();

    await expect(goalSummary(page)).toContainText('with Blue/Red');
    await page.getByRole('button', { name: 'Create Goal' }).click();
    await expect(page.getByText('Goal created', { exact: true })).toBeVisible();

    const criteria = bodies[0].searchCriteria as { conditions: Record<string, unknown> };
    expect(criteria.conditions.colors_array).toEqual({ atLeast: ['U', 'R'] });
    expect(bodies[0].targetQuantityAll).toBe(1);
  });

  test('a successful create redirects to the collection filtered by the new goal', async ({ page }) => {
    await mockCreateGoal(page);
    await openCreatePage(page);

    const visitedUrls: string[] = [];
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) visitedUrls.push(frame.url());
    });

    await page.getByLabel('Goal Name').fill('Redirect Goal');
    await page.getByRole('button', { name: 'Create Goal' }).click();
    await page.waitForURL((url) => url.pathname === `/collections/${LOCAL_TEST_USER_ID}`, { timeout: 15000 });

    const redirect = new URL(visitedUrls.find((u) => new URL(u).pathname.startsWith('/collections/'))!);
    expect(redirect.searchParams.get('contentType')).toBe('cards');
    expect(redirect.searchParams.get('goalId')).toBe(String(CREATED_GOAL_ID));
    expect(redirect.searchParams.get('oneResultPerCardName')).toBe('true');
  });

  test('a 500 with an API message shows that message and stays on the form', async ({ page }) => {
    await mockCreateGoal(page, (route) =>
      fulfillJson(route, { success: false, error: { message: 'Goal compilation failed' } }, 500),
    );
    await openCreatePage(page);

    await page.getByLabel('Goal Name').fill('Broken Goal');
    await page.getByRole('button', { name: 'Create Goal' }).click();

    await expect(page.getByText('Goal compilation failed')).toBeVisible();
    await expect(page.getByText('Goal created', { exact: true })).toHaveCount(0);
    expect(new URL(page.url()).pathname).toBe('/goals/create');
    await expect(page.getByLabel('Goal Name')).toHaveValue('Broken Goal');
  });

  test('a 500 without a message falls back to "Failed to create goal"', async ({ page }) => {
    await mockCreateGoal(page, (route) => route.fulfill({ status: 500, contentType: 'text/plain', body: 'oops' }));
    await openCreatePage(page);

    await page.getByLabel('Goal Name').fill('Broken Goal');
    await page.getByRole('button', { name: 'Create Goal' }).click();

    await expect(page.getByText('Failed to create goal', { exact: true })).toBeVisible();
    expect(new URL(page.url()).pathname).toBe('/goals/create');
  });

  test('Separate mode with no quantities blocks submit', async ({ page }) => {
    const bodies = await mockCreateGoal(page);
    await openCreatePage(page);

    await page.getByLabel('Goal Name').fill('Empty Targets');
    await page.getByText('Separate Regular/Foil', { exact: true }).click();
    await page.getByRole('button', { name: 'Create Goal' }).click();

    await expect(page.getByText('Please fix the following errors:')).toBeVisible();
    expect(bodies).toHaveLength(0);
  });
});
