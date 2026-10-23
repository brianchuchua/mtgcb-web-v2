import { APIRequestContext, Locator, Page, expect, test } from '@playwright/test';

const API = 'http://local.mtgcb.com:5000';
const SET_SLUG = 'dominaria-united';
const SET_NAME = 'Dominaria United';

interface NavSet {
  id: string;
  name: string;
  slug: string;
}

// Neighbours come from the live navigation list (release date, newest first), so
// compute them instead of hardcoding: new sets get added all the time.
const getNeighbours = async (request: APIRequestContext, slug: string) => {
  const response = await request.get(`${API}/sets/navigation?sortBy=releasedAt&sortDirection=desc`);
  expect(response.ok()).toBeTruthy();
  const sets: NavSet[] = (await response.json()).data.sets;
  const index = sets.findIndex((set) => set.slug === slug);
  expect(index).toBeGreaterThan(0);
  return { current: sets[index], previous: sets[index - 1], next: sets[index + 1] };
};

const setHeading = (page: Page, name: string): Locator => page.getByRole('heading', { level: 4, name, exact: true });

const navArrow = (page: Page, direction: 'Left' | 'Right'): Locator =>
  page.locator(`button:has([data-testid="Chevron${direction}Icon"])`).first();

test.describe('Browse set detail page', () => {
  test('renders the set header and requests only that set\'s cards', async ({ page, request }) => {
    const setResponse = await request.post(`${API}/sets/search`, { data: { slug: SET_SLUG, limit: 1 } });
    const setId: string = (await setResponse.json()).data.sets[0].id;

    const cardsRequest = page.waitForRequest(
      (req) => req.url() === `${API}/cards/search` && req.method() === 'POST' && !!req.postDataJSON()?.setId,
    );
    await page.goto(`/browse/sets/${SET_SLUG}`);

    await expect(setHeading(page, SET_NAME)).toBeVisible();
    await expect(page.getByTestId('breadcrumbs')).toContainText(SET_NAME);
    await expect(page.getByText('Normal Set - Expansion')).toBeVisible();

    const body = (await cardsRequest).postDataJSON();
    expect(body.setId).toEqual({ OR: [setId] });
    await expect(page.getByTestId('card-item').first()).toBeVisible({ timeout: 15000 });
  });

  test('next/previous arrows walk the release-date order and update URL and heading', async ({ page, request }) => {
    const { previous, next } = await getNeighbours(request, SET_SLUG);
    await page.goto(`/browse/sets/${SET_SLUG}`);
    await page.waitForLoadState('networkidle');
    await expect(setHeading(page, SET_NAME)).toBeVisible();

    const step = async (direction: 'Left' | 'Right', target: NavSet | { slug: string; name: string }) => {
      await page.waitForLoadState('networkidle');
      await expect(navArrow(page, direction)).toBeEnabled();
      await navArrow(page, direction).click();
      await page.waitForURL(new RegExp(`/browse/sets/${target.slug}$`), { timeout: 15000 });
      await expect(setHeading(page, target.name)).toBeVisible({ timeout: 15000 });
    };

    await step('Right', next);
    await step('Left', { slug: SET_SLUG, name: SET_NAME });
    await step('Left', previous);
  });

  test('a bogus slug shows "Set not found" with a Reset Search action', async ({ page }) => {
    await page.goto('/browse/sets/this-set-does-not-exist-e2e');

    await expect(page.getByText('Set not found or no cards found in it matching your criteria')).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByTestId('breadcrumbs')).toContainText('Set not found');
    await expect(page.locator('main').getByRole('button', { name: 'Reset Search' })).toBeVisible();
    await expect(page.getByTestId('card-item')).toHaveCount(0);
  });

  test('lists every subset with a link to its own set page', async ({ page, request }) => {
    const parentResponse = await request.post(`${API}/sets/search`, { data: { slug: SET_SLUG, limit: 1 } });
    const parentId: string = (await parentResponse.json()).data.sets[0].id;
    const subsetsResponse = await request.post(`${API}/sets/search`, { data: { parentSetId: parentId, limit: 500 } });
    const subsets: NavSet[] = (await subsetsResponse.json()).data.sets;
    expect(subsets.length).toBeGreaterThan(0);

    await page.goto(`/browse/sets/${SET_SLUG}`);
    await expect(page.getByRole('heading', { name: 'Subsets', exact: true })).toBeVisible({ timeout: 15000 });

    for (const subset of subsets) {
      await expect(page.getByRole('link', { name: subset.name, exact: true })).toHaveAttribute(
        'href',
        `/browse/sets/${subset.slug}`,
      );
    }

    const firstSubset = subsets[0];
    const subsetLink = page.getByRole('link', { name: firstSubset.name, exact: true });
    await subsetLink.scrollIntoViewIfNeeded();
    await expect(async () => {
      await subsetLink.click();
      await page.waitForURL(new RegExp(`/browse/sets/${firstSubset.slug}$`), { timeout: 5000 });
    }).toPass({ timeout: 30000 });
    await expect(setHeading(page, firstSubset.name)).toBeVisible();
  });

  test('clicking a subset header expands it and loads that subset\'s cards', async ({ page, request }) => {
    const parentResponse = await request.post(`${API}/sets/search`, { data: { slug: SET_SLUG, limit: 1 } });
    const parentId: string = (await parentResponse.json()).data.sets[0].id;
    const subsetsResponse = await request.post(`${API}/sets/search`, { data: { parentSetId: parentId, limit: 500 } });
    const subset = ((await subsetsResponse.json()).data.sets as NavSet[]).find((s) => s.slug.endsWith('-variants'));
    test.skip(!subset, 'no variants subset found');

    await page.goto(`/browse/sets/${SET_SLUG}`);
    await page.waitForLoadState('networkidle');

    // Click the category line under the name, not the name link (the link navigates instead of expanding).
    const subsetLink = page.getByRole('link', { name: subset!.name, exact: true });
    const header = subsetLink.locator('xpath=ancestor::p[1]/following-sibling::p[1]');
    // No subset cards exist in the DOM until it is expanded; the main set's grid sits above the subsets.
    const firstCardAfterHeader = header.locator('xpath=following::*[@data-testid="card-item"][1]');
    await expect(firstCardAfterHeader).toHaveCount(0);

    const subsetCardsResponse = page.waitForResponse(
      (res) =>
        res.url() === `${API}/cards/search` &&
        res.request().method() === 'POST' &&
        JSON.stringify(res.request().postDataJSON()?.setId ?? null).includes(`"${subset!.id}"`),
    );
    await header.scrollIntoViewIfNeeded();
    await header.click();

    const response = await subsetCardsResponse;
    expect((await response.json()).data.cards.length).toBeGreaterThan(0);
    await expect(firstCardAfterHeader).toBeVisible({ timeout: 15000 });
    expect(page.url()).toMatch(new RegExp(`/browse/sets/${SET_SLUG}$`));
  });
});
