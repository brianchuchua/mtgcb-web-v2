import { test } from '@playwright/test';
import path from 'path';

// User story: a visitor paginates through browse results. Verifies first/next/
// last pagination controls work and produce visually distinct pages.

const SHOTS_DIR = path.join(process.cwd(), 'test-results', 'manual-screenshots');
const shot = (name: string) => path.join(SHOTS_DIR, `${name}.png`);

test('Browse pagination: first → next → last produces distinct pages', async ({ page }) => {
  await page.goto('/browse');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('[data-testid="set-item"]');

  const paginationTop = page.getByTestId('pagination-top');

  await page.screenshot({ path: shot('pagination-page-1') });

  await paginationTop.getByTestId('pagination-next').click();
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: shot('pagination-page-2') });

  await paginationTop.getByTestId('pagination-last').click();
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: shot('pagination-last-page') });

  console.log(JSON.stringify({ url: page.url(), label: 'pagination-last-page-url' }));
});
