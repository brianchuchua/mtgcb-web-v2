import { expect, test, type Page } from '@playwright/test';

// Bug: clicking a sortable table column header updates Redux state and the URL,
// but does NOT update the corresponding `mtgcb_preferred_sort_*` localStorage
// entry. Changing sort via the dropdown DOES update localStorage. As a result,
// the user's last header-driven sort is forgotten on the next visit.
//
// Three handlers participate:
//   - src/features/browse/hooks/useSort.ts  (cards table — browse + collection)
//   - src/components/sets/SetDisplay.tsx    (sets table — browse)
//   - src/components/collections/CollectionSetDisplay.tsx  (sets table — collection)
//
// All three dispatch setSortBy/setSortOrder but skip the setPreferred*Sort*()
// localStorage writes that the dropdown handlers in BrowseSearchFormMain.tsx
// and useBrowseController.ts perform.
//
// The four cases below assert the *expected* behavior (header click persists
// to localStorage like dropdown change does). They will fail until the bug is
// fixed in the three handlers above.

interface SortCase {
  name: string;
  url: string;
  contentType: 'cards' | 'sets';
  columnLabel: string;
  expectedSortBy: string;
  // The URL adapter splits sort by view: ?cardsSortBy=... vs ?setsSortBy=...
  urlSortByKey: 'cardsSortBy' | 'setsSortBy';
  storageKeyBy: string;
  storageKeyOrder: string;
}

const COLLECTION_USER_ID = '1337';

const CASES: SortCase[] = [
  {
    name: 'Browse cards',
    url: '/browse?contentType=cards',
    contentType: 'cards',
    columnLabel: 'Name',
    expectedSortBy: 'name',
    urlSortByKey: 'cardsSortBy',
    storageKeyBy: 'mtgcb_preferred_sort_by_cards',
    storageKeyOrder: 'mtgcb_preferred_sort_order_cards',
  },
  {
    name: 'Browse sets',
    url: '/browse?contentType=sets',
    contentType: 'sets',
    columnLabel: 'Set Name',
    expectedSortBy: 'name',
    urlSortByKey: 'setsSortBy',
    storageKeyBy: 'mtgcb_preferred_sort_by_sets',
    storageKeyOrder: 'mtgcb_preferred_sort_order_sets',
  },
  {
    name: 'Collection cards',
    url: `/collections/${COLLECTION_USER_ID}?contentType=cards`,
    contentType: 'cards',
    columnLabel: 'Name',
    expectedSortBy: 'name',
    urlSortByKey: 'cardsSortBy',
    storageKeyBy: 'mtgcb_preferred_sort_by_cards',
    storageKeyOrder: 'mtgcb_preferred_sort_order_cards',
  },
  {
    name: 'Collection sets',
    url: `/collections/${COLLECTION_USER_ID}?contentType=sets`,
    contentType: 'sets',
    columnLabel: 'Set Name',
    expectedSortBy: 'name',
    urlSortByKey: 'setsSortBy',
    storageKeyBy: 'mtgcb_preferred_sort_by_sets',
    storageKeyOrder: 'mtgcb_preferred_sort_order_sets',
  },
];

async function clearAllStorage(page: Page) {
  await page.goto('about:blank');
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      /* noop */
    }
  });
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function readStoredSort(page: Page, key: string): Promise<string | null> {
  const raw = await page.evaluate((k) => localStorage.getItem(k), key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as string;
  } catch {
    return raw;
  }
}

test.describe('Sort persistence: column-header clicks should update localStorage', () => {
  for (const c of CASES) {
    test(`${c.name}: clicking the "${c.columnLabel}" header persists ${c.storageKeyBy}`, async ({ page }) => {
      await clearAllStorage(page);

      await page.goto(c.url);
      await page.waitForLoadState('networkidle');

      // Switch to table view so column headers are rendered.
      const paginationTop = page.getByTestId('pagination-top');
      await expect(paginationTop).toBeVisible({ timeout: 15000 });
      await paginationTop.getByTestId('view-mode-toggle-table').click();

      // Wait for at least one sortable column header to render.
      await page.waitForSelector('th .MuiTableSortLabel-root', { timeout: 15000 });

      // Sanity: localStorage was empty before the click.
      const beforeBy = await page.evaluate((k) => localStorage.getItem(k), c.storageKeyBy);
      expect(beforeBy, 'localStorage should start clean for this test').toBeNull();

      // Click the column header. Match the <th>'s text exactly so we don't
      // hit a column whose label is a superstring of ours.
      const headerRegex = new RegExp(`^\\s*${escapeRegex(c.columnLabel)}\\s*$`);
      const header = page
        .locator('th')
        .filter({ has: page.locator('.MuiTableSortLabel-root') })
        .filter({ hasText: headerRegex })
        .first();
      await expect(header).toBeVisible({ timeout: 10000 });

      // Give useBrowseStateSync a moment to flip hasInit.current to true; if we
      // click before init, the Redux→URL sync useEffect bails out.
      await page.waitForTimeout(500);

      await header.locator('.MuiTableSortLabel-root').click();

      // Confirm the click actually changed Redux state (URL is the observable
      // side effect, debounced ~100ms; URL key is per-view: cardsSortBy/setsSortBy).
      await page.waitForFunction(
        ({ key, expected }) => new URL(window.location.href).searchParams.get(key) === expected,
        { key: c.urlSortByKey, expected: c.expectedSortBy },
        { timeout: 5000 },
      );

      // The bug: localStorage is still null even though the URL/Redux moved.
      // Expected: localStorage matches the new sortBy.
      const afterBy = await readStoredSort(page, c.storageKeyBy);
      expect(afterBy, `${c.storageKeyBy} should reflect header-driven sort change`).toBe(c.expectedSortBy);
    });
  }
});
