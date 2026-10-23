import { Page, expect, test } from '@playwright/test';
import { collectPageErrors } from './consoleErrors';

interface StaticPageCase {
  path: string;
  assertMainContent: (page: Page) => Promise<void>;
}

const expectH1 = (name: string | RegExp) => async (page: Page) => {
  await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();
};

const STATIC_PAGES: StaticPageCase[] = [
  { path: '/', assertMainContent: expectH1('MTG Collection Builder') },
  { path: '/changelog', assertMainContent: expectH1('Changelog') },
  { path: '/faq', assertMainContent: expectH1('Frequently Asked Questions') },
  { path: '/contact', assertMainContent: expectH1('Contact') },
  { path: '/news', assertMainContent: expectH1('News') },
  { path: '/roadmap', assertMainContent: expectH1('Roadmap') },
  { path: '/terms-and-privacy', assertMainContent: expectH1('Terms and Privacy') },
  { path: '/patrons', assertMainContent: expectH1('Support MTG CB') },
  { path: '/binder-templates', assertMainContent: expectH1('Binder Templates') },
  { path: '/draft-cubes', assertMainContent: expectH1('Draft Cubes') },
  { path: '/draft-helper', assertMainContent: expectH1('17Lands Visual Comparison Tool') },
  {
    // The desktop game has no heading; the start button only enables once the set list loads.
    path: '/iconic-impact',
    assertMainContent: async (page) => {
      await expect(page.getByRole('button', { name: 'Start Game' })).toBeEnabled({ timeout: 15000 });
      await expect(page.getByText(/Iconic Impact is a fan-made educational game/)).toBeVisible();
    },
  },
  {
    // Browse has no h1; breadcrumbs plus a rendered set grid is its "main heading".
    path: '/browse',
    assertMainContent: async (page) => {
      await expect(page.getByTestId('breadcrumbs')).toContainText('Browse');
      await expect(page.getByTestId('set-item').first()).toBeVisible({ timeout: 15000 });
    },
  },
];

test.describe('Public pages smoke test (logged out)', () => {
  for (const { path, assertMainContent } of STATIC_PAGES) {
    test(`${path} returns 200, renders its main content and logs no errors`, async ({ page }) => {
      const errors = collectPageErrors(page);

      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await page.waitForLoadState('networkidle');

      await assertMainContent(page);
      expect(errors).toEqual([]);
    });
  }

  test('an unknown URL renders the 404 page', async ({ page }) => {
    const errors = collectPageErrors(page, { allowStatus404: true });

    const response = await page.goto('/this-route-does-not-exist-e2e');
    expect(response?.status()).toBe(404);

    await expect(page.getByRole('heading', { level: 1, name: '404' })).toBeVisible();
    await expect(page.getByText('This page could not be found.')).toBeVisible();
    expect(errors).toEqual([]);
  });
});
