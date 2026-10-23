import { expect, test, type Page } from '@playwright/test';
import { LOCAL_TEST_USER_ID, authenticateAsLocalTestUser, getLocalTestJwt } from '../utils/auth';
import { patchApiResponse } from './fixtures/apiMocks';

// The summary numbers ride on the sets/cards search responses. The real responses are passed
// through and only the summary fields are overwritten, so the assertions don't depend on the
// live collection.

interface Summary {
  username: string;
  uniquePrintingsCollected: number;
  numberOfCardsInMagic: number;
  totalCardsCollected: number;
  percentageCollected: number;
  totalValue: number;
  hideCollectionValue: boolean;
}

const SETS_SUMMARY: Summary = {
  username: 'Mock Collector',
  uniquePrintingsCollected: 1234,
  numberOfCardsInMagic: 56789,
  totalCardsCollected: 4321,
  percentageCollected: 2.4,
  totalValue: 9876.54,
  hideCollectionValue: false,
};

const CARDS_SUMMARY: Summary = {
  ...SETS_SUMMARY,
  uniquePrintingsCollected: 2222,
  totalCardsCollected: 1,
  percentageCollected: 3.6,
  totalValue: 1234567.8,
};

const patchSummary = async (page: Page, sets: Summary, cards: Summary = sets): Promise<void> => {
  const apply = (summary: Summary) => (json: any, body: any) => {
    if (json?.data && Number(body?.userId) === LOCAL_TEST_USER_ID) Object.assign(json.data, summary);
  };
  await patchApiResponse(page, '/sets/search', apply(sets));
  await patchApiResponse(page, '/cards/search', apply(cards));
};

const header = (page: Page) => page.getByRole('heading', { name: "Mock Collector's Collection" }).locator('..');

const expectHeaderStats = async (page: Page, summary: Summary, value: string, percent: string): Promise<void> => {
  await expect(page.getByRole('heading', { name: `${summary.username}'s Collection` })).toBeVisible({
    timeout: 20000,
  });
  await expect(
    header(page).getByText(`${summary.uniquePrintingsCollected}/${summary.numberOfCardsInMagic}`, { exact: true }),
  ).toBeVisible();
  const cardWord = summary.totalCardsCollected === 1 ? 'card' : 'cards';
  await expect(
    header(page).getByText(`(${summary.totalCardsCollected} total ${cardWord} collected)`, { exact: true }),
  ).toBeVisible();
  await expect(header(page)).toContainText(`Collection value: ${value}`);
  await expect(header(page).getByText(percent, { exact: true })).toBeVisible();
};

test.describe('Collection overview - owner', () => {
  test.beforeEach(async ({ context }) => {
    test.skip(!getLocalTestJwt(), 'Set E2E_TEST_JWT_1337 to run (see tests/utils/auth.ts)');
    await authenticateAsLocalTestUser(context);
  });

  test('header shows the collection summary from the sets search', async ({ page }) => {
    await patchSummary(page, SETS_SUMMARY, CARDS_SUMMARY);
    await page.goto(`/collections/${LOCAL_TEST_USER_ID}`);

    await expectHeaderStats(page, SETS_SUMMARY, '$9,876.54', '2% collected');
  });

  test('switching to cards fetches cards for this user and the header follows the cards summary', async ({
    page,
  }) => {
    await patchSummary(page, SETS_SUMMARY, CARDS_SUMMARY);
    await page.goto(`/collections/${LOCAL_TEST_USER_ID}`);
    await expectHeaderStats(page, SETS_SUMMARY, '$9,876.54', '2% collected');

    const cardsRequest = page.waitForRequest(
      (request) =>
        new URL(request.url()).pathname === '/cards/search' &&
        Number(request.postDataJSON()?.userId) === LOCAL_TEST_USER_ID,
    );
    await page.getByTestId('content-type-toggle-cards').click();
    await cardsRequest;

    await expect(page).toHaveURL(/contentType=cards/);
    await expectHeaderStats(page, CARDS_SUMMARY, '$1,234,567.80', '4% collected');

    await page.getByTestId('content-type-toggle-sets').click();
    await expect(page).not.toHaveURL(/contentType=cards/);
    await expectHeaderStats(page, SETS_SUMMARY, '$9,876.54', '2% collected');
  });

  test('the owner always sees the value, even with hideCollectionValue on', async ({ page }) => {
    await patchSummary(page, { ...SETS_SUMMARY, hideCollectionValue: true });
    await page.goto(`/collections/${LOCAL_TEST_USER_ID}`);

    await expectHeaderStats(page, SETS_SUMMARY, '$9,876.54', '2% collected');
  });
});

test.describe('Collection overview - visitor (not the owner)', () => {
  // No auth cookie: the visitor is anonymous, so user 1337's collection belongs to someone else.

  test('value is hidden when the owner has hideCollectionValue on, but counts still show', async ({ page }) => {
    await patchSummary(page, { ...SETS_SUMMARY, hideCollectionValue: true });
    await page.goto(`/collections/${LOCAL_TEST_USER_ID}`);

    await expect(page.getByRole('heading', { name: "Mock Collector's Collection" })).toBeVisible({ timeout: 20000 });
    await expect(header(page).getByText('1234/56789', { exact: true })).toBeVisible();
    await expect(header(page).getByText('2% collected', { exact: true })).toBeVisible();
    await expect(header(page)).not.toContainText('Collection value');
    await expect(page.getByText('$9,876.54')).toHaveCount(0);
  });

  test('value is shown when hideCollectionValue is explicitly off', async ({ page }) => {
    await patchSummary(page, { ...SETS_SUMMARY, hideCollectionValue: false });
    await page.goto(`/collections/${LOCAL_TEST_USER_ID}`);

    await expectHeaderStats(page, SETS_SUMMARY, '$9,876.54', '2% collected');
  });

  test('value is hidden when the API omits hideCollectionValue', async ({ page }) => {
    await patchApiResponse(page, '/sets/search', (json, body) => {
      if (!json?.data || Number(body?.userId) !== LOCAL_TEST_USER_ID) return;
      Object.assign(json.data, { ...SETS_SUMMARY });
      delete json.data.hideCollectionValue;
    });
    await page.goto(`/collections/${LOCAL_TEST_USER_ID}`);

    await expect(page.getByRole('heading', { name: "Mock Collector's Collection" })).toBeVisible({ timeout: 20000 });
    await expect(header(page).getByText('1234/56789', { exact: true })).toBeVisible();
    await expect(header(page)).not.toContainText('Collection value');
  });
});
