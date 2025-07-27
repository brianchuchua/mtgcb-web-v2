import { expect, test } from '@playwright/test';

test.describe('Forgot Password Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.addScriptTag({
      content: `
        window.grecaptcha = {
          ready: (callback) => callback(),
          execute: () => Promise.resolve('test-token')
        };
      `,
    });

    await page.goto('/forgot-password');
    await page.waitForLoadState('networkidle');
  });

  test('should display all required UI elements', async ({ page }) => {
    await expect(page.getByTestId('forgot-password-icon')).toBeVisible();
    await expect(page.getByTestId('forgot-password-title')).toBeVisible();
    await expect(page.getByTestId('forgot-password-description')).toBeVisible();
    await expect(page.getByTestId('forgot-password-form')).toBeVisible();
    await expect(page.getByTestId('username-input')).toBeVisible();
    await expect(page.getByTestId('email-input')).toBeVisible();
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
  });

  test('should validate email format', async ({ page }) => {
    await page.getByTestId('username-input').fill('testuser');
    await page.getByTestId('email-input').fill('invalid-email');
    await page.getByTestId('submit-button').click();

    await expect(page.getByText('Invalid email address')).toBeVisible();
  });

  test('should disable submit button during submission', async ({ page }) => {
    await page.getByTestId('username-input').fill('testuser');
    await page.getByTestId('email-input').fill('test@example.com');

    const submitButton = page.getByTestId('submit-button');
    await submitButton.click();

    await expect(submitButton).toBeDisabled();
  });

  test('should handle successful password reset request', async ({ page }) => {
    await page.route('/api/auth/forgot-password', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            message: 'Password reset email sent',
          },
        }),
      });
    });

    await page.getByTestId('username-input').fill('testuser');
    await page.getByTestId('email-input').fill('test@example.com');
    await page.getByTestId('submit-button').click();

    // Check for success message in snackbar
    await expect(page.getByText('Reset instructions sent to your email if a matching account exists.')).toBeVisible();

    // Verify form is cleared after successful submission
    await expect(page.getByTestId('username-input')).toHaveValue('');
    await expect(page.getByTestId('email-input')).toHaveValue('');
  });

  test('should handle API error response', async ({ page }) => {
    await page.route('/api/auth/forgot-password', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            message: 'No account found with that username and email combination',
          },
        }),
      });
    });

    await page.getByTestId('username-input').fill('nonexistent');
    await page.getByTestId('email-input').fill('wrong@example.com');
    await page.getByTestId('submit-button').click();

    await expect(page.getByTestId('form-error')).toHaveText('No account found with that username and email combination');
  });

  test('should handle server error', async ({ page }) => {
    await page.route('/api/auth/forgot-password', (route) => route.abort('failed'));

    await page.getByTestId('username-input').fill('testuser');
    await page.getByTestId('email-input').fill('test@example.com');
    await page.getByTestId('submit-button').click();

    await expect(page.getByTestId('form-error')).toHaveText(
      'There was a problem requesting a password reset. Please try again in a moment.',
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
  });

  test('should open privacy policy link in new tab', async ({ page }) => {
    const privacyLink = page.getByTestId('privacy-link');
    await expect(privacyLink).toHaveAttribute('target', '_blank');
    await expect(privacyLink).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(privacyLink).toHaveAttribute('href', 'https://policies.google.com/privacy');
  });

  test('should open terms of service link in new tab', async ({ page }) => {
    const termsLink = page.getByTestId('terms-link');
    await expect(termsLink).toHaveAttribute('target', '_blank');
    await expect(termsLink).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(termsLink).toHaveAttribute('href', 'https://policies.google.com/terms');
  });
});