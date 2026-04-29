import { expect, test } from '@playwright/test';
import path from 'path';
import { authenticateAsLocalTestUser, getLocalTestJwt } from '../../utils/auth';

// User story: an authenticated user navigates to /goals/create, fills out the
// form, and would submit. We do NOT submit here to avoid mutating the test
// user's goal list — capturing the populated form is the manual-verify value.

const SHOTS_DIR = path.join(process.cwd(), 'test-results', 'manual-screenshots');
const shot = (name: string) => path.join(SHOTS_DIR, `${name}.png`);

test('Create Goal form renders, accepts input, button enables', async ({ context, page }) => {
  test.skip(!getLocalTestJwt(), 'E2E_TEST_JWT_1337 not set');
  await authenticateAsLocalTestUser(context);

  await page.goto('/goals/create');
  await page.waitForLoadState('networkidle');

  await page.screenshot({ path: shot('create-goal-form-empty'), fullPage: false });

  await page.getByLabel('Goal Name').fill('Manual Verify Test Goal (do not save)');
  await page.screenshot({ path: shot('create-goal-form-filled'), fullPage: false });

  // Confirm the submit button is enabled — the form is valid by default.
  const submit = page.getByRole('button', { name: 'Create Goal' });
  await expect(submit).toBeEnabled();

  console.log(JSON.stringify({ label: 'create-goal-form-ready-to-submit' }));
  // Intentionally not clicking "Create Goal" — leaves the test user's goals untouched.
});
