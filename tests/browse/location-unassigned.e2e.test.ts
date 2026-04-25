/**
 * E2E: LocationSelector "Unassigned" filter
 *
 * Verifies the frontend wiring for the unassigned-location sentinel:
 *   - The dropdown surfaces an "Unassigned" option (and only when the user has any location).
 *   - Selecting it sets the URL `locationId=-1` and the search description text.
 *   - The "Include child locations" checkbox stays hidden for the sentinel (no children apply).
 *   - The cards-search request goes out with `locationId: -1`.
 *
 * The LocationSelector is hidden when the user has zero locations, so a temp location is
 * created in beforeAll via the real API and deleted in afterAll. That keeps the test
 * independent of whatever locations user 1337 already has.
 */
import { expect, test } from '@playwright/test';
import {
  LOCAL_TEST_USER_ID,
  authenticateAsLocalTestUser,
  getLocalTestJwt,
} from '../utils/auth';

const API_BASE = 'http://local.mtgcb.com:5000';

test.describe.configure({ mode: 'serial' });

test.describe('LocationSelector "Unassigned" filter', () => {
  let testLocationId: number | null = null;
  const TEMP_LOCATION_NAME = `E2E Unassigned Test ${Date.now()}`;

  test.beforeAll(async ({ request }) => {
    test.skip(!getLocalTestJwt(), 'Set E2E_TEST_JWT_1337 to run (see tests/utils/auth.ts)');

    const jwt = getLocalTestJwt();
    const res = await request.post(`${API_BASE}/locations`, {
      data: { name: TEMP_LOCATION_NAME, description: 'temp - delete me' },
      headers: { 'content-type': 'application/json', cookie: `MTGCB_AuthToken=${jwt}` },
    });
    if (!res.ok()) {
      throw new Error(`Failed to create test location: ${res.status()} ${await res.text()}`);
    }
    testLocationId = (await res.json()).data.id;
  });

  test.afterAll(async ({ request }) => {
    if (testLocationId == null) return;
    const jwt = getLocalTestJwt();
    if (!jwt) return;
    await request.delete(`${API_BASE}/locations/${testLocationId}`, {
      headers: { cookie: `MTGCB_AuthToken=${jwt}` },
    });
  });

  test.beforeEach(async ({ context, page }) => {
    test.skip(!getLocalTestJwt(), 'Set E2E_TEST_JWT_1337 to run (see tests/utils/auth.ts)');
    await authenticateAsLocalTestUser(context);

    await page.goto(`/collections/${LOCAL_TEST_USER_ID}?contentType=cards`);
    await page.waitForLoadState('networkidle');

    // Mobile collapses the search form; expand if the toggle is present.
    const searchFormToggle = page.getByTestId('search-form-toggle');
    if (await searchFormToggle.isVisible({ timeout: 1000 }).catch(() => false)) {
      await searchFormToggle.click();
      await page.waitForTimeout(300);
    }

    await page.getByTestId('location-selector').waitFor({ state: 'visible', timeout: 10000 });
  });

  test('dropdown exposes the Unassigned option', async ({ page }) => {
    // MUI's Select renders an aria-hidden native input plus a visible combobox div. The
    // testid hangs off the input, so click the combobox role within the wrapper.
    await page.getByTestId('location-selector').getByRole('combobox').click();
    const unassignedOption = page.getByTestId('location-option-unassigned');
    await expect(unassignedOption).toBeVisible();
    await expect(unassignedOption).toContainText('Unassigned');
    await expect(unassignedOption).toContainText("Cards you own that aren't in any location");
  });

  test('selecting Unassigned sets locationId=-1 in the URL', async ({ page }) => {
    // MUI's Select renders an aria-hidden native input plus a visible combobox div. The
    // testid hangs off the input, so click the combobox role within the wrapper.
    await page.getByTestId('location-selector').getByRole('combobox').click();
    await page.getByTestId('location-option-unassigned').click();

    // URL update is debounced — wait for the locationId param to land.
    await page.waitForFunction(
      () => new URL(window.location.href).searchParams.get('locationId') === '-1',
      { timeout: 5000 },
    );

    const params = new URL(page.url()).searchParams;
    expect(params.get('locationId')).toBe('-1');
  });

  test('search description updates to "not assigned to any location"', async ({ page }) => {
    // MUI's Select renders an aria-hidden native input plus a visible combobox div. The
    // testid hangs off the input, so click the combobox role within the wrapper.
    await page.getByTestId('location-selector').getByRole('combobox').click();
    await page.getByTestId('location-option-unassigned').click();

    await expect(page.getByText(/not assigned to any location/)).toBeVisible({ timeout: 5000 });
  });

  test('does not show the "Include child locations" checkbox when Unassigned is selected', async ({ page }) => {
    // MUI's Select renders an aria-hidden native input plus a visible combobox div. The
    // testid hangs off the input, so click the combobox role within the wrapper.
    await page.getByTestId('location-selector').getByRole('combobox').click();
    await page.getByTestId('location-option-unassigned').click();

    await page.waitForFunction(
      () => new URL(window.location.href).searchParams.get('locationId') === '-1',
      { timeout: 5000 },
    );

    // The checkbox label exists for real locations but not for the sentinel.
    await expect(page.getByText('Include child locations')).toHaveCount(0);
  });

  test('shows the "Include child locations" checkbox for a real location (sanity)', async ({ page }) => {
    if (testLocationId == null) {
      test.skip(true, 'no temp location available');
      return;
    }

    // MUI's Select renders an aria-hidden native input plus a visible combobox div. The
    // testid hangs off the input, so click the combobox role within the wrapper.
    await page.getByTestId('location-selector').getByRole('combobox').click();
    // Match the real location by its accessible name (text inside the MenuItem).
    await page.getByRole('option', { name: new RegExp(TEMP_LOCATION_NAME) }).click();

    await page.waitForFunction(
      (id) => new URL(window.location.href).searchParams.get('locationId') === String(id),
      testLocationId,
      { timeout: 5000 },
    );

    await expect(page.getByText('Include child locations')).toBeVisible();
  });

  test('cards-search request fires with locationId=-1 when Unassigned is selected', async ({ page }) => {
    // Match on body content, not just URL/method. The initial page-load /cards/search request
    // (no locationId) can race the predicate when this test runs as part of the full suite,
    // surfacing as "Received: undefined". Filtering on body.locationId === -1 pins us to the
    // post-click request.
    const searchRequest = page.waitForRequest(
      (req) => {
        if (!req.url().includes('/cards/search') || req.method() !== 'POST') return false;
        try {
          const body = JSON.parse(req.postData() || '{}');
          return body.locationId === -1;
        } catch {
          return false;
        }
      },
      { timeout: 10000 },
    );

    await page.getByTestId('location-selector').getByRole('combobox').click();
    await page.getByTestId('location-option-unassigned').click();

    const req = await searchRequest;
    const body = JSON.parse(req.postData() || '{}');
    expect(body.locationId).toBe(-1);
    // includeChildLocations is meaningless for the sentinel — should be omitted.
    expect(body.includeChildLocations).toBeUndefined();
  });
});
