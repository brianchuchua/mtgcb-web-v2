import { type Page, type Route, expect, test } from '@playwright/test';
import { LOCAL_TEST_USER_ID, authenticateAsLocalTestUser, getLocalTestJwt } from '../utils/auth';

// Every /collection/migrations/* endpoint (and /collection/update, used by "Remove from
// collection") is mocked: nothing here reads or changes user 1337's real migrations.
const MIGRATIONS_URL = /\/collection\/migrations\//;
const COLLECTION_UPDATE_URL = 'http://local.mtgcb.com:5000/collection/update';

const SET = { setId: 990001, setCode: 'E2E', setName: 'E2E Test Tokens', totalCards: 1, totalCopies: 2 };
const SOURCE_CARD_ID = 880001;
const TARGET_A = 880101;
const TARGET_B = 880102;

const candidate = (cardId: number, name: string, collectorNumber: string) => ({
  cardId,
  name,
  setName: SET.setName,
  setSlug: null,
  setCode: SET.setCode,
  collectorNumber,
  backScryfallId: null,
  canBeFoil: false,
  canBeNonFoil: true,
});

const baseHolding = {
  sourceCardId: SOURCE_CARD_ID,
  sourceName: 'E2E Old Token',
  canBeFoil: false,
  canBeNonFoil: true,
  sourceSetName: SET.setName,
  sourceSetSlug: null,
  sourceSetCode: SET.setCode,
  sourceCollectorNumber: '1',
  quantityReg: 2,
  quantityFoil: 0,
  deprecatedReason: 'combined',
  successorCardId: null,
  successorName: null,
  successorSetName: null,
  successorSetSlug: null,
  successorSetCode: null,
  successorCollectorNumber: null,
  successorBackScryfallId: null,
  successorCanBeFoil: null,
  successorCanBeNonFoil: null,
  ambiguousCandidates: [] as ReturnType<typeof candidate>[],
};

const AMBIGUOUS_HOLDING = {
  ...baseHolding,
  resolution: 'ambiguous',
  ambiguousCandidates: [candidate(TARGET_B, 'E2E New Token B', '7'), candidate(TARGET_A, 'E2E New Token A', '3')],
};

const AUTO_HOLDING = {
  ...baseHolding,
  resolution: 'auto',
  successorCardId: TARGET_A,
  successorName: 'E2E New Token A',
  successorSetName: SET.setName,
  successorSetCode: SET.setCode,
  successorCollectorNumber: '3',
  successorCanBeFoil: false,
  successorCanBeNonFoil: true,
};

interface MigrationMock {
  sets: (typeof SET)[];
  holdings: unknown[];
  runResponse?: unknown;
}

const fulfillJson = (route: Route, body: unknown, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

const mockMigrations = async (page: Page, mock: MigrationMock) => {
  const runBodies: unknown[] = [];
  let holdings = mock.holdings;
  await page.route(MIGRATIONS_URL, async (route) => {
    const { pathname } = new URL(route.request().url());
    if (pathname.endsWith('/deprecated-cards/sets')) {
      return fulfillJson(route, { success: true, data: { sets: mock.sets }, error: null });
    }
    if (pathname.endsWith('/deprecated-cards/count')) {
      return fulfillJson(route, { success: true, data: { totalCards: holdings.length, totalCopies: 2 }, error: null });
    }
    if (pathname.endsWith('/deprecated-cards')) {
      return fulfillJson(route, {
        success: true,
        data: { holdings, totalCards: holdings.length, totalCopies: 2, setId: SET.setId },
        error: null,
      });
    }
    if (pathname.endsWith('/run')) {
      runBodies.push(route.request().postDataJSON());
      if (!mock.runResponse) holdings = [];
      return fulfillJson(
        route,
        mock.runResponse ?? {
          success: true,
          data: {
            results: [
              {
                sourceCardId: SOURCE_CARD_ID,
                status: 'migrated',
                successorCardId: TARGET_A,
                movedQuantityReg: 2,
                movedQuantityFoil: 0,
                movedLocations: 0,
              },
            ],
            migratedCount: 1,
            skippedCount: 0,
            errorCount: 0,
          },
          error: null,
        },
      );
    }
    return fulfillJson(route, { success: false, data: null, error: { message: 'unmocked migration endpoint' } }, 500);
  });
  await page.route(COLLECTION_UPDATE_URL, (route) =>
    fulfillJson(route, { success: false, data: null, error: { message: 'blocked in e2e' } }, 500),
  );
  return { runBodies };
};

const candidateCell = (page: Page, name: string) =>
  page.locator('div').filter({ has: page.getByRole('link', { name, exact: true }) }).filter({
    has: page.getByRole('spinbutton', { name: 'Regular' }),
  }).last();

test.describe('Migrate page: route guards', () => {
  test('a non-numeric or zero user id shows "Invalid user ID"', async ({ page }) => {
    await page.goto('/collections/0/migrate');
    await expect(page.getByText('Invalid user ID')).toBeVisible();

    await page.goto('/collections/not-a-number/migrate');
    await expect(page.getByText('Invalid user ID')).toBeVisible();
  });

  test('a logged-out visitor is told only the owner can use it', async ({ page }) => {
    const migrationCalls: string[] = [];
    await page.route(MIGRATIONS_URL, async (route) => {
      migrationCalls.push(route.request().url());
      await fulfillJson(route, { success: false }, 500);
    });

    await page.goto(`/collections/${LOCAL_TEST_USER_ID}/migrate`);

    await expect(page.getByText('You can only update your own collection.', { exact: false })).toBeVisible();
    expect(migrationCalls).toEqual([]);
  });
});

test.describe('Migrate page: owner flows', () => {
  test.beforeEach(async ({ context }) => {
    test.skip(!getLocalTestJwt(), 'Set E2E_TEST_JWT_1337 to run (see tests/utils/auth.ts)');
    await authenticateAsLocalTestUser(context);
  });

  test("another user's migrate page is gated and loads nothing", async ({ page }) => {
    const migrationCalls: string[] = [];
    await page.route(MIGRATIONS_URL, async (route) => {
      migrationCalls.push(route.request().url());
      await fulfillJson(route, { success: false }, 500);
    });

    await page.goto('/collections/1/migrate');

    await expect(
      page.getByText(
        'You can only update your own collection. Sign in as the owner of this collection to use this tool.',
      ),
    ).toBeVisible();
    expect(migrationCalls).toEqual([]);
  });

  test('shows the up-to-date state when no set has pending updates', async ({ page }) => {
    await mockMigrations(page, { sets: [], holdings: [] });

    await page.goto(`/collections/${LOCAL_TEST_USER_ID}/migrate`);

    await expect(page.getByRole('heading', { name: 'Update Cards' })).toBeVisible();
    await expect(page.getByText('Your collection is up to date.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Apply update' })).toHaveCount(0);
  });

  test('over-allocating across candidates disables Apply update; a valid split sends the expected body', async ({
    page,
  }) => {
    const migrations = await mockMigrations(page, { sets: [SET], holdings: [AMBIGUOUS_HOLDING] });

    await page.goto(`/collections/${LOCAL_TEST_USER_ID}/migrate`);

    await expect(page.getByRole('link', { name: 'E2E Old Token', exact: true })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('1 remaining')).toBeVisible();
    await expect(page.getByText('Distribute your copies across one or more of these options:')).toBeVisible();

    const apply = page.getByRole('button', { name: 'Apply update' });
    await expect(page.getByText('No copies allocated yet')).toBeVisible();
    await expect(apply).toBeDisabled();

    const cellA = candidateCell(page, 'E2E New Token A');
    const cellB = candidateCell(page, 'E2E New Token B');
    await cellA.getByRole('button', { name: 'Increase quantity' }).click();
    await cellA.getByRole('button', { name: 'Increase quantity' }).click();
    await expect(cellA.getByRole('spinbutton', { name: 'Regular' })).toHaveValue('2');
    await expect(apply).toBeEnabled();

    await cellB.getByRole('button', { name: 'Increase quantity' }).click();
    await expect(cellB.getByRole('spinbutton', { name: 'Regular' })).toHaveValue('1');
    await expect(page.getByText(/^Exceeds owned/)).toBeVisible();
    await expect(apply).toBeDisabled();

    await cellB.getByRole('button', { name: 'Decrease quantity' }).click();
    await expect(page.getByText(/ready to apply the update/)).toBeVisible();
    await expect(apply).toBeEnabled();

    await apply.click();

    await expect(page.getByText(`Nothing left to do for ${SET.setName}.`)).toBeVisible({ timeout: 15000 });
    expect(migrations.runBodies).toEqual([
      { migrations: [{ cardId: SOURCE_CARD_ID, targetCardId: TARGET_A, quantityReg: 2, quantityFoil: 0 }] },
    ]);
  });

  test('an auto-resolved card is pre-allocated and applies in one click', async ({ page }) => {
    const migrations = await mockMigrations(page, { sets: [SET], holdings: [AUTO_HOLDING] });

    await page.goto(`/collections/${LOCAL_TEST_USER_ID}/migrate`);

    await expect(page.getByText(/Auto-allocated .* to the only available option/)).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: 'Apply update' }).click();

    await expect(page.getByText(`Nothing left to do for ${SET.setName}.`)).toBeVisible({ timeout: 15000 });
    expect(migrations.runBodies).toEqual([
      { migrations: [{ cardId: SOURCE_CARD_ID, targetCardId: TARGET_A, quantityReg: 2, quantityFoil: 0 }] },
    ]);
  });

  test('a migration result with an error keeps the card and shows the message', async ({ page }) => {
    await mockMigrations(page, {
      sets: [SET],
      holdings: [AUTO_HOLDING],
      runResponse: {
        success: true,
        data: {
          results: [
            {
              sourceCardId: SOURCE_CARD_ID,
              status: 'error',
              successorCardId: TARGET_A,
              movedQuantityReg: 0,
              movedQuantityFoil: 0,
              movedLocations: 0,
              message: 'Target card is locked',
            },
          ],
          migratedCount: 0,
          skippedCount: 0,
          errorCount: 1,
        },
        error: null,
      },
    });

    await page.goto(`/collections/${LOCAL_TEST_USER_ID}/migrate`);
    await page.getByRole('button', { name: 'Apply update' }).click();

    await expect(page.getByText('Target card is locked')).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('link', { name: 'E2E Old Token', exact: true })).toBeVisible();
  });

  test('Skip for now moves past the card and offers to review skipped cards', async ({ page }) => {
    const migrations = await mockMigrations(page, { sets: [SET], holdings: [AUTO_HOLDING] });

    await page.goto(`/collections/${LOCAL_TEST_USER_ID}/migrate`);
    await page.getByRole('button', { name: 'Skip for now' }).click();

    await expect(page.getByText(`Nothing left to do for ${SET.setName}.`)).toBeVisible();
    await expect(page.getByText('You skipped 1 card.', { exact: false })).toBeVisible();
    await page.getByRole('button', { name: 'Review skipped cards' }).click();
    await expect(page.getByRole('link', { name: 'E2E Old Token', exact: true })).toBeVisible();
    expect(migrations.runBodies).toEqual([]);
  });
});
