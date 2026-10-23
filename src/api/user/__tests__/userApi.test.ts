/**
 * @jest-environment node
 */
import {
  TestStore,
  createTestApiStore,
  injectTagProbe,
  installFetchMock,
  jsonResponse,
  settle,
} from '@/api/collections/__tests__/rtkTestHarness';
import { mtgcbApi } from '@/api/mtgcbApi';
import { shareLinkApi } from '@/api/user/shareLinkApi';
import { userApi } from '@/api/user/userApi';

const probeApi = injectTagProbe({
  auth: ['Auth'],
  supporters: ['PatreonSupporters'],
  costToComplete: ['CostToComplete'],
  userSets: [{ type: 'Sets', id: 'user-1337' }],
  otherUserSets: [{ type: 'Sets', id: 'user-42' }],
  shareLink: ['ShareLink'],
});
const PROBES = ['auth', 'supporters', 'costToComplete', 'userSets', 'otherUserSets', 'shareLink'];

let fetchApi: ReturnType<typeof installFetchMock>;
let store: TestStore;

const refetchedBy = async (runMutation: () => Promise<unknown>) => {
  PROBES.forEach((name) => store.dispatch(probeApi.endpoints.tagProbe.initiate(name)));
  await settle(store);
  const before = Object.fromEntries(PROBES.map((name) => [name, fetchApi.probeFetchCount(name)]));
  await runMutation();
  await settle(store);
  return PROBES.filter((name) => fetchApi.probeFetchCount(name) > before[name]).sort();
};

beforeEach(() => {
  fetchApi = installFetchMock();
  store = createTestApiStore();
  fetchApi.on('PUT', '/user', () => jsonResponse({ success: true, data: { userId: 1337 } }));
});

afterEach(() => {
  store.dispatch(mtgcbApi.util.resetApiState());
});

describe('userApi.updateUser', () => {
  const updateUser = (body: Parameters<typeof userApi.endpoints.updateUser.initiate>[0]) => () =>
    store.dispatch(userApi.endpoints.updateUser.initiate(body));

  it('sends the changes as PUT /user', async () => {
    await store.dispatch(userApi.endpoints.updateUser.initiate({ username: 'manath2', isPublic: false }));
    const [request] = fetchApi.requestsTo('/user', 'PUT');
    expect(await request.json()).toEqual({ username: 'manath2', isPublic: false });
  });

  it('refreshes only the signed-in user for plain profile changes', async () => {
    expect(await refetchedBy(updateUser({ username: 'manath2', hideCollectionValue: true }))).toEqual(['auth']);
  });

  it.each([
    ['showAsPatreonSupporter', { showAsPatreonSupporter: false }],
    ['patreonCardId', { patreonCardId: 'abc' }],
    ['clearing patreonCardId', { patreonCardId: null }],
    ['patreonCardColor', { patreonCardColor: 'gold' as const }],
  ])('also refreshes the patron supporters list when %s changes', async (_label, body) => {
    expect(await refetchedBy(updateUser(body))).toEqual(['auth', 'supporters']);
  });

  it('refreshes cost-to-complete and that user’s sets when the draft cube variant changes', async () => {
    expect(await refetchedBy(updateUser({ draftCubeVariant: 'two-uncommon' }))).toEqual([
      'auth',
      'costToComplete',
      'userSets',
    ]);
  });

  it('skips the cost-to-complete refresh when a draft cube change fails', async () => {
    fetchApi.on('PUT', '/user', () => jsonResponse({ success: false, error: { message: 'nope' } }, 400));
    const refetched = await refetchedBy(updateUser({ draftCubeVariant: 'standard' }));
    expect(refetched).not.toContain('costToComplete');
    expect(refetched).not.toContain('userSets');
  });
});

describe('shareLinkApi', () => {
  it('resolveShareToken posts the token and returns the validation data', async () => {
    fetchApi.on('POST', '/users/resolve-share-token', () =>
      jsonResponse({ success: true, data: { isValid: true, userId: '1337', username: 'manath', expiresAt: null } }),
    );

    const result = await store.dispatch(shareLinkApi.endpoints.resolveShareToken.initiate({ shareToken: 'abc123' }));

    expect('data' in result && result.data).toEqual({ isValid: true, userId: '1337', username: 'manath', expiresAt: null });
    const [request] = fetchApi.requestsTo('/users/resolve-share-token', 'POST');
    expect(await request.json()).toEqual({ shareToken: 'abc123' });
  });

  it('resolveShareToken turns success:false into an invalid link instead of an error', async () => {
    fetchApi.on('POST', '/users/resolve-share-token', () =>
      jsonResponse({ success: false, data: null, error: { message: 'expired' } }),
    );

    const result = await store.dispatch(shareLinkApi.endpoints.resolveShareToken.initiate({ shareToken: 'old' }));

    expect('data' in result && result.data).toEqual({ isValid: false });
  });

  it('resolveShareToken still rejects on an HTTP error', async () => {
    fetchApi.on('POST', '/users/resolve-share-token', () => jsonResponse({ success: false }, 404));
    const result = await store.dispatch(shareLinkApi.endpoints.resolveShareToken.initiate({ shareToken: 'gone' }));
    expect('error' in result && (result.error as any).status).toBe(404);
  });

  it('generating or revoking a link refreshes the cached share link', async () => {
    fetchApi.on('POST', '/user/share-link', () => jsonResponse({ success: true, data: { token: 't' } }));
    fetchApi.on('DELETE', '/user/share-link', () => jsonResponse({ success: true, data: { message: 'revoked' } }));

    expect(
      await refetchedBy(() => store.dispatch(shareLinkApi.endpoints.generateShareLink.initiate({ expiresInHours: 24 }))),
    ).toEqual(['shareLink']);
    expect(await refetchedBy(() => store.dispatch(shareLinkApi.endpoints.revokeShareLink.initiate()))).toEqual([
      'shareLink',
    ]);
  });
});
