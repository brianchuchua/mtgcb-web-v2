import { expect, test } from '@playwright/test';
import {
  LOCAL_TEST_USER_ID,
  authenticateAsLocalTestUser,
  getLocalTestJwt,
  resetCollectionEntry,
} from '../utils/auth';

const COLLECTION_QUANTITY_MAX = 9999;

// Stable foil-capable card owned by user 1337 on the local DB:
// "Accumulated Knowledge" (card id 6219, Nemesis). Used for cap-edge tests.
const CAP_CARD_SLUG = 'accumulated-knowledge';
const CAP_CARD_ID = 6219;

// Stable foil-capable card NOT owned by user 1337 on the local DB:
// "About Face" (card id 5233, Urza's Legacy). Used for happy-path tests that
// start from a known 0/0 state and exercise real saves.
const HAPPY_CARD_SLUG = 'about-face';
const HAPPY_CARD_ID = 5233;

// Tests in this file mutate the same rows in user 1337's Collection (via
// debounced saves on fill/blur). Serial execution within the file ensures
// the beforeEach reset for test N sees a clean slate after test N-1's
// afterEach has completed, avoiding interleaved-write flakiness.
test.describe.configure({ mode: 'serial' });

test.describe('Card detail inline editor (EditableCardQuantity) - cap tests', () => {
  test.beforeEach(async ({ context, page }) => {
    test.skip(!getLocalTestJwt(), 'Set E2E_TEST_JWT_1337 to run (see tests/utils/auth.ts)');

    await authenticateAsLocalTestUser(context);
    // Start each test from a known 0/0 state so tests are independent.
    await resetCollectionEntry(context.request, CAP_CARD_ID);

    await page.goto(`/collections/${LOCAL_TEST_USER_ID}/cards/${CAP_CARD_SLUG}/${CAP_CARD_ID}`);
    await page.waitForLoadState('networkidle');
    await page.getByTestId('editable-card-quantity-regular').waitFor();
  });

  test.afterEach(async ({ context }) => {
    // Reset back to 0/0 after any mutations (debounced saves fire on blur / typing).
    await resetCollectionEntry(context.request, CAP_CARD_ID);
  });

  test('regular input exposes min=0 max=9999', async ({ page }) => {
    const input = page.getByTestId('editable-card-quantity-regular');
    await expect(input).toHaveAttribute('min', '0');
    await expect(input).toHaveAttribute('max', String(COLLECTION_QUANTITY_MAX));
  });

  test('foil input exposes min=0 max=9999', async ({ page }) => {
    const input = page.getByTestId('editable-card-quantity-foil');
    await expect(input).toHaveAttribute('min', '0');
    await expect(input).toHaveAttribute('max', String(COLLECTION_QUANTITY_MAX));
  });

  test('regular rangeOverflow fires when typed value exceeds 9999', async ({ page }) => {
    const input = page.getByTestId('editable-card-quantity-regular');
    await input.fill(String(COLLECTION_QUANTITY_MAX + 1));

    const rangeOverflow = await input.evaluate((el) => (el as HTMLInputElement).validity.rangeOverflow);
    expect(rangeOverflow).toBe(true);
  });

  test('regular clamps to 9999 when handleQuantityChange triggers (via blur/debounce path)', async ({ page }) => {
    const input = page.getByTestId('editable-card-quantity-regular');
    await input.fill('1000000');
    await input.blur();

    await expect(input).toHaveValue(String(COLLECTION_QUANTITY_MAX));
  });

  test('foil rangeOverflow fires when typed value exceeds 9999', async ({ page }) => {
    const input = page.getByTestId('editable-card-quantity-foil');
    await input.fill(String(COLLECTION_QUANTITY_MAX + 1));

    const rangeOverflow = await input.evaluate((el) => (el as HTMLInputElement).validity.rangeOverflow);
    expect(rangeOverflow).toBe(true);
  });
});

test.describe('Card detail inline editor (EditableCardQuantity) - happy path', () => {
  test.beforeEach(async ({ context, page }) => {
    test.skip(!getLocalTestJwt(), 'Set E2E_TEST_JWT_1337 to run (see tests/utils/auth.ts)');

    await authenticateAsLocalTestUser(context);
    await resetCollectionEntry(context.request, HAPPY_CARD_ID);

    await page.goto(`/collections/${LOCAL_TEST_USER_ID}/cards/${HAPPY_CARD_SLUG}/${HAPPY_CARD_ID}`);
    await page.waitForLoadState('networkidle');
    await page.getByTestId('editable-card-quantity-regular').waitFor();
  });

  test.afterEach(async ({ context }) => {
    await resetCollectionEntry(context.request, HAPPY_CARD_ID);
  });

  test('starts from 0/0 state for an unowned card', async ({ page }) => {
    await expect(page.getByTestId('editable-card-quantity-regular')).toHaveValue('0');
    await expect(page.getByTestId('editable-card-quantity-foil')).toHaveValue('0');
  });

  test('typing a normal regular quantity (3) posts to /collection/update with that value', async ({ page }) => {
    const input = page.getByTestId('editable-card-quantity-regular');

    const requestPromise = page.waitForRequest(
      (r) => r.url().endsWith('/collection/update') && r.method() === 'POST',
    );
    await input.fill('3');
    await input.blur();

    const request = await requestPromise;
    expect(request.postDataJSON()).toMatchObject({
      mode: 'set',
      cards: [{ cardId: HAPPY_CARD_ID, quantityReg: 3 }],
    });

    await expect(input).toHaveValue('3');
  });

  test('typing a normal foil quantity (2) posts to /collection/update with that value', async ({ page }) => {
    const input = page.getByTestId('editable-card-quantity-foil');

    const requestPromise = page.waitForRequest(
      (r) => r.url().endsWith('/collection/update') && r.method() === 'POST',
    );
    await input.fill('2');
    await input.blur();

    const request = await requestPromise;
    expect(request.postDataJSON()).toMatchObject({
      mode: 'set',
      cards: [{ cardId: HAPPY_CARD_ID, quantityFoil: 2 }],
    });

    await expect(input).toHaveValue('2');
  });

  test('clearing the regular input via blur on empty resets display to 0', async ({ page }) => {
    // Seed to 3 first so there's something to clear.
    const input = page.getByTestId('editable-card-quantity-regular');
    await input.fill('3');
    await input.blur();
    await expect(input).toHaveValue('3');

    // Clear and blur → handleInputBlur sets display to "0".
    await input.fill('');
    await input.blur();

    await expect(input).toHaveValue('0');
  });

  test('repeated API increments of +9999 reject with 400 (regression)', async ({ context }) => {
    // Regression coverage for a bug where a user could submit increment mode
    // twice to accumulate past 9999. The server now rejects the second call
    // with 400 instead of silently clamping to 9999 — the silent clamp had
    // the side effect of making the frontend show a misleading success
    // toast since the response looked normal.
    const jwt = process.env.E2E_TEST_JWT_1337!;
    const first = await context.request.post('http://local.mtgcb.com:5000/collection/update', {
      data: { mode: 'increment', cards: [{ cardId: HAPPY_CARD_ID, quantityReg: 9999 }] },
      headers: { 'content-type': 'application/json', cookie: `MTGCB_AuthToken=${jwt}` },
    });
    expect(first.ok()).toBe(true);
    expect((await first.json()).data.cards[0].quantityReg).toBe(9999);

    const second = await context.request.post('http://local.mtgcb.com:5000/collection/update', {
      data: { mode: 'increment', cards: [{ cardId: HAPPY_CARD_ID, quantityReg: 9999 }] },
      headers: { 'content-type': 'application/json', cookie: `MTGCB_AuthToken=${jwt}` },
    });
    expect(second.status()).toBe(400);
    const body = await second.json();
    expect(body.success).toBe(false);
    expect(body.error.message).toBe('You can have at most 9999 copies of a card.');
  });
});
