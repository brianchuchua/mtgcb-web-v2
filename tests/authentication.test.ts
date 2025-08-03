import { expect, test } from '@playwright/test';


// List of all protected routes that require authentication
const protectedRoutes = [
  { path: '/account', name: 'Account' },
  { path: '/collections/edit-cards', name: 'Edit Cards' },
  { path: '/import', name: 'Import' },
  { path: '/export', name: 'Export' },
  { path: '/locations', name: 'Locations' },
  { path: '/locations/create', name: 'Create Location' },
  { path: '/locations/edit/1', name: 'Edit Location' },
  { path: '/goals', name: 'Goals' },
  { path: '/goals/create', name: 'Create Goal' },
  { path: '/goals/edit/1', name: 'Edit Goal' },
  { path: '/reset-collection', name: 'Reset Collection' },
];

test.describe('Protected Routes - Authentication Required', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the /auth/me endpoint to return 401 (unauthenticated)
    await page.route('http://local.mtgcb.com:5000/auth/me', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            message: 'Unauthorized',
          },
        }),
      });
    });
  });

  protectedRoutes.forEach(({ path, name }) => {
    test(`${name} (${path}) should redirect to login when not authenticated`, async ({ page }) => {
      // Navigate to the protected route
      await page.goto(path);
      
      // Wait for either redirect or stay on same page with loading
      await page.waitForLoadState('networkidle');
      
      // Give time for client-side redirect to happen
      await page.waitForTimeout(2000);
      
      // Check if we've been redirected to login
      const currentUrl = page.url();
      
      // Verify we're on the login page
      expect(currentUrl).toContain('/login');
      
      // Verify the redirectTo parameter is set correctly
      const url = new URL(currentUrl);
      const redirectTo = url.searchParams.get('redirectTo');
      expect(decodeURIComponent(redirectTo || '')).toBe(path);
    });
  });
});

test.describe('Authentication Flow', () => {
  test('should show loading state while checking authentication', async ({ page }) => {
    let authCheckCount = 0;
    
    // Mock the /auth/me endpoint with a delay
    await page.route('http://local.mtgcb.com:5000/auth/me', async (route) => {
      authCheckCount++;
      // Add a delay to see the loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            message: 'Unauthorized',
          },
        }),
      });
    });
    
    // Navigate to a protected route
    await page.goto('/account');
    
    // Should see a loading spinner initially
    const spinner = page.locator('[role="progressbar"], .MuiCircularProgress-root');
    await expect(spinner).toBeVisible();
    
    // Wait for redirect
    await page.waitForURL((url) => url.pathname === '/login');
    
    // Verify auth check was made
    expect(authCheckCount).toBeGreaterThan(0);
  });
  
  test('login page should have all required elements', async ({ page }) => {
    // Mock unauthenticated state
    await page.route('http://local.mtgcb.com:5000/auth/me', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            message: 'Unauthorized',
          },
        }),
      });
    });
    
    // Go to a protected route to trigger redirect
    await page.goto('/account');
    await page.waitForURL((url) => url.pathname === '/login');
    
    // Check for login form elements
    await expect(page.getByTestId('login-form')).toBeVisible();
    await expect(page.getByTestId('username-input')).toBeVisible();
    await expect(page.getByTestId('password-input')).toBeVisible();
    await expect(page.getByTestId('submit-button')).toBeVisible();
  });
});

test.describe('Public Routes', () => {
  test('should allow access to home page without authentication', async ({ page }) => {
    // Mock unauthenticated state
    await page.route('http://local.mtgcb.com:5000/auth/me', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            message: 'Unauthorized',
          },
        }),
      });
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Should NOT be redirected to login
    expect(page.url()).toBe('http://local.mtgcb.com:3000/');
  });
  
  test('should allow access to browse page without authentication', async ({ page }) => {
    // Mock unauthenticated state
    await page.route('http://local.mtgcb.com:5000/auth/me', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            message: 'Unauthorized',
          },
        }),
      });
    });
    
    // Mock the browse API endpoints
    await page.route('http://local.mtgcb.com:5000/cards/search', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            cards: [],
            total: 0,
          },
        }),
      });
    });
    
    await page.goto('/browse');
    await page.waitForLoadState('networkidle');
    
    // Should NOT be redirected to login
    expect(page.url()).toContain('/browse');
    expect(page.url()).not.toContain('/login');
  });
});