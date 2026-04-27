import { expect, test, type Page } from '@playwright/test';
import { LOCAL_TEST_USER_ID, authenticateAsLocalTestUser, getLocalTestJwt } from '../utils/auth';

const API_BASE = 'http://local.mtgcb.com:5000';

const LOCATION_ID = 9999;

const MOCK_LOCATION = {
  id: LOCATION_ID,
  userId: LOCAL_TEST_USER_ID,
  name: 'Test Binder',
  description: 'Original description',
  parentId: null,
  cardCount: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const fulfillJson = async (route: any, body: unknown, status = 200) => {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
};

const stubHierarchy = (page: Page) =>
  page.route(`${API_BASE}/locations/hierarchy*`, (route) =>
    fulfillJson(route, { success: true, data: [] }),
  );

test.describe('Locations CRUD', () => {
  test.beforeEach(async ({ context }) => {
    test.skip(!getLocalTestJwt(), 'Set E2E_TEST_JWT_1337 to run (see tests/utils/auth.ts)');
    await authenticateAsLocalTestUser(context);
  });

  test('creates a location and shows "Location created" toast', async ({ page }) => {
    await stubHierarchy(page);

    let createCalled = false;
    await page.route(`${API_BASE}/locations`, async (route) => {
      if (route.request().method() === 'POST') {
        createCalled = true;
        await fulfillJson(route, { success: true, data: { ...MOCK_LOCATION, name: 'New Binder' } });
      } else {
        await fulfillJson(route, { success: true, data: { locations: [], totalCount: 0 } });
      }
    });

    await page.goto('/locations/create');
    await page.waitForLoadState('networkidle');

    await page.getByLabel('Location Name').fill('New Binder');
    await page.getByRole('button', { name: 'Create Location' }).click();

    await expect(page.getByText('Location created')).toBeVisible();
    await page.waitForURL('/locations', { timeout: 10000 });
    expect(createCalled).toBe(true);
  });

  test('updates a location and shows "Location updated" toast', async ({ page }) => {
    await stubHierarchy(page);

    let patchCalled = false;
    await page.route(`${API_BASE}/locations/${LOCATION_ID}`, async (route) => {
      const method = route.request().method();
      if (method === 'GET') {
        await fulfillJson(route, { success: true, data: MOCK_LOCATION });
      } else if (method === 'PATCH') {
        patchCalled = true;
        await fulfillJson(route, {
          success: true,
          data: { ...MOCK_LOCATION, name: 'Renamed Binder' },
        });
      } else {
        await route.continue();
      }
    });
    await page.route(`${API_BASE}/locations*`, (route) =>
      fulfillJson(route, { success: true, data: { locations: [MOCK_LOCATION], totalCount: 1 } }),
    );

    await page.goto(`/locations/edit/${LOCATION_ID}`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByLabel('Location Name')).toHaveValue('Test Binder');

    const nameField = page.getByLabel('Location Name');
    await nameField.fill('Renamed Binder');
    await page.getByRole('button', { name: 'Save Changes' }).click();

    await expect(page.getByText('Location updated')).toBeVisible();
    await page.waitForURL('/locations', { timeout: 10000 });
    expect(patchCalled).toBe(true);
  });

  test('deletes a location via confirm dialog and shows "Location deleted" toast', async ({ page }) => {
    await stubHierarchy(page);

    let deleteCalled = false;
    await page.route(`${API_BASE}/locations/${LOCATION_ID}`, async (route) => {
      const method = route.request().method();
      if (method === 'GET') {
        await fulfillJson(route, { success: true, data: MOCK_LOCATION });
      } else if (method === 'DELETE') {
        deleteCalled = true;
        await fulfillJson(route, { success: true, data: { message: 'Deleted' } });
      } else {
        await route.continue();
      }
    });
    await page.route(`${API_BASE}/locations*`, (route) =>
      fulfillJson(route, { success: true, data: { locations: [], totalCount: 0 } }),
    );

    await page.goto(`/locations/edit/${LOCATION_ID}`);
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Delete', exact: true }).click();

    // Confirm dialog appears with its own Delete button.
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/Test Binder/)).toBeVisible();

    await dialog.getByRole('button', { name: 'Delete' }).click();

    await expect(page.getByText('Location deleted')).toBeVisible();
    expect(deleteCalled).toBe(true);
  });

  test('cancels delete from dialog without calling API', async ({ page }) => {
    await stubHierarchy(page);

    let deleteCalled = false;
    await page.route(`${API_BASE}/locations/${LOCATION_ID}`, async (route) => {
      const method = route.request().method();
      if (method === 'GET') {
        await fulfillJson(route, { success: true, data: MOCK_LOCATION });
      } else if (method === 'DELETE') {
        deleteCalled = true;
        await fulfillJson(route, { success: true, data: { message: 'Deleted' } });
      } else {
        await route.continue();
      }
    });

    await page.goto(`/locations/edit/${LOCATION_ID}`);
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Delete', exact: true }).click();

    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Cancel' }).click();

    await expect(dialog).not.toBeVisible();
    expect(deleteCalled).toBe(false);
  });

  test('toast text omits the word "successfully"', async ({ page }) => {
    await stubHierarchy(page);
    await page.route(`${API_BASE}/locations`, async (route) => {
      if (route.request().method() === 'POST') {
        await fulfillJson(route, { success: true, data: MOCK_LOCATION });
      } else {
        await fulfillJson(route, { success: true, data: { locations: [], totalCount: 0 } });
      }
    });

    await page.goto('/locations/create');
    await page.waitForLoadState('networkidle');
    await page.getByLabel('Location Name').fill('New Binder');
    await page.getByRole('button', { name: 'Create Location' }).click();

    await expect(page.getByText('Location created')).toBeVisible();
    await expect(page.getByText(/successfully/i)).toHaveCount(0);
  });
});
