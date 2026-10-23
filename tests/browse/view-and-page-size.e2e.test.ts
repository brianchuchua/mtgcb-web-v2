import { Page, Request, expect, test } from '@playwright/test';

const CARDS_SEARCH_URL = 'http://local.mtgcb.com:5000/cards/search';
const SETS_SEARCH_URL = 'http://local.mtgcb.com:5000/sets/search';

const waitForSearch = (page: Page, url: string, matches: (body: Record<string, unknown>) => boolean) =>
  page
    .waitForRequest(
      (request: Request) => {
        if (request.url() !== url || request.method() !== 'POST') return false;
        try {
          return matches(request.postDataJSON());
        } catch {
          return false;
        }
      },
      { timeout: 15000 },
    )
    .then((request) => request.postDataJSON());

const paginationTop = (page: Page) => page.getByTestId('pagination-top');
const resultsTable = (page: Page) => page.locator('main table').first();

test.describe('Browse view mode persistence', () => {
  test('cards: switching to table survives a reload; switching back to grid does too', async ({ page }) => {
    await page.goto('/browse?contentType=cards');
    await expect(page.getByTestId('cards-grid')).toBeVisible({ timeout: 15000 });

    await paginationTop(page).getByTestId('view-mode-toggle-table').click();
    await expect(page.getByTestId('cards-grid')).toHaveCount(0);
    await expect(resultsTable(page)).toBeVisible();

    await page.reload();
    await expect(resultsTable(page)).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('cards-grid')).toHaveCount(0);
    await expect(paginationTop(page).getByTestId('view-mode-toggle-table')).toHaveClass(/MuiButton-contained/);

    await paginationTop(page).getByTestId('view-mode-toggle-grid').click();
    await expect(page.getByTestId('cards-grid')).toBeVisible();
    await page.reload();
    await expect(page.getByTestId('cards-grid')).toBeVisible({ timeout: 15000 });
  });

  test('cards and sets remember their view modes independently', async ({ page }) => {
    await page.goto('/browse?contentType=cards');
    await expect(page.getByTestId('cards-grid')).toBeVisible({ timeout: 15000 });
    await paginationTop(page).getByTestId('view-mode-toggle-table').click();
    await expect(resultsTable(page)).toBeVisible();

    await page.goto('/browse?contentType=sets');
    await expect(page.getByTestId('sets-grid')).toBeVisible({ timeout: 15000 });

    await page.goto('/browse?contentType=cards');
    await expect(resultsTable(page)).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('cards-grid')).toHaveCount(0);
  });
});

test.describe('Browse page size', () => {
  test('changing page size jumps back to page 1 and is sent as the new limit', async ({ page }) => {
    await page.goto('/browse?contentType=cards');
    await expect(page.getByTestId('card-item').first()).toBeVisible({ timeout: 15000 });
    await expect(paginationTop(page).getByTestId('page-info')).toContainText(/Showing 1-20 of /);

    // Page 2 is usually prefetched, so there may be no new request to wait on here.
    await paginationTop(page).getByTestId('pagination-next').click();
    await expect(paginationTop(page).getByTestId('page-info')).toContainText(/Showing 21-40 of /);

    const resized = waitForSearch(page, CARDS_SEARCH_URL, (b) => b.limit === 50);
    await paginationTop(page).getByRole('combobox', { name: 'Cards' }).click();
    await page.getByRole('option', { name: '50', exact: true }).click();
    expect(await resized).toMatchObject({ limit: 50, offset: 0 });

    await expect(paginationTop(page).getByTestId('page-info')).toContainText(/Showing 1-50 of /);
    await expect(paginationTop(page).getByTestId('pagination-prev')).toBeDisabled();
  });

  test('the chosen card page size persists across reloads but is not put in the URL', async ({ page }) => {
    await page.goto('/browse?contentType=cards');
    await expect(page.getByTestId('card-item').first()).toBeVisible({ timeout: 15000 });

    await paginationTop(page).getByRole('combobox', { name: 'Cards' }).click();
    await page.getByRole('option', { name: '36', exact: true }).click();
    await expect(paginationTop(page).getByTestId('page-info')).toContainText(/Showing 1-36 of /);
    expect(page.url()).not.toContain('PageSize');

    // Match the page-1 request; the page-2 prefetch (offset 36) can arrive first.
    const afterReload = waitForSearch(page, CARDS_SEARCH_URL, (b) => b.limit !== undefined && b.offset === 0);
    await page.reload();
    expect(await afterReload).toMatchObject({ limit: 36, offset: 0 });
    await expect(paginationTop(page).getByRole('combobox', { name: 'Cards' })).toHaveText('36');
  });

  test('cards and sets page sizes are stored separately', async ({ page }) => {
    await page.goto('/browse?contentType=cards');
    await expect(page.getByTestId('card-item').first()).toBeVisible({ timeout: 15000 });
    await paginationTop(page).getByRole('combobox', { name: 'Cards' }).click();
    await page.getByRole('option', { name: '50', exact: true }).click();
    await expect(paginationTop(page).getByTestId('page-info')).toContainText(/Showing 1-50 of /);

    const setsRequest = waitForSearch(page, SETS_SEARCH_URL, (b) => b.limit !== undefined && !b.slug);
    await page.goto('/browse?contentType=sets');
    expect(await setsRequest).toMatchObject({ limit: 20 });
    await expect(paginationTop(page).getByTestId('page-info')).toContainText(/Showing 1-20 of /);
  });
});
