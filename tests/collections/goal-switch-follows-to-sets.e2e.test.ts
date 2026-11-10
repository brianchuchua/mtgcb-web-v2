import { expect, Page, test } from '@playwright/test';
import { LOCAL_TEST_USER_ID, authenticateAsLocalTestUser, getLocalTestJwt } from '../utils/auth';

// Repro for "Goal selection navigation too sticky or not enough" (Notion 2b0e7f6b51f280c5).
//
// Report (Nov 2025): open goal A from the Goals page, go back, open goal B, then switch to
// Sets: the Sets view still showed goal A. Cause was stale sessionStorage for the view you
// weren't on. Fixed in web 1.24.8 by copying the goal into the other view's saved state
// (syncSharedFieldsToStorage). This pins it.
test.describe('Collection goal: opening a second goal carries over to the Sets view', () => {
  test.beforeEach(async ({ context }) => {
    test.skip(!getLocalTestJwt(), 'Set E2E_TEST_JWT_1337 to run (see tests/utils/auth.ts)');
    await authenticateAsLocalTestUser(context);
  });

  const goalLinks = (page: Page) =>
    page.locator(`a[href*="/collections/${LOCAL_TEST_USER_ID}?"][href*="goalId="]`);

  const goalIdOf = (href: string | null) => new URL(href || '', 'http://x').searchParams.get('goalId');

  test('Sets view shows goal B after opening goal A then goal B from /goals', async ({ page }) => {
    await page.goto('/goals');
    await goalLinks(page).first().waitFor({ timeout: 15000 });

    const hrefs = await goalLinks(page).evaluateAll((as) => as.map((a) => a.getAttribute('href')));
    const ids = [...new Set(hrefs.map(goalIdOf).filter(Boolean))];
    test.skip(ids.length < 2, 'Needs two goals for user 1337');
    const [goalA, goalB] = ids;

    // Goal A: cards view, then Sets once so the Sets view has saved state with goal A.
    await page.locator(`a[href*="goalId=${goalA}"]`).first().click();
    await page.waitForURL(new RegExp(`goalId=${goalA}`), { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await page.getByTestId('content-type-toggle-sets').click();
    await page.waitForFunction(() => new URL(location.href).searchParams.get('contentType') === 'sets');
    await page.waitForLoadState('networkidle');
    expect(new URL(page.url()).searchParams.get('goalId')).toBe(goalA);

    // Back to /goals, open goal B (lands on the cards view).
    await page.goto('/goals');
    await page.locator(`a[href*="goalId=${goalB}"]`).first().click();
    await page.waitForURL(new RegExp(`goalId=${goalB}`), { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Switch to Sets: it must show goal B, not the goal A it last showed.
    await page.getByTestId('content-type-toggle-sets').click();
    await page.waitForFunction(() => new URL(location.href).searchParams.get('contentType') === 'sets');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    expect(new URL(page.url()).searchParams.get('goalId')).toBe(goalB);
  });
});
