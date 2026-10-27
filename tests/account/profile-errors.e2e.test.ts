import { type Page, expect, test } from '@playwright/test';
import { authenticateAsLocalTestUser, getLocalTestJwt } from '../utils/auth';

const USER_URL = 'http://local.mtgcb.com:5000/user';

const mockProfileUpdate = async (page: Page, status: number, body: unknown) => {
  await page.route(USER_URL, async (route) => {
    if (route.request().method() !== 'PUT') return route.continue();
    await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
  });
};

const gotoAccount = async (page: Page) => {
  await page.goto('/account');
  await expect(page.getByRole('heading', { name: 'Account Settings' })).toBeVisible();
  await expect(page.getByLabel('Username')).not.toHaveValue('');
};

const changeUsernameAndSubmit = async (page: Page) => {
  const username = page.getByLabel('Username');
  await username.fill(`${await username.inputValue()}_e2e`);
  await page.getByRole('button', { name: 'Update Profile' }).click();
};

const changeEmailAndSubmit = async (page: Page) => {
  await page.getByLabel('Email').fill('someone-else@example.com');
  await page.getByRole('button', { name: 'Update Profile' }).click();
};

test.describe('Account profile update errors', () => {
  test.beforeEach(async ({ context }) => {
    test.skip(!getLocalTestJwt(), 'Set E2E_TEST_JWT_1337 to run (see tests/utils/auth.ts)');
    await authenticateAsLocalTestUser(context);
  });

  test('Update Profile is disabled until the username or email changes', async ({ page }) => {
    await gotoAccount(page);
    const button = page.getByRole('button', { name: 'Update Profile' });
    await expect(button).toBeDisabled();

    const username = page.getByLabel('Username');
    const original = await username.inputValue();
    await username.fill(`${original}x`);
    await expect(button).toBeEnabled();

    await username.fill(original);
    await expect(button).toBeDisabled();
  });

  test('USERNAME_TAKEN shows a field error under Username', async ({ page }) => {
    await mockProfileUpdate(page, 200, {
      success: false,
      data: null,
      error: { code: 'USERNAME_TAKEN', message: 'Username taken' },
    });
    await gotoAccount(page);
    await changeUsernameAndSubmit(page);

    await expect(page.getByText('Username is already taken')).toBeVisible();
    await expect(page.getByText('Profile updated')).toHaveCount(0);
  });

  // Emails are deliberately not unique, so the API never reports a taken email.
  // An error on an email change shows the API's message, with no field error.
  test('an email change error shows the API message in the toast', async ({ page }) => {
    await mockProfileUpdate(page, 400, {
      success: false,
      data: null,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid email address' },
    });
    await gotoAccount(page);
    await changeEmailAndSubmit(page);

    await expect(page.getByText('Invalid email address')).toBeVisible();
    await expect(page.getByText('Email is already registered')).toHaveCount(0);
    await expect(page.getByText('Profile updated')).toHaveCount(0);
  });

  test('a 500 without a message shows the "Failed to update profile" toast', async ({ page }) => {
    await mockProfileUpdate(page, 500, { success: false, data: null, error: null });
    await gotoAccount(page);
    await changeUsernameAndSubmit(page);

    await expect(page.getByText('Failed to update profile')).toBeVisible();
  });

  test('a 500 with an API message shows that message in the toast', async ({ page }) => {
    await mockProfileUpdate(page, 500, {
      success: false,
      data: null,
      error: { code: 'INTERNAL', message: 'Database is unavailable' },
    });
    await gotoAccount(page);
    await changeUsernameAndSubmit(page);

    await expect(page.getByText('Database is unavailable')).toBeVisible();
  });

  test('the real API duplicate-username response shows a field error under Username', async ({ page }) => {

    await mockProfileUpdate(page, 409, {
      success: false,
      data: null,
      error: { code: 'USERNAME_EXISTS', message: 'Username already exists' },
    });
    await gotoAccount(page);
    await changeUsernameAndSubmit(page);

    await expect(page.getByText('Username is already taken')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Account password form validation', () => {
  test.beforeEach(async ({ context }) => {
    test.skip(!getLocalTestJwt(), 'Set E2E_TEST_JWT_1337 to run (see tests/utils/auth.ts)');
    await authenticateAsLocalTestUser(context);
  });

  test('Update Password stays disabled for a short password', async ({ page }) => {
    await gotoAccount(page);
    const button = page.getByRole('button', { name: 'Update Password' });
    await expect(button).toBeDisabled();

    await page.getByLabel('New Password', { exact: true }).fill('short12');
    await page.getByLabel('Confirm New Password').fill('short12');

    await expect(page.getByText('Password must be at least 8 characters long')).toBeVisible();
    await expect(button).toBeDisabled();
  });

  test('Update Password stays disabled when the passwords do not match', async ({ page }) => {
    await gotoAccount(page);
    const button = page.getByRole('button', { name: 'Update Password' });

    await page.getByLabel('New Password', { exact: true }).fill('longenough1');
    await page.getByLabel('Confirm New Password').fill('longenough2');

    await expect(page.getByText('The passwords do not match')).toBeVisible();
    await expect(button).toBeDisabled();

    await page.getByLabel('Confirm New Password').fill('longenough1');
    await expect(button).toBeEnabled();
  });
});
