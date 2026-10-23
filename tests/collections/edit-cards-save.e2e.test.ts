import { expect, test, type Page } from '@playwright/test';
import { authenticateAsLocalTestUser, getLocalTestJwt } from '../utils/auth';
import {
  MOCK_LOCATIONS,
  apiError,
  mockApiRoute,
  mockLocationHierarchy,
  ok,
  patchApiResponse,
} from './fixtures/apiMocks';

// Giant Spider (Tenth Edition) has both regular and foil printings, so both inputs are enabled.
const CARD_ID = 12390;
const CARD_NAME = 'Giant Spider';
const CARD_OPTION_LABEL = 'Giant Spider [Tenth Edition]';

// The search response is patched so the "current" quantities the toast is computed from are
// fixed, regardless of what other tests have done to user 1337's real collection.
const CURRENT_REG = 4;
const CURRENT_FOIL = 2;

interface UpdateBody {
  mode: string;
  cards: Array<{ cardId: number; quantityReg: number; quantityFoil: number; locationId?: number }>;
}

const pinCurrentQuantities = (page: Page) =>
  patchApiResponse(page, '/cards/search', (json) => {
    for (const card of json?.data?.cards ?? []) {
      if (String(card.id) === String(CARD_ID)) {
        card.quantityReg = CURRENT_REG;
        card.quantityFoil = CURRENT_FOIL;
      }
    }
  });

const mockUpdate = (page: Page, respond = () => ok({ updates: [] })) =>
  mockApiRoute<UpdateBody>(page, '/collection/update', { method: 'POST', respond });

const selectMode = async (page: Page, mode: 'increment' | 'decrement' | 'set'): Promise<void> => {
  const toggle = page.getByRole('button', { name: `${mode} mode` });
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
};

const pickCard = async (page: Page): Promise<void> => {
  const searchBox = page.getByLabel('Search cards to add or remove!');
  await searchBox.click();
  await searchBox.fill(CARD_NAME);
  const option = page.getByRole('option', { name: CARD_OPTION_LABEL, exact: true });
  await option.waitFor({ timeout: 15000 });
  await option.click();
  await page.getByTestId('edit-cards-quantity-regular').waitFor();
};

const regularInput = (page: Page) => page.getByTestId('edit-cards-quantity-regular');
const foilInput = (page: Page) => page.getByTestId('edit-cards-quantity-foil');

test.describe('Edit Cards page - saving', () => {
  test.beforeEach(async ({ context, page }) => {
    test.skip(!getLocalTestJwt(), 'Set E2E_TEST_JWT_1337 to run (see tests/utils/auth.ts)');
    await authenticateAsLocalTestUser(context);
    await pinCurrentQuantities(page);
    await mockLocationHierarchy(page);
    await page.goto('/collections/edit-cards');
    await expect(page.getByRole('heading', { name: 'Add or Remove Cards' })).toBeVisible({ timeout: 20000 });
  });

  test('increment mode sends the entered quantities and reports the new totals', async ({ page }) => {
    const calls = await mockUpdate(page);
    await pickCard(page);
    await selectMode(page, 'increment');

    await expect(regularInput(page)).toHaveValue('1');
    await expect(foilInput(page)).toHaveValue('0');
    await regularInput(page).fill('2');
    await foilInput(page).fill('1');
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText(`${CARD_NAME} has been set to 6 and 3 foils`)).toBeVisible();
    expect(calls).toHaveLength(1);
    expect(calls[0].body).toEqual({
      mode: 'increment',
      cards: [{ cardId: CARD_ID, quantityReg: 2, quantityFoil: 1 }],
    });
  });

  test('decrement mode sends an increment with negative quantities', async ({ page }) => {
    const calls = await mockUpdate(page);
    await pickCard(page);
    await selectMode(page, 'decrement');

    await regularInput(page).fill('1');
    await foilInput(page).fill('1');
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText(`${CARD_NAME} has been set to 3 and 1 foil`, { exact: true })).toBeVisible();
    expect(calls[0].body).toEqual({
      mode: 'increment',
      cards: [{ cardId: CARD_ID, quantityReg: -1, quantityFoil: -1 }],
    });
  });

  test('decrement mode never goes below zero in the toast', async ({ page }) => {
    await mockUpdate(page);
    await pickCard(page);
    await selectMode(page, 'decrement');

    await regularInput(page).fill('10');
    await foilInput(page).fill('0');
    await page.getByRole('button', { name: 'Save' }).click();

    // 2 foils remain because only regulars were removed.
    await expect(page.getByText(`${CARD_NAME} has been set to 0 and 2 foils`)).toBeVisible();
  });

  test('set mode starts from the current quantities and sends exact values', async ({ page }) => {
    const calls = await mockUpdate(page);
    await pickCard(page);
    await selectMode(page, 'set');

    await expect(regularInput(page)).toHaveValue(String(CURRENT_REG));
    await expect(foilInput(page)).toHaveValue(String(CURRENT_FOIL));
    await regularInput(page).fill('7');
    await foilInput(page).fill('0');
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText(`${CARD_NAME} has been set to 7`, { exact: true })).toBeVisible();
    expect(calls[0].body).toEqual({
      mode: 'set',
      cards: [{ cardId: CARD_ID, quantityReg: 7, quantityFoil: 0 }],
    });
  });

  test('a chosen location is sent with increment saves but the picker is hidden in decrement mode', async ({
    page,
  }) => {
    const calls = await mockUpdate(page);
    await pickCard(page);
    await selectMode(page, 'increment');

    await page.getByLabel('Assign to Location (optional)').click();
    await page.getByRole('option', { name: MOCK_LOCATIONS.shoebox.name }).click();
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText(`${CARD_NAME} has been set to 5 and 2 foils`)).toBeVisible();
    expect(calls[0].body.cards[0]).toEqual({
      cardId: CARD_ID,
      quantityReg: 1,
      quantityFoil: 0,
      locationId: MOCK_LOCATIONS.shoebox.id,
    });

    await pickCard(page);
    await selectMode(page, 'decrement');
    await expect(page.getByLabel('Assign to Location (optional)')).toHaveCount(0);
    await page.getByRole('button', { name: 'Save' }).click();
    await expect.poll(() => calls.length).toBe(2);
    expect(calls[1].body.cards[0]).not.toHaveProperty('locationId');
  });

  test('a failed save shows the API message', async ({ page }) => {
    await mockUpdate(page, () => apiError(400, 'Quantity too large for this card'));
    await pickCard(page);
    await selectMode(page, 'increment');
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText('Quantity too large for this card')).toBeVisible();
    await expect(page.getByText(/has been set to/)).toHaveCount(0);
    // The card stays selected so the user can retry.
    await expect(regularInput(page)).toBeVisible();
  });

  test('a failed save without a message falls back to a generic toast', async ({ page }) => {
    await mockUpdate(page, () => apiError(500));
    await pickCard(page);
    await selectMode(page, 'set');
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText(`Failed to update ${CARD_NAME}`)).toBeVisible();
  });
});
