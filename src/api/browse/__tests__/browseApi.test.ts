/** @jest-environment node */
import { browseApi, getNextPageParams } from '@/api/browse/browseApi';
import { CardApiParams, SetApiParams } from '@/api/browse/types';
import { mtgcbApi } from '@/api/mtgcbApi';
import { makeStore as makeRealStore } from '@/redux/store';

const stores: ReturnType<typeof makeRealStore>[] = [];

const makeStore = () => {
  const store = makeRealStore();
  stores.push(store);
  return store;
};

// Clears RTK Query's cache-removal timers so jest can exit.
afterEach(() => {
  stores.splice(0).forEach((store) => store.dispatch(mtgcbApi.util.resetApiState()));
});

type FetchCall = { url: string; method: string; body: unknown };

const fetchCalls: FetchCall[] = [];

beforeEach(() => {
  fetchCalls.length = 0;
  global.fetch = jest.fn(async (input: RequestInfo | URL) => {
    const request = input as Request;
    const text = await request.text();
    fetchCalls.push({ url: request.url, method: request.method, body: text ? JSON.parse(text) : undefined });
    return new Response(JSON.stringify({ success: true, data: {} }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;
});

const cacheKeyFor = async (endpoint: 'getCards' | 'getSets', args: CardApiParams | SetApiParams) => {
  const store = makeStore();
  const subscription = store.dispatch(
    (browseApi.endpoints[endpoint] as typeof browseApi.endpoints.getCards).initiate(args as CardApiParams),
  );
  await subscription;
  const key = subscription.queryCacheKey;
  subscription.unsubscribe();
  return { key, store };
};

describe('getNextPageParams', () => {
  it('sets the offset to the start of the next page', () => {
    expect(getNextPageParams({ limit: 20, offset: 0 } as CardApiParams, 1, 20)).toEqual({ limit: 20, offset: 20 });
    expect(getNextPageParams({ limit: 50 } as SetApiParams, 3, 50)).toEqual({ limit: 50, offset: 150 });
  });

  it('keeps every other param and does not mutate the input', () => {
    const current = { name: 'Bolt', limit: 20, offset: 40, sortBy: 'name' } as CardApiParams;
    const next = getNextPageParams(current, 3, 20);

    expect(next).toEqual({ name: 'Bolt', limit: 20, offset: 60, sortBy: 'name' });
    expect(current.offset).toBe(40);
  });
});

describe('browseApi — getCards / getSets cache keys', () => {
  it('builds the key from paging, sort and the remaining filters', async () => {
    const { key } = await cacheKeyFor('getCards', {
      limit: 50,
      offset: 100,
      sortBy: 'name',
      sortDirection: 'desc',
      name: 'Elf',
    } as CardApiParams);
    expect(key).toBe('getCards:limit=50&offset=100&sort=name:desc{"name":"Elf"}');
  });

  it('defaults paging to 20/0 and direction to asc', async () => {
    const { key } = await cacheKeyFor('getCards', { sortBy: 'name' } as CardApiParams);
    expect(key).toBe('getCards:limit=20&offset=0&sort=name:asc{}');
  });

  it('leaves the sort out when there is no sortBy', async () => {
    const { key } = await cacheKeyFor('getSets', { sortDirection: 'desc', code: 'LEA' } as SetApiParams);
    expect(key).toBe('getSets:limit=20&offset=0{"code":"LEA"}');
  });

  it('gives different pages different keys', async () => {
    const first = await cacheKeyFor('getCards', { limit: 20, offset: 0 } as CardApiParams);
    const second = await cacheKeyFor('getCards', { limit: 20, offset: 20 } as CardApiParams);
    expect(first.key).not.toBe(second.key);
  });

  it('gives different filters different keys', async () => {
    const elf = await cacheKeyFor('getCards', { name: 'Elf' } as CardApiParams);
    const goblin = await cacheKeyFor('getCards', { name: 'Goblin' } as CardApiParams);
    expect(elf.key).not.toBe(goblin.key);
  });

  it('keeps getCards and getSets in separate cache entries for identical args', async () => {
    const store = makeStore();
    const args = { limit: 20, offset: 0 } as CardApiParams;
    const cards = store.dispatch(browseApi.endpoints.getCards.initiate(args));
    const sets = store.dispatch(browseApi.endpoints.getSets.initiate(args as SetApiParams));
    await Promise.all([cards, sets]);

    expect(cards.queryCacheKey).not.toBe(sets.queryCacheKey);
  });
});

describe('browseApi — requests', () => {
  it('POSTs card searches to /cards/search', async () => {
    await cacheKeyFor('getCards', { name: 'Elf', limit: 20 } as CardApiParams);
    expect(fetchCalls).toHaveLength(1);
    expect(fetchCalls[0].url).toBe('http://localhost:5000/cards/search');
    expect(fetchCalls[0].method).toBe('POST');
    expect(fetchCalls[0].body).toMatchObject({ name: 'Elf', limit: 20 });
  });

  it('POSTs set searches to /sets/search', async () => {
    await cacheKeyFor('getSets', { code: 'LEA' } as SetApiParams);
    expect(fetchCalls[0].url).toBe('http://localhost:5000/sets/search');
    expect(fetchCalls[0].method).toBe('POST');
    expect(fetchCalls[0].body).toMatchObject({ code: 'LEA' });
  });

  it('strips collection-only params from a search with no user', async () => {
    await cacheKeyFor('getCards', { name: 'Elf', sortBy: 'quantityReg' } as unknown as CardApiParams);
    expect(fetchCalls[0].body).toMatchObject({ name: 'Elf', sortBy: 'releasedAt' });
  });

  it('GETs set navigation with its sort params', async () => {
    const store = makeStore();
    await store.dispatch(
      browseApi.endpoints.getSetsNavigation.initiate({ sortBy: 'name', sortDirection: 'asc' }),
    );
    const url = new URL(fetchCalls[0].url);
    expect(url.pathname).toBe('/sets/navigation');
    expect(fetchCalls[0].method).toBe('GET');
    expect(Object.fromEntries(url.searchParams)).toEqual({ sortBy: 'name', sortDirection: 'asc' });
  });

  it('GETs a set by id', async () => {
    const store = makeStore();
    await store.dispatch(browseApi.endpoints.getSetById.initiate('123'));
    expect(fetchCalls[0].url).toBe('http://localhost:5000/sets/123');
    expect(fetchCalls[0].method).toBe('GET');
  });
});
