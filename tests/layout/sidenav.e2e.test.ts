import { expect, test } from '@playwright/test';
import { LOCAL_TEST_USER_ID, authenticateAsLocalTestUser, getLocalTestJwt } from '../utils/auth';
import { clickAndWaitForUrl, pathUrl, sidenav } from './navHelpers';

const RESOURCE_LINKS = [
  { name: 'News', path: '/news' },
  { name: 'Roadmap', path: '/roadmap' },
  { name: 'Changelog', path: '/changelog' },
  { name: 'FAQ', path: '/faq' },
  { name: 'Contact', path: '/contact' },
  { name: 'Binder Templates', path: '/binder-templates' },
  { name: 'Draft Helper', path: '/draft-helper' },
  { name: 'Draft Cubes', path: '/draft-cubes' },
  { name: 'Iconic Impact', path: '/iconic-impact' },
];

const LOGGED_IN_ONLY_LINKS = ['Collection', 'Add or Remove Cards'];

test.describe('Sidenav (desktop, logged out)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/faq');
    await page.waitForLoadState('networkidle');
  });

  test('Resources section is collapsed on the home page and expands on click', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const nav = sidenav(page);

    await expect(nav.getByRole('link', { name: 'News', exact: true })).toBeHidden();
    await nav.getByRole('button', { name: 'Resources' }).click();
    await expect(nav.getByRole('link', { name: 'News', exact: true })).toBeVisible();
  });

  test('Resources section auto-expands on a resources page and every link has the right href', async ({ page }) => {
    const nav = sidenav(page);
    for (const { name, path } of RESOURCE_LINKS) {
      const link = nav.getByRole('link', { name, exact: true });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute('href', path);
    }
    await expect(nav.getByRole('link', { name: 'FAQ', exact: true })).toHaveClass(/Mui-selected/);
  });

  for (const { name, path } of RESOURCE_LINKS.filter((link) => link.path !== '/faq')) {
    test(`clicking "${name}" routes to ${path}`, async ({ page }) => {
      await clickAndWaitForUrl(page, sidenav(page).getByRole('link', { name, exact: true }), pathUrl(path));
      await expect(sidenav(page).getByRole('link', { name, exact: true })).toHaveClass(/Mui-selected/);
    });
  }

  test('top-level links route to Home, Browse and Support Us', async ({ page }) => {
    const nav = sidenav(page);
    await clickAndWaitForUrl(page, nav.getByRole('link', { name: 'Browse', exact: true }), pathUrl('/browse'));
    await clickAndWaitForUrl(page, nav.getByRole('link', { name: 'Support Us', exact: true }), pathUrl('/patrons'));
    await clickAndWaitForUrl(page, nav.getByRole('link', { name: 'Home', exact: true }), pathUrl('/'));
  });

  test('logged-out users do not see collection links', async ({ page }) => {
    const nav = sidenav(page);
    await expect(nav.getByRole('link', { name: 'Home', exact: true })).toBeVisible();
    for (const name of LOGGED_IN_ONLY_LINKS) {
      await expect(nav.getByRole('link', { name, exact: true })).toHaveCount(0);
    }
    await expect(nav.getByRole('button', { name: 'Manage Collection' })).toHaveCount(0);
  });

  test('collapse toggle hides and restores the main menu', async ({ page }) => {
    const nav = sidenav(page);
    const homeLink = nav.getByRole('link', { name: 'Home', exact: true });

    await nav.getByRole('button', { name: 'Collapse navigation' }).click();
    await expect(homeLink).toBeHidden();
    await expect(nav.getByRole('button', { name: 'Expand navigation' })).toBeVisible();

    await nav.getByRole('button', { name: 'Expand navigation' }).click();
    await expect(homeLink).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Collapse navigation' })).toBeVisible();
  });

  test('clicking the "Main Menu" header row also toggles the menu', async ({ page }) => {
    const nav = sidenav(page);
    await nav.getByText('Main Menu').click();
    await expect(nav.getByRole('link', { name: 'Home', exact: true })).toBeHidden();
    await nav.getByText('Main Menu').click();
    await expect(nav.getByRole('link', { name: 'Home', exact: true })).toBeVisible();
  });

  test('header "menu" button closes and reopens the desktop sidenav', async ({ page }) => {
    const nav = sidenav(page);
    await expect(nav.getByText('Main Menu')).toBeVisible();

    await page.getByRole('button', { name: 'menu', exact: true }).click();
    await expect(nav.getByText('Main Menu')).toBeHidden();

    await page.getByRole('button', { name: 'menu', exact: true }).click();
    await expect(nav.getByText('Main Menu')).toBeVisible();
  });
});

test.describe('Sidenav (desktop, logged in)', () => {
  test.beforeEach(async ({ context, page }) => {
    test.skip(!getLocalTestJwt(), 'E2E_TEST_JWT_1337 not set');
    await authenticateAsLocalTestUser(context);
    await page.goto('/faq');
    await page.waitForLoadState('networkidle');
  });

  test('shows collection links pointing at the signed-in user', async ({ page }) => {
    const nav = sidenav(page);
    await expect(nav.getByRole('link', { name: 'Collection', exact: true })).toHaveAttribute(
      'href',
      `/collections/${LOCAL_TEST_USER_ID}`,
    );
    await expect(nav.getByRole('link', { name: 'Add or Remove Cards', exact: true })).toHaveAttribute(
      'href',
      '/collections/edit-cards',
    );
  });

  test('Manage Collection expands to the collection tools, with Reset under Danger Zone', async ({ page }) => {
    const nav = sidenav(page);
    await expect(nav.getByRole('link', { name: 'Goals', exact: true })).toBeHidden();

    await nav.getByRole('button', { name: 'Manage Collection' }).click();

    const expected = [
      { name: 'Goals', href: '/goals' },
      { name: 'Locations', href: '/locations' },
      { name: 'Import', href: '/import' },
      { name: 'Export', href: '/export' },
      { name: 'History', href: '/history' },
      { name: 'Update Cards', href: `/collections/${LOCAL_TEST_USER_ID}/migrate` },
    ];
    for (const { name, href } of expected) {
      await expect(nav.getByRole('link', { name, exact: true })).toHaveAttribute('href', href);
    }

    const resetLink = nav.getByRole('link', { name: 'Reset Collection', exact: true });
    await expect(resetLink).toBeHidden();
    await nav.getByRole('button', { name: 'Danger Zone' }).click();
    await expect(resetLink).toBeVisible();
    await expect(resetLink).toHaveAttribute('href', '/reset-collection');
  });

  test('Manage Collection auto-expands on a collection tool page', async ({ page }) => {
    await page.goto('/goals');
    await page.waitForLoadState('networkidle');
    const goalsLink = sidenav(page).getByRole('link', { name: 'Goals', exact: true });
    await expect(goalsLink).toBeVisible();
    await expect(goalsLink).toHaveClass(/Mui-selected/);
  });
});
