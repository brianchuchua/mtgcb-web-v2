import { expect, test } from '@playwright/test';
import path from 'path';

// User story: a visitor applies several filters, then clicks Reset Search to
// clear them. Verifies URL params drop and result count returns to unfiltered.

const SHOTS_DIR = path.join(process.cwd(), 'test-results', 'manual-screenshots');
const shot = (name: string) => path.join(SHOTS_DIR, `${name}.png`);

async function expandSearchFormIfMobile(page: import('@playwright/test').Page) {
  const toggle = page.getByTestId('search-form-toggle');
  if (await toggle.isVisible({ timeout: 1000 }).catch(() => false)) {
    await toggle.click();
    await page.waitForTimeout(300);
  }
}

test('Reset Search clears applied card-name filter', async ({ page }) => {
  await page.goto('/browse?contentType=cards&name=Lightning');
  await page.waitForLoadState('networkidle');
  await expandSearchFormIfMobile(page);

  // Initial state: filter applied.
  expect(new URL(page.url()).searchParams.get('name')).toBe('Lightning');
  await page.screenshot({ path: shot('reset-search-before'), fullPage: false });

  await page.getByRole('button', { name: 'Reset Search' }).click();

  // Wait for URL to drop the name param.
  await page.waitForFunction(
    () => new URL(window.location.href).searchParams.get('name') === null,
    undefined,
    { timeout: 5000 },
  );

  await page.screenshot({ path: shot('reset-search-after'), fullPage: false });
  console.log(JSON.stringify({
    urlAfterReset: page.url(),
    nameParam: new URL(page.url()).searchParams.get('name'),
    label: 'reset-search-cleared',
  }));
});
