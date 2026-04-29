import { expect, test } from '@playwright/test';
import { LOCAL_TEST_USER_ID, authenticateAsLocalTestUser, getLocalTestJwt } from '../utils/auth';

// Mirrors the API's Collection quantity bounds (@/utils/validationLimits).
const COLLECTION_QUANTITY_MAX = 9999;

// Card with known-stable data on the local DB: Giant Spider (id=99, Alpha).
// User 1337 (Manath) owns 1 of these — it's a cheap, always-resolvable pick
// for the autocomplete, chosen to keep the test stable across local refreshes.
const TEST_CARD_NAME_PREFIX = 'Giant Spi';

test.describe('Edit Cards page - collection quantity limits', () => {
  test.beforeEach(async ({ context, page }) => {
    test.skip(!getLocalTestJwt(), 'Set E2E_TEST_JWT_1337 to run (see tests/utils/auth.ts)');

    await authenticateAsLocalTestUser(context);
    await page.goto('/collections/edit-cards');
    await page.waitForLoadState('networkidle');

    const searchBox = page.getByLabel('Search cards to add or remove!');
    await searchBox.click();
    await searchBox.fill(TEST_CARD_NAME_PREFIX);

    // Wait for debounce (300ms) + API + dropdown render.
    await page.getByRole('option').first().waitFor({ timeout: 10000 });
    await page.getByRole('option').first().click();

    // Give the form a moment to mount the quantity inputs.
    await page.getByTestId('edit-cards-quantity-regular').waitFor();
  });

  test('regular quantity input exposes min=0 max=9999', async ({ page }) => {
    const input = page.getByTestId('edit-cards-quantity-regular');
    await expect(input).toHaveAttribute('min', '0');
    await expect(input).toHaveAttribute('max', String(COLLECTION_QUANTITY_MAX));
  });

  test('foil quantity input exposes min=0 max=9999', async ({ page }) => {
    const input = page.getByTestId('edit-cards-quantity-foil');
    await expect(input).toHaveAttribute('min', '0');
    await expect(input).toHaveAttribute('max', String(COLLECTION_QUANTITY_MAX));
  });

  test('regular quantity clamps typed value above 9999 back to 9999', async ({ page }) => {
    const input = page.getByTestId('edit-cards-quantity-regular');
    await input.fill(String(COLLECTION_QUANTITY_MAX + 1));

    // onChange clamps via clampCollectionQuantity — displayed value stays at the cap.
    await expect(input).toHaveValue(String(COLLECTION_QUANTITY_MAX));
  });

  test('foil quantity clamps typed value above 9999 back to 9999', async ({ page }) => {
    const input = page.getByTestId('edit-cards-quantity-foil');
    await input.fill(String(COLLECTION_QUANTITY_MAX + 1));

    await expect(input).toHaveValue(String(COLLECTION_QUANTITY_MAX));
  });

  test('regular quantity clamps a very large value (1_000_000) back to 9999', async ({ page }) => {
    const input = page.getByTestId('edit-cards-quantity-regular');
    await input.fill('1000000');

    await expect(input).toHaveValue(String(COLLECTION_QUANTITY_MAX));
  });

  test('regular quantity accepts the cap (9999) without clamping', async ({ page }) => {
    const input = page.getByTestId('edit-cards-quantity-regular');
    await input.fill(String(COLLECTION_QUANTITY_MAX));

    await expect(input).toHaveValue(String(COLLECTION_QUANTITY_MAX));
  });

  test.describe('happy path - normal values', () => {
    test('regular accepts a normal value (3) with no error state', async ({ page }) => {
      const input = page.getByTestId('edit-cards-quantity-regular');
      await input.fill('3');

      await expect(input).toHaveValue('3');
      const rangeOverflow = await input.evaluate((el) => (el as HTMLInputElement).validity.rangeOverflow);
      expect(rangeOverflow).toBe(false);
    });

    test('foil accepts a normal value (2)', async ({ page }) => {
      const input = page.getByTestId('edit-cards-quantity-foil');
      await input.fill('2');

      await expect(input).toHaveValue('2');
    });

    test('Save button is enabled once a card is selected', async ({ page }) => {
      // After the card is picked in beforeEach, the Save button should be clickable.
      await expect(page.getByRole('button', { name: 'Save' })).toBeEnabled();
    });
  });

  test.describe('card link navigation', () => {
    test('clicking the card image goes to the collection card page, not /browse', async ({ page }) => {
      // The card image is the first <img> with cursor: pointer rendered after selection.
      // Clicking it should navigate into the user's collection-context card page.
      const cardImage = page.locator('img[alt="Giant Spider"]').first();
      await expect(cardImage).toBeVisible();
      await cardImage.click();

      await page.waitForURL(/\/collections\/\d+\/cards\//, { timeout: 5000 });
      expect(page.url()).toContain(`/collections/${LOCAL_TEST_USER_ID}/cards/giant-spider/`);
      expect(page.url()).not.toContain('/browse/cards/');
    });
  });
});
