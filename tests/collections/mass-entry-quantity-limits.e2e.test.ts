import { expect, test } from '@playwright/test';
import { LOCAL_TEST_USER_ID, authenticateAsLocalTestUser, getLocalTestJwt } from '../utils/auth';

const COLLECTION_QUANTITY_MAX = 9999;

test.describe('Mass Entry panel (main collection page) - quantity limits', () => {
  test.beforeEach(async ({ context, page }) => {
    test.skip(!getLocalTestJwt(), 'Set E2E_TEST_JWT_1337 to run (see tests/utils/auth.ts)');

    await authenticateAsLocalTestUser(context);
    await page.goto(`/collections/${LOCAL_TEST_USER_ID}?contentType=cards`);
    await page.waitForLoadState('networkidle');

    // Main collection page renders MassEntryPanel (not MassUpdatePanel) as the
    // "Mass Update" menu item. Open it.
    await page.getByTestId('collection-more-actions').click();
    await page.getByRole('menuitem', { name: 'Mass Update' }).click();
    await page.getByTestId('mass-entry-quantity-regular').waitFor();
  });

  test('regular input exposes min=0 max=9999', async ({ page }) => {
    const input = page.getByTestId('mass-entry-quantity-regular');
    await expect(input).toHaveAttribute('min', '0');
    await expect(input).toHaveAttribute('max', String(COLLECTION_QUANTITY_MAX));
  });

  test('foil input exposes min=0 max=9999', async ({ page }) => {
    const input = page.getByTestId('mass-entry-quantity-foil');
    await expect(input).toHaveAttribute('min', '0');
    await expect(input).toHaveAttribute('max', String(COLLECTION_QUANTITY_MAX));
  });

  test('regular clamps typed overflow (10000) to 9999', async ({ page }) => {
    const input = page.getByTestId('mass-entry-quantity-regular');
    await input.fill(String(COLLECTION_QUANTITY_MAX + 1));
    await expect(input).toHaveValue(String(COLLECTION_QUANTITY_MAX));
  });

  test('regular clamps a very large value (1_000_000) to 9999', async ({ page }) => {
    const input = page.getByTestId('mass-entry-quantity-regular');
    await input.fill('1000000');
    await expect(input).toHaveValue(String(COLLECTION_QUANTITY_MAX));
  });

  test('foil clamps typed overflow (10000) to 9999', async ({ page }) => {
    const input = page.getByTestId('mass-entry-quantity-foil');
    await input.fill(String(COLLECTION_QUANTITY_MAX + 1));
    await expect(input).toHaveValue(String(COLLECTION_QUANTITY_MAX));
  });

  test.describe('happy path - normal values', () => {
    test('regular accepts a normal value (3) with no clamping', async ({ page }) => {
      const input = page.getByTestId('mass-entry-quantity-regular');
      await input.fill('3');
      await expect(input).toHaveValue('3');
    });

    test('foil accepts a normal value (2) with no clamping', async ({ page }) => {
      const input = page.getByTestId('mass-entry-quantity-foil');
      await input.fill('2');
      await expect(input).toHaveValue('2');
    });

    test('Apply button is enabled once quantities are set', async ({ page }) => {
      await page.getByTestId('mass-entry-quantity-regular').fill('3');
      await expect(page.getByRole('button', { name: 'Apply' })).toBeEnabled();
    });
  });
});
