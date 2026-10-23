/**
 * @jest-environment node
 */
import { browseApi } from '@/api/browse/browseApi';
import { collectionsEndpoints } from '@/api/collections/collectionsApi';
import { mtgcbApi } from '@/api/mtgcbApi';
import { setUser } from '@/redux/slices/authSlice';
import {
  TestStore,
  createTestApiStore,
  deferred,
  injectTagProbe,
  installFetchMock,
  jsonResponse,
  settle,
} from './rtkTestHarness';

const USER_ID = 1337;

const probeApi = injectTagProbe({
  collection: ['Collection'],
  userCards: [{ type: 'Cards', id: `user-${USER_ID}` }],
  otherUserCards: [{ type: 'Cards', id: 'user-999' }],
  card42: [{ type: 'Cards', id: 42 }],
  userSets: [{ type: 'Sets', id: `user-${USER_ID}` }],
  userGoals: [{ type: 'Goals', id: `user-${USER_ID}` }],
  goalDetail: [{ type: 'Goals', id: 7 }],
  location: [{ type: 'Location', id: 'LIST' }],
  statistics: ['Statistics'],
  auth: ['Auth'],
});
const PROBES = [
  'collection',
  'userCards',
  'otherUserCards',
  'card42',
  'userSets',
  'userGoals',
  'goalDetail',
  'location',
  'statistics',
  'auth',
];

const COLLECTION_WIDE = ['collection', 'userCards', 'userSets', 'userGoals', 'goalDetail', 'statistics'];

let fetchApi: ReturnType<typeof installFetchMock>;
let store: TestStore;

const signIn = () =>
  store.dispatch(setUser({ userId: USER_ID, username: 'manath', email: 'm@example.com', isPublic: true }));

const refetchedBy = async (runMutation: () => Promise<unknown>) => {
  PROBES.forEach((name) => store.dispatch(probeApi.endpoints.tagProbe.initiate(name)));
  await settle(store);
  const before = Object.fromEntries(PROBES.map((name) => [name, fetchApi.probeFetchCount(name)]));
  await runMutation();
  await settle(store);
  return PROBES.filter((name) => fetchApi.probeFetchCount(name) > before[name]).sort();
};

const ok = (data: unknown = {}) => () => jsonResponse({ success: true, data });

beforeEach(() => {
  fetchApi = installFetchMock();
  store = createTestApiStore();
});

afterEach(() => {
  store.dispatch(mtgcbApi.util.resetApiState());
});

describe('collectionsApi tag invalidation', () => {
  it('nuke refreshes everything collection-related, including locations, for the signed-in user', async () => {
    signIn();
    fetchApi.on('DELETE', '/collection/nuke', ok({ userId: USER_ID, deletedCount: 3, message: 'gone' }));

    const refetched = await refetchedBy(() => store.dispatch(collectionsEndpoints.nukeCollection.initiate()));

    expect(refetched).toEqual([...COLLECTION_WIDE, 'location'].sort());
  });

  it('nuke without a signed-in user only refreshes collection and locations', async () => {
    fetchApi.on('DELETE', '/collection/nuke', ok());
    const refetched = await refetchedBy(() => store.dispatch(collectionsEndpoints.nukeCollection.initiate()));
    expect(refetched).toEqual(['collection', 'location']);
  });

  it('nuke refreshes nothing when the API reports failure or errors', async () => {
    signIn();
    fetchApi.on('DELETE', '/collection/nuke', () => jsonResponse({ success: false, data: null }));
    expect(await refetchedBy(() => store.dispatch(collectionsEndpoints.nukeCollection.initiate()))).toEqual([]);

    fetchApi.on('DELETE', '/collection/nuke', () => jsonResponse({ success: false }, 500));
    expect(await refetchedBy(() => store.dispatch(collectionsEndpoints.nukeCollection.initiate()))).toEqual([]);
  });

  it('running migrations refreshes the same caches as a nuke', async () => {
    signIn();
    fetchApi.on('POST', '/collection/migrations/run', ok({ results: [] }));

    const refetched = await refetchedBy(() =>
      store.dispatch(collectionsEndpoints.runDeprecatedMigrations.initiate({ migrations: [] })),
    );

    expect(refetched).toEqual([...COLLECTION_WIDE, 'location'].sort());
    expect(fetchApi.requestsTo('/collection/migrations/run', 'POST')).toHaveLength(1);
  });

  it('mass update and mass entry refresh collection, cards, sets, goals and statistics but not locations', async () => {
    signIn();
    fetchApi.on('POST', '/collection/mass-update', ok());
    fetchApi.on('POST', '/collection/mass-entry', ok());

    const afterMassUpdate = await refetchedBy(() =>
      store.dispatch(collectionsEndpoints.massUpdateCollection.initiate({} as any)),
    );
    expect(afterMassUpdate).toEqual([...COLLECTION_WIDE].sort());

    const afterMassEntry = await refetchedBy(() =>
      store.dispatch(collectionsEndpoints.massEntryCollection.initiate({} as any)),
    );
    expect(afterMassEntry).toEqual([...COLLECTION_WIDE].sort());
  });

  it('an increment update refreshes the collection caches once the API confirms', async () => {
    signIn();
    fetchApi.on('POST', '/collection/update', ok({ cards: [] }));

    const refetched = await refetchedBy(() =>
      store.dispatch(
        collectionsEndpoints.updateCollection.initiate({ mode: 'increment', cards: [{ cardId: 42, quantityReg: 1 }] }),
      ),
    );

    expect(refetched).toEqual([...COLLECTION_WIDE].sort());
  });

  it('an update without a signed-in user only refreshes collection and statistics', async () => {
    fetchApi.on('POST', '/collection/update', ok({ cards: [] }));
    const refetched = await refetchedBy(() =>
      store.dispatch(collectionsEndpoints.updateCollection.initiate({ mode: 'set', cards: [{ cardId: 42, quantityReg: 1 }] })),
    );
    expect(refetched).toEqual(['collection', 'statistics']);
  });

  it('mass location update refreshes locations and the user cards only', async () => {
    signIn();
    fetchApi.on('POST', '/collection/locations/mass-update', ok({ updated: 2 }));

    const refetched = await refetchedBy(() =>
      store.dispatch(collectionsEndpoints.massUpdateLocations.initiate({} as any)),
    );

    expect(refetched).toEqual(['location', 'userCards']);
  });

  it.each([
    ['associateCardLocation', 'POST'],
    ['updateCardLocation', 'PATCH'],
    ['removeCardLocation', 'DELETE'],
  ] as const)('%s refreshes collection, locations, that card and the user cards', async (endpoint, method) => {
    signIn();
    fetchApi.on(method, '/collection/locations', ok());

    const refetched = await refetchedBy(() =>
      store.dispatch((collectionsEndpoints[endpoint] as any).initiate({ cardId: 42, locationId: 3 })),
    );

    expect(refetched).toEqual(['card42', 'collection', 'location', 'userCards']);
  });
});

describe('collectionsApi updateCollection optimistic update', () => {
  const cardsArgs = { userId: USER_ID, limit: 20, offset: 0 } as any;
  const serverCards = () => ({
    success: true,
    data: {
      cards: [
        { id: '604', name: 'Lightning Bolt', quantityReg: 0, quantityFoil: 2 },
        { id: '898', name: 'Counterspell', quantityReg: 1, quantityFoil: 0 },
      ],
      totalCount: 2,
    },
  });
  const cachedCards = () =>
    (browseApi.endpoints.getCards.select(cardsArgs)(store.getState()).data as any)?.data?.cards;
  const cardsSearchCount = () => fetchApi.requestsTo('/cards/search', 'POST').length;

  const seedCardsCache = async () => {
    fetchApi.on('POST', '/cards/search', () => jsonResponse(serverCards()));
    store.dispatch(browseApi.endpoints.getCards.initiate(cardsArgs));
    await settle(store);
    expect(cachedCards()).toHaveLength(2);
  };

  it('patches cached card quantities before the API answers and keeps them after success', async () => {
    signIn();
    await seedCardsCache();
    const response = deferred<Response>();
    fetchApi.on('POST', '/collection/update', () => response.promise);

    const mutation = store.dispatch(
      collectionsEndpoints.updateCollection.initiate({ mode: 'set', cards: [{ cardId: 604, quantityReg: 4 }] }),
    );
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(cachedCards()[0]).toMatchObject({ id: '604', quantityReg: 4, quantityFoil: 2 });
    expect(cachedCards()[1]).toMatchObject({ id: '898', quantityReg: 1 });

    const searchesBefore = cardsSearchCount();
    fetchApi.on('POST', '/cards/search', () => {
      const body = serverCards();
      body.data.cards[0].quantityReg = 4;
      return jsonResponse(body);
    });
    response.resolve(jsonResponse({ success: true, data: { cards: [] } }));
    await mutation;
    await settle(store);

    expect(cardsSearchCount()).toBe(searchesBefore + 1);
    expect(cachedCards()[0].quantityReg).toBe(4);
  });

  it('rolls the cached quantities back when the update fails', async () => {
    signIn();
    await seedCardsCache();
    const response = deferred<Response>();
    fetchApi.on('POST', '/collection/update', () => response.promise);

    const mutation = store.dispatch(
      collectionsEndpoints.updateCollection.initiate({
        mode: 'set',
        cards: [
          { cardId: 604, quantityReg: 9, quantityFoil: 0 },
          { cardId: 898, quantityFoil: 3 },
        ],
      }),
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(cachedCards().map((c: any) => [c.quantityReg, c.quantityFoil])).toEqual([
      [9, 0],
      [1, 3],
    ]);

    const searchesBefore = cardsSearchCount();
    response.resolve(jsonResponse({ success: false, error: { message: 'boom' } }, 500));
    await mutation;
    await settle(store);

    expect(cachedCards().map((c: any) => [c.quantityReg, c.quantityFoil])).toEqual([
      [0, 2],
      [1, 0],
    ]);
    expect(cardsSearchCount()).toBe(searchesBefore);
  });

  it('does not touch the cache optimistically for increment updates', async () => {
    signIn();
    await seedCardsCache();
    const response = deferred<Response>();
    fetchApi.on('POST', '/collection/update', () => response.promise);

    const mutation = store.dispatch(
      collectionsEndpoints.updateCollection.initiate({ mode: 'increment', cards: [{ cardId: 604, quantityReg: 4 }] }),
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(cachedCards()[0].quantityReg).toBe(0);

    response.resolve(jsonResponse({ success: false }, 500));
    await mutation;
  });

  it('does not patch another user’s cached cards', async () => {
    signIn();
    const otherArgs = { userId: 999, limit: 20, offset: 0 } as any;
    fetchApi.on('POST', '/cards/search', () => jsonResponse(serverCards()));
    store.dispatch(browseApi.endpoints.getCards.initiate(otherArgs));
    await settle(store);
    const response = deferred<Response>();
    fetchApi.on('POST', '/collection/update', () => response.promise);

    const mutation = store.dispatch(
      collectionsEndpoints.updateCollection.initiate({ mode: 'set', cards: [{ cardId: 604, quantityReg: 4 }] }),
    );
    await new Promise((resolve) => setTimeout(resolve, 0));

    const otherCards = (browseApi.endpoints.getCards.select(otherArgs)(store.getState()).data as any).data.cards;
    expect(otherCards[0].quantityReg).toBe(0);

    response.resolve(jsonResponse({ success: false }, 500));
    await mutation;
  });
});
