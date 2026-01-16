import { expect, test } from '@playwright/test';

test.describe('Card Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/browse');
    await page.waitForLoadState('networkidle');
    
    // Check if we need to expand the search form (mobile view)
    const searchFormToggle = page.getByTestId('search-form-toggle');
    if (await searchFormToggle.isVisible({ timeout: 1000 }).catch(() => false)) {
      await searchFormToggle.click();
      await page.waitForTimeout(300); // Wait for animation
    }
    
    // Wait for the content type toggle to be visible
    await page.waitForSelector('[data-testid="content-type-toggle-cards"]', { 
      state: 'visible',
      timeout: 10000 
    });
    
    // Switch to cards view
    await page.getByTestId('content-type-toggle-cards').click();
    
    // Wait for URL to update to cards view
    await page.waitForFunction(
      () => window.location.href.includes('contentType=cards'),
      { timeout: 5000 }
    );
  });

  test.describe('Card Name Field', () => {
    test('should display card name search field', async ({ page }) => {
      // Verify the card name field is visible
      const cardNameField = page.getByTestId('card-name-field');
      await expect(cardNameField).toBeVisible();
      
      // Verify it has a search icon
      await expect(page.getByTestId('card-name-search-icon')).toBeVisible();
      
      // Verify placeholder text (check the input element within the field)
      const cardNameInput = cardNameField.locator('input');
      await expect(cardNameInput).toHaveAttribute('placeholder', 'Search by card name');
    });

    test('should search for cards by name', async ({ page }) => {
      const cardNameField = page.getByTestId('card-name-field');
      const cardNameInput = cardNameField.locator('input');
      
      // Type a search term
      await cardNameInput.fill('Lightning Bolt');
      
      // Wait for search results to update
      await page.waitForFunction(
        () => {
          const cardNames = Array.from(document.querySelectorAll('[data-testid="card-name"]')).map(el => el.textContent || '');
          return cardNames.some(name => name.toLowerCase().includes('lightning bolt'));
        },
        { timeout: 10000 }
      );
      
      // Verify cards grid is displayed
      await expect(page.getByTestId('cards-grid')).toBeVisible();
      
      // Verify search results contain cards with "Lightning Bolt" in the name
      const cardNames = await page.getByTestId('card-name').allTextContents();
      expect(cardNames.length).toBeGreaterThan(0);
      expect(cardNames.every(name => name.toLowerCase().includes('lightning bolt'))).toBeTruthy();
    });

    test('should handle partial name search', async ({ page }) => {
      const cardNameField = page.getByTestId('card-name-field');
      const cardNameInput = cardNameField.locator('input');

      // Search for partial name
      await cardNameInput.fill('Lightning');

      // Wait for search results to update - look for a card with "Lightning" in the name
      await page.waitForFunction(
        () => {
          const cardNames = Array.from(document.querySelectorAll('[data-testid="card-name"]')).map((el) => el.textContent || '');
          return cardNames.some((name) => name.toLowerCase().includes('lightning'));
        },
        { timeout: 10000 }
      );

      // Verify results include cards with "Lightning" in the name
      const cardNames = await page.getByTestId('card-name').allTextContents();

      expect(cardNames.length).toBeGreaterThan(0);
      expect(cardNames.every((name) => name.toLowerCase().includes('lightning'))).toBeTruthy();
    });

    test('should handle case-insensitive search', async ({ page }) => {
      const cardNameField = page.getByTestId('card-name-field');
      const cardNameInput = cardNameField.locator('input');
      
      // Search with mixed case
      await cardNameInput.fill('LIGHTNING bolt');
      
      // Wait for search results to update
      await page.waitForFunction(
        () => {
          const cardNames = Array.from(document.querySelectorAll('[data-testid="card-name"]')).map(el => el.textContent || '');
          return cardNames.some(name => name.toLowerCase().includes('lightning bolt'));
        },
        { timeout: 10000 }
      );
      
      // Verify results are found regardless of case
      const cardNames = await page.getByTestId('card-name').allTextContents();
      expect(cardNames.length).toBeGreaterThan(0);
      expect(cardNames.some(name => name.includes('Lightning Bolt'))).toBeTruthy();
    });

    test('should clear search and show all cards', async ({ page }) => {
      const cardNameField = page.getByTestId('card-name-field');
      const cardNameInput = cardNameField.locator('input');
      
      // First search for something specific
      await cardNameInput.fill('Lightning Bolt');
      
      // Wait for search results to update
      await page.waitForFunction(
        () => {
          const cardNames = Array.from(document.querySelectorAll('[data-testid="card-name"]')).map(el => el.textContent || '');
          return cardNames.some(name => name.toLowerCase().includes('lightning bolt'));
        },
        { timeout: 10000 }
      );
      
      // Verify we have filtered results
      const filteredCards = await page.getByTestId('card-name').allTextContents();
      expect(filteredCards.every(name => name.toLowerCase().includes('lightning'))).toBeTruthy();
      
      // Clear the search
      await cardNameInput.clear();
      
      // Wait for results to reset (check that we don't have Lightning Bolt anymore)
      await page.waitForFunction(
        () => {
          const cardNames = Array.from(document.querySelectorAll('[data-testid="card-name"]')).map(el => el.textContent || '');
          return !cardNames.some(name => name.toLowerCase().includes('lightning bolt'));
        },
        { timeout: 10000 }
      );
      
      // Verify we now have unfiltered results (variety of different cards)
      const allCards = await page.getByTestId('card-name').allTextContents();
      expect(allCards.length).toBeGreaterThan(0);
      
      // Check that not all cards contain "lightning" anymore
      expect(allCards.every(name => name.toLowerCase().includes('lightning'))).toBeFalsy();
      
      // Verify the search field is empty
      await expect(cardNameInput).toHaveValue('');
    });

    test('should handle special characters in search', async ({ page }) => {
      const cardNameField = page.getByTestId('card-name-field');
      const cardNameInput = cardNameField.locator('input');
      
      // Search with special characters
      await cardNameInput.fill('Ajani\'s Welcome');
      
      // Wait for search results to update
      await page.waitForFunction(
        () => {
          const cardNames = Array.from(document.querySelectorAll('[data-testid="card-name"]')).map(el => el.textContent || '');
          return cardNames.some(name => name.toLowerCase().includes('ajani'));
        },
        { timeout: 10000 }
      );
      
      // Verify the search works with apostrophes
      const cardNames = await page.getByTestId('card-name').allTextContents();
      expect(cardNames.some(name => name.includes('Ajani\'s Welcome'))).toBeTruthy();
    });

    test('should show no results message for non-existent card', async ({ page }) => {
      const cardNameField = page.getByTestId('card-name-field');
      const cardNameInput = cardNameField.locator('input');
      
      // Search for a card that doesn't exist
      await cardNameInput.fill('ThisCardDefinitelyDoesNotExist12345');
      
      // Wait for search to complete (either no results message or empty results)
      await page.waitForTimeout(500); // Wait for debounce
      await page.waitForLoadState('networkidle');
      
      // Verify no results message is shown
      await expect(page.getByText('No cards found')).toBeVisible();
    });

    test('should maintain search value when switching between views', async ({ page }) => {
      const cardNameField = page.getByTestId('card-name-field');
      const cardNameInput = cardNameField.locator('input');
      
      // Enter a search term
      await cardNameInput.fill('Lightning Bolt');
      
      // Wait for search results to update
      await page.waitForFunction(
        () => {
          const cardNames = Array.from(document.querySelectorAll('[data-testid="card-name"]')).map(el => el.textContent || '');
          return cardNames.some(name => name.toLowerCase().includes('lightning bolt'));
        },
        { timeout: 10000 }
      );
      
      // Switch to table view
      await page.getByTestId('view-mode-toggle-table').click();
      await page.waitForTimeout(300);
      
      // Verify search term is still in the field
      await expect(cardNameInput).toHaveValue('Lightning Bolt');
      
      // Switch back to grid view
      await page.getByTestId('view-mode-toggle-grid').click();
      await page.waitForTimeout(300);
      
      // Verify search term is still maintained
      await expect(cardNameInput).toHaveValue('Lightning Bolt');
    });

    test('should update URL with search parameters', async ({ page }) => {
      const cardNameField = page.getByTestId('card-name-field');
      const cardNameInput = cardNameField.locator('input');
      
      // Enter a search term
      await cardNameInput.fill('Lightning Bolt');
      
      // Wait for debounce
      await page.waitForTimeout(500);
      
      // Wait for URL to update with search parameter
      await page.waitForFunction(
        () => {
          return window.location.href.includes('name=Lightning');
        },
        { timeout: 5000 }
      );
      
      // Verify URL contains the search parameter
      const url = new URL(page.url());
      const searchParams = url.searchParams;
      
      expect(searchParams.get('name')).toBe('Lightning Bolt');
      expect(searchParams.get('contentType')).toBe('cards');
    });

    test('should handle rapid typing with debouncing', async ({ page }) => {
      const cardNameField = page.getByTestId('card-name-field');
      const cardNameInput = cardNameField.locator('input');
      
      // Track network requests
      let searchRequestCount = 0;
      page.on('request', request => {
        if (request.url().includes('/cards/search')) {
          searchRequestCount++;
        }
      });
      
      // Type rapidly
      await cardNameInput.type('L', { delay: 50 });
      await cardNameInput.type('i', { delay: 50 });
      await cardNameInput.type('g', { delay: 50 });
      await cardNameInput.type('h', { delay: 50 });
      await cardNameInput.type('t', { delay: 50 });
      
      // Wait for debounce period plus some buffer
      await page.waitForTimeout(500);
      await page.waitForLoadState('networkidle');
      
      // Should only make 1-2 requests due to debouncing, not 5
      expect(searchRequestCount).toBeLessThanOrEqual(2);
    });
  });
});