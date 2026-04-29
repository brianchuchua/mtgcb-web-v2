/**
 * Postgres `User.id` is `integer` with a minimum of 1, so userId = 0 (or
 * negative, or non-integer) fails server-side schema validation with
 * `body/userId must be >= 1`. Sources of bad userId values include URLs
 * like `/collections/0`, OG-image scrapers probing share links, and
 * legacy sessionStorage. Centralized here so every API caller agrees on
 * the shape.
 */

export const isValidUserId = (userId: unknown): userId is number =>
  typeof userId === 'number' && Number.isInteger(userId) && userId >= 1;

export const stripInvalidUserId = <T extends object>(params: T): T => {
  const maybeUserId = (params as { userId?: unknown }).userId;
  if (maybeUserId === undefined || isValidUserId(maybeUserId)) {
    return params;
  }
  const { userId: _userId, ...rest } = params as Record<string, unknown>;
  return rest as T;
};
