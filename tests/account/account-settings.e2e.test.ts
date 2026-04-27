import { expect, test, type Page } from '@playwright/test';
import { LOCAL_TEST_USER_ID, authenticateAsLocalTestUser, getLocalTestJwt } from '../utils/auth';

const API_BASE = 'http://local.mtgcb.com:5000';
const USER_URL = `${API_BASE}/user`;

const mockUpdateUser = async (page: Page): Promise<{ lastBody: () => any }> => {
  let lastBody: any = null;
  await page.route(USER_URL, async (route) => {
    if (route.request().method() === 'PUT') {
      lastBody = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { userId: LOCAL_TEST_USER_ID },
        }),
      });
    } else {
      await route.continue();
    }
  });
  return { lastBody: () => lastBody };
};

const gotoAccount = async (page: Page) => {
  await page.goto('/account');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: 'Account Settings' })).toBeVisible();
};

test.describe('Account settings', () => {
  test.beforeEach(async ({ context }) => {
    test.skip(!getLocalTestJwt(), 'Set E2E_TEST_JWT_1337 to run (see tests/utils/auth.ts)');
    await authenticateAsLocalTestUser(context);
  });

  test('updates profile and shows "Profile updated" toast', async ({ page }) => {
    const update = await mockUpdateUser(page);
    await gotoAccount(page);

    const username = page.getByLabel('Username');
    const original = await username.inputValue();
    await username.fill(`${original}_test`);

    await page.getByRole('button', { name: 'Update Profile' }).click();

    await expect(page.getByText('Profile updated')).toBeVisible();
    await expect(page.getByText(/successfully/i)).toHaveCount(0);
    expect(update.lastBody()?.username).toBe(`${original}_test`);
  });

  test('updates password and shows "Password updated" toast', async ({ page }) => {
    const update = await mockUpdateUser(page);
    await gotoAccount(page);

    await page.getByLabel('New Password', { exact: true }).fill('newPassword123');
    await page.getByLabel('Confirm New Password').fill('newPassword123');
    await page.getByRole('button', { name: 'Update Password' }).click();

    await expect(page.getByText('Password updated')).toBeVisible();
    await expect(page.getByText(/successfully/i)).toHaveCount(0);
    expect(update.lastBody()?.password).toBe('newPassword123');
  });

  test('toggles privacy and shows "Privacy settings updated" toast', async ({ page }) => {
    const update = await mockUpdateUser(page);
    await gotoAccount(page);

    await page.getByRole('checkbox', { name: 'Make my collection public' }).click();

    await expect(page.getByText('Privacy settings updated')).toBeVisible();
    expect(typeof update.lastBody()?.isPublic).toBe('boolean');
  });

  test('toggles hide-collection-value and shows toast', async ({ page }) => {
    const update = await mockUpdateUser(page);
    await gotoAccount(page);

    await page.getByRole('checkbox', { name: 'Hide collection value from others' }).click();

    await expect(page.getByText('Collection value visibility updated')).toBeVisible();
    expect(typeof update.lastBody()?.hideCollectionValue).toBe('boolean');
  });

  test('changes draft cube variant and shows toast', async ({ page }) => {
    const update = await mockUpdateUser(page);
    await gotoAccount(page);

    // Read current value so we pick the OTHER option — picking the same value
    // wouldn't trigger an update.
    const select = page.getByTestId('draft-cube-variant-select').locator('[role="combobox"]');
    const currentLabel = (await select.textContent()) ?? '';
    const switchTo = currentLabel.startsWith('Two-Uncommon') ? 'standard' : 'two-uncommon';
    const optionPattern = switchTo === 'two-uncommon' ? /^Two-Uncommon/i : /^Standard/i;

    await select.click();
    await page.getByRole('option', { name: optionPattern }).click();

    await expect(page.getByText('Draft cube variant updated')).toBeVisible();
    expect(update.lastBody()?.draftCubeVariant).toBe(switchTo);
  });
});
