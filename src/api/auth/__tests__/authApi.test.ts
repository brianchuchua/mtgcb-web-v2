/**
 * @jest-environment node
 */
import { authApi } from '@/api/auth/authApi';
import {
  TestStore,
  createTestApiStore,
  injectTagProbe,
  installFetchMock,
  jsonResponse,
  settle,
} from '@/api/collections/__tests__/rtkTestHarness';
import { mtgcbApi } from '@/api/mtgcbApi';
import { clearAllSearchState } from '@/hooks/useSearchStateSync';

jest.mock('@/hooks/useSearchStateSync', () => ({ clearAllSearchState: jest.fn() }));

const probeApi = injectTagProbe({ cards: [{ type: 'Cards', id: 'user-1337' }] });

let fetchApi: ReturnType<typeof installFetchMock>;
let store: TestStore;

const seedUserScopedCache = async () => {
  store.dispatch(probeApi.endpoints.tagProbe.initiate('cards'));
  await settle(store);
  expect(probeApi.endpoints.tagProbe.select('cards')(store.getState()).data).toBeDefined();
};
const cachedProbe = () => probeApi.endpoints.tagProbe.select('cards')(store.getState()).data;

beforeEach(() => {
  fetchApi = installFetchMock();
  store = createTestApiStore();
  jest.mocked(clearAllSearchState).mockClear();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  store.dispatch(mtgcbApi.util.resetApiState());
  jest.restoreAllMocks();
});

describe('authApi clears per-user state', () => {
  it('login clears saved search state after a successful login', async () => {
    fetchApi.on('POST', '/auth/login', () => jsonResponse({ success: true, data: { userId: 1337 } }));

    await store.dispatch(authApi.endpoints.login.initiate({ username: 'manath', password: 'hunter22' } as any));
    await settle(store);

    expect(clearAllSearchState).toHaveBeenCalledTimes(1);
    const [request] = fetchApi.requestsTo('/auth/login', 'POST');
    expect(await request.json()).toEqual({ username: 'manath', password: 'hunter22' });
  });

  it('login keeps saved search state when the credentials are rejected', async () => {
    fetchApi.on('POST', '/auth/login', () => jsonResponse({ success: false }, 401));
    await store.dispatch(authApi.endpoints.login.initiate({ username: 'manath', password: 'wrong' } as any));
    await settle(store);
    expect(clearAllSearchState).not.toHaveBeenCalled();
  });

  it('logout clears saved search state and drops every cached query', async () => {
    await seedUserScopedCache();
    fetchApi.on('POST', '/auth/logout', () => jsonResponse({ success: true, data: null }));

    await store.dispatch(authApi.endpoints.logout.initiate());
    await settle(store);

    expect(clearAllSearchState).toHaveBeenCalledTimes(1);
    expect(cachedProbe()).toBeUndefined();
  });

  it('a failed logout keeps the cache and saved search state', async () => {
    await seedUserScopedCache();
    fetchApi.on('POST', '/auth/logout', () => jsonResponse({ success: false }, 500));

    await store.dispatch(authApi.endpoints.logout.initiate());
    await settle(store);

    expect(clearAllSearchState).not.toHaveBeenCalled();
    expect(cachedProbe()).toBeDefined();
  });

  it('deleting the account clears saved search state and drops every cached query', async () => {
    await seedUserScopedCache();
    fetchApi.on('DELETE', '/auth/account', () => jsonResponse({ success: true, data: { message: 'deleted' } }));

    await store.dispatch(authApi.endpoints.deleteAccount.initiate());
    await settle(store);

    expect(clearAllSearchState).toHaveBeenCalledTimes(1);
    expect(cachedProbe()).toBeUndefined();
  });

  it('a failed account deletion keeps the cache', async () => {
    await seedUserScopedCache();
    fetchApi.on('DELETE', '/auth/account', () => jsonResponse({ success: false }, 500));

    await store.dispatch(authApi.endpoints.deleteAccount.initiate());
    await settle(store);

    expect(clearAllSearchState).not.toHaveBeenCalled();
    expect(cachedProbe()).toBeDefined();
  });

  it('/auth/me is fetched from the API base url', async () => {
    fetchApi.on('GET', '/auth/me', () => jsonResponse({ success: true, data: { userId: 1337 } }));
    const result = await store.dispatch(authApi.endpoints.me.initiate());
    expect('data' in result && result.data).toEqual({ success: true, data: { userId: 1337 } });
    expect(fetchApi.requestsTo('/auth/me')[0].url).toBe('http://localhost:5000/auth/me');
  });
});
