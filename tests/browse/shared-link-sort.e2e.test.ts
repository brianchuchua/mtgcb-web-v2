import { expect, test, type Page, type Request } from '@playwright/test';

// A sort in a link wins over the viewer's saved sort. A link without one uses the viewer's
// saved sort, so a fully default sort stays out of the URL and any other sort is written whole.
// Tidying the URL on load must not add a history entry, or Back lands on the same page.

const searchSort = (request: Request) => {
  const body = JSON.parse(request.postData() || '{}');
  return `${body.sortBy} ${body.sortDirection}`;
};

const waitForSearch = (page: Page, path: '/cards/search' | '/sets/search') =>
  page.waitForRequest((r) => r.method() === 'POST' && new URL(r.url()).pathname === path);

const saveSort = async (page: Page, view: 'cards' | 'sets', sortBy: string, sortOrder: string) => {
  await page.addInitScript(
    ({ view, sortBy, sortOrder }) => {
      localStorage.setItem(`mtgcb_preferred_sort_by_${view}`, JSON.stringify(sortBy));
      localStorage.setItem(`mtgcb_preferred_sort_order_${view}`, JSON.stringify(sortOrder));
    },
    { view, sortBy, sortOrder },
  );
};

const openAs = async (page: Page, url: string, path: '/cards/search' | '/sets/search') => {
  const search = waitForSearch(page, path);
  await page.goto(url);
  return searchSort(await search);
};

test.describe('Browse — sort in links', () => {
  test('a cards link with a sort wins over the viewer’s saved sort', async ({ page }) => {
    await saveSort(page, 'cards', 'releasedAt', 'asc');
    expect(await openAs(page, '/browse?contentType=cards&name=bolt&cardsSortBy=name&cardsSortOrder=desc', '/cards/search')).toBe(
      'name desc',
    );
  });

  test('a link sorted by Artist opens sorted by Artist', async ({ page }) => {
    await saveSort(page, 'cards', 'name', 'desc');
    expect(
      await openAs(page, '/browse?contentType=cards&name=bolt&cardsSortBy=artist&cardsSortOrder=asc', '/cards/search'),
    ).toBe('artist asc');
  });

  test('choosing Artist puts the whole sort in the URL, order included', async ({ page }) => {
    await page.goto('/browse?contentType=cards&name=bolt');
    await page.waitForLoadState('networkidle');
    await page.locator('[aria-labelledby~="sort-by-label"]').first().click();
    await page.locator('li[role="option"][data-value="artist"]').first().click();
    await page.waitForFunction(() => new URL(window.location.href).searchParams.get('cardsSortBy') === 'artist');
    expect(new URL(page.url()).searchParams.get('cardsSortOrder')).toBe('asc');
  });

  test('a link sorted by Category opens sorted by Category', async ({ page }) => {
    await saveSort(page, 'sets', 'name', 'asc');
    expect(await openAs(page, '/browse?contentType=sets&setsSortBy=category&setsSortOrder=asc', '/sets/search')).toBe(
      'category asc',
    );
  });

  test('a link without a sort uses the viewer’s saved sort', async ({ page }) => {
    await saveSort(page, 'cards', 'name', 'desc');
    expect(await openAs(page, '/browse?contentType=cards&name=bolt', '/cards/search')).toBe('name desc');
  });

  test('tidying the URL on load does not add a Back step', async ({ page }) => {
    // The app rewrites this as ?name=bolt&contentType=cards once it loads
    await page.goto('/browse?contentType=cards&name=bolt');
    await page.waitForFunction(() => window.location.search.endsWith('contentType=cards'));

    await page.goBack();
    await expect(page).toHaveURL('about:blank');
  });

  test('a sort change after load still adds a Back step', async ({ page }) => {
    await page.goto('/browse?contentType=cards&name=bolt');
    await page.waitForFunction(() => window.location.search.endsWith('contentType=cards'));
    await page.waitForLoadState('networkidle');

    await page.locator('[aria-labelledby~="sort-by-label"]').first().click();
    await page.locator('li[role="option"][data-value="name"]').first().click();
    await page.waitForFunction(() => new URL(window.location.href).searchParams.get('cardsSortBy') === 'name');

    await page.goBack();
    await page.waitForFunction(() => !new URL(window.location.href).searchParams.has('cardsSortBy'));
    expect(new URL(page.url()).searchParams.get('name')).toBe('bolt');
  });
});
