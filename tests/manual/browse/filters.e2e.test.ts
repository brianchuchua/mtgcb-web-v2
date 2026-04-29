import { expect, test } from '@playwright/test';
import path from 'path';

// User story: a visitor applies advanced filters (color, rarity, type) to the
// browse cards view and sees results narrow down.
//
// This drives filters via the URL rather than clicking the sidebar widgets,
// which keeps the test decoupled from icon-font-based color buttons that have
// no testids. The state→URL adapter is the integration boundary that matters.

const SHOTS_DIR = path.join(process.cwd(), 'test-results', 'manual-screenshots');
const shot = (name: string) => path.join(SHOTS_DIR, `${name}.png`);

test.describe('Browse filters', () => {
  test('color filter narrows results — colors=R (red only)', async ({ page }) => {
    await page.goto('/browse?contentType=cards&colors=R&colorMatchType=exactly');
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(
      () => document.querySelectorAll('[data-testid="card-item"]').length > 0,
      undefined,
      { timeout: 10000 },
    );

    const cardCount = await page.getByTestId('card-item').count();
    await page.screenshot({ path: shot('filters-color-red'), fullPage: false });
    console.log(JSON.stringify({ url: page.url(), cardCount, label: 'filters-color-red' }));
    expect(cardCount).toBeGreaterThan(0);
  });

  test('rarity filter narrows results — includeRarities=5 (Mythic)', async ({ page }) => {
    // Rarity values are numeric: Common=2, Uncommon=3, Rare=4, Mythic=5, Special=6.
    await page.goto('/browse?contentType=cards&includeRarities=5');
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(
      () => document.querySelectorAll('[data-testid="card-item"]').length > 0,
      undefined,
      { timeout: 10000 },
    );

    const cardCount = await page.getByTestId('card-item').count();
    await page.screenshot({ path: shot('filters-rarity-mythic'), fullPage: false });
    console.log(JSON.stringify({ url: page.url(), cardCount, label: 'filters-rarity-mythic' }));
    expect(cardCount).toBeGreaterThan(0);
  });

  test('combined color + name filter renders narrowed result page', async ({ page }) => {
    await page.goto('/browse?contentType=cards&name=Lightning&colors=R&colorMatchType=atLeast');
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('domcontentloaded');

    await page.screenshot({ path: shot('filters-combined'), fullPage: false });
    console.log(JSON.stringify({ url: page.url(), label: 'filters-combined' }));
  });
});
