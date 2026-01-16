import { expect, test } from '@playwright/test';

test.describe('Card Details Page', () => {
  test.describe('Basic Rendering', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to browse page in cards mode
      await page.goto('/browse?contentType=cards');
      await page.waitForLoadState('networkidle');

      // Wait for cards to load
      await page.waitForSelector('[data-testid="card-item"]', {
        state: 'visible',
        timeout: 10000,
      });
    });

    test('should navigate to card details page and display card image', async ({ page }) => {
      // Get the first card item
      const firstCardItem = page.getByTestId('card-item').first();

      // Click on the card to navigate to details
      await firstCardItem.click();

      // Wait for navigation to complete
      await page.waitForURL(/\/browse\/cards\/[a-z0-9-]+\/[a-f0-9-]+$/);
      await page.waitForLoadState('networkidle');

      // Verify card image container is visible
      await expect(page.getByTestId('card-image-container')).toBeVisible();

      // Verify card image loads (wait for img element to be present)
      const cardImage = page.getByTestId('card-image');
      await expect(cardImage).toBeVisible({ timeout: 10000 });

      // Verify the image has a valid src attribute
      const imageSrc = await cardImage.getAttribute('src');
      expect(imageSrc).toContain('r2.mtgcollectionbuilder.com');
    });

    test('should display card name correctly on details page', async ({ page }) => {
      // Get the first card item and its name
      const firstCardItem = page.getByTestId('card-item').first();
      const cardNameElement = firstCardItem.getByTestId('card-name');
      const expectedCardName = await cardNameElement.textContent();

      // Navigate to details page
      await firstCardItem.click();
      await page.waitForURL(/\/browse\/cards\/[a-z0-9-]+\/[a-f0-9-]+$/);
      await page.waitForLoadState('networkidle');

      // Verify card name is displayed on the details page
      const detailsCardName = page.getByTestId('card-name');
      await expect(detailsCardName).toBeVisible();

      // The card name on details page should match what we clicked on
      const displayedName = await detailsCardName.textContent();
      expect(displayedName).toBe(expectedCardName);
    });

    test('should display set information on card details page', async ({ page }) => {
      // Navigate to a card details page
      const firstCardItem = page.getByTestId('card-item').first();
      await firstCardItem.click();

      await page.waitForURL(/\/browse\/cards\/[a-z0-9-]+\/[a-f0-9-]+$/);
      await page.waitForLoadState('networkidle');

      // Verify set name is displayed and clickable
      const setNameLink = page.getByTestId('card-set-name');
      await expect(setNameLink).toBeVisible();

      // Verify set name has content
      const setName = await setNameLink.textContent();
      expect(setName).toBeTruthy();
      expect(setName!.length).toBeGreaterThan(0);

      // Verify set name is a link (has href attribute)
      const href = await setNameLink.getAttribute('href');
      expect(href).toContain('/browse/sets/');
    });

    test('should display breadcrumbs with correct navigation path', async ({ page }) => {
      // Navigate to a card details page
      const firstCardItem = page.getByTestId('card-item').first();
      await firstCardItem.click();
      await page.waitForURL(/\/browse\/cards\/[a-z0-9-]+\/[a-f0-9-]+$/);
      await page.waitForLoadState('networkidle');

      // Verify breadcrumbs are displayed
      const breadcrumbs = page.getByTestId('breadcrumbs');
      await expect(breadcrumbs).toBeVisible();

      // Verify breadcrumb trail includes Home, Browse, Cards
      await expect(breadcrumbs.getByText('Home')).toBeVisible();
      await expect(breadcrumbs.getByText('Browse')).toBeVisible();
      await expect(breadcrumbs.getByText('Cards')).toBeVisible();
    });

    test('should load all basic card details elements', async ({ page }) => {
      // Navigate to a card details page
      const firstCardItem = page.getByTestId('card-item').first();
      await firstCardItem.click();

      await page.waitForURL(/\/browse\/cards\/[a-z0-9-]+\/[a-f0-9-]+$/);
      await page.waitForLoadState('networkidle');

      // Verify all basic elements are present
      await expect(page.getByTestId('card-image-container')).toBeVisible();
      await expect(page.getByTestId('card-name')).toBeVisible();
      await expect(page.getByTestId('card-set-name')).toBeVisible();

      // Verify URL structure is correct
      const url = page.url();
      expect(url).toMatch(/\/browse\/cards\/[a-z0-9-]+\/[a-f0-9-]+$/);
    });
  });
});
