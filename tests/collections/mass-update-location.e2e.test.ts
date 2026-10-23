import { expect, test, type Page } from '@playwright/test';
import { LOCAL_TEST_USER_ID, authenticateAsLocalTestUser, getLocalTestJwt } from '../utils/auth';
import { MOCK_LOCATIONS, apiError, mockApiRoute, mockLocationHierarchy, ok } from './fixtures/apiMocks';

// User 1337 owns Alpha cards, so the set page offers the Locations action. The location tree
// and the mass-update write are both mocked.
const TEST_SET_SLUG = 'limited-edition-alpha';

test.describe.configure({ mode: 'serial' });

interface LocationMassBody {
  mode: string;
  cardIds: number[];
  locationId?: number;
  quantityReg: number;
  quantityFoil: number;
}

const response = (overrides: Record<string, unknown> = {}) => ({
  processed: 3,
  successful: 3,
  failed: 0,
  operations: { created: 3, updated: 0, removed: 0 },
  errors: [],
  warnings: [],
  ...overrides,
});

const mockLocationMassUpdate = (page: Page, respond = () => ok(response())) =>
  mockApiRoute<LocationMassBody>(page, '/collection/locations/mass-update', { method: 'POST', respond });

const openLocationsPanel = async (page: Page): Promise<void> => {
  await page.getByTestId('collection-set-more-actions').click();
  await page.getByRole('menuitem', { name: 'Locations' }).click();
  await page.getByTestId('mass-update-location-quantity-regular').waitFor();
};

const panel = (page: Page) => page.getByTestId('mass-update-location-panel');

const chooseLocation = async (page: Page, path: string): Promise<void> => {
  await panel(page).getByRole('combobox').click();
  await page.getByRole('option', { name: path, exact: true }).click();
};

const apply = (page: Page) => panel(page).getByRole('button', { name: 'Apply' }).click();

test.describe('Mass Update Location panel on a set collection page', () => {
  test.beforeEach(async ({ context, page }) => {
    test.skip(!getLocalTestJwt(), 'Set E2E_TEST_JWT_1337 to run (see tests/utils/auth.ts)');
    test.setTimeout(60000);
    await authenticateAsLocalTestUser(context);
    await mockLocationHierarchy(page);
    await page.goto(`/collections/${LOCAL_TEST_USER_ID}/${TEST_SET_SLUG}?contentType=cards`);
    await page.waitForLoadState('networkidle');
    await openLocationsPanel(page);
  });

  test('Apply stays disabled until a location is chosen; nested locations show their path', async ({ page }) => {
    await expect(panel(page).getByRole('button', { name: 'Apply' })).toBeDisabled();

    await panel(page).getByRole('combobox').click();
    await expect(page.getByRole('option', { name: 'Mock Binder > Mock Page', exact: true })).toBeVisible();
    await page.getByRole('option', { name: MOCK_LOCATIONS.shoebox.name, exact: true }).click();

    await expect(panel(page).getByRole('button', { name: 'Apply' })).toBeEnabled();
  });

  test('set mode sends the location, quantities and owned card ids', async ({ page }) => {
    const calls = await mockLocationMassUpdate(page);
    await chooseLocation(page, 'Mock Binder > Mock Page');
    await page.getByTestId('mass-update-location-quantity-regular').fill('2');
    await apply(page);

    await expect(page.getByText('Cards added to location', { exact: true })).toBeVisible();
    expect(calls).toHaveLength(1);
    const body = calls[0].body;
    expect(body.mode).toBe('set');
    expect(body.locationId).toBe(MOCK_LOCATIONS.binderPage.id);
    expect(body.quantityReg).toBe(2);
    expect(body.quantityFoil).toBe(0);
    expect(body.cardIds.length).toBeGreaterThan(0);
    await expect(panel(page)).toBeHidden();
  });

  test('edit-quantity mode sends an increment and allows negative values', async ({ page }) => {
    const calls = await mockLocationMassUpdate(page, () =>
      ok(response({ operations: { created: 0, updated: 3, removed: 0 } })),
    );
    await page.getByLabel('Assign and edit quantity').check();
    await chooseLocation(page, MOCK_LOCATIONS.shoebox.name);
    await page.getByTestId('mass-update-location-quantity-regular').fill('-1');
    await apply(page);

    await expect(page.getByText('Location quantities updated', { exact: true })).toBeVisible();
    expect(calls[0].body).toMatchObject({
      mode: 'increment',
      locationId: MOCK_LOCATIONS.shoebox.id,
      quantityReg: -1,
      quantityFoil: 0,
    });
  });

  test('remove-from-all mode sends mode "remove" with no location and zero quantities', async ({ page }) => {
    const calls = await mockLocationMassUpdate(page, () =>
      ok(response({ operations: { created: 0, updated: 0, removed: 3 } })),
    );
    await page.getByLabel('Remove from all locations').check();
    await expect(panel(page).getByRole('combobox')).toHaveCount(0);
    await apply(page);

    await expect(page.getByText('Locations cleared', { exact: true })).toBeVisible();
    expect(calls[0].body.mode).toBe('remove');
    expect(calls[0].body).not.toHaveProperty('locationId');
    expect(calls[0].body.quantityReg).toBe(0);
    expect(calls[0].body.quantityFoil).toBe(0);
  });

  test('every card skipped shows an error toast with a friendly reason', async ({ page }) => {
    await mockLocationMassUpdate(page, () =>
      ok(
        response({
          successful: 0,
          failed: 3,
          operations: { created: 0, updated: 0, removed: 0 },
          errors: [1, 2, 3].map((cardId) => ({ cardId, reason: 'Card not found in collection' })),
        }),
      ),
    );
    await chooseLocation(page, MOCK_LOCATIONS.shoebox.name);
    await apply(page);

    await expect(page.getByText('3 cards skipped (Cards not in collection)', { exact: true })).toBeVisible();
  });

  test('partial success with skipped and capped cards shows a combined warning', async ({ page }) => {
    await mockLocationMassUpdate(page, () =>
      ok(
        response({
          successful: 2,
          failed: 1,
          errors: [{ cardId: 3, reason: 'No foil version of this card' }],
          warnings: [
            { cardId: 1, message: 'Quantity capped at available amount' },
            { cardId: 1, message: 'Foil quantity capped at available amount' },
          ],
        }),
      ),
    );
    await chooseLocation(page, MOCK_LOCATIONS.shoebox.name);
    await apply(page);

    await expect(
      page.getByText(
        'Cards added to location. 1 card skipped (No foil version exists). 1 card had quantities capped at maximum owned and unassigned to other locations',
        { exact: true },
      ),
    ).toBeVisible();
  });

  test('an API error shows its message, or a fallback without one', async ({ page }) => {
    const responses = [apiError(400, 'Location is full'), apiError(500)];
    await mockApiRoute(page, '/collection/locations/mass-update', {
      method: 'POST',
      respond: (_c, i) => responses[i],
    });
    await chooseLocation(page, MOCK_LOCATIONS.shoebox.name);

    await apply(page);
    await expect(page.getByText('Location is full', { exact: true })).toBeVisible();

    await apply(page);
    await expect(page.getByText('Failed to update card locations', { exact: true })).toBeVisible();
  });
});
