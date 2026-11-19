import { Page, test } from '@playwright/test';
import path from 'path';
import { authenticateAsLocalTestUser, getLocalTestJwt } from '../../utils/auth';

// Review screenshots for the label (Tag) and message box (Notice) restyle, on the real pages.
// Nothing is asserted: a person or an agent looks at the output.
// The error-state shots fake a failed API call, so they do not depend on the dev database.
// Everything else shows whatever the local test user has, so counts and names will differ by machine.
const SHOTS_DIR = path.join(process.cwd(), 'test-results', 'manual-screenshots', 'labels-notices');
const shot = (name: string) => path.join(SHOTS_DIR, `${name}.jpg`);

test.use({ viewport: { width: 1440, height: 900 } });

const API = 'http://local.mtgcb.com:5000';

const settle = async (page: Page) => {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(600);
};

const capture = async (page: Page, name: string, consoleErrors: string[]) => {
  await page.screenshot({ path: shot(name), type: 'jpeg', quality: 85 });
  console.log(JSON.stringify({ label: 'labels-notices', name, url: page.url(), consoleErrors }));
};

const watchConsole = (page: Page) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (/hook|hydrat|Warning:|kebab-case/i.test(text)) errors.push(text.slice(0, 200));
  });
  return errors;
};

const centre = async (page: Page, text: string) => {
  await page.getByText(text, { exact: false }).first().scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, 200));
  await page.waitForTimeout(300);
};

const failApi = async (page: Page, pattern: RegExp) => {
  await page.route(
    (url) => url.href.startsWith(API) && pattern.test(url.pathname),
    (route) => route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ success: false }) }),
  );
};

test.describe('Review shots: public pages', () => {
  const pages: [string, string][] = [
    ['01-changelog', '/changelog'],
    ['02-news', '/news'],
    ['03-roadmap', '/roadmap'],
    ['04-card-details', '/browse/cards/lightning-bolt/147'],
    ['05-goals-logged-out', '/goals'],
    ['06-locations-logged-out', '/locations'],
  ];
  for (const [name, url] of pages) {
    test(name, async ({ page }) => {
      const errors = watchConsole(page);
      await page.goto(url);
      await settle(page);
      await capture(page, name, errors);
    });
  }
});

test.describe('Review shots: logged in', () => {
  test.beforeEach(async ({ context }) => {
    test.skip(!getLocalTestJwt(), 'E2E_TEST_JWT_1337 not set');
    await authenticateAsLocalTestUser(context);
  });

  const simple: [string, string][] = [
    ['10-import', '/import'],
    ['13-export', '/export'],
    ['14-history', '/history'],
    ['15-goals', '/goals'],
    ['16-create-location', '/locations/create'],
    ['17-reset-collection', '/reset-collection'],
    ['19-update-cards', '/collections/1337/migrate'],
    ['20-collection-card', '/collections/1337/cards/lightning-bolt/147'],
  ];
  for (const [name, url] of simple) {
    test(name, async ({ page }) => {
      const errors = watchConsole(page);
      await page.goto(url);
      await settle(page);
      await capture(page, name, errors);
    });
  }

  test('07-account-privacy', async ({ page }) => {
    const errors = watchConsole(page);
    await page.goto('/account');
    await settle(page);
    await page.evaluate(() => {
      const heading = Array.from(document.querySelectorAll('h6')).find((el) => el.textContent?.includes('Privacy & Sharing'));
      heading?.scrollIntoView({ block: 'start' });
      window.scrollBy(0, -80);
    });
    await page.waitForTimeout(400);
    await capture(page, '07-account-privacy', errors);
  });

  test('08-account-patreon', async ({ page }) => {
    const errors = watchConsole(page);
    await page.goto('/account');
    await settle(page);
    await page.getByRole('heading', { name: 'Patreon' }).scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await capture(page, '08-account-patreon', errors);
  });

  test('09-account-delete', async ({ page }) => {
    const errors = watchConsole(page);
    await page.goto('/account');
    await settle(page);
    await page.evaluate(() => {
      const heading = Array.from(document.querySelectorAll('h6')).find((el) => el.textContent?.includes('Danger Zone'));
      const toggle = (heading?.closest('[role=button]') ?? heading?.closest('button') ?? heading?.parentElement) as HTMLElement | null;
      toggle?.click();
    });
    await page.waitForTimeout(800);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(400);
    await capture(page, '09-account-delete', errors);
  });

  test('11-import-custom-csv', async ({ page }) => {
    const errors = watchConsole(page);
    await page.goto('/import');
    await settle(page);
    await page.locator('input[type=radio][value="custom"]').check();
    await centre(page, 'Select a CSV file first');
    await capture(page, '11-import-custom-csv', errors);
  });

  test('12-import-unsupported', async ({ page }) => {
    const errors = watchConsole(page);
    await page.goto('/import');
    await settle(page);
    await page.locator('label', { hasText: 'Unsupported' }).first().locator('input[type=radio]').check();
    await centre(page, 'This format is not currently supported.');
    await capture(page, '12-import-unsupported', errors);
  });

  test('18-reset-collection-dialog', async ({ page }) => {
    const errors = watchConsole(page);
    await page.goto('/reset-collection');
    await settle(page);
    await page.getByRole('button', { name: /Reset My Collection/i }).click();
    await page.waitForTimeout(500);
    await capture(page, '18-reset-collection-dialog', errors);
  });

  const failures: [string, string, RegExp][] = [
    ['21-error-goals', '/goals', /^\/goals/],
    ['22-error-locations', '/locations', /^\/locations/],
    ['23-error-history', '/history', /history/],
    ['24-error-import-formats', '/import', /import/],
    ['25-error-export-formats', '/export', /export/],
  ];
  for (const [name, url, pattern] of failures) {
    test(name, async ({ page }) => {
      const errors = watchConsole(page);
      await failApi(page, pattern);
      await page.goto(url);
      await settle(page);
      await page.waitForTimeout(1500);
      await capture(page, name, errors);
    });
  }
});
