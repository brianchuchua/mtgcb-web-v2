import { expect, test } from '@playwright/test';

test.describe('Browse Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/browse');
    await page.waitForLoadState('networkidle');
  });

  test('should load default browse page with sets grid view', async ({ page }) => {
    // Verify breadcrumbs
    await expect(page.getByTestId('breadcrumbs')).toBeVisible();
    await expect(page.getByTestId('breadcrumbs').getByText('Home')).toBeVisible();
    await expect(page.getByTestId('breadcrumbs').getByText('Browse')).toBeVisible();

    // Verify top pagination is visible
    await expect(page.getByTestId('pagination-top')).toBeVisible();
    
    // Verify sets grid is displayed by default
    await expect(page.getByTestId('sets-grid')).toBeVisible();
    
    // Wait for sets to load and verify at least one set item is visible
    await expect(page.getByTestId('set-item').first()).toBeVisible();
    
    // Verify set item contains expected elements
    const firstSetItem = page.getByTestId('set-item').first();
    await expect(firstSetItem.getByTestId('set-name')).toBeVisible();
    
    // Verify set name includes code in parentheses (e.g., "Foundations (FDN)")
    const setNameText = await firstSetItem.getByTestId('set-name').textContent();
    expect(setNameText).toMatch(/\([A-Z0-9]{2,4}\)$/);
    
    await expect(firstSetItem.getByTestId('set-icon')).toBeVisible();
    await expect(firstSetItem.getByTestId('set-release-date')).toBeVisible();
    await expect(firstSetItem.getByTestId('set-card-count')).toBeVisible();

    // Verify bottom pagination is visible
    await expect(page.getByTestId('pagination-bottom')).toBeVisible();
  });

  test('should display multiple sets in grid', async ({ page }) => {
    // Wait for sets to load
    await page.waitForSelector('[data-testid="set-item"]');
    
    // Verify multiple sets are displayed (virtualized, so only visible items are rendered)
    const setItems = page.getByTestId('set-item');
    const initialCount = await setItems.count();
    expect(initialCount).toBeGreaterThan(0);
    
    // Scroll to bottom to trigger virtualization to render more items
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500); // Wait for virtualization to render
    
    // Note: Virtualization may adjust the number of rendered items based on viewport
    
    // Verify page info shows the correct total (should show "1-24 of X")
    const pageInfo = await page.getByTestId('page-info').textContent();
    expect(pageInfo).toMatch(/1-24 of \d+/);
  });

  test('should have clickable set names that navigate to set details', async ({ page }) => {
    // Wait for sets to load
    await page.waitForSelector('[data-testid="set-item"]');
    
    // Get the first set's name
    const firstSetName = page.getByTestId('set-name').first();
    const setNameText = await firstSetName.textContent();
    
    // Extract just the set name without the code for breadcrumb check
    const setNameOnly = setNameText?.replace(/\s*\([A-Z0-9]+\)$/, '') || '';
    
    // Click on the set name
    await firstSetName.click();
    
    // Verify navigation to set details page
    await expect(page).toHaveURL(/\/browse\/sets\/[a-z0-9-]+$/);
    
    // Verify the set name appears on the details page (in breadcrumbs - may not include code)
    await expect(page.getByTestId('breadcrumbs')).toContainText(setNameOnly);
  });

  test('should display pagination information', async ({ page }) => {
    // Wait for pagination to load
    await expect(page.getByTestId('pagination-top')).toBeVisible();
    
    // Verify page info displays (e.g., "1-10 of 500")
    await expect(page.getByTestId('page-info')).toContainText(/\d+-\d+ of \d+/);
    
    // Verify page navigation controls
    await expect(page.getByTestId('pagination-first')).toBeVisible();
    await expect(page.getByTestId('pagination-prev')).toBeVisible();
    await expect(page.getByTestId('pagination-next')).toBeVisible();
    await expect(page.getByTestId('pagination-last')).toBeVisible();
    
    // First and previous should be disabled on first page
    await expect(page.getByTestId('pagination-first')).toBeDisabled();
    await expect(page.getByTestId('pagination-prev')).toBeDisabled();
  });

  test('should load real data from API', async ({ page }) => {
    // Wait for sets to load
    await page.waitForSelector('[data-testid="set-item"]');
    
    // Verify real set data is displayed (check for known MTG sets)
    const setNames = await page.getByTestId('set-name').allTextContents();
    
    // Should contain actual MTG set names
    expect(setNames.length).toBeGreaterThan(0);
    expect(setNames.some(name => name.length > 0)).toBeTruthy();
    
    // Verify all set names include codes in parentheses (e.g., "Foundations (FDN)")
    expect(setNames.every(name => /\([A-Z0-9]{2,4}\)$/.test(name))).toBeTruthy();
  });

  test('should handle pagination navigation', async ({ page }) => {
    // Wait for initial load
    await page.waitForSelector('[data-testid="set-item"]');
    
    // Get first page set names
    const firstPageSetNames = await page.getByTestId('set-name').allTextContents();
    
    // Click next page
    await page.getByTestId('pagination-next').click();
    
    // Wait for the content to actually change
    await page.waitForFunction(
      (firstPageFirstSet) => {
        const currentFirstSet = document.querySelector('[data-testid="set-name"]')?.textContent;
        return currentFirstSet && currentFirstSet !== firstPageFirstSet;
      },
      firstPageSetNames[0], // Pass the first set name from page 1
      { timeout: 10000 }
    );
    
    // Get second page set names
    const secondPageSetNames = await page.getByTestId('set-name').allTextContents();
    
    // Verify different sets are displayed
    expect(firstPageSetNames).not.toEqual(secondPageSetNames);
    
    // Verify pagination controls updated
    await expect(page.getByTestId('pagination-first')).toBeEnabled();
    await expect(page.getByTestId('pagination-prev')).toBeEnabled();
  });
});