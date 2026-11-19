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
    expect(body).not.toHaveProperty('color_identities_array');
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

  test('color identity with "at most" match type', async ({ page }) => {
    const body = await browseCards(
      page,
      '&colorIdentity=W,U&colorIdentityMatchType=atMost',
      (b) => 'color_identities_array' in b,
    );
    expect(body.color_identities_array).toEqual({ atMost: ['W', 'U'] });
    expect(body).not.toHaveProperty('colors_array');
  });

  test('color identity with no match type defaults to "exactly"', async ({ page }) => {
    const body = await browseCards(page, '&colorIdentity=B,G', (b) => 'color_identities_array' in b);
    expect(body.color_identities_array).toEqual({ exactly: ['B', 'G'] });
  });

  test('colorless identity becomes exactly []', async ({ page }) => {
    const body = await browseCards(page, '&colorlessIdentity=true', (b) => 'color_identities_array' in b);
    expect(body.color_identities_array).toEqual({ exactly: [] });
  });

  test('color and color identity travel as separate criteria', async ({ page }) => {
    const body = await browseCards(
      page,
      '&colorless=true&colorIdentity=G&colorIdentityMatchType=atLeast',
      (b) => 'colors_array' in b && 'color_identities_array' in b,
    );
    expect(body.colors_array).toEqual({ exactly: [] });
    expect(body.color_identities_array).toEqual({ atLeast: ['G'] });
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
    const colorButton = (symbol: string) =>
      sidenav(page).getByTestId('color-filter').locator(`button:has(i.ms-${symbol})`);

    let body = waitForCardSearch(page, (b) => JSON.stringify(b.colors_array) === JSON.stringify({ exactly: ['W'] }));
    await colorButton('w').click();
    await body;

    body = waitForCardSearch(page, (b) => JSON.stringify(b.colors_array) === JSON.stringify({ exactly: ['W', 'U'] }));
    await colorButton('u').click();
    await body;
    await expect(page).toHaveURL(/colors=W%2CU|colors=W,U/);

    body = waitForCardSearch(page, (b) => JSON.stringify(b.colors_array) === JSON.stringify({ atMost: ['W', 'U'] }));
    await sidenav(page).getByTestId('color-filter-match-type').getByRole('combobox').click();
    await page.getByRole('option', { name: 'At Most These Colors' }).click();
    expect(await body).not.toHaveProperty('color_identities_array');
    await expect(page).toHaveURL(/colorMatchType=atMost/);

    body = waitForCardSearch(page, (b) => JSON.stringify(b.colors_array) === JSON.stringify({ exactly: [] }));
    await colorButton('c').click();
    await body;
    await expect(page).toHaveURL(/colorless=true/);
  });

  test('clicking color identity symbols and changing match type updates body and URL', async ({ page }) => {
    const identity = (b: Body) => JSON.stringify(b.color_identities_array);
    const identityButton = (symbol: string) => sidenav(page).getByTestId(`color-identity-filter-${symbol}`);

    let body = waitForCardSearch(page, (b) => identity(b) === JSON.stringify({ exactly: ['G'] }));
    await identityButton('G').click();
    expect(await body).not.toHaveProperty('colors_array');

    body = waitForCardSearch(page, (b) => identity(b) === JSON.stringify({ exactly: ['G', 'U'] }));
    await identityButton('U').click();
    await body;
    await expect(page).toHaveURL(/colorIdentity=G%2CU|colorIdentity=G,U/);

    body = waitForCardSearch(page, (b) => identity(b) === JSON.stringify({ atMost: ['G', 'U'] }));
    await sidenav(page).getByTestId('color-identity-filter-match-type').getByRole('combobox').click();
    await page.getByRole('option', { name: 'At Most These Colors' }).click();
    await body;
    await expect(page).toHaveURL(/colorIdentityMatchType=atMost/);
    await expect(page.getByText(/at most Green\/Blue color identity/).first()).toBeVisible();

    body = waitForCardSearch(page, (b) => identity(b) === JSON.stringify({ exactly: [] }));
    await identityButton('C').click();
    await body;
    await expect(page).toHaveURL(/colorlessIdentity=true/);
    await expect(page).not.toHaveURL(/colorIdentity=/);

    // Turning colorless back off leaves nothing selected, so the criterion is gone. The
    // unfiltered search is already cached from page load, so there is no request to wait for.
    await identityButton('C').click();
    await expect(page).not.toHaveURL(/colorlessIdentity/);
    await expect(identityButton('C')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByText(/color identity\)/)).toHaveCount(0);
  });

  test('the color and color identity pickers do not disturb each other', async ({ page }) => {
    const both = waitForCardSearch(
      page,
      (b) =>
        JSON.stringify(b.colors_array) === JSON.stringify({ exactly: ['R'] }) &&
        JSON.stringify(b.color_identities_array) === JSON.stringify({ exactly: ['R', 'W'] }),
    );
    await sidenav(page).getByTestId('color-filter-R').click();
    await sidenav(page).getByTestId('color-identity-filter-R').click();
    await sidenav(page).getByTestId('color-identity-filter-W').click();
    await both;

    await expect(sidenav(page).getByTestId('color-filter-R')).toHaveAttribute('aria-pressed', 'true');
    await expect(sidenav(page).getByTestId('color-filter-W')).toHaveAttribute('aria-pressed', 'false');
    await expect(sidenav(page).getByTestId('color-identity-filter-W')).toHaveAttribute('aria-pressed', 'true');
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
