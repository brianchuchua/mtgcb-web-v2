import { test } from '@playwright/test';
import path from 'path';
import { LOCAL_TEST_USER_ID, authenticateAsLocalTestUser, getLocalTestJwt } from '../../utils/auth';

// User story: from the Edit Cards page, clicking the selected card's image or
// metadata should land the user on their collection-context card page (with
// quantities, locations, etc.) — not the public /browse card page.

const SHOTS_DIR = path.join(process.cwd(), 'test-results', 'manual-screenshots');
const shot = (name: string) => path.join(SHOTS_DIR, `${name}.png`);

test.describe('User story: Edit Cards card link goes to collection entry', () => {
  test.beforeEach(async ({ context }) => {
    test.skip(!getLocalTestJwt(), 'E2E_TEST_JWT_1337 not set');
    await authenticateAsLocalTestUser(context);
  });

  test('happy path: select a card, click image, lands on collection card page', async ({ page }) => {
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

    await page.goto('/collections/edit-cards');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: shot('edit-cards-link-01-landing'), fullPage: false });

    const searchBox = page.getByLabel('Search cards to add or remove!');
    await searchBox.click();
    await searchBox.fill('Giant Spi');

    await page.getByRole('option').first().waitFor({ timeout: 10000 });
    await page.getByRole('option').first().click();
    await page.getByTestId('edit-cards-quantity-regular').waitFor();
    await page.screenshot({ path: shot('edit-cards-link-02-card-selected'), fullPage: false });

    const cardImage = page.locator('img[alt="Giant Spider"]').first();
    const beforeUrl = page.url();
    await cardImage.click();

    await page.waitForURL(/\/collections\/\d+\/cards\//, { timeout: 5000 });
    await page.waitForLoadState('networkidle');
    const afterUrl = page.url();
    await page.screenshot({ path: shot('edit-cards-link-03-collection-card-page'), fullPage: false });

    console.log(
      JSON.stringify({
        label: 'edit-cards-link-result',
        beforeUrl,
        afterUrl,
        landedOnCollectionPage: afterUrl.includes(`/collections/${LOCAL_TEST_USER_ID}/cards/`),
        landedOnBrowsePage: afterUrl.includes('/browse/cards/'),
        reactErrors,
      }),
    );
  });
});
