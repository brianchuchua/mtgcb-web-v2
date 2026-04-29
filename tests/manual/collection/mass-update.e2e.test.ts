import { test } from '@playwright/test';
import path from 'path';
import { LOCAL_TEST_USER_ID, authenticateAsLocalTestUser, getLocalTestJwt } from '../../utils/auth';

// User story: an authenticated user opens the Mass Update panel from a set-
// specific collection page (e.g., Limited Edition Alpha) to bulk-update
// quantities for cards in that set.

const SHOTS_DIR = path.join(process.cwd(), 'test-results', 'manual-screenshots');
const shot = (name: string) => path.join(SHOTS_DIR, `${name}.png`);

const TEST_SET_SLUG = 'limited-edition-alpha';

test('Mass Update panel opens from a collection set page', async ({ context, page }) => {
  test.skip(!getLocalTestJwt(), 'E2E_TEST_JWT_1337 not set');
  await authenticateAsLocalTestUser(context);

  await page.goto(`/collections/${LOCAL_TEST_USER_ID}/${TEST_SET_SLUG}?contentType=cards`);
  await page.waitForLoadState('networkidle');

  await page.getByTestId('collection-set-more-actions').click();
  await page.getByRole('menuitem', { name: 'Mass Update' }).click();
  await page.getByTestId('mass-update-quantity-regular').waitFor();

  await page.screenshot({ path: shot('mass-update-panel-open'), fullPage: false });

  await page.getByTestId('mass-update-quantity-regular').fill('1');
  await page.screenshot({ path: shot('mass-update-with-quantity'), fullPage: false });
  console.log(JSON.stringify({ label: 'mass-update-panel-rendered' }));
});

test('Mass Update Location panel opens from a collection set page', async ({ context, page }) => {
  test.skip(!getLocalTestJwt(), 'E2E_TEST_JWT_1337 not set');
  await authenticateAsLocalTestUser(context);

  await page.goto(`/collections/${LOCAL_TEST_USER_ID}/${TEST_SET_SLUG}?contentType=cards`);
  await page.waitForLoadState('networkidle');

  await page.getByTestId('collection-set-more-actions').click();
  await page.getByRole('menuitem', { name: 'Locations' }).click();
  await page.getByTestId('mass-update-location-quantity-regular').waitFor();

  await page.screenshot({ path: shot('mass-update-location-panel-open'), fullPage: false });
  console.log(JSON.stringify({ label: 'mass-update-location-panel-rendered' }));
});
