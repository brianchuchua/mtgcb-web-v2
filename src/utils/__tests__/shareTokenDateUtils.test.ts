import { getAbsoluteShareUrl } from '@/utils/shareLinkUtils';
import { format, formatDistanceToNow, parseISO } from '@/utils/shareTokenDateUtils';

const NOW = new Date('2025-08-07T00:00:00.000Z');
const offset = (ms: number) => new Date(NOW.getTime() + ms);
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe('parseISO', () => {
  it('reads the database "YYYY-MM-DD HH:mm:ss.SSS" format as UTC', () => {
    expect(parseISO('2025-08-06 23:59:42.449').toISOString()).toBe('2025-08-06T23:59:42.449Z');
  });

  it('reads the database format without milliseconds as UTC', () => {
    expect(parseISO('2025-01-02 03:04:05').toISOString()).toBe('2025-01-02T03:04:05.000Z');
  });

  it('parses ISO strings normally', () => {
    expect(parseISO('2025-08-06T12:00:00.000Z').toISOString()).toBe('2025-08-06T12:00:00.000Z');
  });
});

describe('formatDistanceToNow', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it.each([
    [offset(-10 * 1000), 'a few seconds ago'],
    [offset(-1 * MINUTE), '1 minute ago'],
    [offset(-5 * MINUTE), '5 minutes ago'],
    [offset(-1 * HOUR), '1 hour ago'],
    [offset(-3 * HOUR), '3 hours ago'],
    [offset(-1 * DAY), '1 day ago'],
    [offset(-29 * DAY), '29 days ago'],
    [offset(-30 * DAY), '1 month ago'],
    [offset(-90 * DAY), '3 months ago'],
    [offset(-365 * DAY), '1 year ago'],
    [offset(-800 * DAY), '2 years ago'],
    [offset(5 * MINUTE), 'in 5 minutes'],
    [offset(2 * DAY + HOUR), 'in 2 days'],
    [offset(30 * 1000), 'in a few seconds'],
  ])('describes %p as "%s"', (date, expected) => {
    expect(formatDistanceToNow(date, { addSuffix: true })).toBe(expected);
  });

  it('adds the suffix by default', () => {
    expect(formatDistanceToNow(offset(-2 * DAY))).toBe('2 days ago');
  });

  it('omits prefix and suffix when addSuffix is false', () => {
    expect(formatDistanceToNow(offset(-2 * DAY), { addSuffix: false })).toBe('2 days');
    expect(formatDistanceToNow(offset(2 * DAY), { addSuffix: false })).toBe('2 days');
  });

  it('treats a database string as UTC', () => {
    expect(formatDistanceToNow('2025-08-06 22:00:00.000')).toBe('2 hours ago');
    expect(formatDistanceToNow('2025-08-06 23:59:42.449')).toBe('a few seconds ago');
  });
});

describe('format', () => {
  it('renders PPP as a long US date', () => {
    expect(format(new Date(2025, 7, 6, 12), 'PPP')).toBe('August 6, 2025');
  });

  it('falls back to the default locale date string for other formats', () => {
    const date = new Date(2025, 7, 6, 12);

    expect(format(date, 'yyyy')).toBe(date.toLocaleDateString());
  });

  it('accepts a date string', () => {
    expect(format('2025-08-06T12:00:00', 'PPP')).toBe('August 6, 2025');
  });
});

describe('getAbsoluteShareUrl', () => {
  it('prefixes the relative url with the current origin', () => {
    expect(getAbsoluteShareUrl('/shared/abc')).toBe(`${window.location.origin}/shared/abc`);
  });
});
