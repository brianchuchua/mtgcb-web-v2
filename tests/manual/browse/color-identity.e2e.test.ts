import { Page, expect, test } from '@playwright/test';
import path from 'path';
import { LOCAL_TEST_USER_ID, authenticateAsLocalTestUser, getLocalTestJwt } from '../../utils/auth';

// User story: someone building a Commander deck filters cards by color identity
// on Browse, on their collection, and as a goal.
//
// Besides the screenshots, each step reads the cards the real local API sent back
// and checks every one of them against the rule that was asked for, so a filter
// that sends the right request but gets the wrong cards still shows up here.
//
// The goal step creates a real goal for local user 1337 and deletes it again.

const API = 'http://local.mtgcb.com:5000';
const SHOTS_DIR = path.join(process.cwd(), 'test-results', 'manual-screenshots');
const shot = (name: string) => path.join(SHOTS_DIR, `${name}.png`);

test.use({ viewport: { width: 1440, height: 900 } });

type SearchCard = { name: string; colors_array?: string[]; color_identities_array?: string[] };
type SearchResult = { body: Record<string, unknown>; cards: SearchCard[]; totalCount: number };

// The page only asks the API for the fields it renders, which leaves out color identity. So once
// the page has sent its search, the same criteria are replayed straight at the API asking for the
// identity of up to 500 matches, and those are what get checked.
const waitForSearch = (page: Page, matches: (body: Record<string, unknown>) => boolean): Promise<SearchResult> =>
  page
    .waitForRequest(
      (request) => {
        if (request.url() !== `${API}/cards/search` || request.method() !== 'POST') return false;
        const body = request.postDataJSON();
        return !!body && matches(body);
      },
      { timeout: 20000 },
    )
    .then(async (request) => {
      const body = request.postDataJSON() as Record<string, unknown>;
      const jwt = getLocalTestJwt();
      const replay = await page.request.post(`${API}/cards/search`, {
        headers: body.userId && jwt ? { cookie: `MTGCB_AuthToken=${jwt}` } : {},
        data: { ...body, offset: 0, limit: 500, select: ['name', 'colors_array', 'color_identities_array'] },
      });
      const json = await replay.json();
      expect(replay.status()).toBe(200);
      return { body, cards: json.data.cards as SearchCard[], totalCount: json.data.totalCount as number };
    });

const sameJson = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const identityIs = (expected: unknown) => (body: Record<string, unknown>) =>
  sameJson(body.color_identities_array, expected);

const identities = (cards: SearchCard[]) => cards.map((card) => [...(card.color_identities_array ?? [])].sort().join(''));

const watchReactErrors = (page: Page) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (/Rendered (more|fewer) hooks|Rules of Hooks|hook order|Hydration|Minified React error/.test(text)) {
      errors.push(text);
    }
  });
  return errors;
};

const sidenav = (page: Page) => page.locator('.MuiDrawer-paper');
const identityBox = (page: Page) => sidenav(page).getByTestId('color-identity-filter');

const waitForCards = (page: Page) => expect(page.getByTestId('card-item').first()).toBeVisible({ timeout: 20000 });

// Screenshot once the page has stopped moving: select menus have finished closing and the card
// images on screen have loaded (best effort, since a missing image must not fail the run).
const snap = async (page: Page, name: string, { menuOpen = false } = {}) => {
  if (!menuOpen) await expect(page.getByRole('listbox')).toHaveCount(0);
  await page
    .waitForFunction(
      () => {
        const images = Array.from(document.querySelectorAll<HTMLImageElement>('[data-testid="card-item"] img'));
        const onScreen = images.filter((img) => {
          const box = img.getBoundingClientRect();
          return box.top < window.innerHeight && box.bottom > 0;
        });
        return onScreen.every((img) => img.complete && img.naturalWidth > 0);
      },
      undefined,
      { timeout: 10000 },
    )
    .catch(() => undefined);
  await page.waitForTimeout(400);
  await page.screenshot({ path: shot(name) });
};

test.describe('User story: filter cards by color identity', () => {
  test('browse: click through every match type and colorless', async ({ page }) => {
    const reactErrors = watchReactErrors(page);

    await page.goto('/browse?contentType=cards');
    await page.waitForLoadState('networkidle');
    await waitForCards(page);
    await identityBox(page).scrollIntoViewIfNeeded();
    await snap(page, 'color-identity-01-browse-untouched');

    // Only Green/Blue
    let search = waitForSearch(page, identityIs({ exactly: ['G', 'U'] }));
    await sidenav(page).getByTestId('color-identity-filter-G').click();
    await sidenav(page).getByTestId('color-identity-filter-U').click();
    const exact = await search;
    await waitForCards(page);
    await snap(page, 'color-identity-02-browse-exactly-GU');
    expect(identities(exact.cards).every((id) => id === 'GU')).toBe(true);

    // At most Green/Blue: what a Simic commander deck can run
    search = waitForSearch(page, identityIs({ atMost: ['G', 'U'] }));
    await sidenav(page).getByTestId('color-identity-filter-match-type').getByRole('combobox').click();
    await snap(page, 'color-identity-03-browse-match-type-menu', { menuOpen: true });
    await page.getByRole('option', { name: 'At Most These Colors' }).click();
    const atMost = await search;
    await waitForCards(page);
    await snap(page, 'color-identity-04-browse-at-most-GU');
    expect(identities(atMost.cards).every((id) => /^G?U?$/.test(id))).toBe(true);

    // At least Green/Blue
    search = waitForSearch(page, identityIs({ atLeast: ['G', 'U'] }));
    await sidenav(page).getByTestId('color-identity-filter-match-type').getByRole('combobox').click();
    await page.getByRole('option', { name: 'At Least These Colors' }).click();
    const atLeast = await search;
    expect(identities(atLeast.cards).every((id) => id.includes('G') && id.includes('U'))).toBe(true);

    // Colorless identity
    search = waitForSearch(page, identityIs({ exactly: [] }));
    await sidenav(page).getByTestId('color-identity-filter-C').click();
    const colorless = await search;
    await waitForCards(page);
    await snap(page, 'color-identity-05-browse-colorless');
    expect(identities(colorless.cards).every((id) => id === '')).toBe(true);

    console.log(
      JSON.stringify({
        label: 'color-identity-browse',
        url: page.url(),
        totals: {
          exactlyGU: exact.totalCount,
          atMostGU: atMost.totalCount,
          atLeastGU: atLeast.totalCount,
          colorless: colorless.totalCount,
        },
        atMostIdentitiesSeen: [...new Set(identities(atMost.cards))],
        reactErrors,
      }),
    );
    expect(exact.totalCount).toBeLessThan(atMost.totalCount);
    expect(exact.totalCount).toBeLessThan(atLeast.totalCount);
    expect(reactErrors).toEqual([]);
  });

  test('browse: colorless cards with a green identity (the two filters together)', async ({ page }) => {
    const search = waitForSearch(
      page,
      (body) => sameJson(body.colors_array, { exactly: [] }) && sameJson(body.color_identities_array, { atLeast: ['G'] }),
    );
    await page.goto('/browse?contentType=cards&colorless=true&colorIdentity=G&colorIdentityMatchType=atLeast');
    const result = await search;
    await waitForCards(page);
    await identityBox(page).scrollIntoViewIfNeeded();
    await snap(page, 'color-identity-06-browse-colorless-color-green-identity');

    // The pickers are restored from the URL, each on its own.
    await expect(sidenav(page).getByTestId('color-filter-C')).toHaveAttribute('aria-pressed', 'true');
    await expect(sidenav(page).getByTestId('color-filter-G')).toHaveAttribute('aria-pressed', 'false');
    await expect(sidenav(page).getByTestId('color-identity-filter-G')).toHaveAttribute('aria-pressed', 'true');
    await expect(sidenav(page).getByTestId('color-identity-filter-C')).toHaveAttribute('aria-pressed', 'false');

    expect(result.cards.every((card) => (card.colors_array ?? []).length === 0)).toBe(true);
    expect(identities(result.cards).every((id) => id.includes('G'))).toBe(true);

    console.log(
      JSON.stringify({
        label: 'color-identity-with-colorless',
        totalCount: result.totalCount,
        sample: result.cards.slice(0, 8).map((card) => `${card.name} [${(card.color_identities_array ?? []).join('')}]`),
      }),
    );
  });

  test('browse: survives a refresh and is cleared by Reset Search', async ({ page }) => {
    await page.goto('/browse?contentType=cards&colorIdentity=R,W&colorIdentityMatchType=atMost');
    await waitForCards(page);

    await page.reload();
    await waitForCards(page);
    await expect(page).toHaveURL(/colorIdentityMatchType=atMost/);
    await expect(sidenav(page).getByTestId('color-identity-filter-R')).toHaveAttribute('aria-pressed', 'true');
    await expect(sidenav(page).getByTestId('color-identity-filter-W')).toHaveAttribute('aria-pressed', 'true');

    await sidenav(page).getByRole('button', { name: /reset search/i }).click();
    await expect(page).not.toHaveURL(/colorIdentity/);
    await expect(page.getByText(/color identity\)/)).toHaveCount(0);
    await expect(sidenav(page).getByTestId('color-identity-filter-R')).toHaveAttribute('aria-pressed', 'false');
    await identityBox(page).scrollIntoViewIfNeeded();
    await snap(page, 'color-identity-07-browse-after-reset');

    console.log(JSON.stringify({ label: 'color-identity-reset', url: page.url() }));
  });

  test('browse table view and sets view', async ({ page }) => {
    await page.goto('/browse?contentType=cards&colorIdentity=B&colorIdentityMatchType=exactly');
    await waitForCards(page);

    // The filter belongs to cards. Switching to sets must not carry it along or break.
    await page.goto('/browse?contentType=sets&colorIdentity=B');
    await page.waitForLoadState('networkidle');
    await expect(sidenav(page).getByTestId('color-identity-filter')).toHaveCount(0);
    await snap(page, 'color-identity-08-sets-view-has-no-picker');
    console.log(JSON.stringify({ label: 'color-identity-sets', url: page.url() }));
  });
});

test.describe('User story: color identity on a collection and in a goal', () => {
  test.beforeEach(async ({ context }) => {
    test.skip(!getLocalTestJwt(), 'E2E_TEST_JWT_1337 not set');
    await authenticateAsLocalTestUser(context);
  });

  test('collection: filter owned cards by color identity', async ({ page }) => {
    const reactErrors = watchReactErrors(page);

    await page.goto(`/collections/${LOCAL_TEST_USER_ID}?contentType=cards`);
    await page.waitForLoadState('networkidle');
    await waitForCards(page);

    const search = waitForSearch(page, identityIs({ exactly: ['W', 'B'] }));
    await sidenav(page).getByTestId('color-identity-filter-W').click();
    await sidenav(page).getByTestId('color-identity-filter-B').click();
    const result = await search;
    await waitForCards(page);
    await identityBox(page).scrollIntoViewIfNeeded();
    await snap(page, 'color-identity-09-collection-exactly-WB');

    expect(result.body.userId).toBe(LOCAL_TEST_USER_ID);
    expect(identities(result.cards).every((id) => id === 'BW')).toBe(true);
    await expect(page).toHaveURL(/colorIdentity=W%2CB|colorIdentity=W,B/);

    console.log(
      JSON.stringify({
        label: 'color-identity-collection',
        url: page.url(),
        totalCount: result.totalCount,
        reactErrors,
      }),
    );
    expect(reactErrors).toEqual([]);
  });

  test('goal: create one by color identity, view it on the collection, reopen it, delete it', async ({
    page,
    request,
  }) => {
    const reactErrors = watchReactErrors(page);
    const authHeaders = { cookie: `MTGCB_AuthToken=${getLocalTestJwt()}` };
    const goalName = `Color identity manual test ${Date.now()}`;
    let goalId: number | undefined;

    try {
      await page.goto('/goals/create');
      await expect(page.getByLabel('Goal Name')).toBeVisible({ timeout: 15000 });
      await page.getByLabel('Goal Name').fill(goalName);

      await page.getByTestId('goal-color-identity-filter-G').click();
      await page.getByTestId('goal-color-identity-filter-U').click();
      await page.getByTestId('goal-color-identity-filter-match-type').getByRole('combobox').click();
      await page.getByRole('option', { name: 'At Most These Colors' }).click();
      await page.getByLabel('Card Types').fill('Legendary');
      await page.getByRole('option', { name: 'Legendary', exact: true }).click();
      await page.keyboard.press('Escape');

      const summary = page.getByText('Goal Summary', { exact: true }).locator('..');
      await expect(summary).toContainText('at most Green/Blue color identity');
      await page.getByTestId('goal-color-identity-filter').scrollIntoViewIfNeeded();
      await snap(page, 'color-identity-10-goal-create-form');
      await summary.scrollIntoViewIfNeeded();
      await snap(page, 'color-identity-11-goal-create-summary');
      const summaryText = (await summary.innerText()).replace(/\s+/g, ' ');

      const created = page.waitForResponse(
        (response) => response.url() === `${API}/goals` && response.request().method() === 'POST',
      );
      await page.getByRole('button', { name: 'Create Goal' }).click();
      const createResponse = await created;
      const createdJson = await createResponse.json();
      goalId = createdJson?.data?.id;
      const sentConditions = createResponse.request().postDataJSON().searchCriteria.conditions;
      expect(createResponse.status()).toBeLessThan(300);
      expect(sentConditions.color_identities_array).toEqual({ atMost: ['G', 'U'] });

      // The create redirects to the collection filtered by the new goal.
      await page.waitForURL((url) => url.pathname === `/collections/${LOCAL_TEST_USER_ID}`, { timeout: 30000 });
      await page.waitForLoadState('networkidle');
      await waitForCards(page);
      await snap(page, 'color-identity-12-goal-on-collection');

      // Ask the API for the goal's cards directly and check every one against the rule.
      const goalCards = await request.post(`${API}/cards/search`, {
        headers: authHeaders,
        data: {
          userId: LOCAL_TEST_USER_ID,
          goalId,
          showGoals: 'all',
          priceType: 'market',
          limit: 500,
          select: ['name', 'type', 'color_identities_array'],
        },
      });
      const goalCardsJson = await goalCards.json();
      const cards: Array<SearchCard & { type?: string }> = goalCardsJson?.data?.cards ?? [];
      const outsideIdentity = cards.filter((card) => !/^G?U?$/.test(identities([card])[0]));
      const notLegendary = cards.filter((card) => !/Legendary/.test(card.type ?? ''));

      // Reopen the goal: the picker must come back as it was saved.
      await page.goto(`/goals/edit/${goalId}`);
      await expect(page.getByLabel('Goal Name')).toHaveValue(goalName, { timeout: 15000 });
      await expect(page.getByTestId('goal-color-identity-filter-G')).toHaveAttribute('aria-pressed', 'true');
      await expect(page.getByTestId('goal-color-identity-filter-U')).toHaveAttribute('aria-pressed', 'true');
      await expect(page.getByTestId('goal-color-identity-filter-R')).toHaveAttribute('aria-pressed', 'false');
      await expect(page.getByTestId('goal-color-filter-G')).toHaveAttribute('aria-pressed', 'false');
      await expect(
        page.getByTestId('goal-color-identity-filter-match-type').getByRole('combobox'),
      ).toHaveText('At Most These Colors');
      await page.getByTestId('goal-color-identity-filter').scrollIntoViewIfNeeded();
      await snap(page, 'color-identity-13-goal-edit-reloaded');

      await page.goto('/goals');
      await expect(page.getByText(goalName)).toBeVisible({ timeout: 15000 });
      await page.getByText(goalName).scrollIntoViewIfNeeded();
      await snap(page, 'color-identity-14-goals-list');

      console.log(
        JSON.stringify({
          label: 'color-identity-goal',
          goalId,
          createStatus: createResponse.status(),
          sentConditions,
          summaryText,
          goalSearchStatus: goalCards.status(),
          goalTotalCount: goalCardsJson?.data?.totalCount,
          checkedCards: cards.length,
          outsideIdentity: outsideIdentity.length,
          notLegendary: notLegendary.length,
          reactErrors,
        }),
      );
      expect(cards.length).toBeGreaterThan(0);
      expect(outsideIdentity).toEqual([]);
      expect(notLegendary).toEqual([]);
      expect(reactErrors).toEqual([]);
    } finally {
      if (goalId) {
        const deleted = await request.delete(`${API}/goals/${LOCAL_TEST_USER_ID}/${goalId}`, { headers: authHeaders });
        console.log(JSON.stringify({ label: 'color-identity-goal-cleanup', goalId, status: deleted.status() }));
      }
    }
  });
});

test.describe('User story: color identity on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('the picker fits the drawer and filters from there', async ({ page }) => {
    await page.goto('/browse?contentType=cards');
    await page.waitForLoadState('networkidle');
    await waitForCards(page);

    await page.getByRole('button', { name: 'menu', exact: true }).click();
    const box = identityBox(page);
    await box.scrollIntoViewIfNeeded();
    await expect(box).toBeVisible();

    const search = waitForSearch(page, identityIs({ exactly: ['B'] }));
    await sidenav(page).getByTestId('color-identity-filter-B').click();
    const result = await search;
    await snap(page, 'color-identity-15-mobile-drawer');

    // All six symbols sit on one row inside the drawer.
    const tops = await box.locator('button').evaluateAll((buttons) => buttons.map((b) => Math.round(b.getBoundingClientRect().top)));
    const boxEdges = await box.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return { left: rect.left, right: rect.right, viewport: window.innerWidth };
    });

    await page.keyboard.press('Escape');
    await waitForCards(page);
    await snap(page, 'color-identity-16-mobile-results');

    console.log(
      JSON.stringify({
        label: 'color-identity-mobile',
        url: page.url(),
        totalCount: result.totalCount,
        buttonRows: [...new Set(tops)].length,
        boxEdges,
      }),
    );
    expect([...new Set(tops)]).toHaveLength(1);
    expect(boxEdges.left).toBeGreaterThanOrEqual(0);
    expect(boxEdges.right).toBeLessThanOrEqual(boxEdges.viewport);
    expect(identities(result.cards).every((id) => id === 'B')).toBe(true);
  });
});
