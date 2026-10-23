import { expect, test, type Page, type Route } from '@playwright/test';
import { LOCAL_TEST_USER_ID, authenticateAsLocalTestUser, getLocalTestJwt } from '../utils/auth';

// Goal progress inside the collection (?goalId=). The goal is fake (id 9201): the goal list is
// mocked so the collection accepts it, and goal-scoped card searches are answered from a real
// plain search (no goal) with goal fields layered on top, so the numbers are fixed.

const API_ORIGIN = 'http://local.mtgcb.com:5000';
const GOAL_ID = 9201;
const GOAL_NAME = 'Progress Goal';

const GOAL = {
  id: GOAL_ID,
  userId: LOCAL_TEST_USER_ID,
  name: GOAL_NAME,
  description: null,
  searchCriteria: { conditions: {} },
  targetQuantityAll: 1,
  targetQuantityReg: null,
  targetQuantityFoil: null,
  onePrintingPerPureName: false,
  includeSetsOutsideGoal: false,
  isActive: true,
  createdAt: '2026-04-26T00:00:00.000Z',
  updatedAt: '2026-04-26T00:00:00.000Z',
};

const GOAL_SUMMARY = {
  goalId: GOAL_ID,
  goalName: GOAL_NAME,
  totalCards: 40,
  collectedCards: 13,
  percentageCollected: 32.5,
  totalValue: 1234.5,
  costToComplete: 98.76,
};

type ShowGoals = 'all' | 'complete' | 'incomplete';

interface GoalSearch {
  showGoals: ShowGoals;
  body: Record<string, unknown>;
}

const fulfillJson = (route: Route, body: unknown, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

const withGoalFields = (card: Record<string, unknown>, met: boolean) => ({
  ...card,
  goalTargetQuantityAll: 1,
  goalTargetQuantityReg: null,
  goalTargetQuantityFoil: null,
  goalAllNeeded: met ? 0 : 1,
  goalRegNeeded: 0,
  goalFoilNeeded: 0,
  goalAllMet: met,
  goalRegMet: met,
  goalFoilMet: met,
  goalFullyMet: met,
  goalMetByOtherSets: false,
  goalContributingVersions: [],
});

const mockGoalCollection = async (page: Page) => {
  const goalSearches: GoalSearch[] = [];
  let missingCardName = '';
  let doneCardName = '';

  await page.route(
    (url) => url.origin === API_ORIGIN && url.pathname.startsWith(`/goals/${LOCAL_TEST_USER_ID}`),
    (route) => {
      const { pathname } = new URL(route.request().url());
      if (pathname === `/goals/${LOCAL_TEST_USER_ID}`) {
        return fulfillJson(route, { success: true, data: { goals: [GOAL], totalCount: 1, limit: 500, offset: 0 } });
      }
      if (pathname === `/goals/${LOCAL_TEST_USER_ID}/${GOAL_ID}`) {
        return fulfillJson(route, { success: true, data: { ...GOAL, progress: GOAL_SUMMARY } });
      }
      return route.fallback();
    },
  );

  await page.route(
    (url) => url.origin === API_ORIGIN && url.pathname === '/cards/search',
    async (route) => {
      const body = route.request().postDataJSON() ?? {};
      if (body.goalId !== GOAL_ID) return route.fallback();

      const showGoals: ShowGoals = body.showGoals ?? 'all';
      goalSearches.push({ showGoals, body });

      const { goalId: _goalId, showGoals: _showGoals, showGoalProgress: _progress, select: _select, ...plain } = body;
      const real = await route.fetch({ postData: JSON.stringify({ ...plain, limit: 2, offset: 0 }) });
      const json = await real.json();
      const [first, second] = json.data.cards as Record<string, unknown>[];
      missingCardName = String(first.name);
      doneCardName = String(second.name);

      const missing = withGoalFields(first, false);
      const done = withGoalFields(second, true);
      const cards = showGoals === 'incomplete' ? [missing] : showGoals === 'complete' ? [done] : [missing, done];

      return fulfillJson(route, {
        ...json,
        data: { ...json.data, cards, totalCount: cards.length, offset: 0, goalSummary: GOAL_SUMMARY },
      });
    },
  );

  return {
    goalSearches,
    cardNames: () => ({ missing: missingCardName, done: doneCardName }),
  };
};

const cardNames = (page: Page) => page.getByTestId('card-name');

const completionButton = (page: Page, label: 'All' | 'Missing' | 'Done') =>
  page
    .getByRole('group')
    // The ownership filter also has All/Missing; only the goal filter has Done.
    .filter({ has: page.getByRole('button', { name: 'Done', exact: true }) })
    .getByRole('button', { name: label, exact: true });

test.describe('Goal progress in the collection', () => {
  test.beforeEach(async ({ context }) => {
    test.skip(!getLocalTestJwt(), 'Set E2E_TEST_JWT_1337 to run (see tests/utils/auth.ts)');
    await authenticateAsLocalTestUser(context);
  });

  // Goal searches are answered by fetching from the real API; let any still in flight drop quietly.
  test.afterEach(async ({ page }) => {
    await page.unrouteAll({ behavior: 'ignoreErrors' });
  });

  test('header shows the goal name, progress, value and cost to complete', async ({ page }) => {
    const mocks = await mockGoalCollection(page);
    await page.goto(`/collections/${LOCAL_TEST_USER_ID}?contentType=cards&goalId=${GOAL_ID}`);

    await expect(page.getByRole('heading', { name: GOAL_NAME })).toBeVisible({ timeout: 20000 });
    await expect(page.getByText("Manath's Collection Goal")).toBeVisible();
    await expect(page.getByText('13/40', { exact: true })).toBeVisible();
    await expect(page.getByText('$1,234.50')).toBeVisible();
    await expect(page.getByText('$98.76')).toBeVisible();

    const firstSearch = mocks.goalSearches[0].body;
    expect(firstSearch.showGoalProgress).toBe(true);
    expect(firstSearch).not.toHaveProperty('showGoals');
    expect(firstSearch.select).toEqual(expect.arrayContaining(['goalFullyMet', 'goalAllNeeded']));
  });

  test('cards show whether the goal is met or what is still needed', async ({ page }) => {
    const mocks = await mockGoalCollection(page);
    await page.goto(`/collections/${LOCAL_TEST_USER_ID}?contentType=cards&goalId=${GOAL_ID}`);

    await expect(cardNames(page)).toHaveCount(2, { timeout: 20000 });
    await expect(page.getByText('(Need 1 regular or foil)')).toHaveCount(1);
    await expect(page.getByText('(Goal met!)')).toHaveCount(1);
    expect(mocks.cardNames().missing).not.toBe('');
  });

  test('completion filter sends showGoals and narrows the cards to missing or done', async ({ page }) => {
    const mocks = await mockGoalCollection(page);
    await page.goto(`/collections/${LOCAL_TEST_USER_ID}?contentType=cards&goalId=${GOAL_ID}`);
    await expect(cardNames(page)).toHaveCount(2, { timeout: 20000 });

    await expect(completionButton(page, 'All')).toHaveAttribute('aria-pressed', 'true');

    await completionButton(page, 'Missing').click();
    await expect.poll(() => mocks.goalSearches.at(-1)?.showGoals).toBe('incomplete');
    await expect(cardNames(page)).toHaveCount(1);
    await expect(cardNames(page)).toHaveText(mocks.cardNames().missing);
    await expect(page.getByText('(Goal met!)')).toHaveCount(0);
    await expect(completionButton(page, 'Missing')).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(() => new URL(page.url()).searchParams.get('showGoals')).toBe('incomplete');

    await completionButton(page, 'Done').click();
    await expect.poll(() => mocks.goalSearches.at(-1)?.showGoals).toBe('complete');
    await expect(cardNames(page)).toHaveCount(1);
    await expect(cardNames(page)).toHaveText(mocks.cardNames().done);
    await expect(page.getByText('(Goal met!)')).toHaveCount(1);
    await expect.poll(() => new URL(page.url()).searchParams.get('showGoals')).toBe('complete');

    await completionButton(page, 'All').click();
    await expect(cardNames(page)).toHaveCount(2);
    await expect.poll(() => new URL(page.url()).searchParams.get('showGoals')).toBeNull();
    // Back on All the cached unfiltered search is reused rather than refetched ('all' = no showGoals sent).
    expect(new Set(mocks.goalSearches.map((s) => s.showGoals))).toEqual(new Set(['all', 'incomplete', 'complete']));
  });

  test('a showGoals URL param preselects the filter on load', async ({ page }) => {
    const mocks = await mockGoalCollection(page);
    await page.goto(`/collections/${LOCAL_TEST_USER_ID}?contentType=cards&goalId=${GOAL_ID}&showGoals=complete`);

    await expect(cardNames(page)).toHaveCount(1, { timeout: 20000 });
    await expect(completionButton(page, 'Done')).toHaveAttribute('aria-pressed', 'true');
    expect(mocks.goalSearches.every((s) => s.showGoals === 'complete')).toBe(true);
  });

  test('the completion filter is hidden without a goal', async ({ page }) => {
    await page.goto(`/collections/${LOCAL_TEST_USER_ID}?contentType=cards`);
    await expect(page.getByText('Goal Completion Status')).toHaveCount(0);
    await expect(page.getByLabel('Collection Goal').first()).toBeVisible({ timeout: 20000 });
    await expect(page.getByText('Goal Completion Status')).toHaveCount(0);
  });
});
