import { expect, test } from '@playwright/test';
import path from 'path';

// User story: a visitor browses the card catalog and toggles between grid and
// table views. Verifies VirtualizedRowGallery (grid) + VirtualizedTable (table)
// render content without console errors.

const SHOTS_DIR = path.join(process.cwd(), 'test-results', 'manual-screenshots');
const shot = (name: string) => path.join(SHOTS_DIR, `${name}.png`);

test.describe('Browse cards — grid and table views', () => {
  test('grid view: cards render and screenshot', async ({ page }) => {
    const reactErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && /Rendered (more|fewer) hooks|Rules of Hooks|hook order/.test(msg.text())) {
        reactErrors.push(msg.text());
      }
    });

    await page.goto('/browse?contentType=cards');
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('cards-grid')).toBeVisible();
    await page.waitForFunction(
      () => document.querySelectorAll('[data-testid="card-item"]').length > 0,
      undefined,
      { timeout: 10000 },
    );

    await page.screenshot({ path: shot('browse-cards-grid'), fullPage: false });
    expect(reactErrors).toEqual([]);
  });

  test('table view: switches to table and table populates rows', async ({ page }) => {
    await page.goto('/browse?contentType=cards');
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('cards-grid')).toBeVisible();

    await page.getByTestId('view-mode-toggle-table').first().click();

    // Wait for TableVirtuoso to populate — it's lazy.
    await page.waitForFunction(
      () => document.querySelectorAll('table tbody tr').length >= 5,
      undefined,
      { timeout: 15000 },
    );

    const rowCount = await page.evaluate(() => document.querySelectorAll('table tbody tr').length);
    console.log(JSON.stringify({ rowCount, label: 'table-rows-rendered' }));

    await page.screenshot({ path: shot('browse-cards-table'), fullPage: false });
  });
});
