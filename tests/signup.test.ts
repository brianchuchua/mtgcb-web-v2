import { expect, test } from '@playwright/test';

test.describe('Sign Up Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.addScriptTag({
      content: `
        window.grecaptcha = {
          ready: (callback) => callback(),
          execute: () => Promise.resolve('test-token')
        };
      `,
    });

    await page.goto('/signup');
    await page.waitForLoadState('networkidle');
  });

  test('should display all required UI elements', async ({ page }) => {
    await expect(page.getByTestId('signup-icon')).toBeVisible();
    await expect(page.getByTestId('signup-title')).toBeVisible();
    await expect(page.getByTestId('signup-form')).toBeVisible();
    await expect(page.getByTestId('username-input')).toBeVisible();
    await expect(page.getByTestId('email-input')).toBeVisible();
    await expect(page.getByTestId('password-input')).toBeVisible();
    await expect(page.getByTestId('password-confirmation-input')).toBeVisible();
    await expect(page.getByTestId('submit-button')).toBeVisible();
    await expect(page.getByTestId('login-link')).toBeVisible();
    await expect(page.getByTestId('recaptcha-text')).toBeVisible();
    await expect(page.getByTestId('privacy-link')).toBeVisible();
    await expect(page.getByTestId('terms-link')).toBeVisible();
  });

  test('should show validation errors for empty form submission', async ({ page }) => {
    await page.getByTestId('submit-button').click();

    await expect(page.getByText('Username is required')).toBeVisible();
    await expect(page.getByText('Email is required')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();
    await expect(page.getByText('Password confirmation is required')).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await page.getByTestId('email-input').fill('invalid-email');
    await page.getByTestId('submit-button').click();

    await expect(page.getByText('Valid email is required')).toBeVisible();
  });

  test('should validate password length', async ({ page }) => {
    await page.getByTestId('password-input').fill('short');
    await page.getByTestId('submit-button').click();

    await expect(page.getByText('Password must be at least eight characters long')).toBeVisible();
  });

  test('should validate password confirmation match', async ({ page }) => {
    await page.getByTestId('password-input').fill('password123');
    await page.getByTestId('password-confirmation-input').fill('password456');
    await page.getByTestId('submit-button').click();

    await expect(page.getByText('Passwords must match')).toBeVisible();
  });

  test('should disable signup button during submission', async ({ page }) => {
    await page.getByTestId('username-input').fill('testuser');
    await page.getByTestId('email-input').fill('test@example.com');
    await page.getByTestId('password-input').fill('password123');
    await page.getByTestId('password-confirmation-input').fill('password123');

    const signupButton = page.getByTestId('submit-button');
    await signupButton.click();

    await expect(signupButton).toBeDisabled();
  });

  test('should redirect to home page after successful signup and login', async ({ page }) => {
    // Mock successful signup response
    await page.route('/api/auth/register', async (route) => {
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

    // Mock successful login response
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
    await page.getByTestId('email-input').fill('test@example.com');
    await page.getByTestId('password-input').fill('password123');
    await page.getByTestId('password-confirmation-input').fill('password123');

    await Promise.all([
      page.getByTestId('submit-button').click(),
      page.waitForURL('/?new=true', { timeout: 10000 }),
    ]);
  });

  test('should handle signup failure', async ({ page }) => {
    // Mock both signup and login endpoints to ensure neither is called with real implementation
    let signupCalled = false;

    await page.route('/api/auth/register', async (route) => {
      signupCalled = true;
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            message: 'Username already exists',
          },
        }),
      });
    });

    // In case the signup somehow succeeds, ensure login won't proceed
    await page.route('http://local.mtgcb.com:5000/auth/login', async (route) => {
      if (signupCalled) {
        throw new Error('Login endpoint should not be called if signup failed');
      }
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            message: 'Login should not be attempted',
          },
        }),
      });
    });

    await page.getByTestId('username-input').fill('existinguser');
    await page.getByTestId('email-input').fill('test@example.com');
    await page.getByTestId('password-input').fill('password123');
    await page.getByTestId('password-confirmation-input').fill('password123');
    await page.getByTestId('submit-button').click();

    await expect(page.getByTestId('form-error')).toHaveText('Username already exists');
  });

  test('should handle server error', async ({ page }) => {
    await page.route('/api/auth/register', (route) => route.abort('failed'));

    await page.getByTestId('username-input').fill('testuser');
    await page.getByTestId('email-input').fill('test@example.com');
    await page.getByTestId('password-input').fill('password123');
    await page.getByTestId('password-confirmation-input').fill('password123');
    await page.getByTestId('submit-button').click();

    await expect(page.getByTestId('form-error')).toHaveText(
      'There was a problem trying to sign up. Please try again in a moment.',
    );
  });

  test('should redirect to login page on link click', async ({ page }) => {
    await page.getByTestId('login-link').click();
    await expect(page).toHaveURL('/login');
  });

  test('should enforce maximum length on input fields', async ({ page }) => {
    const longString = 'a'.repeat(256);

    await page.getByTestId('username-input').fill(longString);
    const username = await page.getByTestId('username-input').inputValue();
    expect(username.length).toBe(255);

    await page.getByTestId('email-input').fill(longString);
    const email = await page.getByTestId('email-input').inputValue();
    expect(email.length).toBe(255);

    await page.getByTestId('password-input').fill(longString);
    const password = await page.getByTestId('password-input').inputValue();
    expect(password.length).toBe(255);

    await page.getByTestId('password-confirmation-input').fill(longString);
    const passwordConfirm = await page.getByTestId('password-confirmation-input').inputValue();
    expect(passwordConfirm.length).toBe(255);
  });
});
