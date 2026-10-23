import { expect, test, type Page } from '@playwright/test';
import { authenticateAsLocalTestUser, getLocalTestJwt } from '../utils/auth';
import { type MockApiResponse, mockApiRoute } from './fixtures/apiMocks';

// Happy paths live in reset-collection.e2e.test.ts. These cover the failure toasts.
const CONFIRMATION_TEXT = 'reset my collection';

const mockNuke = (page: Page, response: MockApiResponse) =>
  mockApiRoute(page, '/collection/nuke', { method: 'DELETE', respond: () => response });

const confirmReset = async (page: Page): Promise<void> => {
  await page.goto('/reset-collection');
  await page.getByRole('button', { name: 'Reset My Collection' }).click({ timeout: 20000 });
  const dialog = page.getByRole('dialog');
  await dialog.getByPlaceholder(CONFIRMATION_TEXT).fill(CONFIRMATION_TEXT);
  await dialog.getByRole('button', { name: 'Yes, Reset My Collection' }).click();
};

test.describe('Reset Collection error handling', () => {
  test.beforeEach(async ({ context }) => {
    test.skip(!getLocalTestJwt(), 'Set E2E_TEST_JWT_1337 to run (see tests/utils/auth.ts)');
    await authenticateAsLocalTestUser(context);
  });

  test('success:false from the API shows "Failed to reset collection" and stays on the page', async ({ page }) => {
    const calls = await mockNuke(page, {
      status: 200,
      body: { success: false, data: null, error: { code: 'NUKE_FAILED', message: 'nope' } },
    });
    await confirmReset(page);

    await expect(page.getByText('Failed to reset collection', { exact: true })).toBeVisible();
    expect(calls).toHaveLength(1);
    await expect(page).toHaveURL(/\/reset-collection$/);
    await expect(page.getByText(/^Deleted \d+ collection/)).toHaveCount(0);
    // The dialog stays open so the user can retry or cancel.
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('a 500 shows the generic error toast and stays on the page', async ({ page }) => {
    const calls = await mockNuke(page, {
      status: 500,
      body: { success: false, data: null, error: { code: 'INTERNAL', message: 'db down' } },
    });
    await confirmReset(page);

    await expect(page.getByText('An error occurred while resetting the collection', { exact: true })).toBeVisible();
    expect(calls).toHaveLength(1);
    await expect(page).toHaveURL(/\/reset-collection$/);
    await expect(page.getByRole('dialog')).toBeVisible();
  });
});
