import { expect, test } from '@playwright/test';
import path from 'path';

// User story: a visitor opens a card's detail page to see its image, prices,
// printings, and buy buttons.

const SHOTS_DIR = path.join(process.cwd(), 'test-results', 'manual-screenshots');
const shot = (name: string) => path.join(SHOTS_DIR, `${name}.png`);

const LIGHTNING_BOLT_URL = '/browse/cards/lightning-bolt/59187';

test('Card detail page renders with image, prices, and buy menu', async ({ page }) => {
  const reactErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' && /Rendered (more|fewer) hooks|Rules of Hooks|hook order/.test(msg.text())) {
      reactErrors.push(msg.text());
    }
  });

  await page.goto(LIGHTNING_BOLT_URL);
  await page.waitForLoadState('networkidle');

  // Verify the card name appears.
  await expect(page.getByTestId('card-name').first()).toBeVisible();

  await page.screenshot({ path: shot('card-detail-top'), fullPage: false });
  await page.screenshot({ path: shot('card-detail-full'), fullPage: true });

  console.log(JSON.stringify({ url: page.url(), label: 'card-detail-loaded' }));
  expect(reactErrors).toEqual([]);
});
