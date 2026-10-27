import { Page, Route, expect, test } from '@playwright/test';

const API = 'http://local.mtgcb.com:5000';
const CARD_ID = '147';
const CARD_URL = `/browse/cards/lightning-bolt/${CARD_ID}`;
const PRINTINGS_PER_PAGE = 20;

// The card page fires two POST /cards/search calls: one by id for the card itself,
// and one by quoted pureName for its other printings.
const isPrintingsSearch = (route: Route) => {
  const body = route.request().postDataJSON();
  return route.request().method() === 'POST' && typeof body?.pureName === 'string';
};

const mockOtherPrintings = async (page: Page, cards: object[]) => {
  await page.route(`${API}/cards/search`, async (route) => {
    if (!isPrintingsSearch(route)) return route.continue();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: { totalCount: cards.length, limit: 500, offset: 0, cards },
        error: null,
      }),
    });
  });
};

const otherPrintingsHeading = (page: Page) => page.getByText(/^Other Printings \(\d+\)$/);

const printingLinks = (page: Page) =>
  page.locator('a[href^="/browse/cards/"]').filter({ has: page.getByText(/ • #/) });

test.describe('Card detail: other printings', () => {
  test('lists every other printing of the card from the live API, 20 per page', async ({ page, request }) => {
    const apiResponse = await request.post(`${API}/cards/search`, {
      data: { pureName: '"Lightning Bolt"', limit: 500, select: ['name'] },
    });
    const apiData = (await apiResponse.json()).data;
    const expectedCount = apiData.totalCount - 1;
    const apiIds: string[] = apiData.cards.map((card: { id: string }) => card.id);
    expect(expectedCount).toBeGreaterThan(PRINTINGS_PER_PAGE);

    const printingsRequest = page.waitForRequest(
      (req) => req.url() === `${API}/cards/search` && !!req.postDataJSON()?.pureName,
    );
    await page.goto(CARD_URL);
    const body = (await printingsRequest).postDataJSON();
    expect(body).toMatchObject({ pureName: '"Lightning Bolt"', sortBy: 'releasedAt', sortDirection: 'desc' });

    await expect(page.getByText(`Other Printings (${expectedCount})`)).toBeVisible({ timeout: 15000 });
    await expect(printingLinks(page)).toHaveCount(PRINTINGS_PER_PAGE);

    const hrefs = await printingLinks(page).evaluateAll((links) => links.map((a) => a.getAttribute('href')));
    for (const href of hrefs) {
      // Slugs vary (flavor names, "(63)" suffixes); the id is what must belong to this card.
      expect(href).toMatch(/^\/browse\/cards\/[a-z0-9-]+\/\d+$/);
      expect(apiIds).toContain(href!.split('/').pop());
      expect(href!.split('/').pop()).not.toBe(CARD_ID);
    }
    expect(new Set(hrefs).size).toBe(hrefs.length);

    await expect(page.getByText(`1-${PRINTINGS_PER_PAGE}`, { exact: true })).toBeVisible();
    await page.locator('button:has([data-testid="ChevronRightIcon"])').last().click();
    await expect(page.getByText(`${PRINTINGS_PER_PAGE + 1}-${Math.min(PRINTINGS_PER_PAGE * 2, expectedCount)}`, { exact: true })).toBeVisible();
    const secondPageHrefs = await printingLinks(page).evaluateAll((links) => links.map((a) => a.getAttribute('href')));
    expect(secondPageHrefs.some((href) => hrefs.includes(href))).toBe(false);
  });

  test('clicking a printing opens that printing\'s detail page', async ({ page }) => {
    await page.goto(CARD_URL);
    await expect(printingLinks(page).first()).toBeVisible({ timeout: 15000 });

    const firstLink = printingLinks(page).first();
    const href = await firstLink.getAttribute('href');
    await expect(async () => {
      await firstLink.click();
      await page.waitForURL(new RegExp(`${href}$`), { timeout: 5000 });
    }).toPass({ timeout: 30000 });

    await expect(page.getByTestId('card-name')).toContainText('Lightning Bolt');
    await expect(otherPrintingsHeading(page)).toBeVisible({ timeout: 15000 });
    await expect(printingLinks(page).first()).toBeVisible();
    await expect(page.locator(`a[href="${href}"]`).filter({ has: page.getByText(/ • #/) })).toHaveCount(0);
  });

  test('renders mocked printings with set, number, price and excludes the current card', async ({ page }) => {
    await mockOtherPrintings(page, [
      { id: CARD_ID, name: 'Lightning Bolt', setName: 'Limited Edition Alpha', setCode: 'LEA', collectorNumber: '161' },
      {
        id: '990001',
        name: 'Lightning Bolt',
        setName: 'E2E Mock Set',
        setCode: 'LEB',
        collectorNumber: '42',
        prices: { normal: { market: 3.5, low: 1, average: 2, high: 9 }, foil: null },
      },
      {
        id: '990002',
        name: "Bolt's Mock Echo",
        setName: 'E2E Foil Set',
        setCode: '2ED',
        collectorNumber: '7a',
        prices: { normal: null, foil: { market: 12.25, low: null, average: null, high: null } },
      },
    ]);

    await page.goto(CARD_URL);

    await expect(page.getByText('Other Printings (2)')).toBeVisible({ timeout: 15000 });
    await expect(printingLinks(page)).toHaveCount(2);
    await expect(page.locator(`a[href="${CARD_URL}"]`).filter({ has: page.getByText(/ • #/) })).toHaveCount(0);

    const mockPrinting = page.locator('a[href="/browse/cards/lightning-bolt/990001"]');
    await expect(mockPrinting).toContainText('E2E Mock Set • #42');
    await expect(mockPrinting).toContainText('$3.50');

    // Printing links use generateCardSlug, so the apostrophe is dropped, not turned into a hyphen.
    const foilOnly = page.locator('a[href="/browse/cards/bolts-mock-echo/990002"]');
    await expect(foilOnly).toContainText('E2E Foil Set • #7a');
    await expect(foilOnly).toContainText('$12.25 foil');

    // Two pages are not needed for two printings.
    await expect(page.getByText('1-2', { exact: true })).toHaveCount(0);
  });

  test('shows an empty state when the card has no other printings', async ({ page }) => {
    await mockOtherPrintings(page, [
      { id: CARD_ID, name: 'Lightning Bolt', setName: 'Limited Edition Alpha', setCode: 'LEA', collectorNumber: '161' },
    ]);
    await page.goto(CARD_URL);

    await expect(page.getByText('Other Printings (0)')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('No other printings found')).toBeVisible();
    await expect(printingLinks(page)).toHaveCount(0);
  });

  test('an unknown card id shows "Card not found"', async ({ page }) => {
    await page.goto('/browse/cards/not-a-card/999999999');

    await expect(page.getByTestId('breadcrumbs')).toContainText('Card not found', { timeout: 15000 });
    await expect(otherPrintingsHeading(page)).toHaveCount(0);
    await expect(page.getByTestId('card-image')).toHaveCount(0);
  });
});
