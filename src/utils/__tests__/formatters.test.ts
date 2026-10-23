import { formatDate } from '@/utils/dateUtils';
import { formatPrice } from '@/utils/formatters';

describe('formatPrice', () => {
  it.each([
    [10.99, '$10.99'],
    [0, '$0.00'],
    [5, '$5.00'],
    [1234.5, '$1,234.50'],
    [1000000, '$1,000,000.00'],
    [0.129, '$0.13'],
    [-3, '-$3.00'],
  ])('formats %p as %s', (price, expected) => {
    expect(formatPrice(price)).toBe(expected);
  });
});

describe('formatDate', () => {
  const UTC_DAY: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' };

  it.each([null, undefined, ''])('returns "Unknown" for %p', (input) => {
    expect(formatDate(input)).toBe('Unknown');
  });

  it('formats an ISO date', () => {
    expect(formatDate('2025-10-01T02:00:02.303Z', UTC_DAY)).toBe('Oct 1, 2025');
  });

  it('reads MySQL datetime strings as UTC', () => {
    // 00:30 UTC is still the previous evening in Los Angeles, which only holds if the string was read as UTC.
    expect(
      formatDate('2025-10-01 00:30:00.000', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'America/Los_Angeles' }),
    ).toBe('Sep 30, 2025');
    expect(formatDate('2025-10-01 00:30:00', UTC_DAY)).toBe('Oct 1, 2025');
  });

  it('uses a short month by default', () => {
    expect(formatDate('2025-06-15T12:00:00Z')).toMatch(/^Jun 1[45], 2025$/);
  });

  it('honours custom options', () => {
    expect(formatDate('2025-10-01T02:00:02Z', { month: 'long', timeZone: 'UTC' })).toBe('October');
  });

  it('returns "Invalid date" for unparseable input', () => {
    expect(formatDate('garbage')).toBe('Invalid date');
  });

  it('returns "Invalid date" for a malformed datetime with a space', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(formatDate('foo bar')).toBe('Invalid date');

    consoleError.mockRestore();
  });
});
