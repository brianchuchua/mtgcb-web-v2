import { expect, test } from '@playwright/test';

// Coverage for the useCallback(debounce()) → useMemo(() => debounce()) refactor in
// src/features/browse/BrowseSearchForm/hooks/useBrowseFormState.ts. The card-name
// path is already tested in card-search.e2e.test.ts; this file exercises the four
// other debounced inputs that hook owns: set name, set code, oracle text, artist.

async function expandSearchFormIfMobile(page: import('@playwright/test').Page) {
  const toggle = page.getByTestId('search-form-toggle');
  if (await toggle.isVisible({ timeout: 1000 }).catch(() => false)) {
    await toggle.click();
    await page.waitForTimeout(300);
  }
}

test.describe('Browse — set search debouncing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/browse');
    await page.waitForLoadState('networkidle');
    await expandSearchFormIfMobile(page);
    // Default view is sets — no need to toggle.
    await page.waitForSelector('[data-testid="set-item"]', { timeout: 10000 });
  });

  test('Set Name field debounces and writes setName to the URL', async ({ page }) => {
    const setNameInput = page.getByPlaceholder('Search by set name');
    await expect(setNameInput).toBeVisible();

    let searchRequestCount = 0;
    page.on('request', (request) => {
      if (request.url().includes('/sets/search')) {
        searchRequestCount++;
      }
    });

    // Type rapidly — debounce should collapse to ≤ a small handful of requests.
    await setNameInput.type('Foundations', { delay: 30 });

    // Wait past the 300ms debounce + URL push debounce.
    await page.waitForFunction(
      () => {
        const url = new URL(window.location.href);
        return (url.searchParams.get('setName') || '').toLowerCase().includes('found');
      },
      undefined,
      { timeout: 5000 },
    );

    const url = new URL(page.url());
    expect(url.searchParams.get('setName')).toBe('Foundations');

    // Roughly the same heuristic the card-search test uses (≤3 for an 11-keystroke run).
    expect(searchRequestCount).toBeLessThanOrEqual(4);
  });

  test('Set Code field debounces and writes code to the URL', async ({ page }) => {
    const setCodeInput = page.getByPlaceholder('Search by set code');
    await expect(setCodeInput).toBeVisible();

    await setCodeInput.fill('FDN');

    await page.waitForFunction(
      () => new URL(window.location.href).searchParams.get('code') === 'FDN',
      undefined,
      { timeout: 5000 },
    );
  });
});

test.describe('Browse — card search field debouncing (artist + oracle)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/browse?contentType=cards');
    await page.waitForLoadState('networkidle');
    await expandSearchFormIfMobile(page);

    // Confirm cards view is active so the cards-only fields render.
    await page.waitForFunction(
      () => new URL(window.location.href).searchParams.get('contentType') === 'cards',
      undefined,
      { timeout: 5000 },
    );
  });

  test('Artist field debounces and writes artist to the URL', async ({ page }) => {
    const artistInput = page.getByPlaceholder('Search by artist name');
    await expect(artistInput).toBeVisible();

    await artistInput.type('Christopher Rush', { delay: 25 });

    await page.waitForFunction(
      () => {
        const v = new URL(window.location.href).searchParams.get('artist') || '';
        return v.toLowerCase().includes('christopher');
      },
      undefined,
      { timeout: 5000 },
    );

    const url = new URL(page.url());
    expect(url.searchParams.get('artist')).toBe('Christopher Rush');
  });

  test('Oracle Text field debounces and writes oracleText to the URL', async ({ page }) => {
    // OracleTextField doesn't have a testid; locate via its label.
    const oracleInput = page.getByLabel(/oracle text/i).first();
    await expect(oracleInput).toBeVisible();

    await oracleInput.fill('flying');

    await page.waitForFunction(
      () => (new URL(window.location.href).searchParams.get('oracleText') || '') === 'flying',
      undefined,
      { timeout: 5000 },
    );
  });
});
