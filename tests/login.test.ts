import { expect, test } from '@playwright/test';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.addScriptTag({
      content: `
        window.grecaptcha = {
          ready: (callback) => callback(),
          execute: () => Promise.resolve('test-token')
        };
      `,
    });

    await page.goto('/login');
    await page.waitForLoadState('networkidle');
  });

  test('should display all required UI elements', async ({ page }) => {
    await expect(page.getByTestId('login-icon')).toBeVisible();
    await expect(page.getByTestId('login-title')).toBeVisible();
    await expect(page.getByTestId('login-form')).toBeVisible();
    await expect(page.getByTestId('username-input')).toBeVisible();
    await expect(page.getByTestId('password-input')).toBeVisible();
    await expect(page.getByTestId('submit-button')).toBeVisible();

    await expect(page.getByTestId('forgot-password-link')).toBeVisible();
    await expect(page.getByTestId('forgot-username-link')).toBeVisible();
    await expect(page.getByTestId('signup-button')).toBeVisible();

    await expect(page.getByTestId('recaptcha-text')).toBeVisible();
    await expect(page.getByTestId('privacy-link')).toBeVisible();
    await expect(page.getByTestId('terms-link')).toBeVisible();
  });

  test('should show validation errors for empty form submission', async ({ page }) => {
    await page.getByTestId('submit-button').click();

    await expect(page.getByText('Username is required')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();
  });

  test('should disable login button during submission', async ({ page }) => {
    await page.getByTestId('username-input').fill('testuser');
    await page.getByTestId('password-input').fill('password123');

    const loginButton = page.getByTestId('submit-button');
    await loginButton.click();

    await expect(loginButton).toBeDisabled();
  });

  test('should redirect to home page after login', async ({ page }) => {
    await page.route('http://local.mtgcb.com:5000/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            userId: '123',
            username: 'testuser',
          },
        }),
      });
    });

    await page.getByTestId('username-input').fill('testuser');
    await page.getByTestId('password-input').fill('password123');

    await Promise.all([
      page.getByTestId('submit-button').click(),
      page.waitForURL('/', { timeout: 10000 }),
    ]);
  });

  test('should handle failed login with invalid credentials', async ({ page }) => {
    await page.route('http://local.mtgcb.com:5000/auth/login', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            message: 'Invalid username or password',
          },
        }),
      });
    });

    await page.getByTestId('username-input').fill('wronguser');
    await page.getByTestId('password-input').fill('wrongpass');
    await page.getByTestId('submit-button').click();

    await expect(page.getByTestId('form-error')).toHaveText('Invalid username or password');
  });

  test('should handle server error', async ({ page }) => {
    await page.route('http://local.mtgcb.com:5000/auth/login', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            message: 'Internal server error',
          },
        }),
      });
    });

    await page.getByTestId('username-input').fill('testuser');
    await page.getByTestId('password-input').fill('password123');
    await page.getByTestId('submit-button').click();

    await expect(page.getByTestId('form-error')).toHaveText(/Internal server error/);
  });

  test('should redirect to signup page on button click', async ({ page }) => {
    await page.getByTestId('signup-button').click();
    await expect(page).toHaveURL('/signup');
  });

  test('should redirect to forgot password page on link click', async ({ page }) => {
    await page.getByTestId('forgot-password-link').click();
    await expect(page).toHaveURL('/forgot-password');
  });

  test('should redirect to forgot username page on link click', async ({ page }) => {
    await page.getByTestId('forgot-username-link').click();
    await expect(page).toHaveURL('/forgot-username');
  });

  test('should enforce maximum length on input fields', async ({ page }) => {
    const longString = 'a'.repeat(256);

    await page.getByTestId('username-input').fill(longString);
    const username = await page.getByTestId('username-input').inputValue();
    expect(username.length).toBe(255);

    await page.getByTestId('password-input').fill(longString);
    const password = await page.getByTestId('password-input').inputValue();
    expect(password.length).toBe(255);
  });
});
