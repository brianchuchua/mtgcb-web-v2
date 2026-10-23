import { type Page, expect, test } from '@playwright/test';

const API_BASE = 'http://local.mtgcb.com:5000';
const SITE_ORIGIN = 'http://local.mtgcb.com:3000';

const ME_USER = {
  userId: 1337,
  username: 'Manath',
  email: 'e2e@example.com',
  isPublic: true,
  showAsPatreonSupporter: false,
  patreonCardId: null,
  patreonCardColor: null,
  draftCubeVariant: 'standard',
  hideCollectionValue: false,
};

const mockLoginSuccess = async (page: Page) => {
  let loginCalled = false;
  await page.route(`${API_BASE}/auth/login`, async (route) => {
    loginCalled = true;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { userId: ME_USER.userId, username: ME_USER.username } }),
    });
  });
  return { wasCalled: () => loginCalled };
};

// /auth/me is 401 until login is called, then reports the user as signed in, the way the
// real cookie round trip would.
const mockMeFlipsAfterLogin = async (page: Page, wasLoginCalled: () => boolean) => {
  await page.route(`${API_BASE}/auth/me`, async (route) => {
    if (wasLoginCalled()) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: ME_USER, error: null }),
      });
    } else {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, data: null, error: { message: 'Unauthorized' } }),
      });
    }
  });
};

// The login form needs the reCAPTCHA script loaded before it can submit.
const waitForRecaptcha = (page: Page) =>
  page.waitForFunction(() => typeof (window as any).grecaptcha?.execute === 'function', null, { timeout: 15000 });

const submitLogin = async (page: Page) => {
  await waitForRecaptcha(page);
  await page.getByTestId('username-input').fill('Manath');
  await page.getByTestId('password-input').fill('password123');
  await page.getByTestId('submit-button').click();
};

test.describe('Login redirectTo', () => {
  test('sends the user to a relative redirectTo (with its query string) after logging in', async ({ page }) => {
    await mockLoginSuccess(page);
    const target = '/browse?contentType=sets&page=2';

    await page.goto(`/login?redirectTo=${encodeURIComponent(target)}`);
    await expect(page.getByTestId('login-form')).toBeVisible();
    await submitLogin(page);

    await page.waitForURL((url) => url.pathname === '/browse', { timeout: 10000 });
    const landed = new URL(page.url());
    expect(landed.searchParams.get('contentType')).toBe('sets');
    expect(landed.searchParams.get('page')).toBe('2');
  });

  test('goes home after login when there is no redirectTo', async ({ page }) => {
    await mockLoginSuccess(page);
    await page.goto('/login');
    await expect(page.getByTestId('login-form')).toBeVisible();
    await submitLogin(page);

    await page.waitForURL((url) => url.pathname === '/', { timeout: 10000 });
  });

  test('a protected route sends a logged-out user to /login with the full path and query in redirectTo', async ({
    page,
  }) => {
    const login = await mockLoginSuccess(page);
    await mockMeFlipsAfterLogin(page, login.wasCalled);

    await page.goto('/account?patreon=unknown_value&tab=1');
    await page.waitForURL((url) => url.pathname === '/login', { timeout: 10000 });
    expect(new URL(page.url()).searchParams.get('redirectTo')).toBe('/account?patreon=unknown_value&tab=1');

    await submitLogin(page);
    await page.waitForURL((url) => url.pathname === '/account', { timeout: 10000 });
    expect(new URL(page.url()).searchParams.get('tab')).toBe('1');
    await expect(page.getByRole('heading', { name: 'Account Settings' })).toBeVisible();
  });

  test('does not leave the site for an absolute external redirectTo', async ({ page }) => {

    await page.route('https://evil.example/**', (route) =>
      route.fulfill({ status: 200, contentType: 'text/html', body: '<html><body>evil</body></html>' }),
    );
    await mockLoginSuccess(page);

    await page.goto(`/login?redirectTo=${encodeURIComponent('https://evil.example/phish')}`);
    await expect(page.getByTestId('login-form')).toBeVisible();
    await submitLogin(page);

    await page.waitForURL((url) => url.pathname !== '/login', { timeout: 10000 });
    expect(new URL(page.url()).origin).toBe(SITE_ORIGIN);
  });
});
