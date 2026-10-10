import { formatReleaseDate } from '../releaseDate';

describe('formatReleaseDate', () => {
  it('keeps the date for midnight timestamps', () => {
    expect(formatReleaseDate('2026-04-24 00:00:00')).toBe('2026-04-24');
    expect(formatReleaseDate('1993-08-05 01:00:00')).toBe('1993-08-05');
  });

  it('moves CET/CEST day-before timestamps to the release day', () => {
    expect(formatReleaseDate('2022-09-08 22:00:00')).toBe('2022-09-09'); // Dominaria United
    expect(formatReleaseDate('2024-11-14 23:00:30')).toBe('2024-11-15'); // Foundations Starter Collection
  });

  it('moves Pacific day-before timestamps to the release day', () => {
    expect(formatReleaseDate('2025-11-20 16:00:05')).toBe('2025-11-21'); // Avatar: The Last Airbender
  });

  it('rolls over month and year ends', () => {
    expect(formatReleaseDate('2019-12-31 23:00:00')).toBe('2020-01-01');
    expect(formatReleaseDate('2024-02-28 22:00:00')).toBe('2024-02-29');
  });

  it('accepts ISO strings and bare dates', () => {
    expect(formatReleaseDate('2022-09-08T22:00:00.000Z')).toBe('2022-09-09');
    expect(formatReleaseDate('2022-09-09')).toBe('2022-09-09');
  });

  it('returns the fallback for empty or unparseable values', () => {
    expect(formatReleaseDate(null)).toBe('');
    expect(formatReleaseDate(undefined, 'N/A')).toBe('N/A');
    expect(formatReleaseDate('not a date', '—')).toBe('—');
  });
});
