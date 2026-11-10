import { expect, Page, test } from '@playwright/test';

// Repro for "Back button loses the page number" (Notion 295e7f6b51f2807a).
//
// Browse sets, go to page 3, open a set, press Back: you used to land on page 1, because the
// page number wasn't in the URL and Browse always started at page 1 when it loaded. The page
// is now in the URL (?page=3), so Back returns to it.
test.describe('Browse: Back from a set returns to the same page', () => {
  const firstSetName = (page: Page) => page.getByTestId('set-name').first().textContent();

  const pageInUrl = (page: Page, expected: string | null) =>
    page.waitForFunction((want) => new URL(location.href).searchParams.get('page') === want, expected, {
      timeout: 10000,
    });

  // Waits for both the new cards and the URL, so each page is its own history entry before
  // the next click.
  const nextPage = async (page: Page, to: number) => {
    const before = await firstSetName(page);
    await page.getByTestId('pagination-top').getByTestId('pagination-next').click();
    await page.waitForFunction(
      (prev) => document.querySelector('[data-testid="set-name"]')?.textContent !== prev,
      before,
      { timeout: 10000 },
    );
    await pageInUrl(page, String(to));
  };

  test('page 3 -> open a set -> Back lands on page 3', async ({ page }) => {
    await page.goto('/browse?contentType=sets');
    await page.waitForSelector('[data-testid="set-item"]');

    await nextPage(page, 2);
    await nextPage(page, 3);
    const pageThreeFirstSet = await firstSetName(page);

    // Open the first set on page 3.
    await page.locator('[data-testid="set-item"] a[href^="/browse/sets/"]').first().click();
    await page.waitForURL(/\/browse\/sets\/[^/?]+/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    // The set page must not pick up Browse's page number (that added a history entry, so Back
    // stayed on the set page).
    expect(new URL(page.url()).searchParams.get('page')).toBeNull();

    await page.goBack();
    await page.waitForURL(/\/browse\?/, { timeout: 10000 });
    await page.waitForSelector('[data-testid="set-item"]');
    await page.waitForTimeout(500);

    expect(new URL(page.url()).searchParams.get('page')).toBe('3');
    await expect(page.getByTestId('set-name').first()).toHaveText(pageThreeFirstSet || '');
  });

  test('Sets page 3 -> switch to Cards shows Cards page 1', async ({ page }) => {
    await page.goto('/browse?contentType=sets&page=3');
    await page.waitForSelector('[data-testid="set-item"]');
    await expect(page.getByTestId('page-info').first()).toContainText('41-60');

    await page.getByRole('button', { name: 'View Cards' }).first().click();
    await page.waitForSelector('[data-testid="card-item"]');
    await page.waitForTimeout(1500);

    expect(new URL(page.url()).searchParams.get('page')).toBeNull();
    await expect(page.getByTestId('page-info').first()).toContainText('1-20');
  });

  test('search page 2 -> switch to Cards -> one Back lands on page 2 of the search', async ({ page }) => {
    await page.goto('/browse?contentType=sets&setName=dominaria&page=2');
    await page.waitForSelector('[data-testid="set-item"]');
    const pageTwoFirstSet = await firstSetName(page);

    await page.getByRole('button', { name: 'View Cards' }).first().click();
    await page.waitForSelector('[data-testid="card-item"]');
    await page.waitForTimeout(1500);

    await page.goBack();
    await page.waitForSelector('[data-testid="set-item"]');
    await page.waitForTimeout(1500);

    // Back used to rewrite the URL to page 1 of the search, adding an entry
    const url = new URL(page.url());
    expect(url.searchParams.get('page')).toBe('2');
    expect(url.searchParams.get('setName')).toBe('dominaria');
    await expect(page.getByTestId('set-name').first()).toHaveText(pageTwoFirstSet || '');
  });

  test('a page past the end does not offer Next', async ({ page }) => {
    await page.goto('/browse?contentType=sets&page=999');
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('pagination-top').getByTestId('pagination-next')).toBeDisabled();
  });

  test('Back walks page 3 -> 2 -> 1', async ({ page }) => {
    await page.goto('/browse?contentType=sets');
    await page.waitForSelector('[data-testid="set-item"]');
    const pageOneFirstSet = await firstSetName(page);
    await nextPage(page, 2);
    const pageTwoFirstSet = await firstSetName(page);
    await nextPage(page, 3);

    await page.goBack();
    await pageInUrl(page, '2');
    await expect(page.getByTestId('set-name').first()).toHaveText(pageTwoFirstSet || '', { timeout: 10000 });
    await page.goBack();
    await pageInUrl(page, null);
    await expect(page.getByTestId('set-name').first()).toHaveText(pageOneFirstSet || '', { timeout: 10000 });
  });
});
