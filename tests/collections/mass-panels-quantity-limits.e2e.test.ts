import { expect, test } from '@playwright/test';
import { LOCAL_TEST_USER_ID, authenticateAsLocalTestUser, getLocalTestJwt } from '../utils/auth';

const COLLECTION_QUANTITY_MAX = 9999;
const COLLECTION_QUANTITY_DELTA_MIN = -9999;

// User 1337 (Manath) owns at least one Alpha card + has a Location
// ("A Literal Shoebox"), so the mass panels and location panel all have the
// data they need to render on this collection page.
const TEST_SET_SLUG = 'limited-edition-alpha';

// Mass panels open from a menu on a set-specific collection page. Under full
// parallel load the `More actions` button can take >30s to render, so run
// these tests serially within the file to avoid flakes.
test.describe.configure({ mode: 'serial' });

test.describe('Mass panels on a collection set page - quantity limits', () => {
  test.beforeEach(async ({ context, page }) => {
    test.skip(!getLocalTestJwt(), 'Set E2E_TEST_JWT_1337 to run (see tests/utils/auth.ts)');

    await authenticateAsLocalTestUser(context);
    await page.goto(`/collections/${LOCAL_TEST_USER_ID}/${TEST_SET_SLUG}?contentType=cards`);
    await page.waitForLoadState('networkidle');
  });

  test.describe('Mass Update panel', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByTestId('collection-set-more-actions').click();
      await page.getByRole('menuitem', { name: 'Mass Update' }).click();
      await page.getByTestId('mass-update-quantity-regular').waitFor();
    });

    test('regular input exposes min=0 max=9999', async ({ page }) => {
      const input = page.getByTestId('mass-update-quantity-regular');
      await expect(input).toHaveAttribute('min', '0');
      await expect(input).toHaveAttribute('max', String(COLLECTION_QUANTITY_MAX));
    });

    test('foil input exposes min=0 max=9999', async ({ page }) => {
      const input = page.getByTestId('mass-update-quantity-foil');
      await expect(input).toHaveAttribute('min', '0');
      await expect(input).toHaveAttribute('max', String(COLLECTION_QUANTITY_MAX));
    });

    test('regular clamps typed overflow (10000) to 9999 via handleQuantityChange', async ({ page }) => {
      const input = page.getByTestId('mass-update-quantity-regular');
      await input.fill(String(COLLECTION_QUANTITY_MAX + 1));
      await expect(input).toHaveValue(String(COLLECTION_QUANTITY_MAX));
    });

    test('regular clamps a very large value (1_000_000) to 9999', async ({ page }) => {
      const input = page.getByTestId('mass-update-quantity-regular');
      await input.fill('1000000');
      await expect(input).toHaveValue(String(COLLECTION_QUANTITY_MAX));
    });

    test.describe('happy path - normal values', () => {
      test('regular accepts a normal value (3) with no clamping', async ({ page }) => {
        const input = page.getByTestId('mass-update-quantity-regular');
        await input.fill('3');
        await expect(input).toHaveValue('3');
      });

      test('foil accepts a normal value (2) with no clamping', async ({ page }) => {
        const input = page.getByTestId('mass-update-quantity-foil');
        await input.fill('2');
        await expect(input).toHaveValue('2');
      });

      test('Apply button is present (the form is ready to submit)', async ({ page }) => {
        await page.getByTestId('mass-update-quantity-regular').fill('3');
        await expect(page.getByRole('button', { name: 'Apply' })).toBeEnabled();
      });
    });
  });

  test.describe('Mass Update Location panel', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByTestId('collection-set-more-actions').click();
      await page.getByRole('menuitem', { name: 'Locations' }).click();
      await page.getByTestId('mass-update-location-quantity-regular').waitFor();
    });

    test('set mode: regular input exposes min=0 max=9999', async ({ page }) => {
      const input = page.getByTestId('mass-update-location-quantity-regular');
      await expect(input).toHaveAttribute('min', '0');
      await expect(input).toHaveAttribute('max', String(COLLECTION_QUANTITY_MAX));
    });

    test('set mode: regular clamps typed overflow (10000) to 9999', async ({ page }) => {
      const input = page.getByTestId('mass-update-location-quantity-regular');
      await input.fill(String(COLLECTION_QUANTITY_MAX + 1));
      await expect(input).toHaveValue(String(COLLECTION_QUANTITY_MAX));
    });

    test('change mode: regular input switches to delta bounds (-9999..9999)', async ({ page }) => {
      // Switch to "Assign and edit quantity" (increment/decrement mode).
      await page.getByLabel('Assign and edit quantity').click();

      const input = page.getByTestId('mass-update-location-quantity-regular');
      await expect(input).toHaveAttribute('min', String(COLLECTION_QUANTITY_DELTA_MIN));
      await expect(input).toHaveAttribute('max', String(COLLECTION_QUANTITY_MAX));
    });

    test('change mode: regular clamps typed underflow (-10000) to -9999', async ({ page }) => {
      await page.getByLabel('Assign and edit quantity').click();

      const input = page.getByTestId('mass-update-location-quantity-regular');
      await input.fill(String(COLLECTION_QUANTITY_DELTA_MIN - 1));
      await expect(input).toHaveValue(String(COLLECTION_QUANTITY_DELTA_MIN));
    });

    test('change mode: regular clamps -1000000 to -9999', async ({ page }) => {
      await page.getByLabel('Assign and edit quantity').click();

      const input = page.getByTestId('mass-update-location-quantity-regular');
      await input.fill('-1000000');

      // clampCollectionQuantityDelta floors at -9999 in increment/change mode.
      await expect(input).toHaveValue(String(COLLECTION_QUANTITY_DELTA_MIN));
    });

    test.describe('happy path - normal values', () => {
      test('set mode: regular accepts a normal value (3) with no clamping', async ({ page }) => {
        const input = page.getByTestId('mass-update-location-quantity-regular');
        await input.fill('3');
        await expect(input).toHaveValue('3');
      });

      test('change mode: regular accepts a positive delta (2)', async ({ page }) => {
        await page.getByLabel('Assign and edit quantity').click();

        const input = page.getByTestId('mass-update-location-quantity-regular');
        await input.fill('2');
        await expect(input).toHaveValue('2');
      });

      test('change mode: regular accepts a negative delta (-2)', async ({ page }) => {
        await page.getByLabel('Assign and edit quantity').click();

        const input = page.getByTestId('mass-update-location-quantity-regular');
        await input.fill('-2');
        await expect(input).toHaveValue('-2');
      });
    });
  });
});
