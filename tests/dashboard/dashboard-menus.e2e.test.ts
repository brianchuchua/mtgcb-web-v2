import { expect, test } from '@playwright/test';

// Regression coverage for the anchorRef → callback-ref refactor in:
//   src/components/layout/Dashboard/components/JumpToSetsMenu.tsx
//   src/components/layout/Dashboard/components/QuickSearch.tsx
//
// Both components used `useRef` + `<Popper anchorEl={anchorRef.current} />` (which
// reads the ref during render — flagged by react-compiler). They now use
// `useState` + `<IconButton ref={setAnchorEl}>` so the popper anchor is plain state.
// If the swap broke anything, the popper would either not open or anchor to (0,0).
test.describe('Dashboard — Jump To Sets menu', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/browse');
    await page.waitForLoadState('networkidle');
  });

  test('opens the popper anchored to the trigger when clicked', async ({ page }) => {
    const trigger = page.getByRole('button', { name: 'jump to set' });
    await expect(trigger).toBeVisible();

    await trigger.click();

    // Popper renders an Autocomplete with placeholder text.
    const input = page.getByPlaceholder('Type to search sets...');
    await expect(input).toBeVisible();

    // Verify the popper actually anchored near the trigger (not at 0,0 — the
    // failure mode if anchorEl is null when Popper renders).
    const triggerBox = await trigger.boundingBox();
    const inputBox = await input.boundingBox();
    expect(triggerBox).not.toBeNull();
    expect(inputBox).not.toBeNull();
    if (triggerBox && inputBox) {
      // Popper appears below the trigger, so input top should be below trigger top.
      expect(inputBox.y).toBeGreaterThan(triggerBox.y);
      // And horizontally close to the trigger (within ~400px on a desktop layout).
      expect(Math.abs(inputBox.x - triggerBox.x)).toBeLessThan(500);
    }
  });

  test('typing in the search box filters and presents set options', async ({ page }) => {
    await page.getByRole('button', { name: 'jump to set' }).click();
    const input = page.getByPlaceholder('Type to search sets...');
    await input.fill('foundations');

    // The autocomplete should produce at least one option matching the query.
    // Use the listbox role rather than a specific option text since set lists vary.
    const listbox = page.getByRole('listbox');
    await expect(listbox).toBeVisible({ timeout: 5000 });
    const options = listbox.getByRole('option');
    expect(await options.count()).toBeGreaterThan(0);
  });

  test('selecting a set option navigates to that set page', async ({ page }) => {
    await page.getByRole('button', { name: 'jump to set' }).click();
    const input = page.getByPlaceholder('Type to search sets...');
    await input.fill('foundations');

    const listbox = page.getByRole('listbox');
    await expect(listbox).toBeVisible({ timeout: 5000 });

    // Click the first option. Unauthenticated users land at /browse/sets/[slug].
    await listbox.getByRole('option').first().click();

    await page.waitForURL((url) => url.pathname.startsWith('/browse/sets/'), { timeout: 5000 });
    expect(new URL(page.url()).pathname).toMatch(/^\/browse\/sets\/[a-z0-9-]+$/);
  });
});

test.describe('Dashboard — Quick Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/browse');
    await page.waitForLoadState('networkidle');
  });

  test('opens the popper anchored to the trigger when clicked', async ({ page }) => {
    const trigger = page.getByRole('button', { name: 'quick search' });
    await expect(trigger).toBeVisible();

    await trigger.click();

    const input = page.getByPlaceholder('Search by card name...');
    await expect(input).toBeVisible();

    const triggerBox = await trigger.boundingBox();
    const inputBox = await input.boundingBox();
    expect(triggerBox).not.toBeNull();
    expect(inputBox).not.toBeNull();
    if (triggerBox && inputBox) {
      expect(inputBox.y).toBeGreaterThan(triggerBox.y);
      expect(Math.abs(inputBox.x - triggerBox.x)).toBeLessThan(500);
    }
  });

  test('submitting a search navigates to the browse cards page with the name param', async ({ page }) => {
    await page.getByRole('button', { name: 'quick search' }).click();
    const input = page.getByPlaceholder('Search by card name...');
    await input.fill('Lightning Bolt');
    await input.press('Enter');

    // Unauthenticated path navigates to /browse with name + contentType=cards.
    await page.waitForURL((url) => url.pathname === '/browse' && url.searchParams.get('contentType') === 'cards', {
      timeout: 5000,
    });
    const url = new URL(page.url());
    // The component encodes spaces as `+` in the raw URL string for cleaner sharing,
    // but URLSearchParams.get decodes `+` back to a space — assert the decoded value.
    expect(url.searchParams.get('name')).toBe('Lightning Bolt');
    expect(url.search).toContain('name=Lightning+Bolt');
    expect(url.searchParams.get('contentType')).toBe('cards');
  });
});
