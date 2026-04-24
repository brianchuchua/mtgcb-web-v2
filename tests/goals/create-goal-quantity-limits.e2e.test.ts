import { expect, test } from '@playwright/test';
import { authenticateAsLocalTestUser, getLocalTestJwt } from '../utils/auth';

// Mirrors @/utils/validationLimits.GOAL_TARGET_QUANTITY_MAX and the API's
// Goal.targetQuantity* schema (mtgcb-api-v3 src/features/goals/goalSchemas.ts).
const GOAL_TARGET_QUANTITY_MAX = 9999;

test.describe('Create Goal - target quantity limits', () => {
  test.beforeEach(async ({ context, page }) => {
    test.skip(!getLocalTestJwt(), 'Set E2E_TEST_JWT_1337 to run (see tests/utils/auth.ts)');

    await authenticateAsLocalTestUser(context);
    await page.goto('/goals/create');
    await page.waitForLoadState('networkidle');
  });

  test('targetQuantityAll input exposes min=0 max=9999', async ({ page }) => {
    const input = page.getByTestId('target-quantity-all');
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute('min', '0');
    await expect(input).toHaveAttribute('max', String(GOAL_TARGET_QUANTITY_MAX));
  });

  test('targetQuantityReg/Foil inputs expose min=0 max=9999 in separate mode', async ({ page }) => {
    await page.getByText('Separate Regular/Foil').click();

    const reg = page.getByTestId('target-quantity-reg');
    const foil = page.getByTestId('target-quantity-foil');

    await expect(reg).toBeVisible();
    await expect(foil).toBeVisible();
    await expect(reg).toHaveAttribute('min', '0');
    await expect(reg).toHaveAttribute('max', String(GOAL_TARGET_QUANTITY_MAX));
    await expect(foil).toHaveAttribute('min', '0');
    await expect(foil).toHaveAttribute('max', String(GOAL_TARGET_QUANTITY_MAX));
  });

  test('targetQuantityAll flags rangeOverflow via HTMLInputElement.validity when value > 9999', async ({ page }) => {
    const input = page.getByTestId('target-quantity-all');
    await input.fill(String(GOAL_TARGET_QUANTITY_MAX + 1));

    const rangeOverflow = await input.evaluate((el) => (el as HTMLInputElement).validity.rangeOverflow);
    expect(rangeOverflow).toBe(true);
  });

  test('targetQuantityAll flags rangeOverflow for values way above the cap (1_000_000)', async ({ page }) => {
    const input = page.getByTestId('target-quantity-all');
    await input.fill('1000000');

    const rangeOverflow = await input.evaluate((el) => (el as HTMLInputElement).validity.rangeOverflow);
    expect(rangeOverflow).toBe(true);
  });

  test('targetQuantityReg flags rangeOverflow in separate mode when value > 9999', async ({ page }) => {
    await page.getByText('Separate Regular/Foil').click();

    const input = page.getByTestId('target-quantity-reg');
    await input.fill(String(GOAL_TARGET_QUANTITY_MAX + 1));

    const rangeOverflow = await input.evaluate((el) => (el as HTMLInputElement).validity.rangeOverflow);
    expect(rangeOverflow).toBe(true);
  });

  test('targetQuantityAll accepts value exactly at the cap (9999) without rangeOverflow', async ({ page }) => {
    const input = page.getByTestId('target-quantity-all');
    await input.fill(String(GOAL_TARGET_QUANTITY_MAX));

    const rangeOverflow = await input.evaluate((el) => (el as HTMLInputElement).validity.rangeOverflow);
    expect(rangeOverflow).toBe(false);
  });

  test.describe('happy path - normal values', () => {
    test('targetQuantityAll accepts a normal value (4) with no error state', async ({ page }) => {
      const input = page.getByTestId('target-quantity-all');
      await input.fill('4');

      await expect(input).toHaveValue('4');
      const rangeOverflow = await input.evaluate((el) => (el as HTMLInputElement).validity.rangeOverflow);
      const rangeUnderflow = await input.evaluate((el) => (el as HTMLInputElement).validity.rangeUnderflow);
      expect(rangeOverflow).toBe(false);
      expect(rangeUnderflow).toBe(false);
    });

    test('separate mode: Regular and Foil accept normal values independently', async ({ page }) => {
      await page.getByText('Separate Regular/Foil').click();

      await page.getByTestId('target-quantity-reg').fill('4');
      await page.getByTestId('target-quantity-foil').fill('2');

      await expect(page.getByTestId('target-quantity-reg')).toHaveValue('4');
      await expect(page.getByTestId('target-quantity-foil')).toHaveValue('2');
    });

    test('Goal Summary text reflects the typed quantity', async ({ page }) => {
      // GoalPreview builds "Nx of ..." text from targetQuantityAll.
      await page.getByTestId('target-quantity-all').fill('4');

      // Preview text contains "4x" within the same "Goal Summary" section.
      await expect(page.getByText(/\b4x\b/)).toBeVisible();
    });
  });
});
