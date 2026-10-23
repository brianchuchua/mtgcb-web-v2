import { Locator, Page, expect, test } from '@playwright/test';

const SET_DETAIL_URL = /\/browse\/sets\/[a-z0-9-]+$/;

const clickAndWaitForUrl = async (page: Page, target: Locator, url: RegExp) => {
  await expect(async () => {
    await target.click();
    await page.waitForURL(url, { timeout: 5000 });
  }).toPass({ timeout: 30000 });
};

test.describe('Browse sets: where clicks go (logged out)', () => {
  test.describe('grid view', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/browse?contentType=sets');
      await expect(page.getByTestId('set-item').first()).toBeVisible({ timeout: 15000 });
    });

    test('set name opens /browse/sets/<slug>', async ({ page }) => {
      const firstItem = page.getByTestId('set-item').first();
      const nameLink = firstItem.locator('a', { has: page.getByTestId('set-name') });
      const href = await nameLink.getAttribute('href');
      expect(href).toMatch(SET_DETAIL_URL);

      await clickAndWaitForUrl(page, nameLink, new RegExp(`${href}$`));
    });

    test('"View set" button opens the same set page as the name', async ({ page }) => {
      const firstItem = page.getByTestId('set-item').first();
      const nameHref = await firstItem.locator('a', { has: page.getByTestId('set-name') }).getAttribute('href');
      const viewSet = firstItem.getByRole('link', { name: 'View set' });
      await expect(viewSet).toHaveAttribute('href', nameHref!);

      await clickAndWaitForUrl(page, viewSet, new RegExp(`${nameHref}$`));
    });
  });

  test.describe('table view', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/browse?contentType=sets');
      await expect(page.getByTestId('set-item').first()).toBeVisible({ timeout: 15000 });
      await page.getByTestId('pagination-top').getByTestId('view-mode-toggle-table').click();
      await expect(page.locator('main table tbody tr').first()).toBeVisible({ timeout: 15000 });
    });

    test('set name cell links to /browse/sets/<slug> (and any other link in the row agrees)', async ({ page }) => {
      const firstRow = page.locator('main table tbody tr').first();
      const nameLink = firstRow.locator('th a');
      await expect(nameLink).toBeVisible();
      const href = await nameLink.getAttribute('href');
      expect(href).toMatch(SET_DETAIL_URL);

      const allHrefs = await firstRow
        .locator('a[href^="/browse/"]')
        .evaluateAll((anchors) => anchors.map((a) => a.getAttribute('href')));
      expect(new Set(allHrefs)).toEqual(new Set([href]));

      await clickAndWaitForUrl(page, nameLink, new RegExp(`${href}$`));
    });

    test('clicking a non-link cell in a row does not navigate', async ({ page }) => {
      // Pins current behaviour: useSetData.handleSetClick (push to /browse?includeSets=<id>) is passed
      // down as onSetClick but the set table renderer never attaches it to the row.
      const firstRow = page.locator('main table tbody tr').first();
      const plainCell = firstRow.locator('td').filter({ hasNot: page.locator('a') }).first();
      await expect(plainCell).toBeVisible();

      const urlBefore = page.url();
      await plainCell.click();
      await expect(page.locator('main table tbody tr').first()).toBeVisible();
      await page.waitForLoadState('networkidle');
      expect(page.url()).toBe(urlBefore);
      expect(page.url()).not.toContain('includeSets=');
    });
  });
});
