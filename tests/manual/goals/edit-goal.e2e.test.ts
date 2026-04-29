import { expect, test } from '@playwright/test';
import path from 'path';
import { authenticateAsLocalTestUser, getLocalTestJwt } from '../../utils/auth';

// User story: an authenticated user opens an existing goal to edit it.
// User 1337 owns goal id 6 ("Timmy") in the local DB — stable pick.

const SHOTS_DIR = path.join(process.cwd(), 'test-results', 'manual-screenshots');
const shot = (name: string) => path.join(SHOTS_DIR, `${name}.png`);

const TEST_GOAL_ID = 6;

test('Edit Goal form loads, populates, and is editable', async ({ context, page }) => {
  test.skip(!getLocalTestJwt(), 'E2E_TEST_JWT_1337 not set');
  await authenticateAsLocalTestUser(context);

  await page.goto(`/goals/edit/${TEST_GOAL_ID}`);
  await page.waitForLoadState('networkidle');

  // Form fields populate.
  await page.getByTestId('target-quantity-all').waitFor();
  const goalNameInput = page.getByLabel('Goal Name');
  await expect(goalNameInput).toBeVisible();

  await page.screenshot({ path: shot('edit-goal-form-loaded'), fullPage: false });
  console.log(JSON.stringify({ label: 'edit-goal-form-loaded', goalId: TEST_GOAL_ID }));

  // Demonstrate edit interaction without saving.
  const original = await goalNameInput.inputValue();
  await goalNameInput.fill(`${original} (manual verify edit)`);
  await page.screenshot({ path: shot('edit-goal-form-modified'), fullPage: false });
  // Restore so the test doesn't leave dirty UI state for follow-on flows.
  await goalNameInput.fill(original);
  console.log(JSON.stringify({ label: 'edit-goal-form-restored', original }));
});
