import { getSafeRedirectPath } from '../safeRedirect';

describe('getSafeRedirectPath', () => {
  it.each([
    ['/goals', '/goals'],
    ['/account?tab=1', '/account?tab=1'],
    ['%2Fcollections%2F1337%3FcontentType%3Dcards', '/collections/1337?contentType=cards'],
    ['/browse#top', '/browse#top'],
  ])('keeps the on-site path %s', (raw, expected) => {
    expect(getSafeRedirectPath(raw)).toBe(expected);
  });

  it.each([
    ['https://evil.example/phish'],
    ['http%3A%2F%2Fevil.example'],
    ['//evil.example'],
    ['/\\evil.example'],
    ['\\\\evil.example'],
    ['javascript:alert(1)'],
    ['goals'],
    ['/%0d%0aSet-Cookie'],
    ['%E0%A4%A'],
  ])('falls back to / for %s', (raw) => {
    expect(getSafeRedirectPath(raw)).toBe('/');
  });

  it('falls back to / when there is no redirect', () => {
    expect(getSafeRedirectPath(null)).toBe('/');
    expect(getSafeRedirectPath(undefined)).toBe('/');
    expect(getSafeRedirectPath('')).toBe('/');
  });
});
