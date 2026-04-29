import { expect, test } from '@playwright/test';
import path from 'path';

// User story: a visitor lands on the home page (the first page they see when
// arriving at the site).

const SHOTS_DIR = path.join(process.cwd(), 'test-results', 'manual-screenshots');
const shot = (name: string) => path.join(SHOTS_DIR, `${name}.png`);

test('Home page renders without console errors', async ({ page }) => {
  const reactErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' && /Rendered (more|fewer) hooks|Rules of Hooks|hook order/.test(msg.text())) {
      reactErrors.push(msg.text());
    }
  });

  await page.goto('/');
  await page.waitForLoadState('networkidle');

  await page.screenshot({ path: shot('home-top'), fullPage: false });
  await page.screenshot({ path: shot('home-full'), fullPage: true });

  console.log(JSON.stringify({ url: page.url(), label: 'home-rendered' }));
  expect(reactErrors).toEqual([]);
});
