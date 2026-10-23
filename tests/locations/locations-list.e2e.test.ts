import { expect, test, type Page, type Route } from '@playwright/test';
import { LOCAL_TEST_USER_ID, authenticateAsLocalTestUser, getLocalTestJwt } from '../utils/auth';

// The location list is mocked so the page shows a fixed set of locations; the one delete is mocked too.

const API_ORIGIN = 'http://local.mtgcb.com:5000';

const buildLocation = (id: number, name: string, overrides: Record<string, unknown> = {}) => ({
  id,
  name,
  description: null,
  parentId: null,
  totalCards: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

const BINDER = buildLocation(9301, 'Blue Binder', { description: 'Shelf by the desk', totalCards: 12, totalValue: 45.5 });
const DECKBOX = buildLocation(9302, 'Red Deckbox', { totalCards: 1, totalValue: 3 });
const TRADE_BOX = buildLocation(9303, 'Trade Box', { updatedAt: '2026-02-01T00:00:00.000Z' });
const LOCATIONS = [BINDER, DECKBOX, TRADE_BOX];

const fulfillJson = (route: Route, body: unknown, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

const mockLocations = async (page: Page, locations = LOCATIONS) => {
  const listRequests: URLSearchParams[] = [];
  const deletedIds: number[] = [];

  await page.route(
    (url) => url.origin === API_ORIGIN && url.pathname === '/locations',
    (route) => {
      const params = new URL(route.request().url()).searchParams;
      listRequests.push(params);
      const limit = Number(params.get('limit') ?? locations.length);
      const offset = Number(params.get('offset') ?? 0);
      return fulfillJson(route, {
        success: true,
        data: { locations: locations.slice(offset, offset + limit), totalCount: locations.length, limit, offset },
      });
    },
  );

  await page.route(
    (url) => url.origin === API_ORIGIN && /^\/locations\/\d+$/.test(url.pathname),
    (route) => {
      const id = Number(new URL(route.request().url()).pathname.split('/').pop());
      if (route.request().method() === 'DELETE') {
        deletedIds.push(id);
        return fulfillJson(route, { success: true, data: { success: true } });
      }
      const location = locations.find((l) => l.id === id);
      return fulfillJson(route, { success: true, data: location });
    },
  );

  await page.route(
    (url) => url.origin === API_ORIGIN && url.pathname === '/locations/hierarchy',
    (route) => fulfillJson(route, { success: true, data: [] }),
  );

  return { listRequests, deletedIds };
};

const locationCard = (page: Page, name: string) => page.locator('.MuiCard-root').filter({ hasText: name });

const viewHref = (locationId: number) => `/collections/${LOCAL_TEST_USER_ID}?contentType=cards&locationId=${locationId}`;

test.describe('Locations list', () => {
  test.beforeEach(async ({ context }) => {
    test.skip(!getLocalTestJwt(), 'Set E2E_TEST_JWT_1337 to run (see tests/utils/auth.ts)');
    await authenticateAsLocalTestUser(context);
  });

  test('asks the API for card counts and values', async ({ page }) => {
    const { listRequests } = await mockLocations(page);
    await page.goto('/locations');
    await expect(locationCard(page, 'Blue Binder')).toBeVisible({ timeout: 15000 });

    const params = listRequests[0];
    expect(params.get('includeCardCount')).toBe('true');
    expect(params.get('includeValue')).toBe('true');
    expect(params.get('limit')).toBe('9');
    expect(params.get('offset')).toBe('0');
  });

  test('each card links to the collection filtered by that location', async ({ page }) => {
    await mockLocations(page);
    await page.goto('/locations');

    for (const location of LOCATIONS) {
      const card = locationCard(page, location.name);
      await expect(card.getByRole('link', { name: 'View location' })).toHaveAttribute('href', viewHref(location.id));
      await expect(card.getByRole('link', { name: location.name })).toHaveAttribute('href', viewHref(location.id));
      await expect(card.getByRole('button', { name: 'Edit location' })).toBeVisible();
      await expect(card.getByRole('button', { name: 'Delete location' })).toBeVisible();
    }
  });

  test('shows description, value and singular/plural card counts', async ({ page }) => {
    await mockLocations(page);
    await page.goto('/locations');

    const binder = locationCard(page, 'Blue Binder');
    await expect(binder.getByText('Shelf by the desk')).toBeVisible({ timeout: 15000 });
    await expect(binder.getByText('12 cards')).toBeVisible();
    await expect(binder.getByText('$45.50')).toBeVisible();

    const deckbox = locationCard(page, 'Red Deckbox');
    await expect(deckbox.getByText('1 card', { exact: true })).toBeVisible();
    await expect(deckbox.getByText('$3.00')).toBeVisible();

    const tradeBox = locationCard(page, 'Trade Box');
    await expect(tradeBox.getByText('0 cards')).toBeVisible();
    await expect(tradeBox.getByText('Location Value')).toHaveCount(0);
    await expect(tradeBox.getByText('Edited', { exact: true })).toBeVisible();
    await expect(binder.getByText('Created', { exact: true })).toBeVisible();
  });

  test('Edit location opens the edit page for that location', async ({ page }) => {
    await mockLocations(page);
    await page.goto('/locations');

    await locationCard(page, 'Red Deckbox').getByRole('button', { name: 'Edit location' }).click();
    await page.waitForURL(`**/locations/edit/${DECKBOX.id}`);
    await expect(page.getByLabel('Location Name')).toHaveValue('Red Deckbox');
  });

  test('Delete location deletes the location in that card', async ({ page }) => {
    const { deletedIds } = await mockLocations(page);
    await page.goto('/locations');

    await locationCard(page, 'Trade Box').getByRole('button', { name: 'Delete location' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('"Trade Box"');
    await dialog.getByRole('button', { name: 'Delete', exact: true }).click();

    await expect(page.getByText('Location deleted', { exact: true })).toBeVisible();
    expect(deletedIds).toEqual([TRADE_BOX.id]);
  });

  test('empty list shows the first-location prompt', async ({ page }) => {
    await mockLocations(page, []);
    await page.goto('/locations');

    await expect(page.getByText('No locations yet')).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: 'Create Your First Location' })).toBeVisible();
  });

  test('pagination requests the next page with the stored page size', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('mtgcb-locations-pagination', JSON.stringify({ pageSize: 2 }));
    });
    const { listRequests } = await mockLocations(page);
    await page.goto('/locations');

    await expect(locationCard(page, 'Red Deckbox')).toBeVisible({ timeout: 15000 });
    await expect(locationCard(page, 'Trade Box')).toHaveCount(0);

    await page.getByTestId('pagination-top').getByTestId('pagination-next').click();

    await expect(locationCard(page, 'Trade Box')).toBeVisible();
    await expect(locationCard(page, 'Blue Binder')).toHaveCount(0);
    const last = listRequests.at(-1)!;
    expect(last.get('limit')).toBe('2');
    expect(last.get('offset')).toBe('2');
  });
});
