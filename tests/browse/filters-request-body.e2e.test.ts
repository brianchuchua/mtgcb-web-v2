import { Page, Request, expect, test } from '@playwright/test';

const CARDS_SEARCH_URL = 'http://local.mtgcb.com:5000/cards/search';

type Body = Record<string, unknown>;

const bodyOf = (request: Request): Body | null => {
  try {
    return request.postDataJSON();
  } catch {
    return null;
  }
};

const waitForCardSearch = (page: Page, matches: (body: Body) => boolean) =>
  page
    .waitForRequest(
      (request) => {
        if (request.url() !== CARDS_SEARCH_URL || request.method() !== 'POST') return false;
        const body = bodyOf(request);
        return !!body && matches(body);
      },
      { timeout: 15000 },
    )
    .then((request) => bodyOf(request) as Body);

const browseCards = async (page: Page, query: string, matches: (body: Body) => boolean) => {
  const body = waitForCardSearch(page, matches);
  await page.goto(`/browse?contentType=cards${query}`);
  return body;
};

const sidenav = (page: Page) => page.locator('.MuiDrawer-paper');

test.describe('Browse filters → POST /cards/search body (from URL)', () => {
  test('no filters: body has paging but no color, type or rarity criteria', async ({ page }) => {
    const body = await browseCards(page, '', (b) => b.limit !== undefined);

    expect(body).toMatchObject({ limit: 20, offset: 0 });
    expect(body).not.toHaveProperty('colors_array');
    expect(body).not.toHaveProperty('type');
    expect(body).not.toHaveProperty('rarityNumeric');
  });

  test('colors with "at least" match type', async ({ page }) => {
    const body = await browseCards(page, '&colors=W,U&colorMatchType=atLeast', (b) => 'colors_array' in b);
    expect(body.colors_array).toEqual({ atLeast: ['W', 'U'] });
  });

  test('colors with no match type default to "exactly"', async ({ page }) => {
    const body = await browseCards(page, '&colors=B,R,G', (b) => 'colors_array' in b);
    expect(body.colors_array).toEqual({ exactly: ['B', 'R', 'G'] });
  });

  test('"at most" match type', async ({ page }) => {
    const body = await browseCards(page, '&colors=G&colorMatchType=atMost', (b) => 'colors_array' in b);
    expect(body.colors_array).toEqual({ atMost: ['G'] });
  });

  test('colorless wins over listed colors and becomes exactly []', async ({ page }) => {
    const body = await browseCards(page, '&colors=W&colorless=true', (b) => 'colors_array' in b);
    expect(body.colors_array).toEqual({ exactly: [] });
  });

  test('included types are ANDed and excluded types go under NOT', async ({ page }) => {
    const body = await browseCards(page, '&includeTypes=Creature|Elf&excludeTypes=Legendary', (b) => 'type' in b);
    expect(body.type).toEqual({ AND: ['Creature', 'Elf'], NOT: ['Legendary'] });
  });

  test('included rarities are ORed as "=n" and excluded ones ANDed as "!=n"', async ({ page }) => {
    const body = await browseCards(page, '&includeRarities=4|5&excludeRarities=2', (b) => 'rarityNumeric' in b);
    expect(body.rarityNumeric).toEqual({ OR: ['=4', '=5'], AND: ['!=2'] });
  });

  test('combined color, type and rarity filters all reach the same request', async ({ page }) => {
    const body = await browseCards(
      page,
      '&colors=R&includeTypes=Instant&includeRarities=2',
      (b) => 'colors_array' in b && 'type' in b && 'rarityNumeric' in b,
    );
    expect(body).toMatchObject({
      colors_array: { exactly: ['R'] },
      type: { AND: ['Instant'] },
      rarityNumeric: { OR: ['=2'] },
      offset: 0,
    });
  });
});

test.describe('Browse filters → POST /cards/search body (from the sidenav form)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/browse?contentType=cards');
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('card-item').first()).toBeVisible({ timeout: 15000 });
  });

  test('clicking color symbols and changing match type updates body and URL', async ({ page }) => {
    const colorButton = (symbol: string) => sidenav(page).locator(`button:has(i.ms-${symbol})`);

    let body = waitForCardSearch(page, (b) => JSON.stringify(b.colors_array) === JSON.stringify({ exactly: ['W'] }));
    await colorButton('w').click();
    await body;

    body = waitForCardSearch(page, (b) => JSON.stringify(b.colors_array) === JSON.stringify({ exactly: ['W', 'U'] }));
    await colorButton('u').click();
    await body;
    await expect(page).toHaveURL(/colors=W%2CU|colors=W,U/);

    body = waitForCardSearch(page, (b) => JSON.stringify(b.colors_array) === JSON.stringify({ atMost: ['W', 'U'] }));
    await sidenav(page).getByRole('combobox').filter({ hasText: 'Only These Colors' }).click();
    await page.getByRole('option', { name: 'At Most These Colors' }).click();
    await body;
    await expect(page).toHaveURL(/colorMatchType=atMost/);

    body = waitForCardSearch(page, (b) => JSON.stringify(b.colors_array) === JSON.stringify({ exactly: [] }));
    await colorButton('c').click();
    await body;
    await expect(page).toHaveURL(/colorless=true/);
  });

  test('picking a rarity includes it; clicking its chip flips it to an exclusion', async ({ page }) => {
    const rarities = sidenav(page).getByRole('combobox', { name: 'Rarities' });

    let body = waitForCardSearch(page, (b) => JSON.stringify(b.rarityNumeric) === JSON.stringify({ OR: ['=4'] }));
    await rarities.click();
    await page.getByRole('option', { name: 'Rare', exact: true }).click();
    await body;
    await expect(page).toHaveURL(/includeRarities=4/);

    await page.keyboard.press('Escape');
    body = waitForCardSearch(page, (b) => JSON.stringify(b.rarityNumeric) === JSON.stringify({ AND: ['!=4'] }));
    await sidenav(page).getByText('✓ Rare', { exact: true }).click();
    await body;
    await expect(page).toHaveURL(/excludeRarities=4/);
    await expect(sidenav(page).getByText('NOT Rare', { exact: true })).toBeVisible();
  });
});
