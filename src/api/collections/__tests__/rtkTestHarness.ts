// Shared harness for the RTK Query endpoint tests under src/api/*/__tests__.
// Runs a real store against a mocked global fetch, plus a "probe" query whose
// tags are chosen per test file, so tag invalidation can be observed as refetches.
import { mtgcbApi } from '@/api/mtgcbApi';
import { makeStore } from '@/redux/store';

export type TestStore = ReturnType<typeof makeStore>;
type ProbeTag = string | { type: string; id?: string | number };
type Responder = (request: Request) => Response | Promise<Response>;

export const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

export const createTestApiStore = () => makeStore();

export const injectTagProbe = (probeTags: Record<string, ProbeTag[]>) =>
  mtgcbApi.injectEndpoints({
    endpoints: (builder) => ({
      tagProbe: builder.query<unknown, string>({
        query: (name) => `/__probe/${name}`,
        providesTags: (_result, _error, name) => (probeTags[name] ?? []) as any,
      }),
    }),
    overrideExisting: true,
  });

export const installFetchMock = () => {
  const routes: Array<{ method: string; path: string; respond: Responder }> = [];

  const fetchMock = jest.fn(async (input: Request) => {
    const { pathname } = new URL(input.url);
    const route = routes.find((r) => r.path === pathname && r.method === input.method);
    if (route) return route.respond(input);
    if (pathname.startsWith('/__probe/')) return jsonResponse({ success: true, data: pathname });
    return jsonResponse({ success: false, error: { message: `unmocked ${input.method} ${pathname}` } }, 404);
  });
  global.fetch = fetchMock as unknown as typeof fetch;

  const requestsTo = (path: string, method?: string) =>
    fetchMock.mock.calls
      .map(([request]) => request)
      .filter((request) => new URL(request.url).pathname === path && (!method || request.method === method));

  return {
    fetchMock,
    on: (method: string, path: string, respond: Responder) => {
      routes.unshift({ method, path, respond });
    },
    requestsTo,
    probeFetchCount: (name: string) => requestsTo(`/__probe/${name}`).length,
  };
};

// Waits for RTK Query to go quiet: the mutation, the delayed tag invalidation and
// any refetches it triggers.
export const settle = async (store: TestStore) => {
  for (let tick = 0; tick < 100; tick++) {
    await new Promise((resolve) => setTimeout(resolve, 0));
    const apiState = store.getState()[mtgcbApi.reducerPath];
    const entries = [...Object.values(apiState.queries), ...Object.values(apiState.mutations)];
    const busy = entries.some((entry) => entry?.status === 'pending');
    if (!busy && tick >= 3) return;
  }
  throw new Error('RTK Query did not settle');
};

export const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
};
