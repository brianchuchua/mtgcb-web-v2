/**
 * Shared rules for the Release Date filter, used by both the browse sidebar and
 * the goal builder so the two cannot drift apart.
 */

/**
 * A bound may be a year, a year-month or a full date. The API widens a partial
 * bound to cover that whole year or month, so every one of these is a complete,
 * meaningful bound rather than a half-typed date.
 */
const RELEASE_DATE_PATTERN = /^\d{4}(-\d{1,2}){0,2}$/;

export const isUsableReleaseBound = (value: string): boolean =>
  value.trim() === '' || RELEASE_DATE_PATTERN.test(value.trim());

/**
 * Placeholders double as format examples. The lower one is Magic's first year,
 * the earliest bound worth suggesting; the upper one tracks the present rather
 * than a hardcoded year that would quietly go stale.
 */
export const RELEASE_DATE_FROM_PLACEHOLDER = 'From (1993)';

export const RELEASE_DATE_TO_PLACEHOLDER = `To (${new Date().getFullYear()})`;
