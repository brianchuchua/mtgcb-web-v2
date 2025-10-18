/**
 * Mock helper functions for tests
 * Centralized mocking utilities to keep tests DRY
 */

/**
 * Mock Next.js navigation hooks with custom values
 * Note: Call this BEFORE requiring/importing components that use these hooks
 */
export function mockNextNavigation({
  pathname = '/browse',
  searchParams = new URLSearchParams(),
  push = jest.fn(),
  replace = jest.fn(),
}: {
  pathname?: string;
  searchParams?: URLSearchParams;
  push?: jest.Mock;
  replace?: jest.Mock;
} = {}) {
  // Import and cast the mocked functions
  const navigation = jest.requireMock('next/navigation');

  // Update the mock implementations
  navigation.usePathname = jest.fn(() => pathname);
  navigation.useSearchParams = jest.fn(() => searchParams);
  navigation.useRouter = jest.fn(() => ({
    push,
    replace,
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    pathname,
  }));

  return { push, replace };
}

/**
 * Mock localStorage with preset values
 */
export function mockLocalStorage(data: Record<string, string> = {}) {
  const { getItem, setItem } = localStorage;

  // Pre-populate with data
  Object.entries(data).forEach(([key, value]) => {
    setItem(key, value);
  });

  return localStorage;
}

/**
 * Mock sessionStorage with preset values
 */
export function mockSessionStorage(data: Record<string, string> = {}) {
  const { getItem, setItem } = sessionStorage;

  // Pre-populate with data
  Object.entries(data).forEach(([key, value]) => {
    setItem(key, value);
  });

  return sessionStorage;
}

/**
 * Mock lodash.debounce to be synchronous in tests
 * Useful for most tests where you don't need to test debounce timing
 */
export function mockDebounceSync() {
  jest.mock('lodash.debounce', () =>
    jest.fn((fn) => {
      const debounced = fn;
      debounced.cancel = jest.fn();
      return debounced;
    })
  );
}

/**
 * Mock lodash.debounce to be controllable with fake timers
 * Use when you need to test debounce timing behavior
 */
export function mockDebounceWithFakeTimers() {
  const debounce = require('lodash.debounce');
  return debounce;
}

/**
 * Create a mock URLSearchParams from object
 */
export function createMockSearchParams(params: Record<string, string | string[]>): URLSearchParams {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((v) => searchParams.append(key, v));
    } else {
      searchParams.set(key, value);
    }
  });

  return searchParams;
}

/**
 * Reset all mocks to clean state
 * Call this in afterEach to ensure test isolation
 */
export function resetAllMocks() {
  jest.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
}
