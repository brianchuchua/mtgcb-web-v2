import { expect, test } from '@playwright/test';

test.describe('Forgot Username Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.addScriptTag({
      content: `
        window.grecaptcha = {
          ready: (callback) => callback(),
          execute: () => Promise.resolve('test-token')
        };
      `,
    });

    await page.goto('/forgot-username');
    await page.waitForLoadState('networkidle');
  });

  test('should display all required UI elements', async ({ page }) => {
    await expect(page.getByTestId('forgot-username-icon')).toBeVisible();
    await expect(page.getByTestId('forgot-username-title')).toBeVisible();
    await expect(page.getByTestId('forgot-username-description')).toBeVisible();
    await expect(page.getByTestId('forgot-username-form')).toBeVisible();
    await expect(page.getByTestId('email-input')).toBeVisible();
    await expect(page.getByTestId('submit-button')).toBeVisible();
    await expect(page.getByTestId('login-link')).toBeVisible();
    await expect(page.getByTestId('recaptcha-text')).toBeVisible();
    await expect(page.getByTestId('privacy-link')).toBeVisible();
    await expect(page.getByTestId('terms-link')).toBeVisible();
  });

  test('should show validation error for empty form submission', async ({ page }) => {
    await page.getByTestId('submit-button').click();

    await expect(page.getByText('Email is required')).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await page.getByTestId('email-input').fill('invalid-email');
    await page.getByTestId('submit-button').click();

    await expect(page.getByText('Invalid email address')).toBeVisible();
  });

  test('should disable submit button during submission', async ({ page }) => {
    await page.getByTestId('email-input').fill('test@example.com');

    const submitButton = page.getByTestId('submit-button');
    await submitButton.click();

    await expect(submitButton).toBeDisabled();
  });

  test('should handle successful username recovery request', async ({ page }) => {
    await page.route('/api/auth/forgot-username', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            message: 'Username sent to email',
          },
        }),
      });
    });

    await page.getByTestId('email-input').fill('test@example.com');
    await page.getByTestId('submit-button').click();

    // Check for success message in snackbar
    await expect(page.getByText('Username sent to your email if a matching account exists.')).toBeVisible();

    // Verify form is cleared after successful submission
    await expect(page.getByTestId('email-input')).toHaveValue('');
  });

  test('should handle API error response', async ({ page }) => {
    await page.route('/api/auth/forgot-username', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            message: 'No account found with that email address',
          },
        }),
      });
    });

    await page.getByTestId('email-input').fill('nonexistent@example.com');
    await page.getByTestId('submit-button').click();

    await expect(page.getByTestId('form-error')).toHaveText('No account found with that email address');
  });

  test('should handle server error', async ({ page }) => {
    await page.route('/api/auth/forgot-username', (route) => route.abort('failed'));

    await page.getByTestId('email-input').fill('test@example.com');
    await page.getByTestId('submit-button').click();

    await expect(page.getByTestId('form-error')).toHaveText(
      'There was a problem requesting username recovery. Please try again in a moment.',
    );
  });

  test('should redirect to login page on link click', async ({ page }) => {
    await page.getByTestId('login-link').click();
    await expect(page).toHaveURL('/login');
  });

  test('should enforce maximum length on email field', async ({ page }) => {
    const longString = 'a'.repeat(256);

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

  test('should handle multiple rapid form submissions', async ({ page }) => {
    await page.route('/api/auth/forgot-username', async (route) => {
      // Delay response to simulate slow network
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { message: 'Username sent' },
        }),
      });
    });

    await page.getByTestId('email-input').fill('test@example.com');
    
    const submitButton = page.getByTestId('submit-button');
    
    // Try to click multiple times
    await submitButton.click();
    await submitButton.click({ force: true });
    
    // Button should remain disabled during submission
    await expect(submitButton).toBeDisabled();
    
    // Wait for success message
    await expect(page.getByText('Username sent to your email if a matching account exists.')).toBeVisible();
  });
});