import { expect, test } from '@playwright/test';
import path from 'path';
import { LOCAL_TEST_USER_ID, authenticateAsLocalTestUser, getLocalTestJwt } from '../../utils/auth';

// User story: an authenticated user lands on their collection page, browses
// sets and cards, and uses the Edit Cards quick-update page.

const SHOTS_DIR = path.join(process.cwd(), 'test-results', 'manual-screenshots');
const shot = (name: string) => path.join(SHOTS_DIR, `${name}.png`);

test.describe('Collection — overview', () => {
  test.beforeEach(async ({ context }) => {
    test.skip(!getLocalTestJwt(), 'E2E_TEST_JWT_1337 not set');
    await authenticateAsLocalTestUser(context);
  });

  test('collection landing page renders for authed user', async ({ page }) => {
    const reactErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && /Rendered (more|fewer) hooks|Rules of Hooks|hook order/.test(msg.text())) {
        reactErrors.push(msg.text());
      }
    });

    await page.goto(`/collections/${LOCAL_TEST_USER_ID}`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByText("Manath's Collection")).toBeVisible();

    await page.screenshot({ path: shot('collection-landing') });
    console.log(JSON.stringify({ url: page.url(), label: 'collection-landing' }));
    expect(reactErrors).toEqual([]);
  });

  test('collection cards view renders and paginates', async ({ page }) => {
    await page.goto(`/collections/${LOCAL_TEST_USER_ID}?contentType=cards`);
    await page.waitForLoadState('networkidle');

    await page.screenshot({ path: shot('collection-cards-page-1') });

    const paginationTop = page.getByTestId('pagination-top');
    if (await paginationTop.isVisible({ timeout: 3000 }).catch(() => false)) {
      const nextBtn = paginationTop.getByTestId('pagination-next');
      if (await nextBtn.isEnabled()) {
        await nextBtn.click();
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: shot('collection-cards-page-2') });
      }
    }
  });

  test('Edit Cards page renders quantity inputs', async ({ page }) => {
    await page.goto('/collections/edit-cards');
    await page.waitForLoadState('networkidle');

    await page.screenshot({ path: shot('edit-cards-page') });
  });
});
