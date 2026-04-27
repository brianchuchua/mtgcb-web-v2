import { expect, test } from '@playwright/test';

test.describe('Browse — view mode and pagination', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/browse');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="set-item"]');
  });

  test('toggles between Grid and Table view modes', async ({ page }) => {
    const paginationTop = page.getByTestId('pagination-top');
    const gridBtn = paginationTop.getByTestId('view-mode-toggle-grid');
    const tableBtn = paginationTop.getByTestId('view-mode-toggle-table');

    await expect(gridBtn).toBeVisible();
    await expect(tableBtn).toBeVisible();
    await expect(page.getByTestId('sets-grid')).toBeVisible();

    await tableBtn.click();
    // After switching, the grid disappears and a table renders.
    await expect(page.getByTestId('sets-grid')).toHaveCount(0);

    await gridBtn.click();
    await expect(page.getByTestId('sets-grid')).toBeVisible();
  });

  test('Last button jumps to the final page; First returns to page 1', async ({ page }) => {
    const paginationTop = page.getByTestId('pagination-top');

    await expect(paginationTop.getByTestId('pagination-first')).toBeDisabled();
    await expect(paginationTop.getByTestId('pagination-prev')).toBeDisabled();

    const firstPageNames = await page.getByTestId('set-name').allTextContents();

    await paginationTop.getByTestId('pagination-last').click();

    await page.waitForFunction(
      (firstName) => {
        const current = document.querySelector('[data-testid="set-name"]')?.textContent;
        return current && current !== firstName;
      },
      firstPageNames[0],
      { timeout: 10000 },
    );

    // On the last page, Next/Last become disabled.
    await expect(paginationTop.getByTestId('pagination-last')).toBeDisabled();
    await expect(paginationTop.getByTestId('pagination-next')).toBeDisabled();

    await paginationTop.getByTestId('pagination-first').click();

    await page.waitForFunction(
      (firstName) => {
        const current = document.querySelector('[data-testid="set-name"]')?.textContent;
        return current === firstName;
      },
      firstPageNames[0],
      { timeout: 10000 },
    );

    await expect(paginationTop.getByTestId('pagination-first')).toBeDisabled();
    await expect(paginationTop.getByTestId('pagination-prev')).toBeDisabled();
  });

  test('changing page size updates the displayed item range', async ({ page }) => {
    const paginationTop = page.getByTestId('pagination-top');
    const initialPageInfo = await paginationTop.getByTestId('page-info').textContent();
    expect(initialPageInfo).toMatch(/1-\d+ of \d+/);

    // Open the page size dropdown and pick a different value.
    const select = paginationTop.getByRole('combobox', { name: /Sets/i });
    await select.click();

    // Pick a smaller page size to make the change observable.
    const options = page.getByRole('option');
    const optionCount = await options.count();
    expect(optionCount).toBeGreaterThan(1);

    // Pick the first option that's smaller than the current page size, falling
    // back to whatever option isn't currently selected.
    const desired = await options.first().textContent();
    await options.first().click();

    await page.waitForFunction(
      (initial) => {
        const current = document.querySelector('[data-testid="page-info"]')?.textContent;
        return current && current !== initial;
      },
      initialPageInfo,
      { timeout: 10000 },
    );

    const updatedPageInfo = await paginationTop.getByTestId('page-info').textContent();
    expect(updatedPageInfo).not.toBe(initialPageInfo);
    if (desired) {
      // The new range should reference the chosen page size.
      expect(updatedPageInfo).toContain(`1-${desired.trim()}`);
    }
  });
});

test.describe('Browse — content type toggle (sets/cards)', () => {
  test('navigates from sets browse to cards browse via URL param', async ({ page }) => {
    await page.goto('/browse');
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('sets-grid')).toBeVisible();

    await page.goto('/browse?contentType=cards');
    await page.waitForLoadState('networkidle');

    // Cards view does not render the sets-grid; verify it disappears.
    await expect(page.getByTestId('sets-grid')).toHaveCount(0);

    // Pagination still renders.
    await expect(page.getByTestId('pagination-top')).toBeVisible();
  });
});
