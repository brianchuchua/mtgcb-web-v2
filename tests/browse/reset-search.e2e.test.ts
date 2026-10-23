import { Page, expect, test } from '@playwright/test';

const CARDS_SEARCH_URL = 'http://local.mtgcb.com:5000/cards/search';
const FILTERED_QUERY = '&name=bolt&colors=R&colorMatchType=atLeast&includeTypes=Instant&includeRarities=2';

const sidenav = (page: Page) => page.locator('.MuiDrawer-paper');

const waitForUnfilteredCardSearch = (page: Page) =>
  page.waitForRequest(
    (request) => {
      if (request.url() !== CARDS_SEARCH_URL || request.method() !== 'POST') return false;
      const body = request.postDataJSON();
      return !('name' in body) && !('colors_array' in body) && !('type' in body) && !('rarityNumeric' in body);
    },
    { timeout: 15000 },
  );

test.describe('Browse Reset Search', () => {
  test('clears card filters from the form, the URL and the API request', async ({ page }) => {
    await page.goto(`/browse?contentType=cards${FILTERED_QUERY}`);
    await expect(page.getByTestId('card-item').first()).toBeVisible({ timeout: 15000 });

    const cardNameInput = page.getByTestId('card-name-field').locator('input');
    await expect(cardNameInput).toHaveValue('bolt');
    await expect(sidenav(page).getByText('✓ Common', { exact: true })).toBeVisible();

    const unfiltered = waitForUnfilteredCardSearch(page);
    await sidenav(page).getByRole('button', { name: 'Reset Search' }).click();
    await unfiltered;

    await expect(cardNameInput).toHaveValue('');
    await expect(sidenav(page).getByText('✓ Common', { exact: true })).toHaveCount(0);
    await expect(sidenav(page).getByText('✓ Instant', { exact: true })).toHaveCount(0);
    await expect(page).not.toHaveURL(/[?&](name|colors|colorMatchType|includeTypes|includeRarities)=/);
    // Reset keeps you on the cards view.
    await expect(page).toHaveURL(/contentType=cards/);
  });

  test('clearing survives a reload (filters are not restored from session state)', async ({ page }) => {
    await page.goto(`/browse?contentType=cards${FILTERED_QUERY}`);
    await expect(page.getByTestId('card-name-field').locator('input')).toHaveValue('bolt');

    await sidenav(page).getByRole('button', { name: 'Reset Search' }).click();
    await expect(page).not.toHaveURL(/[?&]name=/);

    const unfiltered = waitForUnfilteredCardSearch(page);
    await page.reload();
    await unfiltered;
    await expect(page.getByTestId('card-name-field').locator('input')).toHaveValue('');
  });

  test('on the sets view it clears the set name search', async ({ page }) => {
    await page.goto('/browse?contentType=sets&setName=dominaria');
    await expect(page.getByTestId('set-item').first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('set-name').first()).toContainText(/dominaria/i);

    const unfiltered = page.waitForRequest(
      (request) =>
        request.url() === 'http://local.mtgcb.com:5000/sets/search' &&
        request.method() === 'POST' &&
        !('name' in request.postDataJSON()),
      { timeout: 15000 },
    );
    await sidenav(page).getByRole('button', { name: 'Reset Search' }).click();
    await unfiltered;
    await expect(page).not.toHaveURL(/[?&]setName=/);
  });
});
