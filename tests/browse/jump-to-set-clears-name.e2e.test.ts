import { type Page, expect, test } from '@playwright/test';
import { authenticateAsLocalTestUser, getLocalTestJwt } from '../utils/auth';

// Jump to Set should start the set page clean, like its changelog entry (1.2.1) says.
// The bug only showed on production builds: dev runs mount effects twice, which hid it.
// Read-only: nothing is saved.
const SET_NAME = 'The Hobbit';

const searchThenJump = async (page: Page) => {
  await page.goto('/browse?contentType=cards&name=Shivan%20Dragon');
  await expect(page.getByLabel('Card Name').first()).toHaveValue('Shivan Dragon', { timeout: 15000 });

  await page.getByLabel('jump to set').click();
  await page.getByPlaceholder('Type to search sets...').fill(SET_NAME);
  await page.getByRole('option', { name: new RegExp(`^${SET_NAME}`) }).first().click();
  await page.waitForURL(/the-hobbit/, { timeout: 15000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
};

test.describe('Jump to Set clears the card name', () => {
  test('logged out: the Browse set page has no name filter', async ({ page }) => {
    await searchThenJump(page);

    expect(new URL(page.url()).searchParams.has('name')).toBe(false);
    await expect(page.getByLabel('Card Name').first()).toHaveValue('');
  });

  test('logged in: the collection set page has no name filter', async ({ page, context }) => {
    test.skip(!getLocalTestJwt(), 'E2E_TEST_JWT_1337 not set');
    await authenticateAsLocalTestUser(context);

    await searchThenJump(page);

    expect(new URL(page.url()).pathname).toMatch(/^\/collections\/1337\/the-hobbit/);
    expect(new URL(page.url()).searchParams.has('name')).toBe(false);
    await expect(page.getByLabel('Card Name').first()).toHaveValue('');
  });

  test('Quick Search still carries its name', async ({ page }) => {
    await page.goto('/browse?contentType=cards&artist=Rebecca%20Guay');
    await page.getByLabel('quick search').click();
    await page.getByPlaceholder('Search by card name...').fill('Lightning Bolt');
    await page.keyboard.press('Enter');
    await page.waitForURL(/name=Lightning/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    await expect(page.getByLabel('Card Name').first()).toHaveValue('Lightning Bolt');
    await expect(page.getByLabel('Artist').first()).toHaveValue('');
  });
});
