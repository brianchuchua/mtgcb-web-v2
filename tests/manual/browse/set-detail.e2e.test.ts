import { expect, test } from '@playwright/test';
import path from 'path';

// User story: a visitor opens a set's detail page to see the cards in that set.

const SHOTS_DIR = path.join(process.cwd(), 'test-results', 'manual-screenshots');
const shot = (name: string) => path.join(SHOTS_DIR, `${name}.png`);

test('Set detail page renders cards belonging to the set', async ({ page }) => {
  const reactErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' && /Rendered (more|fewer) hooks|Rules of Hooks|hook order/.test(msg.text())) {
      reactErrors.push(msg.text());
    }
  });

  // Use Foundations Art Series since JumpToSetsMenu test confirmed its slug exists.
  await page.goto('/browse/sets/foundations-art-series');
  await page.waitForLoadState('networkidle');

  // Wait for cards to populate.
  await page.waitForFunction(
    () => document.querySelectorAll('[data-testid="card-item"]').length > 0,
    undefined,
    { timeout: 10000 },
  );

  await page.screenshot({ path: shot('set-detail-top'), fullPage: false });

  const cardCount = await page.getByTestId('card-item').count();
  console.log(JSON.stringify({ url: page.url(), cardCount, label: 'set-detail-loaded' }));

  expect(cardCount).toBeGreaterThan(0);
  expect(reactErrors).toEqual([]);
});
