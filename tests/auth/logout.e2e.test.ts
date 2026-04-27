import { expect, test } from '@playwright/test';
import { authenticateAsLocalTestUser, getLocalTestJwt } from '../utils/auth';

const API_BASE = 'http://local.mtgcb.com:5000';

test.describe('Logout', () => {
  test.beforeEach(async ({ context, page }) => {
    test.skip(!getLocalTestJwt(), 'Set E2E_TEST_JWT_1337 to run (see tests/utils/auth.ts)');
    await authenticateAsLocalTestUser(context);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('logs out via the account menu, calls API, and redirects home', async ({ page }) => {
    let logoutCalled = false;
    await page.route(`${API_BASE}/auth/logout`, async (route) => {
      logoutCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: null }),
      });
    });

    // After logout, /auth/me must return 401 so the auth state flips to
    // unauthenticated. Without this mock the JWT cookie is still attached and
    // the user appears logged in to the rehydrated /me query.
    await page.route(`${API_BASE}/auth/me`, async (route) => {
      if (logoutCalled) {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, error: { message: 'Unauthorized' } }),
        });
      } else {
        await route.continue();
      }
    });

    await page.getByRole('button', { name: 'account menu' }).click();
    await page.getByRole('menuitem', { name: 'Log out' }).click();

    // After logout: API was hit, page redirected to '/', and the account menu
    // now shows logged-out entries.
    await page.waitForURL('/', { timeout: 10000 });
    expect(logoutCalled).toBe(true);

    await page.getByRole('button', { name: 'account menu' }).click();
    await expect(page.getByRole('menuitem', { name: 'Log in' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Sign up' })).toBeVisible();
  });
});
