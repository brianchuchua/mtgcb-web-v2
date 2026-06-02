import { expect, test } from '@playwright/test';
import { LOCAL_TEST_USER_ID, authenticateAsLocalTestUser, getLocalTestJwt } from '../utils/auth';

// Repro for: "Sets nav link resets collection goal instead of remembering most recently selected"
// (Notion ticket 356e7f6b51f2818dbed1e4aa66f73b54).
//
// Flow: pick goal X → switch to Sets view → click into a set → change goal to Default
// → click "Sets" breadcrumb → expected: stay on Default. Bug was that stale sessionStorage
// for the inactive view kept goalId=X and re-applied it on navigation.
test.describe('Collection goal: clearing goal persists across Sets breadcrumb navigation', () => {
  test.beforeEach(async ({ context }) => {
    test.skip(!getLocalTestJwt(), 'Set E2E_TEST_JWT_1337 to run (see tests/utils/auth.ts)');
    await authenticateAsLocalTestUser(context);
  });

  test('Default selection survives drilling into a set then clicking Sets breadcrumb', async ({ page }) => {
    // 1. Collection root — cards view, no goal.
    await page.goto(`/collections/${LOCAL_TEST_USER_ID}`);
    await page.waitForLoadState('networkidle');

    // 2. Pick a real goal from the selector.
    const goalSelector = page.getByLabel('Collection Goal').first();
    await goalSelector.click();

    const goalOptions = page.getByRole('option');
    const optionCount = await goalOptions.count();
    let pickedIndex = -1;
    for (let i = 0; i < optionCount; i++) {
      const txt = ((await goalOptions.nth(i).textContent()) || '').toLowerCase();
      if (!txt.includes('default') && !txt.includes('create new')) {
        pickedIndex = i;
        break;
      }
    }
    test.skip(pickedIndex < 0, 'No active goals available for user 1337 — skipping');

    await goalOptions.nth(pickedIndex).click();

    // URL picks up goalId after the goal is chosen.
    await page.waitForFunction(
      () => new URL(window.location.href).searchParams.get('goalId') !== null,
      undefined,
      { timeout: 10000 },
    );
    const pickedGoalId = new URL(page.url()).searchParams.get('goalId');
    expect(pickedGoalId).not.toBeNull();

    // 3. Switch to Sets view.
    await page.getByTestId('content-type-toggle-sets').click();
    await page.waitForFunction(
      () => new URL(window.location.href).searchParams.get('contentType') === 'sets',
      undefined,
      { timeout: 5000 },
    );
    await page.waitForLoadState('networkidle');

    // 4. Click into a specific set. Set links target /collections/{userId}/{slug}.
    // Exclude /migrate (sidenav "Update Cards" link) so we land on a real set tile.
    const setLink = page
      .locator(`a[href*="/collections/${LOCAL_TEST_USER_ID}/"]:not([href*="/migrate"])`)
      .filter({ hasNotText: /^$/ })
      .first();
    await setLink.waitFor({ timeout: 10000 });
    await setLink.click();
    await page.waitForURL(new RegExp(`/collections/${LOCAL_TEST_USER_ID}/[^/?]+`), { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Sanity: goalId travelled into the set page URL.
    expect(new URL(page.url()).searchParams.get('goalId')).toBe(pickedGoalId);

    // 5. Change goal back to Default (empty option) on the set page.
    const goalSelectorOnSet = page.getByLabel('Collection Goal').first();
    await goalSelectorOnSet.click();
    await page.getByRole('option').filter({ hasText: /Default \(all cards\)/i }).first().click();

    // URL should drop goalId.
    await page.waitForFunction(
      () => new URL(window.location.href).searchParams.get('goalId') === null,
      undefined,
      { timeout: 5000 },
    );

    // 6. Click the "Sets" breadcrumb.
    await page
      .getByTestId('breadcrumbs')
      .getByRole('link', { name: 'Sets', exact: true })
      .click();
    await page.waitForURL(new RegExp(`/collections/${LOCAL_TEST_USER_ID}(\\?|$)`), { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Allow any debounced URL-rewrite (100ms) plus a margin to fire. Without the fix,
    // stale sessionStorage repopulates Redux and the URL gets rewritten with goalId.
    await page.waitForTimeout(500);

    // 7. The bug assertion: goalId must NOT be back in the URL.
    const finalUrl = new URL(page.url());
    expect(finalUrl.searchParams.get('goalId')).toBeNull();

    // And the selector should still show Default.
    await expect(page.getByLabel('Collection Goal').first()).toContainText(/Default \(all cards\)/i);
  });
});
