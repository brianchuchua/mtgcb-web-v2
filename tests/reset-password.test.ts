import { expect, test } from '@playwright/test';

test.describe('Reset Password Page', () => {
  test.describe('Valid Token Flow', () => {
    test.beforeEach(async ({ page }) => {
      // Mock successful token validation
      await page.route('/api/auth/validate-password-reset*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { valid: true },
          }),
        });
      });

      await page.goto('/reset-password?token=valid-test-token');
      await page.waitForLoadState('networkidle');
    });

    test('should display all required UI elements', async ({ page }) => {
      await expect(page.getByTestId('reset-password-icon')).toBeVisible();
      await expect(page.getByTestId('reset-password-title')).toBeVisible();
      await expect(page.getByTestId('reset-password-description')).toBeVisible();
      await expect(page.getByTestId('reset-password-form')).toBeVisible();
      await expect(page.getByTestId('new-password-input')).toBeVisible();
      await expect(page.getByTestId('confirm-password-input')).toBeVisible();
      await expect(page.getByTestId('submit-button')).toBeVisible();
      await expect(page.getByTestId('login-link')).toBeVisible();
    });

    test('should show validation errors for empty form submission', async ({ page }) => {
      await page.getByTestId('submit-button').click();

      await expect(page.getByText('Password is required')).toBeVisible();
      await expect(page.getByText('Please confirm your password')).toBeVisible();
    });

    test('should validate password length', async ({ page }) => {
      await page.getByTestId('new-password-input').fill('short');
      await page.getByTestId('submit-button').click();

      await expect(page.getByText('Password must be at least eight characters long')).toBeVisible();
    });

    test('should validate password confirmation match', async ({ page }) => {
      await page.getByTestId('new-password-input').fill('password123');
      await page.getByTestId('confirm-password-input').fill('password456');
      await page.getByTestId('submit-button').click();

      await expect(page.getByText('Passwords must match')).toBeVisible();
    });

    test('should disable submit button during submission', async ({ page }) => {
      await page.getByTestId('new-password-input').fill('password123');
      await page.getByTestId('confirm-password-input').fill('password123');

      const submitButton = page.getByTestId('submit-button');
      await submitButton.click();

      await expect(submitButton).toBeDisabled();
    });

    test('should handle successful password reset', async ({ page }) => {
      await page.route('/api/auth/reset-password', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { message: 'Password reset successfully' },
          }),
        });
      });

      await page.getByTestId('new-password-input').fill('newpassword123');
      await page.getByTestId('confirm-password-input').fill('newpassword123');

      await Promise.all([
        page.getByTestId('submit-button').click(),
        page.waitForURL('/login', { timeout: 10000 }),
      ]);

      // Check for success message in snackbar before redirect
      await expect(page.getByText('Your password has been successfully reset! Go ahead and log in.')).toBeVisible();
    });

    test('should handle API error response', async ({ page }) => {
      await page.route('/api/auth/reset-password', async (route) => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: { message: 'This reset link has already been used' },
          }),
        });
      });

      await page.getByTestId('new-password-input').fill('newpassword123');
      await page.getByTestId('confirm-password-input').fill('newpassword123');
      await page.getByTestId('submit-button').click();

      await expect(page.getByTestId('form-error')).toHaveText('This reset link has already been used');
    });

    test('should handle server error', async ({ page }) => {
      await page.route('/api/auth/reset-password', (route) => route.abort('failed'));

      await page.getByTestId('new-password-input').fill('newpassword123');
      await page.getByTestId('confirm-password-input').fill('newpassword123');
      await page.getByTestId('submit-button').click();

      await expect(page.getByTestId('form-error')).toHaveText(
        'There was a problem resetting the password. Please try again in a moment.',
      );
    });

    test('should redirect to login page on link click', async ({ page }) => {
      await page.getByTestId('login-link').click();
      await expect(page).toHaveURL('/login');
    });

    test('should enforce maximum length on input fields', async ({ page }) => {
      const longString = 'a'.repeat(256);

      await page.getByTestId('new-password-input').fill(longString);
      const newPassword = await page.getByTestId('new-password-input').inputValue();
      expect(newPassword.length).toBe(255);

      await page.getByTestId('confirm-password-input').fill(longString);
      const confirmPassword = await page.getByTestId('confirm-password-input').inputValue();
      expect(confirmPassword.length).toBe(255);
    });
  });

  test.describe('Invalid Token Flow', () => {
    test('should show error message for missing token', async ({ page }) => {
      await page.goto('/reset-password');
      await page.waitForLoadState('networkidle');

      await expect(page.getByTestId('invalid-token-icon')).toBeVisible();
      await expect(page.getByTestId('invalid-token-title')).toBeVisible();
      await expect(page.getByTestId('invalid-token-message')).toHaveText(
        'No reset token provided. Please request a new password reset link.',
      );
      await expect(page.getByTestId('return-to-login-button')).toBeVisible();
    });

    test('should show error message for invalid token', async ({ page }) => {
      await page.route('/api/auth/validate-password-reset*', async (route) => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: { message: 'This password reset link has expired' },
          }),
        });
      });

      await page.goto('/reset-password?token=expired-token');
      await page.waitForLoadState('networkidle');

      await expect(page.getByTestId('invalid-token-icon')).toBeVisible();
      await expect(page.getByTestId('invalid-token-title')).toBeVisible();
      await expect(page.getByTestId('invalid-token-message')).toHaveText('This password reset link has expired');
      await expect(page.getByTestId('return-to-login-button')).toBeVisible();
    });

    test('should handle token validation server error', async ({ page }) => {
      await page.route('/api/auth/validate-password-reset*', (route) => route.abort('failed'));

      await page.goto('/reset-password?token=test-token');
      await page.waitForLoadState('networkidle');

      await expect(page.getByTestId('invalid-token-icon')).toBeVisible();
      await expect(page.getByTestId('invalid-token-title')).toBeVisible();
      await expect(page.getByTestId('invalid-token-message')).toHaveText('Error validating reset token');
    });

    test('should redirect to login when clicking return button', async ({ page }) => {
      await page.goto('/reset-password');
      await page.waitForLoadState('networkidle');

      await page.getByTestId('return-to-login-button').click();
      await expect(page).toHaveURL('/login');
    });
  });

  test.describe('Password Field Interactions', () => {
    test.beforeEach(async ({ page }) => {
      // Mock successful token validation
      await page.route('/api/auth/validate-password-reset*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { valid: true },
          }),
        });
      });

      await page.goto('/reset-password?token=valid-test-token');
      await page.waitForLoadState('networkidle');
    });

    test('should show password fields as password type', async ({ page }) => {
      const newPasswordInput = page.getByTestId('new-password-input');
      const confirmPasswordInput = page.getByTestId('confirm-password-input');

      await expect(newPasswordInput).toHaveAttribute('type', 'password');
      await expect(confirmPasswordInput).toHaveAttribute('type', 'password');
    });

    test('should validate password match in real-time', async ({ page }) => {
      await page.getByTestId('new-password-input').fill('password123');
      await page.getByTestId('confirm-password-input').fill('password12');
      
      // Trigger validation by clicking submit
      await page.getByTestId('submit-button').click();
      
      await expect(page.getByText('Passwords must match')).toBeVisible();
      
      // Fix the password
      await page.getByTestId('confirm-password-input').fill('password123');
      
      // Submit again - error should be gone
      await page.getByTestId('submit-button').click();
      
      // Should not see the password match error anymore
      await expect(page.getByText('Passwords must match')).not.toBeVisible();
    });
  });
});