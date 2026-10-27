import { expect, test, type Page, type Route } from '@playwright/test';
import { authenticateAsLocalTestUser, getLocalTestJwt } from '../utils/auth';

// Parent-location picker on the create and edit forms, against a mocked nested hierarchy:
//   Home > Shelf > Binder A, and Garage on its own.
// Every POST / PATCH is mocked; nothing touches user 1337's real locations.

const API_ORIGIN = 'http://local.mtgcb.com:5000';
const NBSP = ' ';

const TIMESTAMPS = { createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' };

const HOME = { id: 9401, name: 'Home', description: null, parentId: null, ...TIMESTAMPS };
const SHELF = { id: 9402, name: 'Shelf', description: 'Top shelf', parentId: HOME.id, ...TIMESTAMPS };
const BINDER = { id: 9403, name: 'Binder A', description: null, parentId: SHELF.id, ...TIMESTAMPS };
const GARAGE = { id: 9404, name: 'Garage', description: 'Old description', parentId: null, ...TIMESTAMPS };
const ALL_LOCATIONS = [HOME, SHELF, BINDER, GARAGE];

const HIERARCHY = [
  { ...HOME, children: [{ ...SHELF, children: [{ ...BINDER, children: [] }] }] },
  { ...GARAGE, children: [] },
];

const fulfillJson = (route: Route, body: unknown, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

const mockLocationApi = async (page: Page, hierarchy: unknown[] = HIERARCHY) => {
  const createBodies: Record<string, unknown>[] = [];
  const patchBodies: Record<string, unknown>[] = [];

  await page.route(
    (url) => url.origin === API_ORIGIN && url.pathname.startsWith('/locations'),
    async (route) => {
      const { pathname } = new URL(route.request().url());
      const method = route.request().method();

      if (pathname === '/locations/hierarchy') return fulfillJson(route, { success: true, data: hierarchy });

      if (pathname === '/locations') {
        if (method === 'POST') {
          const body = route.request().postDataJSON();
          createBodies.push(body);
          return fulfillJson(route, { success: true, data: { id: 9499, ...body, ...TIMESTAMPS } });
        }
        return fulfillJson(route, { success: true, data: { locations: [], totalCount: 0, limit: 9, offset: 0 } });
      }

      const id = Number(pathname.split('/').pop());
      const location = ALL_LOCATIONS.find((l) => l.id === id);
      if (method === 'PATCH') {
        const body = route.request().postDataJSON();
        patchBodies.push(body);
        return fulfillJson(route, { success: true, data: { ...location, ...body } });
      }
      return fulfillJson(route, { success: true, data: location });
    },
  );

  return { createBodies, patchBodies };
};

const parentSelect = (page: Page) => page.getByRole('combobox', { name: 'Parent Location (Optional)' });

const openParentOptions = async (page: Page) => {
  await parentSelect(page).click();
  const listbox = page.getByRole('listbox');
  await expect(listbox).toBeVisible();
  return listbox;
};

const optionTexts = async (page: Page) => {
  const listbox = await openParentOptions(page);
  return listbox.getByRole('option').allTextContents();
};

const openEditPage = async (page: Page, location: { id: number; name: string }) => {
  await page.goto(`/locations/edit/${location.id}`);
  await expect(page.getByLabel('Location Name')).toHaveValue(location.name, { timeout: 15000 });
  await expect(parentSelect(page)).toBeVisible();
};

const saveAndCapturePatch = async (page: Page, patchBodies: Record<string, unknown>[]) => {
  await page.getByRole('button', { name: 'Save Changes' }).click();
  await expect(page.getByText('Location updated', { exact: true })).toBeVisible();
  await page.waitForURL((url) => url.pathname === '/locations');
  expect(patchBodies).toHaveLength(1);
  return patchBodies[0];
};

test.describe('Location hierarchy', () => {
  test.beforeEach(async ({ context }) => {
    test.skip(!getLocalTestJwt(), 'Set E2E_TEST_JWT_1337 to run (see tests/utils/auth.ts)');
    await authenticateAsLocalTestUser(context);
  });

  test.describe('create form', () => {
    test('hides the parent picker when there are no locations yet', async ({ page }) => {
      await mockLocationApi(page, []);
      await page.goto('/locations/create');

      await expect(page.getByLabel('Location Name')).toBeVisible({ timeout: 15000 });
      await expect(page.getByText('Parent Location (Optional)')).toHaveCount(0);
    });

    test('lists every location, indented by depth, after a None option', async ({ page }) => {
      await mockLocationApi(page);
      await page.goto('/locations/create');
      await expect(parentSelect(page)).toBeVisible({ timeout: 15000 });

      expect(await optionTexts(page)).toEqual([
        'None',
        'Home',
        `${NBSP.repeat(4)}└ Shelf`,
        `${NBSP.repeat(8)}└ Binder A`,
        'Garage',
      ]);
    });

    test('sends the chosen parentId when creating', async ({ page }) => {
      const { createBodies } = await mockLocationApi(page);
      await page.goto('/locations/create');

      await page.getByLabel('Location Name').fill('  Binder B  ');
      const listbox = await openParentOptions(page);
      await listbox.getByRole('option', { name: /Shelf$/ }).click();
      await page.getByRole('button', { name: 'Create Location' }).click();

      await expect(page.getByText('Location created', { exact: true })).toBeVisible();
      expect(createBodies).toEqual([{ name: 'Binder B', parentId: SHELF.id }]);
    });

    test('omits parentId when None is chosen', async ({ page }) => {
      const { createBodies } = await mockLocationApi(page);
      await page.goto('/locations/create');

      await page.getByLabel('Location Name').fill('Loose Box');
      await page.getByLabel('Description (Optional)').fill('Under the bed');
      await page.getByRole('button', { name: 'Create Location' }).click();

      await expect(page.getByText('Location created', { exact: true })).toBeVisible();
      expect(createBodies).toEqual([{ name: 'Loose Box', description: 'Under the bed' }]);
    });
  });

  test.describe('edit form', () => {
    test('does not offer the location itself as its own parent', async ({ page }) => {
      await mockLocationApi(page);
      await openEditPage(page, SHELF);

      const options = await optionTexts(page);
      expect(options.map((o) => o.replace(/[ └ ]/g, ''))).not.toContain('Shelf');
    });

    test('does not offer descendants as parents', async ({ page }) => {
      await mockLocationApi(page);
      await openEditPage(page, HOME);

      const names = (await optionTexts(page)).map((o) => o.replace(/^[ └ ]+/, ''));
      expect(names).toEqual(['None', 'Garage']);
    });

    test('preselects the current parent', async ({ page }) => {
      await mockLocationApi(page);
      await openEditPage(page, SHELF);

      await expect(parentSelect(page)).toHaveText('Home');
    });

    test('renaming a nested location sends only the new name', async ({ page }) => {
      const { patchBodies } = await mockLocationApi(page);
      await openEditPage(page, SHELF);

      await page.getByLabel('Location Name').fill('Middle Shelf');
      const body = await saveAndCapturePatch(page, patchBodies);

      expect(body).toEqual({ name: 'Middle Shelf' });
    });

    test('renaming a top-level location sends only the new name', async ({ page }) => {
      const { patchBodies } = await mockLocationApi(page);
      await openEditPage(page, GARAGE);

      await page.getByLabel('Location Name').fill('Big Garage');
      const body = await saveAndCapturePatch(page, patchBodies);

      expect(body).toEqual({ name: 'Big Garage' });
    });

    test('moving to another parent sends only the new parentId', async ({ page }) => {
      const { patchBodies } = await mockLocationApi(page);
      await openEditPage(page, SHELF);

      const listbox = await openParentOptions(page);
      await listbox.getByRole('option', { name: 'Garage' }).click();
      const body = await saveAndCapturePatch(page, patchBodies);

      expect(body).toEqual({ parentId: GARAGE.id });
    });

    test('choosing None clears the parent with parentId: null', async ({ page }) => {
      const { patchBodies } = await mockLocationApi(page);
      await openEditPage(page, SHELF);

      const listbox = await openParentOptions(page);
      await listbox.getByRole('option', { name: 'None' }).click();
      const body = await saveAndCapturePatch(page, patchBodies);

      expect(body).toEqual({ parentId: null });
    });

    test('changing the description sends the trimmed description', async ({ page }) => {
      const { patchBodies } = await mockLocationApi(page);
      await openEditPage(page, SHELF);

      await page.getByLabel('Description (Optional)').fill('  Bottom shelf  ');
      const body = await saveAndCapturePatch(page, patchBodies);

      expect(body).toEqual({ description: 'Bottom shelf' });
    });

    test('clearing the description sends an empty description', async ({ page }) => {
      const { patchBodies } = await mockLocationApi(page);
      await openEditPage(page, SHELF);

      await page.getByLabel('Description (Optional)').fill('');
      const body = await saveAndCapturePatch(page, patchBodies);

      expect(body).toHaveProperty('description');
      expect(body.description ?? '').toBe('');
    });

    test('Save Changes stays disabled until something changes', async ({ page }) => {
      await mockLocationApi(page);
      await openEditPage(page, SHELF);

      const save = page.getByRole('button', { name: 'Save Changes' });
      await expect(save).toBeDisabled();
      await page.getByLabel('Location Name').fill('Shelf 2');
      await expect(save).toBeEnabled();
    });
  });
});
