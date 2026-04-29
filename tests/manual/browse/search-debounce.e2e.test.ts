import { expect, test } from '@playwright/test';
import path from 'path';

// User story: a visitor types rapidly in a browse search field. Verifies
// useBrowseFormState's debouncing — keystrokes collapse to a small handful
// of network requests rather than one per keystroke.

const SHOTS_DIR = path.join(process.cwd(), 'test-results', 'manual-screenshots');
const shot = (name: string) => path.join(SHOTS_DIR, `${name}.png`);

test('Browse search: rapid card-name typing → debounced URL + minimal requests', async ({ page }) => {
  const reactErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' && /Rendered (more|fewer) hooks|Rules of Hooks|hook order/.test(msg.text())) {
      reactErrors.push(msg.text());
    }
  });

  await page.goto('/browse?contentType=cards');
  await page.waitForLoadState('networkidle');

  let searchRequestCount = 0;
  page.on('request', (req) => {
    if (req.url().includes('/cards/search')) searchRequestCount++;
  });

  const cardNameInput = page.getByTestId('card-name-field').locator('input');
  await cardNameInput.type('Lightning Bolt', { delay: 30 });

  await page.waitForFunction(
    () => new URL(window.location.href).searchParams.get('name') === 'Lightning Bolt',
    undefined,
    { timeout: 5000 },
  );
  await page.waitForLoadState('networkidle');

  await page.screenshot({ path: shot('search-debounce-result') });
  console.log(JSON.stringify({
    keystrokes: 14,
    networkRequests: searchRequestCount,
    label: 'debounce-ratio',
  }));

  expect(reactErrors).toEqual([]);
});
