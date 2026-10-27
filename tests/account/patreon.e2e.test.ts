import { type Page, expect, test } from '@playwright/test';
import { authenticateAsLocalTestUser, getLocalTestJwt } from '../utils/auth';

const API_BASE = 'http://local.mtgcb.com:5000';

const LINKED_STATUS = {
  linked: true,
  currentTier: { slug: 'rare', name: 'Rare', badge: 'R', rank: 3, isActive: true },
  highestTier: { slug: 'rare', name: 'Rare', badge: 'R', rank: 3 },
};

const fulfillJson = (body: unknown, status = 200) => ({
  status,
  contentType: 'application/json',
  body: JSON.stringify(body),
});

// Dev mode's Strict Mode runs the callback effect twice, so the toast can appear twice there.
const toast = (page: Page, text: string) => page.getByText(text).first();

const expectUrlIsPlainAccount = async (page: Page) => {
  await expect.poll(() => new URL(page.url()).search).toBe('');
  expect(new URL(page.url()).pathname).toBe('/account');
};

test.describe('Patreon on the account page', () => {
  test.beforeEach(async ({ context, page }) => {
    test.skip(!getLocalTestJwt(), 'Set E2E_TEST_JWT_1337 to run (see tests/utils/auth.ts)');
    await authenticateAsLocalTestUser(context);
    await page.route(`${API_BASE}/patreon/status`, (route) => route.fulfill(fulfillJson({ success: true, data: { linked: false } })));
  });

  test('?patreon=linked shows the linked toast and cleans the URL', async ({ page }) => {
    await page.goto('/account?patreon=linked');
    await expect(toast(page, 'Patreon account linked')).toBeVisible();
    await expectUrlIsPlainAccount(page);
  });

  test('?error=invalid_state shows the session expired toast and cleans the URL', async ({ page }) => {
    await page.goto('/account?error=invalid_state');
    await expect(toast(page, 'Session expired. Please try linking again.')).toBeVisible();
    await expectUrlIsPlainAccount(page);
  });

  test('?error=not_patron shows the not-a-patron toast and cleans the URL', async ({ page }) => {
    await page.goto('/account?error=not_patron');
    await expect(toast(page, 'You must be an active patron to link your account.')).toBeVisible();
    await expectUrlIsPlainAccount(page);
  });

  test('an unknown ?error code is shown verbatim in the toast', async ({ page }) => {
    await page.goto('/account?error=something_odd');
    await expect(toast(page, 'Unable to link Patreon account: something_odd')).toBeVisible();
    await expectUrlIsPlainAccount(page);
  });

  test('an unlinked account offers Join and Link buttons', async ({ page }) => {
    await page.goto('/account');
    await expect(page.getByRole('button', { name: 'Link Existing Account' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Join Patreon' })).toHaveAttribute(
      'href',
      'https://www.patreon.com/mtgcollectionbuilder',
    );
    await expect(page.getByRole('button', { name: 'Disconnect from Patreon' })).toHaveCount(0);
  });

  test('disconnecting a linked account calls DELETE /patreon/disconnect and returns to the unlinked state', async ({
    page,
  }) => {
    let disconnected = false;
    const disconnectMethods: string[] = [];
    await page.route(`${API_BASE}/patreon/status`, (route) =>
      route.fulfill(fulfillJson({ success: true, data: disconnected ? { linked: false } : LINKED_STATUS })),
    );
    await page.route(`${API_BASE}/patreon/disconnect`, async (route) => {
      disconnectMethods.push(route.request().method());
      disconnected = true;
      await route.fulfill(fulfillJson({ success: true, data: { message: 'Disconnected' } }));
    });

    await page.goto('/account');
    await expect(page.getByText('Current Tier')).toBeVisible();
    await expect(page.getByText('Highest Tier Ever')).toBeVisible();

    await page.getByRole('button', { name: 'Disconnect from Patreon' }).click();
    const dialog = page.getByRole('dialog', { name: 'Disconnect Patreon Account?' });
    await expect(dialog).toBeVisible();

    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).toHaveCount(0);
    expect(disconnectMethods).toEqual([]);

    await page.getByRole('button', { name: 'Disconnect from Patreon' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Disconnect', exact: true }).click();

    await expect(page.getByText('Patreon account disconnected')).toBeVisible();
    expect(disconnectMethods).toEqual(['DELETE']);
    await expect(page.getByRole('button', { name: 'Link Existing Account' })).toBeVisible();
  });

  test('a failed disconnect shows an error toast and keeps the linked state', async ({ page }) => {
    await page.route(`${API_BASE}/patreon/status`, (route) =>
      route.fulfill(fulfillJson({ success: true, data: LINKED_STATUS })),
    );
    await page.route(`${API_BASE}/patreon/disconnect`, (route) =>
      route.fulfill(fulfillJson({ success: false, data: null, error: null }, 500)),
    );

    await page.goto('/account');
    await page.getByRole('button', { name: 'Disconnect from Patreon' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Disconnect', exact: true }).click();

    await expect(page.getByText('Failed to disconnect Patreon account')).toBeVisible();
    const dialog = page.getByRole('dialog', { name: 'Disconnect Patreon Account?' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Disconnect from Patreon' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Link Existing Account' })).toHaveCount(0);
  });
});
