import { expect, test, type Page } from '@playwright/test';
import { LOCAL_TEST_USER_ID, authenticateAsLocalTestUser, getLocalTestJwt } from '../utils/auth';
import { type MockApiResponse, mockApiRoute, ok } from './fixtures/apiMocks';

// Dates and times are formatted in the browser's zone; pin it so headings are stable.
test.use({ timezoneId: 'UTC', locale: 'en-US' });

let nextId = 1;

const entry = (overrides: Record<string, unknown>) => ({
  id: nextId++,
  timestamp: '2026-03-10T15:00:00Z',
  operationType: 'update',
  mode: null,
  description: '',
  card: null,
  set: null,
  location: null,
  quantities: null,
  bulkSummary: null,
  ...overrides,
});

const GIANT_SPIDER = {
  card: { id: 12390, name: 'Giant Spider', setCode: '10E', setName: 'Tenth Edition' },
  set: { id: 77, code: '10E', name: 'Tenth Edition', slug: 'tenth-edition' },
};

const quantities = (regBefore: number, regAfter: number, foilBefore = 0, foilAfter = 0) => ({
  regular: { before: regBefore, after: regAfter },
  foil: { before: foilBefore, after: foilAfter },
});

const importEntry = (timestamp: string, mode: string, cardsAffected: number) =>
  entry({ timestamp, operationType: 'import', mode, bulkSummary: { cardsAffected } });

const mockHistory = (page: Page, response: MockApiResponse) =>
  mockApiRoute(page, '/collection/history', { method: 'GET', respond: () => response });

const gotoHistory = async (page: Page): Promise<void> => {
  await page.goto('/history');
};

const entryRows = (page: Page) => page.locator('h2 + hr + div > div');

test.describe('Collection history', () => {
  test.beforeEach(async ({ context }) => {
    test.skip(!getLocalTestJwt(), 'Set E2E_TEST_JWT_1337 to run (see tests/utils/auth.ts)');
    await authenticateAsLocalTestUser(context);
  });

  test('requests the last 100 operations and shows the empty state', async ({ page }) => {
    const calls = await mockHistory(page, ok({ history: [] }));
    await gotoHistory(page);

    await expect(page.getByRole('heading', { level: 1, name: 'Collection History' })).toBeVisible({ timeout: 20000 });
    await expect(page.getByText('No collection history yet')).toBeVisible();
    expect(calls[0].url.searchParams.get('limit')).toBe('100');

    await page.getByRole('button', { name: 'Add or Remove Cards' }).click();
    await expect(page).toHaveURL(/\/collections\/edit-cards$/);
  });

  test('shows an error alert when the history request fails', async ({ page }) => {
    await mockHistory(page, { status: 500, body: { success: false, data: null, error: { message: 'down' } } });
    await gotoHistory(page);

    await expect(page.getByRole('alert').filter({ hasText: 'Failed to load collection history.' })).toBeVisible({
      timeout: 20000,
    });
    await expect(page.getByText('No collection history yet')).toHaveCount(0);
  });

  test('labels each operation and mode', async ({ page }) => {
    await mockHistory(
      page,
      ok({
        history: [
          entry({ ...GIANT_SPIDER, mode: 'set', quantities: quantities(0, 2) }),
          entry({ ...GIANT_SPIDER, mode: 'increment', quantities: quantities(3, 1) }),
          entry({ ...GIANT_SPIDER, mode: 'increment', quantities: quantities(1, 1, 0, 2) }),
          entry({ operationType: 'nuke', description: 'Deleted 42 collection entries' }),
          entry({ operationType: 'import', mode: 'replace', bulkSummary: { cardsAffected: 1 } }),
          entry({ operationType: 'migration', mode: null }),
          entry({ operationType: 'some-future-operation', mode: 'remove' }),
        ],
      }),
    );
    await gotoHistory(page);
    await expect(page.getByRole('heading', { name: 'March 10, 2026' })).toBeVisible({ timeout: 20000 });

    const rows = entryRows(page);
    await expect(rows).toHaveCount(7);

    await expect(rows.nth(0)).toContainText('3:00 PM');
    await expect(rows.nth(0)).toContainText('Update');
    await expect(rows.nth(0)).toContainText('set mode');
    await expect(rows.nth(0)).toContainText('Giant Spider (Tenth Edition)');
    await expect(rows.nth(0)).toContainText('• Regular: 0 → 2');
    await expect(rows.nth(0)).not.toContainText('Foil:');
    await expect(rows.nth(0).getByRole('link', { name: 'Giant Spider' })).toHaveAttribute(
      'href',
      `/collections/${LOCAL_TEST_USER_ID}/cards/giant-spider/12390`,
    );
    await expect(rows.nth(0).getByRole('link', { name: 'Tenth Edition' })).toHaveAttribute(
      'href',
      new RegExp(`/collections/${LOCAL_TEST_USER_ID}/tenth-edition`),
    );

    await expect(rows.nth(1)).toContainText('remove mode');
    await expect(rows.nth(1)).toContainText('• Regular: 3 → 1');

    await expect(rows.nth(2)).toContainText('add mode');
    await expect(rows.nth(2)).toContainText('• Foil: 0 → 2');
    await expect(rows.nth(2)).not.toContainText('Regular:');

    await expect(rows.nth(3)).toContainText('Nuke');
    await expect(rows.nth(3)).toContainText('Deleted 42 collection entries');

    await expect(rows.nth(4)).toContainText('Import');
    await expect(rows.nth(4)).toContainText('replace mode');
    await expect(rows.nth(4)).toContainText('• 1 card');

    await expect(rows.nth(5)).toContainText('Migration');

    // Unknown operation types from a newer API fall back to their raw name instead of crashing.
    await expect(rows.nth(6)).toContainText('some-future-operation');
    await expect(rows.nth(6)).toContainText('remove mode');
  });

  test('describes bulk operations in a sentence', async ({ page }) => {
    await mockHistory(
      page,
      ok({
        history: [
          entry({
            operationType: 'mass-update',
            mode: 'set',
            bulkSummary: {
              cardsAffected: 116,
              rarity: 'rare',
              setName: 'Limited Edition Alpha',
              setSlug: 'limited-edition-alpha',
              quantityReg: 2,
              quantityFoil: 0,
            },
          }),
          entry({
            operationType: 'mass-entry',
            mode: 'increment',
            bulkSummary: { cardsAffected: 5, rarity: 'all', quantityReg: 1, quantityFoil: 2 },
          }),
          entry({
            operationType: 'location-mass-update',
            mode: 'remove',
            location: { id: 7, name: 'A Literal Shoebox' },
            bulkSummary: { cardsAffected: 3 },
          }),
          entry({
            operationType: 'location-mass-update',
            mode: 'increment',
            location: { id: 7, name: 'A Literal Shoebox' },
            bulkSummary: { cardsAffected: 4, quantityReg: -1, quantityFoil: 0 },
          }),
        ],
      }),
    );
    await gotoHistory(page);
    const rows = entryRows(page);
    await expect(rows).toHaveCount(4, { timeout: 20000 });

    await expect(rows.nth(0)).toContainText('Mass Update');
    await expect(rows.nth(0)).toContainText('Set 116 rare cards in Limited Edition Alpha to 2 regular');
    await expect(rows.nth(0).getByRole('link', { name: 'Limited Edition Alpha' })).toHaveAttribute(
      'href',
      new RegExp(`/collections/${LOCAL_TEST_USER_ID}/limited-edition-alpha`),
    );

    await expect(rows.nth(1)).toContainText('Mass Entry');
    await expect(rows.nth(1)).toContainText('add mode');
    await expect(rows.nth(1)).toContainText('Added 1 regular and 2 foil to 5 cards');

    await expect(rows.nth(2)).toContainText('Location Mass Update');
    await expect(rows.nth(2)).toContainText('Removed 3 cards from A Literal Shoebox');
    await expect(rows.nth(2).getByRole('link', { name: 'A Literal Shoebox' })).toHaveAttribute(
      'href',
      /locationId=7/,
    );

    await expect(rows.nth(3)).toContainText('remove mode');
    await expect(rows.nth(3)).toContainText('Removed 1 regular from 4 cards in A Literal Shoebox');
  });

  test('a removing mass entry reads "from", not "to"', async ({ page }) => {
    await mockHistory(
      page,
      ok({
        history: [
          entry({
            operationType: 'mass-entry',
            mode: 'increment',
            bulkSummary: { cardsAffected: 5, rarity: 'all', quantityReg: -1, quantityFoil: 0 },
          }),
        ],
      }),
    );
    await gotoHistory(page);
    const rows = entryRows(page);
    await expect(rows).toHaveCount(1, { timeout: 20000 });
    await expect(rows.nth(0)).toContainText('remove mode');
    await expect(rows.nth(0)).toContainText('Removed 1 regular from 5 cards', { timeout: 3000 });
  });

  test('groups entries by day, newest day first', async ({ page }) => {
    await mockHistory(
      page,
      ok({
        history: [
          entry({ ...GIANT_SPIDER, timestamp: '2026-03-11T09:30:00Z', mode: 'set', quantities: quantities(0, 1) }),
          entry({ ...GIANT_SPIDER, timestamp: '2026-03-10T20:00:00Z', mode: 'set', quantities: quantities(1, 2) }),
          entry({ ...GIANT_SPIDER, timestamp: '2026-03-10T08:00:00Z', mode: 'set', quantities: quantities(2, 3) }),
        ],
      }),
    );
    await gotoHistory(page);

    const dayHeadings = page.getByRole('heading', { level: 2 });
    await expect(dayHeadings).toHaveText(['March 11, 2026', 'March 10, 2026'], { timeout: 20000 });
    await expect(entryRows(page)).toHaveCount(3);
  });

  test('merges consecutive same-mode imports within a minute of the first one', async ({ page }) => {
    await mockHistory(
      page,
      ok({
        history: [
          importEntry('2026-03-10T15:00:00Z', 'merge', 500),
          importEntry('2026-03-10T14:59:30Z', 'merge', 500),
          importEntry('2026-03-10T14:59:05Z', 'merge', 200),
          // 70s after the first entry of the run (only 25s after the previous one): starts a new group.
          // The window is measured from the first import of the run, not the previous entry.
          importEntry('2026-03-10T14:58:50Z', 'merge', 7),
          // Same time window but a different mode: never merged.
          importEntry('2026-03-10T14:58:45Z', 'replace', 3),
          entry({ ...GIANT_SPIDER, timestamp: '2026-03-10T14:58:44Z', mode: 'set', quantities: quantities(0, 1) }),
          // An unrelated operation between imports breaks the run.
          importEntry('2026-03-10T14:58:43Z', 'replace', 4),
        ],
      }),
    );
    await gotoHistory(page);

    const rows = entryRows(page);
    await expect(rows).toHaveCount(5, { timeout: 20000 });
    await expect(rows.nth(0)).toContainText('Import');
    await expect(rows.nth(0)).toContainText('add mode');
    await expect(rows.nth(0)).toContainText('• 1200 cards');
    await expect(rows.nth(1)).toContainText('• 7 cards');
    await expect(rows.nth(2)).toContainText('replace mode');
    await expect(rows.nth(2)).toContainText('• 3 cards');
    await expect(rows.nth(3)).toContainText('Update');
    await expect(rows.nth(4)).toContainText('• 4 cards');
  });

  test('paginates five days per page', async ({ page }) => {
    const days = ['16', '15', '14', '13', '12', '11'];
    await mockHistory(
      page,
      ok({
        history: days.map((day) =>
          entry({ ...GIANT_SPIDER, timestamp: `2026-03-${day}T12:00:00Z`, mode: 'set', quantities: quantities(0, 1) }),
        ),
      }),
    );
    await gotoHistory(page);

    const dayHeadings = page.getByRole('heading', { level: 2 });
    await expect(dayHeadings).toHaveCount(5, { timeout: 20000 });
    await expect(dayHeadings.first()).toHaveText('March 16, 2026');

    await page.getByRole('button', { name: 'Go to page 2' }).click();
    await expect(dayHeadings).toHaveText(['March 11, 2026']);
  });
});
