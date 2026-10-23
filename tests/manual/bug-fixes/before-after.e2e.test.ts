import { type Page, type Route, expect, test } from '@playwright/test';
import path from 'path';
import { encodeToken } from '../../../src/utils/tokenEncoder';
import { mockApiRoute, ok } from '../../collections/fixtures/apiMocks';
import { authenticateAsLocalTestUser, getLocalTestJwt } from '../../utils/auth';

// Screenshots of each visible bug fixed on 2026-10-23. Run once against a build without the
// fixes and once with them:
//   SHOT_PHASE=before SHOT_DIR=<dir> pnpm test:manual tests/manual/bug-fixes --reporter=line
// Every write is mocked; nothing touches user 1337's real data.

const PHASE = process.env.SHOT_PHASE ?? 'current';
const SHOTS_DIR = process.env.SHOT_DIR ?? path.join(process.cwd(), 'test-results', 'manual-screenshots');
const shot = (name: string) => path.join(SHOTS_DIR, `${name}-${PHASE}.png`);

const API = 'http://local.mtgcb.com:5000';

test.use({ viewport: { width: 1440, height: 900 }, timezoneId: 'UTC', locale: 'en-US' });

const fulfillJson = (route: Route, body: unknown, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

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

test.describe('Bug fixes: logged out', () => {
  test('login redirect to an outside site', async ({ page, context }) => {
    // The real cookie lets the home page load its stats after the mocked login.
    if (getLocalTestJwt()) await authenticateAsLocalTestUser(context);
    let loggedIn = false;
    await page.route('https://evil.example/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `<html><body style="font-family:sans-serif;background:#fde8e8;padding:80px">
          <h1 style="font-size:48px">evil.example</h1>
          <p style="font-size:28px">Not MTG CB. A lookalike page here could ask for your password again.</p>
        </body></html>`,
      }),
    );
    await page.route(`${API}/auth/login`, async (route) => {
      loggedIn = true;
      await fulfillJson(route, { success: true, data: { userId: 1337, username: 'Manath' } });
    });
    await page.route(`${API}/auth/me`, (route) =>
      loggedIn
        ? fulfillJson(route, { success: true, data: ME_USER, error: null })
        : fulfillJson(route, { success: false, data: null, error: { message: 'Unauthorized' } }, 401),
    );

    await page.goto(`/login?redirectTo=${encodeURIComponent('https://evil.example/login')}`);
    await page.waitForFunction(() => typeof (window as any).grecaptcha?.execute === 'function', null, {
      timeout: 15000,
    });
    await page.getByTestId('username-input').fill('Manath');
    await page.getByTestId('password-input').fill('password123');
    await page.getByTestId('submit-button').click();
    await page.waitForURL((url) => url.origin !== 'http://local.mtgcb.com:3000' || url.pathname !== '/login', {
      timeout: 15000,
      waitUntil: 'commit',
    });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    console.log(JSON.stringify({ label: 'redirect', url: page.url() }));
    await page.screenshot({ path: shot('01-login-redirect') });
  });

  test('share link whose token starts with 00', async ({ page }) => {
    const hexToken = `00${'7f3a9c2e5b1d8046'.repeat(4).slice(0, 62)}`;
    const encoded = encodeToken(hexToken);
    await page.route('**/users/resolve-share-token*', (route) => {
      const sent = route.request().postDataJSON()?.shareToken;
      if (sent === hexToken) {
        return fulfillJson(route, {
          success: true,
          data: { isValid: true, userId: '1337', username: 'Manath', expiresAt: null },
          error: null,
        });
      }
      return fulfillJson(
        route,
        { success: false, data: null, error: { message: 'Invalid share token', code: 'NOT_FOUND' } },
        404,
      );
    });

    await page.goto(`/shared/${encoded}?contentType=sets`);
    await expect(page.getByText(/Invalid Share Link|Viewing Shared Collection/).first()).toBeVisible({
      timeout: 20000,
    });
    await page.waitForLoadState('networkidle');

    console.log(JSON.stringify({ label: 'share', hexToken, encoded }));
    await page.screenshot({ path: shot('02-share-link') });
  });
});

test.describe('Bug fixes: logged in', () => {
  test.beforeEach(async ({ context }) => {
    test.skip(!getLocalTestJwt(), 'E2E_TEST_JWT_1337 not set');
    await authenticateAsLocalTestUser(context);
  });

  test('taken username on the account page', async ({ page }) => {
    await page.route(`${API}/user`, (route) =>
      route.request().method() === 'PUT'
        ? fulfillJson(
            route,
            { success: false, data: null, error: { code: 'USERNAME_EXISTS', message: 'Username already exists' } },
            409,
          )
        : route.continue(),
    );
    await page.goto('/account');
    await expect(page.getByRole('heading', { name: 'Account Settings' })).toBeVisible({ timeout: 20000 });
    const username = page.getByLabel('Username');
    await expect(username).not.toHaveValue('');
    await username.fill('Jace');
    await page.getByRole('button', { name: 'Update Profile' }).click();
    await expect(page.getByText(/Username already exists|Username is already taken/).first()).toBeVisible();
    await page.waitForTimeout(400);

    await page.screenshot({ path: shot('03-username-taken') });
  });

  test('location edit parent options', async ({ page }) => {
    await mockLocations(page);
    await page.goto(`/locations/edit/${HOME.id}`);
    await expect(page.getByLabel('Location Name')).toHaveValue('Home', { timeout: 20000 });
    await page.getByRole('combobox', { name: 'Parent Location (Optional)' }).click();
    await expect(page.getByRole('listbox')).toBeVisible();
    await page.waitForTimeout(300);

    await page.screenshot({ path: shot('04-location-parent-options') });
  });

  test('clearing a location description', async ({ page }) => {
    await mockLocations(page);
    await page.goto(`/locations/edit/${SHELF.id}`);
    await expect(page.getByLabel('Description (Optional)')).toHaveValue('Top shelf', { timeout: 20000 });
    await page.getByLabel('Description (Optional)').fill('');
    await page.getByRole('button', { name: 'Save Changes' }).click();
    await page.waitForURL((url) => url.pathname === '/locations');

    await page.goto(`/locations/edit/${SHELF.id}`);
    await expect(page.getByLabel('Location Name')).toHaveValue('Shelf', { timeout: 20000 });
    await page.waitForTimeout(300);

    await page.screenshot({ path: shot('05-location-description') });
  });

  test('export with only the required fields', async ({ page }) => {
    await page.goto('/export');
    await expect(page.getByRole('heading', { name: 'Export Collection' })).toBeVisible({ timeout: 20000 });
    await page.getByRole('checkbox', { name: 'Customize fields to export' }).check();
    for (const box of await page.getByRole('checkbox').all()) {
      const label = await box.evaluate((el) => el.closest('label')?.textContent ?? '');
      if (label !== 'Customize fields to export' && (await box.isEnabled()) && (await box.isChecked())) {
        await box.uncheck();
      }
    }
    await page.getByRole('button', { name: 'Export Collection' }).scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    await page.screenshot({ path: shot('06-export-hint') });
  });

  test('history wording for removals', async ({ page }) => {
    const base = { card: null, set: null, location: null, quantities: null, description: '' };
    await mockApiRoute(page, '/collection/history', {
      method: 'GET',
      respond: () =>
        ok({
          history: [
            {
              ...base,
              id: 1,
              timestamp: '2026-10-22T15:00:00Z',
              operationType: 'mass-entry',
              mode: 'increment',
              bulkSummary: { cardsAffected: 5, rarity: 'all', quantityReg: -1, quantityFoil: 0 },
            },
            {
              ...base,
              id: 2,
              timestamp: '2026-10-22T14:00:00Z',
              operationType: 'mass-entry',
              mode: 'increment',
              bulkSummary: { cardsAffected: 5, rarity: 'all', quantityReg: 1, quantityFoil: 2 },
            },
          ],
        }),
    });
    await page.goto('/history');
    await expect(page.getByText(/Removed 1 regular/)).toBeVisible({ timeout: 20000 });
    await page.waitForTimeout(300);

    await page.screenshot({ path: shot('07-history-wording') });
  });
});

const TIMESTAMPS = { createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' };
const HOME = { id: 9401, name: 'Home', description: null as string | null, parentId: null as number | null, ...TIMESTAMPS };
const SHELF = { id: 9402, name: 'Shelf', description: 'Top shelf' as string | null, parentId: 9401, ...TIMESTAMPS };
const BINDER = { id: 9403, name: 'Binder A', description: null as string | null, parentId: 9402, ...TIMESTAMPS };
const GARAGE = { id: 9404, name: 'Garage', description: null as string | null, parentId: null as number | null, ...TIMESTAMPS };

// Stateful: a PATCH changes what the next GET returns, like the real API.
const mockLocations = async (page: Page) => {
  const locations = new Map([HOME, SHELF, BINDER, GARAGE].map((l) => [l.id, { ...l }]));
  const hierarchy = () => {
    const node = (id: number): any => ({
      ...locations.get(id),
      children: [...locations.values()].filter((l) => l.parentId === id).map((l) => node(l.id)),
    });
    return [...locations.values()].filter((l) => l.parentId === null).map((l) => node(l.id));
  };

  await page.route(
    (url) => url.origin === API && url.pathname.startsWith('/locations'),
    async (route) => {
      const { pathname } = new URL(route.request().url());
      const method = route.request().method();
      if (pathname === '/locations/hierarchy') return fulfillJson(route, { success: true, data: hierarchy() });
      if (pathname === '/locations') {
        return fulfillJson(route, { success: true, data: { locations: [], totalCount: 0, limit: 9, offset: 0 } });
      }
      const id = Number(pathname.split('/').pop());
      const location = locations.get(id);
      if (method === 'PATCH' && location) {
        const body = route.request().postDataJSON() ?? {};
        if ('description' in body) location.description = body.description ? body.description : null;
        if ('name' in body) location.name = body.name;
        if ('parentId' in body) location.parentId = body.parentId;
      }
      return fulfillJson(route, { success: true, data: location });
    },
  );
};
