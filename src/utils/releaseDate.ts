/**
 * Format a set release date as YYYY-MM-DD.
 *
 * Set.releasedAt is a naive timestamp near midnight of the release day, stored in one of
 * several conventions: midnight (00:00), the CET/CEST day before (22:00/23:00, legacy import),
 * or the Pacific day before (16:00/17:00, hydrated sets). The seconds order same-day sets.
 * Rounding to the nearest midnight recovers the release day for all of them, with no
 * timezone conversion, so every visitor sees the same date.
 */
export const formatReleaseDate = (value: string | null | undefined, fallback: string = ''): string => {
  if (!value) return fallback;

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}))?/);
  if (!match) return fallback;

  const [, year, month, day, hour] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (isNaN(date.getTime())) return fallback;

  if (Number(hour ?? 0) >= 12) date.setUTCDate(date.getUTCDate() + 1);

  return date.toISOString().slice(0, 10);
};
