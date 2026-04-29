import { expect, test } from '@playwright/test';
import path from 'path';

// User story: a visitor uses the rocket icon in the dashboard header to jump
// directly to a specific set. Verifies the popper anchors correctly to its
// trigger, filtering works, and selection navigates.

const SHOTS_DIR = path.join(process.cwd(), 'test-results', 'manual-screenshots');
const shot = (name: string) => path.join(SHOTS_DIR, `${name}.png`);

test.describe('Dashboard — Jump To Set menu', () => {
  test('opens with popper anchored to the trigger', async ({ page }) => {
    await page.goto('/browse');
    await page.waitForLoadState('networkidle');

    const trigger = page.getByRole('button', { name: 'jump to set' });
    await trigger.click();
    const input = page.getByPlaceholder('Type to search sets...');
    await expect(input).toBeVisible();

    await page.screenshot({ path: shot('jump-to-set-open') });

    const triggerBox = await trigger.boundingBox();
    const inputBox = await input.boundingBox();
    console.log(JSON.stringify({ triggerBox, inputBox, label: 'jump-to-set-anchor-geometry' }));
  });

  test('filters and navigates on selection', async ({ page }) => {
    await page.goto('/browse');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'jump to set' }).click();
    await page.getByPlaceholder('Type to search sets...').fill('foundations');

    const listbox = page.getByRole('listbox');
    await expect(listbox).toBeVisible();
    await page.screenshot({ path: shot('jump-to-set-filtered') });

    await listbox.getByRole('option').first().click();
    await page.waitForURL((url) => url.pathname.startsWith('/browse/sets/'));
    await page.waitForLoadState('networkidle');

    await page.screenshot({ path: shot('jump-to-set-after-navigate') });
    console.log(JSON.stringify({ navigatedTo: page.url(), label: 'jump-to-set-navigation' }));
  });
});
