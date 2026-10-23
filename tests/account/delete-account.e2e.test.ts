import { type Page, expect, test } from '@playwright/test';
import { authenticateAsLocalTestUser, getLocalTestJwt } from '../utils/auth';

const DELETE_ACCOUNT_URL = 'http://local.mtgcb.com:5000/auth/account';

// Every test mocks DELETE /auth/account; an unmocked call would delete user 1337 for real.
const mockDeleteAccount = async (page: Page, status: number, body: unknown) => {
  const calls: string[] = [];
  await page.route(DELETE_ACCOUNT_URL, async (route) => {
    calls.push(route.request().method());
    await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
  });
  return { calls };
};

const openDeleteDialog = async (page: Page) => {
  await page.goto('/account');
  await expect(page.getByRole('heading', { name: 'Account Settings' })).toBeVisible();
  await page.getByText('Danger Zone - Delete Account').click();
  await page.getByRole('button', { name: 'Delete Account' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('This action is permanent and cannot be undone!')).toBeVisible();
  return dialog;
};

test.describe('Delete account dialog', () => {
  test.beforeEach(async ({ context }) => {
    test.skip(!getLocalTestJwt(), 'Set E2E_TEST_JWT_1337 to run (see tests/utils/auth.ts)');
    await authenticateAsLocalTestUser(context);
  });

  test('confirm button stays disabled until the confirmation text matches (case-insensitive)', async ({ page }) => {
    const deletion = await mockDeleteAccount(page, 200, { success: true, data: { message: 'deleted' } });
    const dialog = await openDeleteDialog(page);
    const confirm = dialog.getByRole('button', { name: 'Delete My Account' });
    const input = dialog.getByPlaceholder('delete my account');

    await expect(confirm).toBeDisabled();

    await input.fill('delete my');
    await expect(dialog.getByText('Text does not match')).toBeVisible();
    await expect(confirm).toBeDisabled();

    await input.fill('DELETE My Account');
    await expect(dialog.getByText('Text does not match')).toHaveCount(0);
    await expect(confirm).toBeEnabled();
    expect(deletion.calls).toEqual([]);
  });

  test('cancel closes the dialog, sends nothing, and clears the typed text', async ({ page }) => {
    const deletion = await mockDeleteAccount(page, 200, { success: true, data: { message: 'deleted' } });
    const dialog = await openDeleteDialog(page);

    await dialog.getByPlaceholder('delete my account').fill('delete my account');
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(deletion.calls).toEqual([]);

    await page.getByRole('button', { name: 'Delete Account' }).click();
    await expect(page.getByRole('dialog').getByPlaceholder('delete my account')).toHaveValue('');
  });

  test('a successful delete calls DELETE /auth/account, shows the toast and goes home', async ({ page }) => {
    const deletion = await mockDeleteAccount(page, 200, { success: true, data: { message: 'deleted' } });
    const dialog = await openDeleteDialog(page);

    await dialog.getByPlaceholder('delete my account').fill('delete my account');
    await dialog.getByRole('button', { name: 'Delete My Account' }).click();

    await expect(page.getByText('Your account has been permanently deleted')).toBeVisible();
    await page.waitForURL((url) => url.pathname === '/', { timeout: 10000 });
    expect(deletion.calls).toEqual(['DELETE']);
  });

  test('a failed delete shows the API error and stays on the account page', async ({ page }) => {
    await mockDeleteAccount(page, 500, {
      success: false,
      data: null,
      error: { code: 'INTERNAL', message: 'Could not delete account right now' },
    });
    const dialog = await openDeleteDialog(page);

    await dialog.getByPlaceholder('delete my account').fill('delete my account');
    await dialog.getByRole('button', { name: 'Delete My Account' }).click();

    await expect(page.getByText('Could not delete account right now')).toBeVisible();
    expect(new URL(page.url()).pathname).toBe('/account');
    await expect(page.getByRole('dialog')).toBeVisible();
  });
});
