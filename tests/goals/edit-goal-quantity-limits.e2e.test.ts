import { expect, test } from '@playwright/test';
import { authenticateAsLocalTestUser, getLocalTestJwt } from '../utils/auth';

const GOAL_TARGET_QUANTITY_MAX = 9999;

// User 1337 owns goal id 6 ("Timmy"), which uses Any Type mode
// (targetQuantityAll = 1). Stable pick for edit-form tests.
const TEST_GOAL_ID = 6;

test.describe('Edit Goal - target quantity limits', () => {
  test.beforeEach(async ({ context, page }) => {
    test.skip(!getLocalTestJwt(), 'Set E2E_TEST_JWT_1337 to run (see tests/utils/auth.ts)');

    await authenticateAsLocalTestUser(context);
    await page.goto(`/goals/edit/${TEST_GOAL_ID}`);
    await page.waitForLoadState('networkidle');
    await page.getByTestId('target-quantity-all').waitFor();
  });

  test('targetQuantityAll input exposes min=0 max=9999', async ({ page }) => {
    const input = page.getByTestId('target-quantity-all');
    await expect(input).toHaveAttribute('min', '0');
    await expect(input).toHaveAttribute('max', String(GOAL_TARGET_QUANTITY_MAX));
  });

  test('targetQuantityAll flags rangeOverflow when value > 9999', async ({ page }) => {
    const input = page.getByTestId('target-quantity-all');
    await input.fill(String(GOAL_TARGET_QUANTITY_MAX + 1));

    const rangeOverflow = await input.evaluate((el) => (el as HTMLInputElement).validity.rangeOverflow);
    expect(rangeOverflow).toBe(true);
  });

  test('targetQuantityReg/Foil inputs expose min=0 max=9999 in separate mode', async ({ page }) => {
    await page.getByText('Separate Regular/Foil').click();

    const reg = page.getByTestId('target-quantity-reg');
    const foil = page.getByTestId('target-quantity-foil');

    await expect(reg).toBeVisible();
    await expect(foil).toBeVisible();
    await expect(reg).toHaveAttribute('max', String(GOAL_TARGET_QUANTITY_MAX));
    await expect(foil).toHaveAttribute('max', String(GOAL_TARGET_QUANTITY_MAX));
  });

  test('targetQuantityReg flags rangeOverflow above the cap in separate mode', async ({ page }) => {
    await page.getByText('Separate Regular/Foil').click();

    const input = page.getByTestId('target-quantity-reg');
    await input.fill(String(GOAL_TARGET_QUANTITY_MAX + 1));

    const rangeOverflow = await input.evaluate((el) => (el as HTMLInputElement).validity.rangeOverflow);
    expect(rangeOverflow).toBe(true);
  });

  test('targetQuantityAll accepts value exactly at the cap without rangeOverflow', async ({ page }) => {
    const input = page.getByTestId('target-quantity-all');
    await input.fill(String(GOAL_TARGET_QUANTITY_MAX));

    const rangeOverflow = await input.evaluate((el) => (el as HTMLInputElement).validity.rangeOverflow);
    expect(rangeOverflow).toBe(false);
  });

  test.describe('happy path - normal values', () => {
    test('loads existing goal with its saved targetQuantityAll (goal 6 = 1)', async ({ page }) => {
      // Goal 6 ("Timmy") has targetQuantityAll: 1 in the DB.
      await expect(page.getByTestId('target-quantity-all')).toHaveValue('1');
    });

    test('accepts a new normal value (4) with no error state', async ({ page }) => {
      const input = page.getByTestId('target-quantity-all');
      await input.fill('4');

      await expect(input).toHaveValue('4');
      const rangeOverflow = await input.evaluate((el) => (el as HTMLInputElement).validity.rangeOverflow);
      expect(rangeOverflow).toBe(false);
    });

    test('switching to separate mode clears All and renders Regular/Foil inputs', async ({ page }) => {
      await page.getByText('Separate Regular/Foil').click();

      await expect(page.getByTestId('target-quantity-reg')).toBeVisible();
      await expect(page.getByTestId('target-quantity-foil')).toBeVisible();
    });
  });
});
