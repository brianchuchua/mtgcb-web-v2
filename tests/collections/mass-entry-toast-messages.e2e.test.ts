import { expect, test, type Page } from '@playwright/test';
import { LOCAL_TEST_USER_ID, authenticateAsLocalTestUser, getLocalTestJwt } from '../utils/auth';

const MASS_ENTRY_URL = 'http://local.mtgcb.com:5000/collection/mass-entry';

interface MockResponseOptions {
  updatedCards: number;
  totalSkipped?: { cannotBeFoil: number; cannotBeNonFoil: number };
}

const mockMassEntryResponse = async (page: Page, opts: MockResponseOptions): Promise<void> => {
  await page.route(MASS_ENTRY_URL, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          totalCardsProvided: 5,
          updatedCards: opts.updatedCards,
          updates: [],
          ...(opts.totalSkipped ? { totalSkipped: opts.totalSkipped } : {}),
        },
      }),
    });
  });
};

const submitMassEntry = async (page: Page, quantity: string): Promise<void> => {
  await page.getByTestId('collection-more-actions').click();
  await page.getByRole('menuitem', { name: 'Mass Update' }).click();
  await page.getByTestId('mass-entry-quantity-regular').waitFor();

  await page.getByTestId('mass-entry-quantity-regular').fill(quantity);

  // Panel Apply opens the confirm dialog. Confirm dialog Apply submits.
  await page.getByRole('button', { name: 'Apply' }).first().click();
  await page.getByRole('dialog').getByRole('button', { name: 'Apply' }).click();
};

test.describe('Mass entry toast messages on main collection page', () => {
  test.beforeEach(async ({ context, page }) => {
    test.skip(!getLocalTestJwt(), 'Set E2E_TEST_JWT_1337 to run (see tests/utils/auth.ts)');
    await authenticateAsLocalTestUser(context);
    await page.goto(`/collections/${LOCAL_TEST_USER_ID}?contentType=cards`);
    await page.waitForLoadState('networkidle');
  });

  test('shows "No cards needed updating" when API returns 0 updated cards', async ({ page }) => {
    await mockMassEntryResponse(page, { updatedCards: 0 });

    await submitMassEntry(page, '3');

    await expect(page.getByText('No cards needed updating')).toBeVisible();
    await expect(page.getByText(/Successfully updated 0 cards/)).toHaveCount(0);
  });

  test('shows "Updated 1 card" (singular) when API returns 1 updated card', async ({ page }) => {
    await mockMassEntryResponse(page, { updatedCards: 1 });

    await submitMassEntry(page, '3');

    await expect(page.getByText('Updated 1 card', { exact: true })).toBeVisible();
    await expect(page.getByText(/Updated 1 cards/)).toHaveCount(0);
  });

  test('shows "Updated N cards" (plural) when API returns multiple updated cards', async ({ page }) => {
    await mockMassEntryResponse(page, { updatedCards: 7 });

    await submitMassEntry(page, '3');

    await expect(page.getByText('Updated 7 cards', { exact: true })).toBeVisible();
  });

  test('does not include "Successfully" in any success toast', async ({ page }) => {
    await mockMassEntryResponse(page, { updatedCards: 7 });

    await submitMassEntry(page, '3');

    await expect(page.getByText('Updated 7 cards', { exact: true })).toBeVisible();
    await expect(page.getByText(/Successfully updated/)).toHaveCount(0);
  });
});
