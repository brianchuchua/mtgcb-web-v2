import { expect, test } from '@playwright/test';
import { LOCAL_TEST_USER_ID, authenticateAsLocalTestUser, getLocalTestJwt } from '../utils/auth';

const COLLECTION_QUANTITY_MAX = 9999;

test.describe('Card table inline quantity input (CardTableRenderer) - limits', () => {
  test.beforeEach(async ({ context, page }) => {
    test.skip(!getLocalTestJwt(), 'Set E2E_TEST_JWT_1337 to run (see tests/utils/auth.ts)');

    await authenticateAsLocalTestUser(context);
    await page.goto(`/collections/${LOCAL_TEST_USER_ID}?contentType=cards`);
    await page.waitForLoadState('networkidle');

    // Switch to table view (buttons exposed via existing data-testids).
    const tableToggle = page.getByTestId('view-mode-toggle-table').first();
    await tableToggle.click();

    // Any quantity cell in the table will do — pick the first one.
    await page.getByTestId('card-table-quantity').first().waitFor({ timeout: 10000 });
  });

  test('a card-table quantity input exposes min=0 max=9999', async ({ page }) => {
    const input = page.getByTestId('card-table-quantity').first();
    await expect(input).toHaveAttribute('min', '0');
    await expect(input).toHaveAttribute('max', String(COLLECTION_QUANTITY_MAX));
  });

  test('a card-table quantity input flags rangeOverflow above 9999', async ({ page }) => {
    // No blur → no debounced save → no mutation.
    const input = page.getByTestId('card-table-quantity').first();
    await input.fill(String(COLLECTION_QUANTITY_MAX + 1));

    const rangeOverflow = await input.evaluate((el) => (el as HTMLInputElement).validity.rangeOverflow);
    expect(rangeOverflow).toBe(true);
  });

  test('a card-table quantity input clamps very large values on blur', async ({ page }) => {
    // The first visible card in the table depends on sort order and isn't
    // deterministic, so fulfill the save endpoint to avoid mutating whichever
    // card it ends up being. The payload contract is already verified
    // end-to-end by the card-detail happy-path tests.
    await page.route('**/collection/update', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { cards: [] } }),
      }),
    );

    const input = page.getByTestId('card-table-quantity').first();
    await input.fill('1000000');
    await input.blur();

    await expect(input).toHaveValue(String(COLLECTION_QUANTITY_MAX));
  });

  test.describe('happy path - normal values', () => {
    test('typing a normal value (3) passes through without clamping and triggers a save', async ({ page }) => {
      // Fulfill save to keep this test non-destructive (first-row card is
      // non-deterministic). The save payload contract is verified end-to-end
      // by the card-detail happy-path tests.
      type Captured = { mode?: string; cards?: Array<Record<string, number>> };
      const captured: Captured = {};
      await page.route('**/collection/update', async (route) => {
        Object.assign(captured, route.request().postDataJSON() as Captured);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: { cards: [] } }),
        });
      });

      const requestPromise = page.waitForRequest(
        (r) => r.url().endsWith('/collection/update') && r.method() === 'POST',
      );
      const input = page.getByTestId('card-table-quantity').first();
      await input.fill('3');
      await input.blur();

      // Wait for the debounced (400ms) save to fire.
      await requestPromise;

      await expect(input).toHaveValue('3');

      // The save fires with the value typed — either as quantityReg or
      // quantityFoil depending on which cell .first() landed on.
      expect(captured.mode).toBe('set');
      expect(captured.cards?.length).toBe(1);
      const card = captured.cards?.[0] ?? {};
      const sentValue = card.quantityReg ?? card.quantityFoil;
      expect(sentValue).toBe(3);
    });
  });
});
