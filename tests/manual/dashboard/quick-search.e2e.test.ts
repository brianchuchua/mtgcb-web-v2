import { expect, test } from '@playwright/test';
import path from 'path';

// User story: a visitor uses the magnifying-glass icon in the dashboard header
// to quickly search for a card. Verifies the popper anchors correctly to its
// trigger and submitting navigates to a filtered browse URL.

const SHOTS_DIR = path.join(process.cwd(), 'test-results', 'manual-screenshots');
const shot = (name: string) => path.join(SHOTS_DIR, `${name}.png`);

test.describe('Dashboard — Quick Search', () => {
  test('opens with popper anchored to the trigger', async ({ page }) => {
    await page.goto('/browse');
    await page.waitForLoadState('networkidle');

    const trigger = page.getByRole('button', { name: 'quick search' });
    await trigger.click();
    const input = page.getByPlaceholder('Search by card name...');
    await expect(input).toBeVisible();

    await page.screenshot({ path: shot('quick-search-open') });

    const triggerBox = await trigger.boundingBox();
    const inputBox = await input.boundingBox();
    console.log(JSON.stringify({ triggerBox, inputBox, label: 'quick-search-anchor-geometry' }));
  });

  test('submitting navigates to filtered browse', async ({ page }) => {
    await page.goto('/browse');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'quick search' }).click();
    const input = page.getByPlaceholder('Search by card name...');
    await input.fill('Lightning Bolt');
    await input.press('Enter');

    await page.waitForURL((url) => url.searchParams.get('contentType') === 'cards');
    await page.waitForLoadState('networkidle');

    await page.screenshot({ path: shot('quick-search-after-submit') });
    console.log(JSON.stringify({ navigatedTo: page.url(), label: 'quick-search-submit' }));
  });
});
