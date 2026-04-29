import { test } from '@playwright/test';
import path from 'path';
import { LOCAL_TEST_USER_ID, authenticateAsLocalTestUser, getLocalTestJwt } from '../../utils/auth';

// User story: an authenticated user opens the Mass Entry panel from their
// collection cards page to bulk-add card quantities.

const SHOTS_DIR = path.join(process.cwd(), 'test-results', 'manual-screenshots');
const shot = (name: string) => path.join(SHOTS_DIR, `${name}.png`);

test('Mass Entry panel opens from collection cards page', async ({ context, page }) => {
  test.skip(!getLocalTestJwt(), 'E2E_TEST_JWT_1337 not set');
  await authenticateAsLocalTestUser(context);

  await page.goto(`/collections/${LOCAL_TEST_USER_ID}?contentType=cards`);
  await page.waitForLoadState('networkidle');

  await page.getByTestId('collection-more-actions').click();
  await page.getByRole('menuitem', { name: 'Mass Update' }).click();
  await page.getByTestId('mass-entry-quantity-regular').waitFor();

  await page.screenshot({ path: shot('mass-entry-panel-open'), fullPage: false });

  // Type a quantity to demonstrate the input works.
  await page.getByTestId('mass-entry-quantity-regular').fill('3');
  await page.screenshot({ path: shot('mass-entry-with-quantity'), fullPage: false });
  console.log(JSON.stringify({ label: 'mass-entry-panel-rendered' }));
});
