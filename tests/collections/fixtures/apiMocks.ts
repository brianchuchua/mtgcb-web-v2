import type { Page, Request } from '@playwright/test';

export const API_BASE = 'http://local.mtgcb.com:5000';

const CORS_HEADERS = {
  'access-control-allow-origin': 'http://local.mtgcb.com:3000',
  'access-control-allow-credentials': 'true',
};

export interface CapturedApiCall<TBody = any> {
  url: URL;
  method: string;
  body: TBody;
}

export interface MockApiResponse {
  status?: number;
  body: unknown;
}

interface MockApiRouteOptions<TBody> {
  method?: string;
  respond: (call: CapturedApiCall<TBody>, index: number) => MockApiResponse | Promise<MockApiResponse>;
}

/**
 * Intercepts one exact API pathname (query string ignored) and records every call.
 * Requests with another method fall through to the next handler / the network.
 */
export const mockApiRoute = async <TBody = any>(
  page: Page,
  pathname: string,
  { method, respond }: MockApiRouteOptions<TBody>,
): Promise<CapturedApiCall<TBody>[]> => {
  const calls: CapturedApiCall<TBody>[] = [];

  await page.route(
    (url) => url.origin === API_BASE && url.pathname === pathname,
    async (route) => {
      const request = route.request();
      if (method && request.method() !== method.toUpperCase()) {
        await route.fallback();
        return;
      }

      const call: CapturedApiCall<TBody> = {
        url: new URL(request.url()),
        method: request.method(),
        body: parseBody(request),
      };
      const index = calls.length;
      calls.push(call);

      const response = await respond(call, index);
      await route.fulfill({
        status: response.status ?? 200,
        contentType: 'application/json',
        headers: CORS_HEADERS,
        body: JSON.stringify(response.body),
      });
    },
  );

  return calls;
};

const parseBody = (request: Request): any => {
  const raw = request.postData();
  if (!raw) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
};

export const ok = (data: unknown): MockApiResponse => ({ body: { success: true, data, error: null } });

export const apiError = (status: number, message?: string): MockApiResponse => ({
  status,
  body: {
    success: false,
    data: null,
    error: message ? { code: 'TEST_ERROR', message } : null,
  },
});

export const MOCK_LOCATIONS = {
  shoebox: { id: 9101, name: 'Mock Shoebox' },
  binder: { id: 9102, name: 'Mock Binder' },
  binderPage: { id: 9103, name: 'Mock Page' },
};

const location = (id: number, name: string, parentId: number | null, children: unknown[] = []) => ({
  id,
  userId: 1337,
  name,
  description: null,
  createdAt: '2026-01-01 00:00:00',
  updatedAt: '2026-01-01 00:00:00',
  parentId,
  children,
});

/** Replaces the user's location tree with a fixed one so selectors and payload ids are stable. */
export const mockLocationHierarchy = async (page: Page): Promise<void> => {
  const { shoebox, binder, binderPage } = MOCK_LOCATIONS;
  await mockApiRoute(page, '/locations/hierarchy', {
    method: 'GET',
    respond: () =>
      ok([
        location(shoebox.id, shoebox.name, null),
        location(binder.id, binder.name, null, [location(binderPage.id, binderPage.name, binder.id)]),
      ]),
  });
};

/**
 * Passes a request through to the real API, then lets the test rewrite the JSON
 * payload. Keeps the real response shape while pinning the values a test asserts on.
 */
export const patchApiResponse = async (
  page: Page,
  pathname: string,
  patch: (json: any, requestBody: any) => void,
): Promise<void> => {
  await page.route(
    (url) => url.origin === API_BASE && url.pathname === pathname,
    async (route) => {
      try {
        const response = await route.fetch();
        const json = await response.json();
        patch(json, parseBody(route.request()));
        await route.fulfill({ response, json });
      } catch (error) {
        // Refetches still in flight when the test ends hit a closed page; nothing to patch then.
        if (!String(error).includes('has been closed')) throw error;
      }
    },
  );
};
