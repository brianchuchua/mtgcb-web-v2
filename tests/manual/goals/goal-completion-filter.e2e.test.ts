import { expect, test } from '@playwright/test';
import path from 'path';
import { LOCAL_TEST_USER_ID, authenticateAsLocalTestUser, getLocalTestJwt } from '../../utils/auth';

// User story: an authenticated user selects a goal, then toggles the goal
// completion status filter (ALL / MISSING / DONE) to focus on different parts
// of their progress.

const SHOTS_DIR = path.join(process.cwd(), 'test-results', 'manual-screenshots');
const shot = (name: string) => path.join(SHOTS_DIR, `${name}.png`);

const GOAL_ID = 8677; // "1x of all cards" — discovered via the goal-flow test.

test('Goal completion filter (ALL / MISSING / DONE) toggles result subset', async ({ context, page }) => {
  test.skip(!getLocalTestJwt(), 'E2E_TEST_JWT_1337 not set');
  await authenticateAsLocalTestUser(context);

  const reactErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' && /Rendered (more|fewer) hooks|Rules of Hooks|hook order/.test(msg.text())) {
      reactErrors.push(msg.text());
    }
  });

  // Start under the chosen goal.
  await page.goto(`/collections/${LOCAL_TEST_USER_ID}?goalId=${GOAL_ID}&contentType=sets`);
  await page.waitForLoadState('networkidle');

  // The completion filter renders as toggle buttons labeled "All" / "Missing" / "Done".
  // (CSS uppercases them visually but the DOM text is mixed-case.)
  const allBtn = page.getByRole('button', { name: 'All', exact: true }).first();
  const missingBtn = page.getByRole('button', { name: 'Missing', exact: true }).first();
  const doneBtn = page.getByRole('button', { name: 'Done', exact: true }).first();

  await expect(allBtn).toBeVisible();
  await page.screenshot({ path: shot('goal-filter-all'), fullPage: false });

  await missingBtn.click();
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: shot('goal-filter-missing'), fullPage: false });
  console.log(JSON.stringify({ url: page.url(), label: 'goal-filter-missing' }));

  await doneBtn.click();
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: shot('goal-filter-done'), fullPage: false });
  console.log(JSON.stringify({ url: page.url(), label: 'goal-filter-done' }));

  expect(reactErrors).toEqual([]);
});
