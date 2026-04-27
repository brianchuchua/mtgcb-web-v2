import { expect, test, type Page } from '@playwright/test';
import { LOCAL_TEST_USER_ID, authenticateAsLocalTestUser, getLocalTestJwt } from '../utils/auth';

const API_BASE = 'http://local.mtgcb.com:5000';
const SHARE_URL = `${API_BASE}/user/share-link`;

const SHARE_RESPONSE = {
  shareUrl: 'http://local.mtgcb.com:3000/?share=test-token-abc123',
  token: 'test-token-abc123',
  createdAt: '2026-04-26T12:00:00.000Z',
  expiresAt: null,
};

const STATUS_NO_LINK = {
  success: true,
  data: { hasShareLink: false },
};

const STATUS_HAS_LINK = {
  success: true,
  data: {
    hasShareLink: true,
    shareUrl: SHARE_RESPONSE.shareUrl,
    createdAt: SHARE_RESPONSE.createdAt,
    expiresAt: null,
  },
};

const fulfillJson = async (route: any, body: unknown, status = 200) => {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
};

const setupShareLinkRoute = async (
  page: Page,
  initialStatus: typeof STATUS_NO_LINK | typeof STATUS_HAS_LINK,
): Promise<{ generateCalled: () => boolean; revokeCalled: () => boolean }> => {
  const state = { generateCalled: false, revokeCalled: false };
  let currentStatus = initialStatus;

  await page.route(SHARE_URL, async (route) => {
    const method = route.request().method();
    if (method === 'GET') {
      await fulfillJson(route, currentStatus);
    } else if (method === 'POST') {
      state.generateCalled = true;
      currentStatus = STATUS_HAS_LINK;
      await fulfillJson(route, { success: true, data: SHARE_RESPONSE });
    } else if (method === 'DELETE') {
      state.revokeCalled = true;
      currentStatus = STATUS_NO_LINK;
      await fulfillJson(route, {
        success: true,
        data: { message: 'Revoked' },
      });
    }
  });

  return {
    generateCalled: () => state.generateCalled,
    revokeCalled: () => state.revokeCalled,
  };
};

const stubUserPut = (page: Page) =>
  page.route(`${API_BASE}/user`, async (route) => {
    if (route.request().method() === 'PUT') {
      await fulfillJson(route, {
        success: true,
        data: { userId: LOCAL_TEST_USER_ID },
      });
    } else {
      await route.continue();
    }
  });

// ShareLinkManager only renders when the user's collection is private. Force
// the auth state to isPublic=false regardless of the real test user's setting.
const stubMePrivate = (page: Page) =>
  page.route(`${API_BASE}/auth/me`, async (route) => {
    await fulfillJson(route, {
      success: true,
      data: {
        userId: LOCAL_TEST_USER_ID,
        username: 'TestUser',
        email: 'test@example.com',
        isPublic: false,
        hideCollectionValue: false,
        draftCubeVariant: 'standard',
      },
    });
  });

test.describe('Share link manager', () => {
  test.beforeEach(async ({ context, page }) => {
    test.skip(!getLocalTestJwt(), 'Set E2E_TEST_JWT_1337 to run (see tests/utils/auth.ts)');
    await authenticateAsLocalTestUser(context);
    await stubMePrivate(page);
    await stubUserPut(page);
  });

  test('generates a new share link and shows "Share link generated" toast', async ({ page }) => {
    const { generateCalled } = await setupShareLinkRoute(page, STATUS_NO_LINK);

    await page.goto('/account');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /Generate Share Link/ }).first().click();

    await expect(page.getByText('Share link generated', { exact: true })).toBeVisible();
    await expect(page.getByText(/successfully/i)).toHaveCount(0);
    expect(generateCalled()).toBe(true);
  });

  test('regenerates the link via dialog and shows "Share link regenerated" toast', async ({ page }) => {
    const { generateCalled } = await setupShareLinkRoute(page, STATUS_HAS_LINK);

    await page.goto('/account');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Regenerate' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Regenerate Share Link?')).toBeVisible();
    await dialog.getByRole('button', { name: 'Regenerate' }).click();

    await expect(page.getByText('Share link regenerated')).toBeVisible();
    await expect(page.getByText(/successfully/i)).toHaveCount(0);
    expect(generateCalled()).toBe(true);
  });

  test('revokes the link via dialog and shows "Share link revoked" toast', async ({ page }) => {
    const { revokeCalled } = await setupShareLinkRoute(page, STATUS_HAS_LINK);

    await page.goto('/account');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Revoke' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Revoke Share Link?')).toBeVisible();
    await dialog.getByRole('button', { name: 'Revoke' }).click();

    await expect(page.getByText('Share link revoked')).toBeVisible();
    await expect(page.getByText(/successfully/i)).toHaveCount(0);
    expect(revokeCalled()).toBe(true);
  });

  test('cancel buttons in regen/revoke dialogs do not call API', async ({ page }) => {
    const { generateCalled, revokeCalled } = await setupShareLinkRoute(page, STATUS_HAS_LINK);

    await page.goto('/account');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Regenerate' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    await page.getByRole('button', { name: 'Revoke' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    expect(generateCalled()).toBe(false);
    expect(revokeCalled()).toBe(false);
  });
});
