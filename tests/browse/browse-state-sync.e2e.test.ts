import { expect, test } from '@playwright/test';

// Coverage for src/hooks/useBrowseStateSync.ts. That hook intentionally reads
// `hasInit.current` during render in two spots (suppressed react-compiler warnings
// with explanations). It also drives URL ↔ Redux sync, sessionStorage restore on
// F5, and view-type changes — all of which would break in subtle ways if the
// suppressions were ever removed without preserving behavior.

async function expandSearchFormIfMobile(page: import('@playwright/test').Page) {
  const toggle = page.getByTestId('search-form-toggle');
  if (await toggle.isVisible({ timeout: 1000 }).catch(() => false)) {
    await toggle.click();
    await page.waitForTimeout(300);
  }
}

test.describe('Browse — state sync (useBrowseStateSync)', () => {
  test('content-type toggle preserves search and updates URL', async ({ page }) => {
    await page.goto('/browse?contentType=cards');
    await page.waitForLoadState('networkidle');
    await expandSearchFormIfMobile(page);

    // Type a card-name search.
    const cardNameField = page.getByTestId('card-name-field');
    await cardNameField.locator('input').fill('Lightning');

    await page.waitForFunction(
      () => new URL(window.location.href).searchParams.get('name') === 'Lightning',
      undefined,
      { timeout: 5000 },
    );

    // Toggle to sets view.
    await page.getByTestId('content-type-toggle-sets').click();
    await page.waitForFunction(
      () => new URL(window.location.href).searchParams.get('contentType') === 'sets',
      undefined,
      { timeout: 5000 },
    );

    // The cards-only "name" param should drop off the URL when we switch to sets.
    expect(new URL(page.url()).searchParams.get('name')).toBeNull();

    // Toggle back to cards. The card-name search was preserved in Redux/sessionStorage
    // and should re-appear in the URL.
    await page.getByTestId('content-type-toggle-cards').click();

    await page.waitForFunction(
      () => {
        const url = new URL(window.location.href);
        return url.searchParams.get('contentType') === 'cards' && url.searchParams.get('name') === 'Lightning';
      },
      undefined,
      { timeout: 5000 },
    );

    // And the input still shows the value.
    await expect(cardNameField.locator('input')).toHaveValue('Lightning');
  });

  test('browser back/forward across UI-driven state changes does not break hooks', async ({ page }) => {
    // Listen for any React hook-order or render errors. The useBrowseStateSync
    // hook reads hasInit.current during render — if that read ever returned a
    // stale value across navigation, hooks could mis-sequence on the next render.
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

    // Drive history via the in-app toggles (these reliably push history entries).
    await page.goto('/browse');
    await page.waitForLoadState('networkidle');
    await expandSearchFormIfMobile(page);
    await expect(page.getByTestId('sets-grid')).toBeVisible();

    // Toggle to cards view → sets a new URL.
    await page.getByTestId('content-type-toggle-cards').click();
    await page.waitForFunction(
      () => new URL(window.location.href).searchParams.get('contentType') === 'cards',
      undefined,
      { timeout: 5000 },
    );

    // Toggle back to sets.
    await page.getByTestId('content-type-toggle-sets').click();
    await page.waitForFunction(
      () => new URL(window.location.href).searchParams.get('contentType') === 'sets',
      undefined,
      { timeout: 5000 },
    );

    // Back: should land on the cards view.
    await page.goBack();
    await page.waitForFunction(
      () => new URL(window.location.href).searchParams.get('contentType') === 'cards',
      undefined,
      { timeout: 5000 },
    );
    // Cards content should be present (sets-grid removed).
    await expect(page.getByTestId('sets-grid')).toHaveCount(0);

    // Forward: back to sets view.
    await page.goForward();
    await page.waitForFunction(
      () => new URL(window.location.href).searchParams.get('contentType') === 'sets',
      undefined,
      { timeout: 5000 },
    );
    await expect(page.getByTestId('sets-grid')).toBeVisible();

    expect(reactErrors).toEqual([]);
  });

  test('refreshing on a filtered URL keeps the filter (URL-driven init path)', async ({ page }) => {
    // Reload while on a filtered URL. Re-initialization runs through the
    // hasInit ref again — verify the filter is honored on the restored render.
    await page.goto('/browse?contentType=cards&name=Lightning');
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('cards-grid')).toBeVisible();

    await page.reload();
    await page.waitForLoadState('networkidle');

    // URL is still filtered.
    expect(new URL(page.url()).searchParams.get('name')).toBe('Lightning');
    // Cards still render and still match the filter.
    await page.waitForFunction(
      () => document.querySelectorAll('[data-testid="card-name"]').length > 0,
      undefined,
      { timeout: 10000 },
    );
    const names = await page.getByTestId('card-name').allTextContents();
    expect(names.length).toBeGreaterThan(0);
    expect(names.every((n) => n.toLowerCase().includes('lightning'))).toBe(true);
  });

  test('shared link with filter loads cleanly and renders results', async ({ page }) => {
    // This exercises the URL→Redux init path on first paint: hasInit goes false→true
    // inside an effect, and the rest of the hook reads .current on subsequent renders.
    // If the suppressed reads ever returned stale values, the search would be ignored
    // on first load (showing all cards instead of the filtered list).
    await page.goto('/browse?contentType=cards&name=Lightning');
    await page.waitForLoadState('networkidle');

    // Cards grid renders.
    await expect(page.getByTestId('cards-grid')).toBeVisible();

    // Wait for at least one card; verify the search actually applied.
    await page.waitForFunction(
      () => document.querySelectorAll('[data-testid="card-name"]').length > 0,
      undefined,
      { timeout: 10000 },
    );
    const names = await page.getByTestId('card-name').allTextContents();
    expect(names.length).toBeGreaterThan(0);
    // All visible card names should match the search filter.
    expect(names.every((n) => n.toLowerCase().includes('lightning'))).toBe(true);
  });
});
