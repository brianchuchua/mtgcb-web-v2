import { expect, test } from '@playwright/test';
import {
  LOCAL_TEST_USERNAME,
  LOCAL_TEST_USER_ID,
  authenticateAsLocalTestUser,
  getLocalTestJwt,
} from '../utils/auth';

// The CTAs use router.push from onClick (no hrefs), so the destination can only be
// checked by clicking. Retry the click in case it lands before hydration.
const clickUntilUrl = async (
  page: import('@playwright/test').Page,
  target: import('@playwright/test').Locator,
  url: RegExp,
) => {
  await expect(async () => {
    await target.click();
    await page.waitForURL(url, { timeout: 5000 });
  }).toPass({ timeout: 30000 });
};

test.describe('Home page (logged out)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('shows the marketing hero, not the dashboard', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: 'MTG Collection Builder' })).toBeVisible();
    await expect(page.getByText('Track and Complete Your Magic Collection')).toBeVisible();
    await expect(page.getByText(/^Welcome( back)?, /)).toHaveCount(0);
    await expect(page.getByText('Quick Actions')).toHaveCount(0);
  });

  test('"Create Free Account" goes to /signup', async ({ page }) => {
    await clickUntilUrl(page, page.getByRole('button', { name: 'Create Free Account' }).first(), /\/signup$/);
  });

  test('"Sign In" goes to /login', async ({ page }) => {
    await clickUntilUrl(page, page.getByRole('button', { name: 'Sign In', exact: true }), /\/login$/);
  });

  test('"See Sample Collection" opens the demo collection in sets view', async ({ page }) => {
    await clickUntilUrl(
      page,
      page.getByRole('button', { name: 'See Sample Collection' }),
      new RegExp(`/collections/${LOCAL_TEST_USER_ID}\\?`),
    );
    const url = new URL(page.url());
    expect(url.searchParams.get('contentType')).toBe('sets');
    expect(url.searchParams.get('includeCompletionStatus')).toBe('complete|partial');
  });
});

test.describe('Home page (logged in)', () => {
  test.beforeEach(async ({ context, page }) => {
    test.skip(!getLocalTestJwt(), 'E2E_TEST_JWT_1337 not set');
    await authenticateAsLocalTestUser(context);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Quick Actions')).toBeVisible({ timeout: 20000 });
  });

  test('greets the user by name and hides the marketing hero', async ({ page }) => {
    await expect(page.getByText(new RegExp(`^Welcome back, ${LOCAL_TEST_USERNAME}!$`)).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Free Account' })).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 1, name: 'MTG Collection Builder' })).toHaveCount(0);
  });

  const ACTION_CARDS = [
    { title: 'View My Collection', url: new RegExp(`/collections/${LOCAL_TEST_USER_ID}$`) },
    { title: 'Add or Remove Cards', url: /\/collections\/edit-cards$/ },
    { title: 'Browse Magic Cards', url: /\/browse$/ },
  ];

  for (const { title, url } of ACTION_CARDS) {
    test(`"${title}" action card navigates to ${url.source}`, async ({ page }) => {
      const card = page.locator('main').getByRole('heading', { name: title, exact: true });
      await clickUntilUrl(page, card, url);
    });
  }
});
