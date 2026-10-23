import { type Page, expect, test } from '@playwright/test';

const API_BASE = 'http://local.mtgcb.com:5000';

const mockSignupSuccess = async (page: Page) => {
  await page.route('**/api/auth/register', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { userId: 999001, username: 'e2e_new_user' } }),
    }),
  );
};

const fillAndSubmitSignup = async (page: Page) => {
  await page.waitForFunction(() => typeof (window as any).grecaptcha?.execute === 'function', null, { timeout: 15000 });
  await page.getByTestId('username-input').fill('e2e_new_user');
  await page.getByTestId('email-input').fill('e2e_new_user@example.com');
  await page.getByTestId('password-input').fill('password123');
  await page.getByTestId('password-confirmation-input').fill('password123');
  await page.getByTestId('submit-button').click();
};

test.describe('Signup followed by automatic login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signup');
    await expect(page.getByTestId('signup-form')).toBeVisible();
  });

  test('sends the user to /login when signup works but the login call reports failure', async ({ page }) => {
    await mockSignupSuccess(page);
    let loginBody: Record<string, unknown> | null = null;
    await page.route(`${API_BASE}/auth/login`, async (route) => {
      loginBody = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, data: null, error: { message: 'Login failed' } }),
      });
    });

    await fillAndSubmitSignup(page);

    await page.waitForURL((url) => url.pathname === '/login', { timeout: 10000 });
    await expect(page.getByTestId('login-form')).toBeVisible();
    expect(loginBody).toMatchObject({ username: 'e2e_new_user', password: 'password123' });
  });

  test('stays on /signup and shows the login error when the login call is rejected', async ({ page }) => {
    // Pins current behavior: a rejected (non-2xx) login falls into the generic catch, so the
    // user sees the login error on the signup page even though their account was created.
    await mockSignupSuccess(page);
    await page.route(`${API_BASE}/auth/login`, (route) =>
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, data: null, error: { message: 'Invalid username or password' } }),
      }),
    );

    await fillAndSubmitSignup(page);

    await expect(page.getByTestId('form-error')).toHaveText('Invalid username or password');
    expect(new URL(page.url()).pathname).toBe('/signup');
  });
});
