import { expect, test, type Page } from '@playwright/test';
import { authenticateAsLocalTestUser, getLocalTestJwt } from '../utils/auth';

const API_BASE = 'http://local.mtgcb.com:5000';
const CONFIRMATION_TEXT = 'reset my collection';

const mockNuke = async (page: Page, deletedCount: number): Promise<{ called: () => boolean }> => {
  const state = { called: false };
  await page.route(`${API_BASE}/collection/nuke`, async (route) => {
    state.called = true;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { deletedCount } }),
    });
  });
  return { called: () => state.called };
};

const openConfirmDialog = async (page: Page): Promise<void> => {
  await page.goto('/reset-collection');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: 'Reset My Collection' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
};

test.describe('Reset Collection (nuke) flow', () => {
  test.beforeEach(async ({ context }) => {
    test.skip(!getLocalTestJwt(), 'Set E2E_TEST_JWT_1337 to run (see tests/utils/auth.ts)');
    await authenticateAsLocalTestUser(context);
  });

  test('Yes button is disabled until exact confirmation text is typed', async ({ page }) => {
    await mockNuke(page, 0);
    await openConfirmDialog(page);

    const dialog = page.getByRole('dialog');
    const confirmButton = dialog.getByRole('button', { name: 'Yes, Reset My Collection' });

    await expect(confirmButton).toBeDisabled();

    await dialog.getByPlaceholder(CONFIRMATION_TEXT).fill('not the right text');
    await expect(confirmButton).toBeDisabled();
    await expect(dialog.getByText('Text does not match')).toBeVisible();

    await dialog.getByPlaceholder(CONFIRMATION_TEXT).fill(CONFIRMATION_TEXT);
    await expect(confirmButton).toBeEnabled();
  });

  test('Cancel closes the dialog without nuking', async ({ page }) => {
    const nuke = await mockNuke(page, 0);
    await openConfirmDialog(page);

    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Cancel' }).click();

    await expect(dialog).not.toBeVisible();
    expect(nuke.called()).toBe(false);
  });

  test('confirms reset and shows pluralized "entries" toast for N > 1', async ({ page }) => {
    const nuke = await mockNuke(page, 5);
    await openConfirmDialog(page);

    const dialog = page.getByRole('dialog');
    await dialog.getByPlaceholder(CONFIRMATION_TEXT).fill(CONFIRMATION_TEXT);
    await dialog.getByRole('button', { name: 'Yes, Reset My Collection' }).click();

    await expect(page.getByText('Deleted 5 collection entries')).toBeVisible();
    expect(nuke.called()).toBe(true);
    await page.waitForURL('/', { timeout: 10000 });
  });

  test('confirms reset and shows singular "entry" toast for N === 1', async ({ page }) => {
    await mockNuke(page, 1);
    await openConfirmDialog(page);

    const dialog = page.getByRole('dialog');
    await dialog.getByPlaceholder(CONFIRMATION_TEXT).fill(CONFIRMATION_TEXT);
    await dialog.getByRole('button', { name: 'Yes, Reset My Collection' }).click();

    await expect(page.getByText('Deleted 1 collection entry')).toBeVisible();
    // Regression guard: prior copy was "Successfully deleted N collection entries"
    // and would say "1 collection entries" with the wrong plural.
    await expect(page.getByText(/Successfully deleted/)).toHaveCount(0);
    await expect(page.getByText('Deleted 1 collection entries')).toHaveCount(0);
  });
});
