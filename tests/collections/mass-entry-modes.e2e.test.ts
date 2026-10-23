import { expect, test, type Page } from '@playwright/test';
import { LOCAL_TEST_USER_ID, authenticateAsLocalTestUser, getLocalTestJwt } from '../utils/auth';
import { apiError, mockApiRoute, ok } from './fixtures/apiMocks';

// All mass writes are mocked; these tests only check what the UI sends and how it reports back.

const TEST_SET_SLUG = 'limited-edition-alpha';
const TEST_SET_NAME = 'Limited Edition Alpha';

interface MassBody {
  mode: string;
  cardIds?: number[];
  setId?: number;
  updates: Array<{ rarity: string; quantityReg: number; quantityFoil: number }>;
}

type UiMode = 'Setting' | 'Adding' | 'Removing';

const fillAndApply = async (page: Page, inputTestId: string, uiMode: UiMode, quantity: string): Promise<void> => {
  await page.getByLabel(uiMode, { exact: true }).check();
  await page.getByTestId(inputTestId).fill(quantity);
  await page.getByRole('button', { name: 'Apply' }).first().click();
  await page.getByRole('dialog').getByRole('button', { name: 'Apply' }).click();
};

test.describe('Mass Entry modes on the main collection page', () => {
  const openMassEntry = async (page: Page): Promise<void> => {
    await page.getByTestId('collection-more-actions').click();
    await page.getByRole('menuitem', { name: 'Mass Update' }).click();
    await page.getByTestId('mass-entry-quantity-regular').waitFor();
  };

  const mockMassEntry = (page: Page, respond = () => ok({ totalCardsProvided: 5, updatedCards: 5, updates: [] })) =>
    mockApiRoute<MassBody>(page, '/collection/mass-entry', { method: 'POST', respond });

  test.beforeEach(async ({ context, page }) => {
    test.skip(!getLocalTestJwt(), 'Set E2E_TEST_JWT_1337 to run (see tests/utils/auth.ts)');
    await authenticateAsLocalTestUser(context);
    await page.goto(`/collections/${LOCAL_TEST_USER_ID}?contentType=cards`);
    await page.waitForLoadState('networkidle');
  });

  test('Setting sends mode "set" with the exact quantities for the cards on the page', async ({ page }) => {
    const calls = await mockMassEntry(page);
    await openMassEntry(page);
    await fillAndApply(page, 'mass-entry-quantity-regular', 'Setting', '3');

    await expect(page.getByText('Updated 5 cards', { exact: true })).toBeVisible();
    expect(calls).toHaveLength(1);
    const body = calls[0].body;
    expect(body.mode).toBe('set');
    expect(body.updates).toEqual([{ rarity: 'all', quantityReg: 3, quantityFoil: 0 }]);
    expect(body.cardIds?.length).toBeGreaterThan(0);
    body.cardIds?.forEach((id) => expect(Number.isInteger(id)).toBe(true));
  });

  test('Adding sends mode "increment" with positive quantities', async ({ page }) => {
    const calls = await mockMassEntry(page);
    await openMassEntry(page);
    await fillAndApply(page, 'mass-entry-quantity-regular', 'Adding', '2');

    await expect(page.getByText('Updated 5 cards', { exact: true })).toBeVisible();
    expect(calls[0].body.mode).toBe('increment');
    expect(calls[0].body.updates).toEqual([{ rarity: 'all', quantityReg: 2, quantityFoil: 0 }]);
  });

  test('Removing sends mode "increment" with negative quantities', async ({ page }) => {
    const calls = await mockMassEntry(page);
    await openMassEntry(page);
    await page.getByLabel('Removing', { exact: true }).check();
    await page.getByTestId('mass-entry-quantity-regular').fill('2');
    await page.getByTestId('mass-entry-quantity-foil').fill('1');
    await page.getByRole('button', { name: 'Apply' }).first().click();
    await page.getByRole('dialog').getByRole('button', { name: 'Apply' }).click();

    await expect(page.getByText('Updated 5 cards', { exact: true })).toBeVisible();
    expect(calls[0].body.mode).toBe('increment');
    expect(calls[0].body.updates).toEqual([{ rarity: 'all', quantityReg: -2, quantityFoil: -1 }]);
  });

  test('all cards skipped for foil constraints shows an error toast', async ({ page }) => {
    await mockMassEntry(page, () =>
      ok({ totalCardsProvided: 5, updatedCards: 0, updates: [], totalSkipped: { cannotBeFoil: 4, cannotBeNonFoil: 1 } }),
    );
    await openMassEntry(page);
    await fillAndApply(page, 'mass-entry-quantity-regular', 'Setting', '1');

    await expect(page.getByText('5 cards skipped due to foil constraints', { exact: true })).toBeVisible();
  });

  test('some cards skipped adds the skipped count to the success toast', async ({ page }) => {
    await mockMassEntry(page, () =>
      ok({ totalCardsProvided: 5, updatedCards: 3, updates: [], totalSkipped: { cannotBeFoil: 2, cannotBeNonFoil: 0 } }),
    );
    await openMassEntry(page);
    await fillAndApply(page, 'mass-entry-quantity-regular', 'Setting', '1');

    await expect(page.getByText('Updated 3 cards. 2 cards skipped due to foil constraints')).toBeVisible();
  });

  test('an API error shows its message, or a fallback without one', async ({ page }) => {
    const responses = [apiError(400, 'Mass entry rejected by server'), apiError(500)];
    await mockApiRoute(page, '/collection/mass-entry', { method: 'POST', respond: (_c, i) => responses[i] });
    await openMassEntry(page);

    await fillAndApply(page, 'mass-entry-quantity-regular', 'Setting', '1');
    await expect(page.getByText('Mass entry rejected by server')).toBeVisible();

    // The panel stays open after an error, so the user can retry.
    await page.getByRole('dialog').getByRole('button', { name: 'Apply' }).click();
    await expect(page.getByText('Failed to mass update collection')).toBeVisible();
  });
});

test.describe('Mass Update modes on a set collection page', () => {
  // The set page mounts a lot of widgets; serial avoids starving the shared API.
  test.describe.configure({ mode: 'serial' });

  const openMassUpdate = async (page: Page): Promise<void> => {
    await page.getByTestId('collection-set-more-actions').click();
    await page.getByRole('menuitem', { name: 'Mass Update' }).click();
    await page.getByTestId('mass-update-quantity-regular').waitFor();
  };

  const mockMassUpdate = (page: Page, respond = () => ok(massUpdateData(4))) =>
    mockApiRoute<MassBody>(page, '/collection/mass-update', { method: 'POST', respond });

  const massUpdateData = (updatedCards: number, totalSkipped?: { cannotBeFoil: number; cannotBeNonFoil: number }) => ({
    setId: 1,
    setCode: 'LEA',
    setName: TEST_SET_NAME,
    updatedCards,
    updates: [],
    ...(totalSkipped ? { totalSkipped } : {}),
  });

  test.beforeEach(async ({ context, page }) => {
    test.skip(!getLocalTestJwt(), 'Set E2E_TEST_JWT_1337 to run (see tests/utils/auth.ts)');
    test.setTimeout(60000);
    await authenticateAsLocalTestUser(context);
    await page.goto(`/collections/${LOCAL_TEST_USER_ID}/${TEST_SET_SLUG}?contentType=cards`);
    await page.waitForLoadState('networkidle');
  });

  test('Adding sends mode "increment" with the set id and positive quantities', async ({ page }) => {
    const calls = await mockMassUpdate(page);
    await openMassUpdate(page);
    await fillAndApply(page, 'mass-update-quantity-regular', 'Adding', '2');

    await expect(page.getByText(`Updated 4 cards in ${TEST_SET_NAME}`)).toBeVisible();
    const body = calls[0].body;
    expect(body.mode).toBe('increment');
    expect(Number.isInteger(body.setId)).toBe(true);
    expect(body.setId).toBeGreaterThan(0);
    expect(body).not.toHaveProperty('cardIds');
    expect(body.updates).toEqual([{ rarity: 'all', quantityReg: 2, quantityFoil: 0 }]);
  });

  test('Removing sends mode "increment" with negative quantities', async ({ page }) => {
    const calls = await mockMassUpdate(page);
    await openMassUpdate(page);
    await fillAndApply(page, 'mass-update-quantity-regular', 'Removing', '3');

    await expect(page.getByText(`Updated 4 cards in ${TEST_SET_NAME}`)).toBeVisible();
    expect(calls[0].body.mode).toBe('increment');
    expect(calls[0].body.updates).toEqual([{ rarity: 'all', quantityReg: -3, quantityFoil: 0 }]);
  });

  test('Setting sends mode "set"', async ({ page }) => {
    const calls = await mockMassUpdate(page);
    await openMassUpdate(page);
    await fillAndApply(page, 'mass-update-quantity-regular', 'Setting', '1');

    await expect(page.getByText(`Updated 4 cards in ${TEST_SET_NAME}`)).toBeVisible();
    expect(calls[0].body.mode).toBe('set');
    expect(calls[0].body.updates).toEqual([{ rarity: 'all', quantityReg: 1, quantityFoil: 0 }]);
  });

  test('an API error shows its message, or a fallback without one', async ({ page }) => {
    const responses = [apiError(400, 'Set mass update rejected'), apiError(500)];
    await mockApiRoute(page, '/collection/mass-update', { method: 'POST', respond: (_c, i) => responses[i] });
    await openMassUpdate(page);

    await fillAndApply(page, 'mass-update-quantity-regular', 'Setting', '1');
    await expect(page.getByText('Set mass update rejected')).toBeVisible();

    await page.getByRole('dialog').getByRole('button', { name: 'Apply' }).click();
    await expect(page.getByText('Failed to update collection')).toBeVisible();
  });
});
