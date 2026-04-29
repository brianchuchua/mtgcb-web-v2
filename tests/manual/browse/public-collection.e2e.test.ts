import { expect, test } from '@playwright/test';
import path from 'path';

// User story: a visitor (not logged in) views another user's public collection.
// This exercises the same useCollectionBrowseController path as the auth'd flow,
// but without auth — the controller should still render summary stats and
// browse content cleanly.

const SHOTS_DIR = path.join(process.cwd(), 'test-results', 'manual-screenshots');
const shot = (name: string) => path.join(SHOTS_DIR, `${name}.png`);

const PUBLIC_USER_ID = 1337; // Manath — test user; their collection is public in the local DB.

test.describe('Public collection viewing (unauthenticated)', () => {
  test('public collection landing renders without auth', async ({ page }) => {
    const reactErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && /Rendered (more|fewer) hooks|Rules of Hooks|hook order/.test(msg.text())) {
        reactErrors.push(msg.text());
      }
    });

    await page.goto(`/collections/${PUBLIC_USER_ID}`);
    await page.waitForLoadState('networkidle');

    await page.screenshot({ path: shot('public-collection-landing'), fullPage: false });
    console.log(JSON.stringify({ url: page.url(), label: 'public-collection-landing' }));
    expect(reactErrors).toEqual([]);
  });

  test('public collection cards view renders', async ({ page }) => {
    await page.goto(`/collections/${PUBLIC_USER_ID}?contentType=cards`);
    await page.waitForLoadState('networkidle');

    await page.screenshot({ path: shot('public-collection-cards'), fullPage: false });
    console.log(JSON.stringify({ url: page.url(), label: 'public-collection-cards' }));
  });
});
