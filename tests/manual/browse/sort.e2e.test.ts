import { expect, test } from '@playwright/test';
import path from 'path';

// User story: a visitor changes sort order on the browse page and sees results
// reorder. Drives sort via URL since the sort UI is a popover with timing.

const SHOTS_DIR = path.join(process.cwd(), 'test-results', 'manual-screenshots');
const shot = (name: string) => path.join(SHOTS_DIR, `${name}.png`);

test('Browse cards: changing sortBy via URL reorders the result list', async ({ page }) => {
  // Sort by release date (newest first) — chosen because it has many distinct
  // values, so the visible first card differs from the alphabetic default.
  // Note: localStorage user-preference can override URL sort on first load —
  // we clear localStorage explicitly to make this test deterministic.
  await page.context().clearCookies();
  await page.goto('about:blank');
  await page.evaluate(() => {
    try { localStorage.clear(); sessionStorage.clear(); } catch (e) { /* noop */ }
  });

  await page.goto('/browse?contentType=cards&sortBy=releasedAt&sortOrder=desc');
  await page.waitForLoadState('networkidle');
  await page.waitForFunction(
    () => document.querySelectorAll('[data-testid="card-name"]').length > 0,
    undefined,
    { timeout: 10000 },
  );
  const newestNames = (await page.getByTestId('card-name').allTextContents()).slice(0, 5);
  await page.screenshot({ path: shot('sort-released-desc'), fullPage: false });

  await page.goto('/browse?contentType=cards&sortBy=releasedAt&sortOrder=asc');
  await page.waitForLoadState('networkidle');
  await page.waitForFunction(
    () => document.querySelectorAll('[data-testid="card-name"]').length > 0,
    undefined,
    { timeout: 10000 },
  );
  const oldestNames = (await page.getByTestId('card-name').allTextContents()).slice(0, 5);
  await page.screenshot({ path: shot('sort-released-asc'), fullPage: false });

  console.log(JSON.stringify({ newestNames, oldestNames, label: 'sort-comparison' }));

  // The first 5 cards on each page should be different sets of cards.
  // (Soft assertion — exploratory test, exact ordering may vary by what's in DB.)
  const overlap = newestNames.filter((n) => oldestNames.includes(n)).length;
  expect(overlap).toBeLessThan(5);
});
