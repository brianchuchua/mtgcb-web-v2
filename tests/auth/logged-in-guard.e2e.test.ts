import { expect, test } from '@playwright/test';
import { authenticateAsLocalTestUser, getLocalTestJwt } from '../utils/auth';

const LOGGED_OUT_ONLY_PAGES = ['/login', '/signup', '/forgot-password', '/forgot-username'];

test.describe('Logged-in user visiting logged-out-only pages', () => {
  test.beforeEach(async ({ context }) => {
    test.skip(!getLocalTestJwt(), 'Set E2E_TEST_JWT_1337 to run (see tests/utils/auth.ts)');
    await authenticateAsLocalTestUser(context);
  });

  for (const path of LOGGED_OUT_ONLY_PAGES) {
    test(`${path} redirects to the home page`, async ({ page }) => {
      await page.goto(path);
      await page.waitForURL((url) => url.pathname === '/', { timeout: 10000 });
      await expect(page.getByTestId('login-form')).toHaveCount(0);
      await expect(page.getByTestId('signup-form')).toHaveCount(0);
    });
  }

  test('/login with a redirectTo sends an already logged-in user to that path', async ({ page }) => {
    await page.goto(`/login?redirectTo=${encodeURIComponent('/browse?contentType=sets')}`);
    await page.waitForURL((url) => url.pathname === '/browse', { timeout: 10000 });
    expect(new URL(page.url()).searchParams.get('contentType')).toBe('sets');
  });
});
