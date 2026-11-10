import { expect, Page, test } from '@playwright/test';
import { LOCAL_TEST_USER_ID, authenticateAsLocalTestUser, getLocalTestJwt } from '../utils/auth';

// Collection version of tests/browse/back-keeps-page.e2e.test.ts (Notion 295e7f6b51f2807a).
// Collection Sets page 2 -> open a set -> the set page doesn't pick up the page number -> one
// Back lands on page 2 again.
test.describe('Collection: Back from a set returns to the same page', () => {
  test.beforeEach(async ({ context }) => {
    test.skip(!getLocalTestJwt(), 'Set E2E_TEST_JWT_1337 to run (see tests/utils/auth.ts)');
    await authenticateAsLocalTestUser(context);
  });

  const setLinks = (page: Page) => page.locator(
    `a[href^="/collections/${LOCAL_TEST_USER_ID}/"]:not([href*="/migrate"]):not([href^="/collections/${LOCAL_TEST_USER_ID}/cards"])`,
  );
  const pageInfo = (page: Page) => page.getByTestId('page-info').first();

  const openSetThenBack = async (page: Page, start: string) => {
    await page.goto(start);
    await setLinks(page).first().waitFor({ timeout: 20000 });
    await page.waitForLoadState('networkidle');
    const startUrl = new URL(page.url());
    const startInfo = (await pageInfo(page).textContent())?.trim();
    const href = await setLinks(page).first().getAttribute('href');

    await setLinks(page).first().click();
    await page.waitForURL((u) => u.pathname === new URL(href || '', 'http://x').pathname, { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    // The set page must not pick up the collection's page number
    expect(new URL(page.url()).searchParams.get('page')).toBeNull();

    await page.goBack();
    await page.waitForURL((u) => u.pathname === startUrl.pathname, { timeout: 15000 });
    await setLinks(page).first().waitFor({ timeout: 20000 });
    await page.waitForTimeout(1500);

    const backUrl = new URL(page.url());
    expect(backUrl.searchParams.get('page')).toBe(startUrl.searchParams.get('page'));
    expect(backUrl.searchParams.get('goalId')).toBe(startUrl.searchParams.get('goalId'));
    await expect(pageInfo(page)).toHaveText(startInfo || '');
  };

  test('Sets page 2 -> open a set -> Back lands on page 2', async ({ page }) => {
    await openSetThenBack(page, `/collections/${LOCAL_TEST_USER_ID}?contentType=sets&page=2`);
  });

  test('goal Sets page 2 -> open a set -> Back lands on page 2 with the goal', async ({ page }) => {
    await openSetThenBack(page, `/collections/${LOCAL_TEST_USER_ID}?contentType=sets&goalId=7&page=2`);
  });

  test('Sets page 1 -> open a set -> Back lands on page 1', async ({ page }) => {
    await openSetThenBack(page, `/collections/${LOCAL_TEST_USER_ID}?contentType=sets`);
  });
});
