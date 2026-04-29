import { expect, test } from '@playwright/test';

// Regression coverage for the rules-of-hooks fixes in:
//   src/components/common/VirtualizedRowGallery.tsx (used by CardGrid)
//   src/components/pagination/Pagination.tsx (useCardSettingGroups was conditional)
//
// Both bugs would manifest as "Rendered more/fewer hooks than during the previous render"
// when the component re-renders across a path that previously skipped a hook call.
test.describe('Browse cards — grid view re-render does not break hook order', () => {
  test('renders cards in grid, survives view toggles and pagination without React errors', async ({ page }) => {
    const reactErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() !== 'error') return;
      const text = msg.text();
      if (
        text.includes('Rendered more hooks') ||
        text.includes('Rendered fewer hooks') ||
        text.includes('Rules of Hooks') ||
        text.includes('hook order')
      ) {
        reactErrors.push(text);
      }
    });

    await page.goto('/browse?contentType=cards');
    await page.waitForLoadState('networkidle');

    // VirtualizedRowGallery wrapper renders with this testid in CardGrid.
    await expect(page.getByTestId('cards-grid')).toBeVisible();

    // Cards actually appear (proves the useCallback that was post-early-return executes).
    await page.waitForFunction(
      () => document.querySelectorAll('[data-testid="card-item"]').length > 0,
      undefined,
      { timeout: 10000 },
    );
    expect(await page.getByTestId('card-item').count()).toBeGreaterThan(0);

    const paginationTop = page.getByTestId('pagination-top');

    // Re-render path 1: switch to table view, then back to grid.
    // Each toggle triggers a fresh mount of CardGrid -> VirtualizedRowGallery.
    await paginationTop.getByTestId('view-mode-toggle-table').click();
    await expect(page.getByTestId('cards-grid')).toHaveCount(0);
    await paginationTop.getByTestId('view-mode-toggle-grid').click();
    await expect(page.getByTestId('cards-grid')).toBeVisible();
    await page.waitForFunction(
      () => document.querySelectorAll('[data-testid="card-item"]').length > 0,
      undefined,
      { timeout: 10000 },
    );

    // Re-render path 2: paginate. Pagination component re-renders with new items
    // (and useCardSettingGroups is now called unconditionally on every render).
    const initialPageInfo = await paginationTop.getByTestId('page-info').textContent();
    await paginationTop.getByTestId('pagination-next').click();
    await page.waitForFunction(
      (initial) => {
        const current = document.querySelector('[data-testid="page-info"]')?.textContent;
        return current && current !== initial;
      },
      initialPageInfo,
      { timeout: 10000 },
    );
    expect(await page.getByTestId('card-item').count()).toBeGreaterThan(0);

    expect(reactErrors).toEqual([]);
  });
});
