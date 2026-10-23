import { type Page, expect, test } from '@playwright/test';
import { authenticateAsLocalTestUser, getLocalTestJwt } from '../utils/auth';

const STORAGE_KEY = 'mtgcb-display-settings';

const gotoAccount = async (page: Page) => {
  await page.goto('/account');
  await expect(page.getByRole('heading', { name: 'Account Settings' })).toBeVisible();
};

const settingsCard = (page: Page, heading: string) =>
  page.locator('.MuiPaper-root').filter({ has: page.getByRole('heading', { name: heading, exact: true }) });

const readStoredSettings = (page: Page) =>
  page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) ?? '{}'), STORAGE_KEY);

// These settings live in this browser's localStorage only, so nothing here touches the API.
test.describe('Device-only account settings', () => {
  test.beforeEach(async ({ context, page }) => {
    test.skip(!getLocalTestJwt(), 'Set E2E_TEST_JWT_1337 to run (see tests/utils/auth.ts)');
    await authenticateAsLocalTestUser(context);
    await page.route('http://local.mtgcb.com:5000/user', (route) =>
      route.request().method() === 'GET' ? route.continue() : route.abort(),
    );
  });

  test('price type choice survives a reload', async ({ page }) => {
    await gotoAccount(page);
    const priceSelect = settingsCard(page, 'Price Settings').getByRole('combobox');
    await expect(priceSelect).toHaveText('Market');

    await priceSelect.click();
    await page.getByRole('option', { name: 'Low', exact: true }).click();
    await expect(priceSelect).toHaveText('Low');

    await page.reload();
    await expect(settingsCard(page, 'Price Settings').getByRole('combobox')).toHaveText('Low');
    expect(JSON.stringify(await readStoredSettings(page))).toContain('low');
  });

  test('progress bar style choice survives a reload', async ({ page }) => {
    await gotoAccount(page);
    const styleSelect = settingsCard(page, 'Progress Bar Style').getByRole('combobox');

    await styleSelect.click();
    await page.getByRole('option', { name: 'Boring Green' }).click();
    await expect(page.getByText("Progress bars use green always instead of the theme color and don't animate")).toBeVisible();

    await page.reload();
    await expect(settingsCard(page, 'Progress Bar Style').getByRole('combobox')).toHaveText('Boring Green');
  });

  test('classic Red/Green Table Rows toggle survives a reload', async ({ page }) => {
    await gotoAccount(page);
    const toggle = page.getByRole('checkbox', { name: 'Red/Green Table Rows' });
    const initial = await toggle.isChecked();

    await toggle.click();
    await expect(toggle).toBeChecked({ checked: !initial });

    await page.reload();
    await expect(page.getByRole('checkbox', { name: 'Red/Green Table Rows' })).toBeChecked({ checked: !initial });
  });
});
