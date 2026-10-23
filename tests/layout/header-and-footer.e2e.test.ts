import { expect, test } from '@playwright/test';
import { authenticateAsLocalTestUser, getLocalTestJwt } from '../utils/auth';
import { clickAndWaitForUrl, pathUrl } from './navHelpers';

test.describe('Footer links', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/faq');
    await page.waitForLoadState('networkidle');
  });

  const FOOTER_LINKS = [
    { name: 'Terms and Privacy', path: '/terms-and-privacy' },
    { name: 'Contact', path: '/contact' },
    { name: 'Support MTG CB and help keep it ad-free', path: '/patrons' },
  ];

  for (const { name, path } of FOOTER_LINKS) {
    test(`"${name}" routes to ${path}`, async ({ page }) => {
      const link = page.locator('footer').getByRole('link', { name, exact: true });
      await expect(link).toBeVisible();
      await clickAndWaitForUrl(page, link, pathUrl(path));
    });
  }

  test('shows the copyright line with the current year', async ({ page }) => {
    const year = new Date().getFullYear();
    await expect(page.locator('footer')).toContainText(`© 2013-${year} MTG Collection Builder`);
  });
});

test.describe('Header', () => {
  test('site title links home and the version badge links to the changelog', async ({ page }) => {
    await page.goto('/faq');
    await page.waitForLoadState('networkidle');

    const header = page.locator('header');
    await expect(header.locator('a[href="/changelog"]')).toHaveText(/^v\d+\.\d+\.\d+$/);
    await clickAndWaitForUrl(page, header.getByRole('link', { name: 'MTG Collection Builder' }), pathUrl('/'));
  });
});

test.describe('Account menu', () => {
  test('logged out: offers Log in and Sign up', async ({ page }) => {
    await page.goto('/faq');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'account menu' }).click();
    const menu = page.getByRole('menu');
    await expect(menu.getByRole('menuitem', { name: 'Log in' })).toBeVisible();
    await expect(menu.getByRole('menuitem', { name: 'Sign up' })).toBeVisible();
    await expect(menu.getByRole('menuitem', { name: 'Account' })).toHaveCount(0);
    await expect(menu.getByRole('menuitem', { name: 'Log out' })).toHaveCount(0);

    await menu.getByRole('menuitem', { name: 'Sign up' }).click();
    await page.waitForURL(pathUrl('/signup'));
  });

  test('logged out: Log in goes to /login', async ({ page }) => {
    await page.goto('/faq');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'account menu' }).click();
    await page.getByRole('menuitem', { name: 'Log in' }).click();
    await page.waitForURL(pathUrl('/login'));
  });

  test('logged in: offers Account and Log out', async ({ context, page }) => {
    test.skip(!getLocalTestJwt(), 'E2E_TEST_JWT_1337 not set');
    await authenticateAsLocalTestUser(context);
    await page.goto('/faq');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'account menu' }).click();
    const menu = page.getByRole('menu');
    await expect(menu.getByRole('menuitem', { name: 'Account' })).toBeVisible();
    await expect(menu.getByRole('menuitem', { name: 'Log out' })).toBeVisible();
    await expect(menu.getByRole('menuitem', { name: 'Log in' })).toHaveCount(0);
    await expect(menu.getByRole('menuitem', { name: 'Sign up' })).toHaveCount(0);

    // Log out is not clicked: other agents share this user's session.
    await menu.getByRole('menuitem', { name: 'Account' }).click();
    await page.waitForURL(pathUrl('/account'));
  });
});
