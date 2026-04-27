import { expect, test, type Page } from '@playwright/test';
import { LOCAL_TEST_USER_ID, authenticateAsLocalTestUser, getLocalTestJwt } from '../utils/auth';

// Same set the other set-page mass panel tests use — guarantees the page
// renders the More actions menu without needing custom seeded data.
const TEST_SET_SLUG = 'limited-edition-alpha';
const TEST_SET_NAME = 'Limited Edition Alpha';

const MASS_UPDATE_URL = 'http://local.mtgcb.com:5000/collection/mass-update';

// The set page mounts a lot of widgets; the More actions menu can take >30s
// under full parallel load. Run serial to avoid flakes.
test.describe.configure({ mode: 'serial' });

interface MockResponseOptions {
  updatedCards: number;
  totalSkipped?: { cannotBeFoil: number; cannotBeNonFoil: number };
}

const mockMassUpdateResponse = async (page: Page, opts: MockResponseOptions): Promise<void> => {
  await page.route(MASS_UPDATE_URL, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          setId: 1,
          setCode: 'lea',
          setName: TEST_SET_NAME,
          updatedCards: opts.updatedCards,
          updates: [],
          ...(opts.totalSkipped ? { totalSkipped: opts.totalSkipped } : {}),
        },
      }),
    });
  });
};

const submitMassUpdate = async (page: Page, quantity: string): Promise<void> => {
  await page.getByTestId('collection-set-more-actions').click();
  await page.getByRole('menuitem', { name: 'Mass Update' }).click();
  await page.getByTestId('mass-update-quantity-regular').waitFor();

  await page.getByTestId('mass-update-quantity-regular').fill(quantity);

  // First Apply button (in the side panel) opens the confirmation dialog.
  await page.getByRole('button', { name: 'Apply' }).first().click();

  // Second Apply button (inside the dialog) submits to the (mocked) API.
  await page.getByRole('dialog').getByRole('button', { name: 'Apply' }).click();
};

test.describe('Mass update toast messages on set collection page', () => {
  test.beforeEach(async ({ context, page }) => {
    test.skip(!getLocalTestJwt(), 'Set E2E_TEST_JWT_1337 to run (see tests/utils/auth.ts)');

    await authenticateAsLocalTestUser(context);
    await page.goto(`/collections/${LOCAL_TEST_USER_ID}/${TEST_SET_SLUG}?contentType=cards`);
    await page.waitForLoadState('networkidle');
  });

  test('shows "No cards needed updating in {set}" when API returns 0 updated cards', async ({ page }) => {
    await mockMassUpdateResponse(page, { updatedCards: 0 });

    await submitMassUpdate(page, '3');

    await expect(page.getByText(`No cards needed updating in ${TEST_SET_NAME}`)).toBeVisible();
    // Regression guard: the prior bug surfaced "Successfully updated 0 cards".
    await expect(page.getByText(/Successfully updated 0 cards/)).toHaveCount(0);
  });

  test('shows "Updated 1 card in {set}" (singular) when API returns 1 updated card', async ({ page }) => {
    await mockMassUpdateResponse(page, { updatedCards: 1 });

    await submitMassUpdate(page, '3');

    await expect(page.getByText(`Updated 1 card in ${TEST_SET_NAME}`)).toBeVisible();
    // Regression guard for the pluralization bug — "1 cards" must not appear.
    await expect(page.getByText(/Updated 1 cards/)).toHaveCount(0);
  });

  test('shows "Updated N cards in {set}" (plural) when API returns multiple updated cards', async ({ page }) => {
    await mockMassUpdateResponse(page, { updatedCards: 5 });

    await submitMassUpdate(page, '3');

    await expect(page.getByText(`Updated 5 cards in ${TEST_SET_NAME}`)).toBeVisible();
  });

  test('does not include the word "Successfully" in success toasts', async ({ page }) => {
    await mockMassUpdateResponse(page, { updatedCards: 5 });

    await submitMassUpdate(page, '3');

    await expect(page.getByText(`Updated 5 cards in ${TEST_SET_NAME}`)).toBeVisible();
    await expect(page.getByText(/Successfully updated/)).toHaveCount(0);
  });
});
