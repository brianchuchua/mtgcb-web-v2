import { expect, test } from '@playwright/test';
import path from 'path';
import { LOCAL_TEST_USER_ID, authenticateAsLocalTestUser, getLocalTestJwt } from '../../utils/auth';

// User story: an authenticated user opens the Share Collection modal from
// their collection page to grab a shareable link.

const SHOTS_DIR = path.join(process.cwd(), 'test-results', 'manual-screenshots');
const shot = (name: string) => path.join(SHOTS_DIR, `${name}.png`);

test('Share Collection modal opens from collection landing', async ({ context, page }) => {
  test.skip(!getLocalTestJwt(), 'E2E_TEST_JWT_1337 not set');
  await authenticateAsLocalTestUser(context);

  await page.goto(`/collections/${LOCAL_TEST_USER_ID}`);
  await page.waitForLoadState('networkidle');

  // ShareCollectionButton renders as either a Button with "Share" text or
  // (on smaller screens) an icon-only button — match by accessible name.
  const shareButton = page.getByRole('button', { name: /share/i }).first();
  await expect(shareButton).toBeVisible();
  await shareButton.click();

  // The modal opens — capture its content.
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  await page.screenshot({ path: shot('share-collection-modal'), fullPage: false });
  console.log(JSON.stringify({ label: 'share-collection-modal-open' }));
});
