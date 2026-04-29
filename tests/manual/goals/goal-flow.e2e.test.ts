import { test } from '@playwright/test';
import path from 'path';
import { LOCAL_TEST_USER_ID, authenticateAsLocalTestUser, getLocalTestJwt } from '../../utils/auth';

const SHOTS_DIR = path.join(process.cwd(), 'test-results', 'manual-screenshots');

test.describe('Goal-based collection navigation', () => {
  test.beforeEach(async ({ context }) => {
    test.skip(!getLocalTestJwt(), 'E2E_TEST_JWT_1337 not set');
    await authenticateAsLocalTestUser(context);
  });

  test('open goal selector, list available goals, switch + navigate to a set', async ({ page }) => {
    const reactErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() !== 'error') return;
      const text = msg.text();
      if (
        text.includes('Rendered more hooks') ||
        text.includes('Rendered fewer hooks') ||
        text.includes('Rules of Hooks') ||
        text.includes('hook order')
      ) {
        reactErrors.push(text);
      }
    });

    await page.goto(`/collections/${LOCAL_TEST_USER_ID}`);
    await page.waitForLoadState('networkidle');

    await page.screenshot({ path: path.join(SHOTS_DIR, 'goal-01-collection-default.png') });

    // The Collection Goal selector is in the left sidebar.
    const goalSelector = page.getByLabel(/Collection Goal/i).first();
    const goalSelectorVisible = await goalSelector.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(JSON.stringify({ goalSelectorVisible, label: 'goal-selector-presence' }));

    if (!goalSelectorVisible) {
      console.log('goal selector not found via label; falling back to text search');
    }

    // Open the dropdown.
    await goalSelector.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SHOTS_DIR, 'goal-02-dropdown-open.png') });

    // Enumerate goal options.
    const options = page.getByRole('option');
    const optionCount = await options.count();
    const optionTexts: string[] = [];
    for (let i = 0; i < optionCount; i++) {
      optionTexts.push((await options.nth(i).textContent()) || '');
    }
    console.log(JSON.stringify({ optionCount, optionTexts, label: 'goal-options' }));

    if (optionCount < 2) {
      console.log('Only default goal exists — cannot exercise goal switch.');
      // Close the menu cleanly.
      await page.keyboard.press('Escape');
      return;
    }

    // Pick the first non-default goal.
    let pickedIndex = -1;
    for (let i = 0; i < optionCount; i++) {
      const txt = (optionTexts[i] || '').toLowerCase();
      if (!txt.includes('default')) {
        pickedIndex = i;
        break;
      }
    }
    if (pickedIndex < 0) pickedIndex = 1;

    console.log(JSON.stringify({ pickedIndex, pickedText: optionTexts[pickedIndex], label: 'goal-picked' }));

    await options.nth(pickedIndex).click();
    await page.waitForLoadState('networkidle');

    // URL should now have goalId param.
    await page.waitForFunction(
      () => new URL(window.location.href).searchParams.get('goalId') !== null,
      undefined,
      { timeout: 10000 },
    ).catch(() => {});

    const url = new URL(page.url());
    console.log(JSON.stringify({
      urlAfterSwitch: page.url(),
      goalId: url.searchParams.get('goalId'),
      label: 'after-goal-switch',
    }));

    await page.screenshot({ path: path.join(SHOTS_DIR, 'goal-03-after-switch.png') });

    // Click the first "View set" button to drill into a specific set under goal context.
    // This is the path that exercises useCollectionBrowseController's prev-goalId
    // tracking and the wait-for-Redux-sync logic.
    const viewSetButton = page.getByRole('link', { name: /view set/i }).first();
    await page.waitForTimeout(500); // let the goal-filtered set list settle
    const linkVisible = await viewSetButton.isVisible({ timeout: 3000 }).catch(() => false);
    if (linkVisible) {
      await viewSetButton.click();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: path.join(SHOTS_DIR, 'goal-04-set-page-with-goal.png') });
      const urlAfter = new URL(page.url());
      console.log(JSON.stringify({
        urlAfterSetNav: page.url(),
        goalIdPreserved: urlAfter.searchParams.get('goalId'),
        pathname: urlAfter.pathname,
        label: 'after-set-navigation',
      }));

      // Now toggle back to the collection root and confirm goalId is still attached.
      await page.goBack();
      await page.waitForLoadState('networkidle');
      const urlBack = new URL(page.url());
      console.log(JSON.stringify({
        urlAfterBack: page.url(),
        goalIdAfterBack: urlBack.searchParams.get('goalId'),
        label: 'after-back-navigation',
      }));
      await page.screenshot({ path: path.join(SHOTS_DIR, 'goal-05-back-to-collection.png') });
    } else {
      console.log('No "View set" button found.');
    }

    console.log(JSON.stringify({ reactErrors, label: 'react-errors' }));
  });
});
