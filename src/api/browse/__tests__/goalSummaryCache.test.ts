/**
 * @jest-environment node
 *
 * The goal summary is cached once per (user, goal, price type) instead of coming back with every
 * card page. This runs the real RTK store and the real mutations against a stubbed fetch, and
 * checks that every mutation that refetches the goal's card pages refetches the summary too.
 */
import { browseApi } from '@/api/browse/browseApi';
import { mtgcbApi } from '@/api/mtgcbApi';
import '@/api/collections/collectionsApi';
import '@/api/goals/goalsApi';
import '@/api/import/importApi';
import '@/api/locations/locationsApi';
import { createTestStore } from '@/__tests__/utils/testUtils';
import { setUser } from '@/redux/slices/authSlice';

const USER_ID = 5;
const GOAL_ID = 7;
const SUMMARY_ARGS = { userId: USER_ID, goalId: GOAL_ID, priceType: 'market' as const };
const pageArgs = (page: number) => ({
  userId: USER_ID,
  priceType: 'market' as const,
  goalId: GOAL_ID,
  limit: 20,
  offset: (page - 1) * 20,
  sortBy: 'releasedAt',
  sortDirection: 'asc' as const,
});

let requests: { url: string; body: any }[] = [];

beforeEach(() => {
  requests = [];
  (globalThis as any).fetch = jest.fn(async (input: Request) => {
    const text = await input.text();
    const body = text ? JSON.parse(text) : undefined;
    requests.push({ url: input.url, body });
    const data = body?.goalSummaryOnly
      ? { cards: [], totalCount: 0, goalSummary: { goalId: GOAL_ID, collectedCards: requests.length } }
      : { cards: [], totalCount: 100, userId: USER_ID, success: true };
    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  });
});

const summaryFetches = () => requests.filter((r) => r.body?.goalSummaryOnly).length;
const pageFetches = () =>
  requests.filter((r) => r.url.endsWith('/cards/search') && r.body && !r.body.goalSummaryOnly).length;

async function settle(store: ReturnType<typeof createTestStore>) {
  for (let i = 0; i < 5; i++) {
    await new Promise((resolve) => setTimeout(resolve, 0));
    await Promise.all(store.dispatch(mtgcbApi.util.getRunningQueriesThunk()) as any);
  }
}

async function setup() {
  const store = createTestStore();
  store.dispatch(setUser({ userId: USER_ID, username: 'u', email: 'u@x.test', isPublic: true }));
  store.dispatch(browseApi.endpoints.getCards.initiate(pageArgs(1)));
  store.dispatch(browseApi.endpoints.getGoalSummary.initiate(SUMMARY_ARGS));
  await settle(store);
  expect(pageFetches()).toBe(1);
  expect(summaryFetches()).toBe(1);
  return store;
}

const endpoints = mtgcbApi.endpoints as any;

describe('goal summary cache', () => {
  it('sends the summary-only body the API expects', async () => {
    await setup();
    const summary = requests.find((r) => r.body?.goalSummaryOnly)!;
    expect(summary.url).toMatch(/\/cards\/search$/);
    expect(summary.body).toEqual({
      userId: USER_ID,
      goalId: GOAL_ID,
      priceType: 'market',
      goalSummaryOnly: true,
      limit: 1,
      offset: 0,
    });
  });

  it('paging fetches each page but the summary only once', async () => {
    const store = await setup();
    for (const page of [2, 3, 4, 5]) {
      store.dispatch(browseApi.endpoints.getCards.initiate(pageArgs(page)));
      store.dispatch(browseApi.endpoints.getGoalSummary.initiate(SUMMARY_ARGS));
    }
    await settle(store);
    expect(pageFetches()).toBe(5);
    expect(summaryFetches()).toBe(1);
  });

  it('a different price type or goal is fetched separately', async () => {
    const store = await setup();
    store.dispatch(browseApi.endpoints.getGoalSummary.initiate({ ...SUMMARY_ARGS, priceType: 'low' }));
    store.dispatch(browseApi.endpoints.getGoalSummary.initiate({ ...SUMMARY_ARGS, goalId: 8 }));
    await settle(store);
    expect(summaryFetches()).toBe(3);
  });

  // Every mutation in the app that can change a goal's progress or its card pages.
  const mutations: [string, string, unknown][] = [
    ['collection edit (set)', 'updateCollection', { mode: 'set', cards: [{ cardId: 1, quantityReg: 1 }] }],
    ['collection edit (increment)', 'updateCollection', { mode: 'increment', cards: [{ cardId: 1, quantityReg: 1 }] }],
    ['mass update', 'massUpdateCollection', { setId: 1, updates: [] }],
    ['mass entry', 'massEntryCollection', { entries: [] }],
    ['nuke collection', 'nukeCollection', undefined],
    ['deprecated card migration', 'runDeprecatedMigrations', { migrations: [] }],
    ['CSV import', 'importCollection', { csvData: 'a', filename: 'a.csv', fieldMappings: {} }],
    ['create goal', 'createGoal', { name: 'g', searchCriteria: {} }],
    ['update goal', 'updateGoal', { userId: USER_ID, goalId: GOAL_ID, body: { name: 'g' } }],
    ['delete goal', 'deleteGoal', { userId: USER_ID, goalId: GOAL_ID }],
    ['assign a card to a location', 'associateCardLocation', { cardId: 1, locationId: 1, quantityReg: 1 }],
    ['change a location quantity', 'updateCardLocation', { cardId: 1, locationId: 1, quantityReg: 1 }],
    ['remove a card from a location', 'removeCardLocation', { cardId: 1, locationId: 1 }],
    ['mass location update', 'massUpdateLocations', { updates: [] }],
    ['rename a location', 'updateLocation', { id: 1, data: { name: 'x' } }],
    ['delete a location', 'deleteLocation', 1],
  ];

  it.each(mutations)('%s refetches the card pages and the summary', async (_label, name, arg) => {
    expect(endpoints[name]).toBeDefined();
    const store = await setup();
    await store.dispatch(endpoints[name].initiate(arg));
    await settle(store);
    expect({ pages: pageFetches(), summaries: summaryFetches() }).toEqual({ pages: 2, summaries: 2 });
  });

  it('a failed collection edit does not refetch the summary', async () => {
    const store = await setup();
    (globalThis as any).fetch.mockImplementationOnce(
      async () => new Response(JSON.stringify({ success: false }), { status: 500, headers: { 'content-type': 'application/json' } }),
    );
    await store.dispatch(endpoints.updateCollection.initiate({ mode: 'set', cards: [{ cardId: 1, quantityReg: 1 }] }));
    await settle(store);
    expect(summaryFetches()).toBe(1);
  });
});
