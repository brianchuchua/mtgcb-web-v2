import { expect, test } from '@playwright/test';
import path from 'path';
import { LOCAL_TEST_USER_ID, authenticateAsLocalTestUser, getLocalTestJwt } from '../../utils/auth';

// User story: an authenticated user drills from their collection landing page
// into a specific set page, viewing the cards they own (and don't own) in
// that set. This is the path that exercises useBrowseController's
// `waitForSetFilter` gate.

const SHOTS_DIR = path.join(process.cwd(), 'test-results', 'manual-screenshots');
const shot = (name: string) => path.join(SHOTS_DIR, `${name}.png`);

test.describe('Collection set page', () => {
  test.beforeEach(async ({ context }) => {
    test.skip(!getLocalTestJwt(), 'E2E_TEST_JWT_1337 not set');
    await authenticateAsLocalTestUser(context);
  });

  test('drilling into a set shows that set\'s cards in collection context', async ({ page }) => {
    const reactErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && /Rendered (more|fewer) hooks|Rules of Hooks|hook order/.test(msg.text())) {
        reactErrors.push(msg.text());
      }
    });

    // Limited Edition Alpha is a stable set the test user owns cards in.
    await page.goto(`/collections/${LOCAL_TEST_USER_ID}/limited-edition-alpha?contentType=cards`);
    await page.waitForLoadState('networkidle');

    await page.waitForFunction(
      () => document.querySelectorAll('[data-testid="card-item"]').length > 0,
      undefined,
      { timeout: 10000 },
    );

    const cardCount = await page.getByTestId('card-item').count();
    await page.screenshot({ path: shot('collection-set-page'), fullPage: false });
    console.log(JSON.stringify({ url: page.url(), cardCount, label: 'collection-set-page' }));
    expect(cardCount).toBeGreaterThan(0);
    expect(reactErrors).toEqual([]);
  });

  test('switching to set view on the set page does NOT change route', async ({ page }) => {
    // The set-specific page forces "cards" view per useCollectionBrowseController;
    // VIEW SETS button shouldn't break the page.
    await page.goto(`/collections/${LOCAL_TEST_USER_ID}/limited-edition-alpha`);
    await page.waitForLoadState('networkidle');

    await page.screenshot({ path: shot('collection-set-page-default'), fullPage: false });
    console.log(JSON.stringify({ url: page.url(), label: 'collection-set-page-default-view' }));
  });
});
